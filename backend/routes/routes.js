const express = require('express');
const jwt = require('jsonwebtoken');
require('../models/user'); 
const mongoose = require('mongoose');
const router = express.Router();
const User = mongoose.model('userInfo');

router.post('/signup', async (req, res) => {
  const { fullName, email, password, role, phoneNumber} = req.body;

  const oldUser = await User.findOne({email:email});
  if (oldUser) {
    return res.send({ data: 'User already exists' });
  }

  try {
    await User.create({
      fullName,
      email:email,
      password,
      role,
      phoneNumber
    })
    res.send({ status:"ok" , data: "user created successfully"});

  } catch (err) {
    res.send({ status: "error", data: err.message });
  }
});


router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });

    if (user.password !== password) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign(
      { id: user._id, role: user.role },
      'secretkey',
      { expiresIn: '1d' }
    );
    res.json({ status: 'ok', token, role: user.role.toLowerCase() });
  } catch (err) {
    res.status(500).json({ message: 'Login error', error: err.message });
  }
});

module.exports = router;