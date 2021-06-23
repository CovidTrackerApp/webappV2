const nodemailer = require("nodemailer");


function sendEmail(verification_otp, receiver) {

    var transporter = nodemailer.createTransport({
        service: "yandex",
        auth: {
            user : "furqan4545@yandex.ru",
            pass : "Yandex12345" 
        }
    });

    var mailOption = {
        from : "furqan4545@yandex.ru",
        to: receiver,
        subject : `COVID TRACKER : ${verification_otp}`,
        text : `Here is your verification Code: ${verification_otp}`
    };

    transporter.sendMail(mailOption, function(error, info){
        if (error){
            console.log(error);
        }
        else {
            console.log("Email sent: " + info.response);
        }
    });

}

module.exports = sendEmail;