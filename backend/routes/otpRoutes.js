// const express = require('express');
// const jwt = require('jsonwebtoken');
// const router = express.Router();
// const User = require('../models/user'); 
// const { sendOTPEmail } = require('../utils/mailer');
// const { saveOtp, verifyOtp } = require('../utils/otpStore');


// router.post('/send-otp', async (req, res) => {
//   const { email } = req.body;
//   if (!email) return res.status(400).json({ message: 'Email is required' });

//   const otp = Math.floor(100000 + Math.random() * 900000).toString();
//   saveOtp(email, otp);
//   await sendOTPEmail(email, otp);

//   res.json({ message: 'OTP sent successfully' });
// });

// router.post('/verify-otp', async (req, res) => {
//   const { email, otp } = req.body;

//   if (!email || !otp) {
//     return res.status(400).json({ message: 'Email and OTP are required' });
//   }

//   try {
//     const isValid = verifyOtp(email, otp);
//     if (!isValid) {
//       return res.status(401).json({ message: 'Invalid or expired OTP' });
//     }

//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     const token = jwt.sign(
//       { userId: user._id, role: user.role },
//       process.env.JWT_SECRET,
//       { expiresIn: '1h' }
//     );

//     res.json({ status: 'ok', token, role: user.role });
//   } catch (err) {
//     console.error('Verify OTP error:', err);
//     res.status(500).json({ message: 'Could not verify OTP' });
//   }
// });

// router.post('/reset-password', async (req, res) => {
//   const { token, newPassword } = req.body;
//   if (!token || !newPassword) return res.status(400).json({ message: 'Token and new password are required' });

//   try {
//     const payload = jwt.verify(token, process.env.JWT_SECRET);
//     const user = await User.findById(payload.userId);
//     if (!user) return res.status(404).json({ message: 'User not found' });

//     user.password = newPassword; 
//     await user.save();

//     res.json({ status: 'ok', message: 'Password reset successful' });
//   } catch (err) {
//     console.error('Reset password error:', err);
//     res.status(400).json({ message: 'Invalid or expired token' });
//   }
// });

// module.exports = router;



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
        // Find the user by email
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(200).json({ message: 'An OTP has been sent to your email.' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        saveOtp(email.toLowerCase(), otp); 

        await sendOTPEmail(email, otp);

        res.json({ message: 'OTP sent successfully' });
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

        // Generate a temporary token that allows password reset for this specific user
        // This token is different from the regular login token, only for password reset
        const resetToken = jwt.sign(
            { userId: user._id }, // Only need user ID for reset
            process.env.JWT_SECRET, // Use the same secret for simplicity, or a different one for reset tokens
            { expiresIn: '15m' } // Token expires quickly, e.g., 15 minutes
        );

        res.json({ status: 'ok', token: resetToken, message: 'OTP verified. Proceed to reset password.' });
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
        const user = await User.findById(payload.userId); // Find user by ID from token

        if (!user) {
            return res.status(404).json({ message: 'User not found or token invalid' });
        }

        // Hash the new password before saving
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt); // Hash the new password
        await user.save(); // Save the user with the new hashed password

        res.json({ status: 'ok', message: 'Password reset successful' });
    } catch (err) {
        console.error('Reset password error:', err.message);
        if (err.name === 'TokenExpiredError') {
            return res.status(400).json({ message: 'Token has expired. Please request a new OTP.' });
        }
        res.status(400).json({ message: 'Invalid token or server error' });
    }
});

module.exports = router;