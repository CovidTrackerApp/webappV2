require("dotenv").config();

const { Pool } = require("pg");

// const isProduction = process.env.NODE_ENV === "production";

// const connectionString = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}`;

// const pool = new Pool({
//   connectionString: isProduction ? process.env.DATABASE_URL : connectionString,
//   ssl: isProduction
// });

const pool = new Pool({
  user: "ubuntu",
  password: "ubuntu",
  database: "test_db",
  host: "ec2-52-74-221-135.ap-southeast-1.compute.amazonaws.com",
  post: 5432
});


module.exports = { pool };
