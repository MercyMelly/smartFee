const express = require('express');
require('../models/user'); 
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
// const bcrypt = require('bcryptjs'); // Uncomment if you want to use bcrypt for password hashing
const router = express.Router();
const User = mongoose.model('userInfo');

const JWT_SECRET = process.env.JWT_SECRET 
// || 'mytempsecretkey'; 


router.post('/signup', async (req, res) => {
  const { fullName, email, password, role, phoneNumber } = req.body;
  const lowerEmail = email.toLowerCase();
  const oldUser = await User.findOne({ email: lowerEmail });

  if (oldUser) {
    return res.send({ data: 'User already exists' });
  }

  try {
    await User.create({
      fullName,
      email: lowerEmail,
      password,
      role,
      phoneNumber
    });
    res.send({ status: "ok", data: "user created successfully" });
  } catch (err) {
    res.send({ status: "error", data: err.message });
  }
});

// router.post('/login', async (req, res) => {
//   const { email, password } = req.body;
//   const lowerEmail = email.toLowerCase();

//   try {
//     const user = await User.findOne({ email: lowerEmail });
//     if (!user) return res.status(400).json({ message: 'User not found' });

//     if (user.password !== password) {
//       return res.status(400).json({ message: 'Invalid credentials' });
//     }

//     // No JWT here — just return role
//     res.json({ status: 'ok', role: user.role.toLowerCase() });

//   } catch (err) {
//     res.status(500).json({ message: 'Login error', error: err.message });
//   }
// });

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    if (user.password !== password) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // const isMatch = await bcrypt.compare(password, user.password);
    // if (!isMatch) {
    //   return res.status(400).json({ message: 'Invalid credentials' });
    // }

    const token = jwt.sign(
      { userId: user._id, role: user.role },JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ status: 'ok', token, role: user.role });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;


module.exports = router;
