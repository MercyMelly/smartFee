const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const router = express.Router();
require('dotenv').config();

const User = require('../models/user');
const { sendOTPEmail } = require('../utils/mailer');
const { saveOtp, verifyOtp } = require('../utils/otpStore');


router.post('/send-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.log(`OTP requested for unregistered email: ${email}`);
      return res.status(200).json({ message: 'An OTP has been sent to your email.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    saveOtp(email.toLowerCase(), otp);
    await sendOTPEmail(email, otp);

    res.json({ message: 'OTP sent successfully. Check your email.' });
  } catch (err) {
    console.error('Send OTP error:', err.message);
    res.status(500).json({ message: 'Could not send OTP' });
  }
});

router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ message: 'Email and OTP are required' });
  }

  try {
    const isValid = verifyOtp(email.toLowerCase(), otp);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid or expired OTP' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const resetToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.json({
      status: 'ok',
      token: resetToken,
      message: 'OTP verified. You can now reset your password.'
    });
  } catch (err) {
    console.error('Verify OTP error:', err.message);
    res.status(500).json({ message: 'Could not verify OTP' });
  }
});
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return res.status(400).json({ message: 'Token and new password are required' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // DO NOT hash manually here:
    user.password = newPassword;
    await user.save(); // This will hash automatically

    res.json({ status: 'ok', message: 'Password reset successful.' });
  } catch (err) {
    console.error('Reset password error:', err.message);
    if (err.name === 'TokenExpiredError') {
      return res.status(400).json({ message: 'Token expired. Please request a new OTP.' });
    }
    res.status(400).json({ message: 'Invalid token.' });
  }
});

module.exports = router;

