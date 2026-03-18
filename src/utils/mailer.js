const nodemailer = require("nodemailer");

const sendMail = async ({ to, cc, subject, text }) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER, 
      pass: process.env.SMTP_PASS, // USE APP PASSWORD HERE
    },
  });

  const mailOptions = {
    from: `"StockAura Admin" <${process.env.MAIL_FROM}>`,
    to,
    cc,
    subject,
    text,
  };

  return transporter.sendMail(mailOptions);
};

module.exports = { sendMail };