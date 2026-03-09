const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, name , htmlTemplate) => {

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: to,
        subject: subject,
        html: htmlTemplate
    };

    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;