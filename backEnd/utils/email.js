const nodemailer = require('nodemailer');

let transporterPromise = null;

async function getTransporter() {
  if (transporterPromise) return transporterPromise;
  // Use real SMTP if provided
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporterPromise = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    return transporterPromise;
  }
  // Otherwise, use Ethereal for testing
  const testAccount = await nodemailer.createTestAccount();
  transporterPromise = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
  return transporterPromise;
}

async function sendResetEmail(to, resetLink) {
  const transporter = await getTransporter();
  const mailOptions = {
    from: process.env.SMTP_FROM || 'no-reply@homigo.com',
    to,
    subject: 'Password Reset Request',
    html: `<p>You requested a password reset for your HomiGo account.</p>
           <p>Click the link below to reset your password:</p>
           <a href="${resetLink}">${resetLink}</a>
           <p>If you did not request this, please ignore this email.</p>`
  };
  const info = await transporter.sendMail(mailOptions);
  // If using Ethereal, log the preview URL
  if (nodemailer.getTestMessageUrl) {
    const url = nodemailer.getTestMessageUrl(info);
    if (url) console.log('Ethereal email preview URL:', url);
  }
  return info;
}

module.exports = { sendResetEmail };
