const express = require("express");
const { pool } = require("./dbConfig");
const bcrypt = require("bcrypt");
const passport = require("passport");
const flash = require("express-flash");
const session = require("express-session");
const sendEmail = require("./send_mail");
require("dotenv").config();
const app = express();

const PORT = process.env.PORT || 3000;

const initializePassport = require("./passportConfig");

initializePassport(passport);

// Middleware

// Parses details from a form
app.use(express.urlencoded({ extended: false }));
app.set("view engine", "ejs");

app.use(
  session({
    // Key we want to keep secret which will encrypt all of our information
    secret: process.env.SESSION_SECRET,
    // Should we resave our session variables if nothing has changes which we dont
    resave: false,
    // Save empty value if there is no vaue which we do not want to do
    saveUninitialized: false
  })
);
// Funtion inside passport which initializes passport
app.use(passport.initialize());
// Store our variables to be persisted across the whole session. Works with app.use(Session) above
app.use(passport.session());
app.use(flash());

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/users/register", checkAuthenticated, (req, res) => {
  res.render("register.ejs");
});

app.get("/users/login", checkAuthenticated, (req, res) => {
  // flash sets a messages variable. passport sets the error message
  // console.log(req.session.flash.error);
  res.render("login.ejs");
});

app.get("/users/dashboard", checkNotAuthenticated, (req, res) => {
  console.log(req.isAuthenticated());
  res.render("dashboard", { user: req.user.uname });
});

app.get("/users/logout", (req, res) => {
  req.logout();
  res.render("index", { message: "You have logged out successfully" });
});

app.post("/users/register", async (req, res) => {
  let {uname, password, re_password, email, ph_no } = req.body;

  let errors = [];

  console.log({
    uname, password, re_password, email, ph_no
  });

  if (!uname || !password || !re_password || !email || !ph_no) {
    errors.push({
      message : "Please Enter all the fields" 
    });
  }

  if (password.length < 4) {
    errors.push({ message: "Password must be a least 4 characters long" });
  }

  if (password != re_password) {
    errors.push({
      message : "Passwords do not match." 
    });
  }
  
  if (errors.length > 0) {
    res.render("register", { errors, uname, email, password, re_password, ph_no });
  } else {

    const saltRounds = 10;
    const salt = bcrypt.genSaltSync(saltRounds);
    let hashedPassword = await bcrypt.hash(password, salt);
    console.log(hashedPassword);
    
    // Validation passed
    pool.query(
      `SELECT * FROM hospital
        WHERE uname = $1`,
      [uname],
      (err, results) => {
        if (err) {
          console.log(err);
        }
        console.log("Hi: ", results.rows);

        if (results.rows.length > 0) {
          console.log("length: ", results.rows.length);
          errors.push({
            message : "Username already registered" 
          });
          return res.render("register", { errors });
        } else {

          // // check duplicacy of email 
          pool.query(`SELECT * FROM hospital
            WHERE email = $1`,
            [email], (err, result2) => {
              if (err) {
                console.log(err);
              }
              if (result2.rows.length > 0) {
                errors.push({
                  message : "Email already registered" 
                });
                return res.render("register", { errors });
              }
              else {
                // check duplicacy of ph_no
                pool.query(`SELECT * FROM hospital
                WHERE ph_no = $1`,
                [ph_no], (err, result3) => {
                  if (err) {
                    console.log(err);
                  }
                  if (result3.rows.length > 0) {
                    errors.push({
                      message : "Phone number already registered" 
                    });
                    return res.render("register", { errors });
                  }
                  else {
                    // generate OTP
                    function randomNum(min, max) {
                      return Math.floor(Math.random() * (max - min) + min)
                    }

                    const verificationCode = randomNum(10000, 99999);
                    var verified = false;
                    var verified_by = null;

                    sendEmail(verificationCode, email);  

                    pool.query(
                      `INSERT INTO hospital (uname, password, email, ph_no, otp, verified, verified_by)
                          VALUES ($1, $2, $3, $4, $5, $6, $7)
                          RETURNING *`,
                      [uname, hashedPassword, email, ph_no, verificationCode, verified, verified_by],
                      (err, results) => {
                        if (err) {
                          throw err;
                        }
                        console.log("Hello: ", results.rows);
                        req.flash("success_msg", "You are now registered. Please log in");
                        res.redirect("/users/login");
                      }
                    );
                  }
                });
              }
            });
        }
      }
    );
  }
});

app.post(
  "/users/login",
  passport.authenticate("local", {
    successRedirect: "/users/dashboard",
    failureRedirect: "/users/login",
    failureFlash: true
  })
);

function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect("/users/dashboard");
  }
  next();
}

function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/users/login");
}


// database connection here. //
async function dbStart() {
  try { 
      await pool.connect();
      console.log("DB connected successfully.");
      // await client.query("");

  }
  catch (e) {
      console.error(`The error has occured: ${e}`)
  }
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  dbStart();
});
