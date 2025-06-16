const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: `"Auth System - SmartFee" <${process.env.EMAIL_USER}>`,
    to:email,
    subject: 'Your One-Time Login Code (OTP)',
    text: `Your OTP is: ${otp}. It will expire in 5 minutes.`,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendOTPEmail };
