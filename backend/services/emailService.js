require("dotenv").config();
const nodemailer = require("nodemailer");

console.log("[emailService.js] NODE_ENV:", process.env.NODE_ENV);

if (process.env.NODE_ENV !== "production") {
  module.exports = async () => {
    console.log("DEV MODE: email disabled");
    return true;
  };
} else {
  // Production mode - send emails via local SMTP (Exim on localhost:25)
  const senderEmail = process.env.EMAIL_USER;

  const transporter = nodemailer.createTransport({
    host: "localhost",
    port: 25,
    secure: false,       // port 25 does not use TLS
    tls: {
      rejectUnauthorized: false,  // allow self-signed certs on localhost
    },
  });

  /**
   * Send an email via local SMTP (Nodemailer)
   * @param {string} to - Recipient email address
   * @param {string} subject - Email subject
   * @param {string} text - Email body (plain text)
   */
  const sendEmail = async (to, subject, text) => {
    try {
      const info = await transporter.sendMail({
        from: senderEmail,
        to,
        subject,
        text,
      });

      console.log("Email successful, messageId:", info.messageId);
    } catch (err) {
      console.error("Failed to send email:", err);
      throw err;
    }
  };

  module.exports = sendEmail;
}
