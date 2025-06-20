// const express = require('express');
// require('../models/user'); 
// const mongoose = require('mongoose');
// const jwt = require('jsonwebtoken');
// // const bcrypt = require('bcryptjs'); 
// const router = express.Router();
// const User = mongoose.model('userInfo');
// const JWT_SECRET = process.env.JWT_SECRET 


// router.post('/signup', async (req, res) => {
//   const { fullName, email, password, role, phoneNumber } = req.body;
//   const lowerEmail = email.toLowerCase();
//   const oldUser = await User.findOne({ email: lowerEmail });

//   if (oldUser) {
//     return res.send({ data: 'User already exists' });
//   }

//   try {
//     await User.create({
//       fullName,
//       email: lowerEmail,
//       password,
//       role,
//       phoneNumber
//     });
//     res.send({ status: "ok", data: "user created successfully" });
//   } catch (err) {
//     res.send({ status: "error", data: err.message });
//   }
// });

// router.post('/login', async (req, res) => {
//   const { email, password } = req.body;
//   const lowerEmail = email.toLowerCase();

//   try {
//     const user = await User.findOne({ email: lowerEmail });
//     if (!user) return res.status(400).json({ message: 'User not found' });

//     if (user.password !== password) {
//       return res.status(400).json({ message: 'Invalid credentials' });
//     }

//     const token = jwt.sign(
//       { userId: user._id, role: user.role },
//       JWT_SECRET,
//       { expiresIn: '7d' }
//     );

//     const safeUser = {
//       _id: user._id,
//       fullName: user.fullName,
//       email: user.email,
//       role: user.role,
//       phoneNumber: user.phoneNumber,
//     };

//     res.json({
//       status: 'ok',
//       token, 
//       role: user.role.toLowerCase(),
//       user: safeUser,
//     });

//     console.log("token", token);

//     console.log(`User ${user.fullName} logged in successfully.`);

//   } catch (err) {
//     res.status(500).json({ message: 'Login error', error: err.message });
//   }
// });

// module.exports = router;

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
require('dotenv').config();

const User = require('../models/user');
const auth = require('../middleware/auth'); // Your authentication middleware

// --- User Signup Route ---
// This route is for the initial admin/director signup for the school.
router.post('/signup',
    [
        check('fullName', 'Full Name is required').not().isEmpty(),
        check('email', 'Please include a valid email').isEmail(),
        check('password', 'Password is required').isLength({ min: 8 })
            .withMessage('Password must be at least 8 characters long')
            .matches(/[a-z]/)
            .withMessage('Password must include at least one lowercase letter')
            .matches(/[A-Z]/)
            .withMessage('Password must include at least one uppercase letter')
            .matches(/\d/)
            .withMessage('Password must include at least one number')
            .matches(/[!@#$%^&*(),.?":{}|<>]/)
            .withMessage('Password must include at least one special character'),
        check('phoneNumber', 'Phone Number is required').matches(/^\+?[0-9]{10,15}$/)
            .withMessage('Invalid phone number format. Must be 10-15 digits, optionally starting with +'),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { fullName, email, password, phoneNumber } = req.body;

        try {
            let existingUser = await User.findOne({ email: email.toLowerCase() });
            if (existingUser) {
                return res.status(400).json({ msg: 'A user with this email already exists.' });
            }

            // Create new user (role defaults to 'director' or 'admin' for first signup)
            const newUser = new User({
                fullName,
                email: email.toLowerCase(), // Store email in lowercase
                phoneNumber,
                password, // Mongoose pre-save hook will hash this
                role: 'director' // Set default role for initial signup
            });

            await newUser.save(); // Save the new user to the database

            // Prepare payload for JWT
            const payload = {
                user: {
                    id: newUser.id, // Mongoose virtual `id` from `_id`
                    role: newUser.role
                }
            };

            // Sign and return token
            jwt.sign(
                payload,
                process.env.JWT_SECRET,
                { expiresIn: '7d' }, // Token expiration
                (err, token) => {
                    if (err) throw err;
                    res.json({
                        status: 'ok',
                        message: 'User registered successfully',
                        token,
                        userRole: newUser.role, // Keep for clarity, though 'user.role' is primary
                        // **Consistent user object for frontend:**
                        user: {
                            _id: newUser._id,
                            fullName: newUser.fullName,
                            email: newUser.email,
                            role: newUser.role,
                            phoneNumber: newUser.phoneNumber,
                        },
                    });
                }
            );

        } catch (err) {
            console.error('User registration error:', err.message);
            // Handle duplicate key error specifically
            if (err.code === 11000) {
                return res.status(400).json({ msg: 'A user with this email already exists.' });
            }
            res.status(500).send('Server error during user registration.');
        }
    }
);

// --- User Login Route ---
router.post('/login',
    [
        check('email', 'Please include a valid email').isEmail(),
        check('password', 'Password is required').exists()
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        try {
            // Find user by email (case-insensitive)
            let user = await User.findOne({ email: email.toLowerCase() });

            if (!user) {
                return res.status(400).json({ message: 'Invalid Credentials' });
            }

            // Check password
            const isMatch = await user.matchPassword(password);
            if (!isMatch) {
                return res.status(400).json({ message: 'Invalid Credentials' });
            }

            // Prepare payload for JWT
            const payload = {
                user: {
                    id: user.id,
                    role: user.role
                }
            };

            // Sign and return token
            jwt.sign(
                payload,
                process.env.JWT_SECRET,
                { expiresIn: '7d' },
                (err, token) => {
                    if (err) throw err;
                    res.json({
                        status: 'ok',
                        token,
                        userRole: user.role.toLowerCase(), // Keep for clarity
                        // **Consistent user object for frontend:**
                        user: {
                            _id: user._id,
                            fullName: user.fullName,
                            email: user.email,
                            role: user.role, // This role is directly from the DB
                            phoneNumber: user.phoneNumber,
                        },
                    });
                }
            );

        } catch (err) {
            console.error('Login error:', err.message);
            res.status(500).json({ message: 'Server error during login', error: err.message });
        }
    }
);

// --- Add Staff Route (Admin/Director Only) ---
// This route is used by an authenticated admin/director to add new staff members.
router.post('/add-staff',
    auth, // Protect this route with authentication middleware
    [
        check('fullName', 'Full Name is required').not().isEmpty(),
        check('email', 'Please include a valid email').isEmail(),
        check('password', 'Password is required').isLength({ min: 8 })
            .withMessage('Password must be at least 8 characters long')
            .matches(/[a-z]/)
            .withMessage('Password must include at least one lowercase letter')
            .matches(/[A-Z]/)
            .withMessage('Password must include at least one uppercase letter')
            .matches(/\d/)
            .withMessage('Password must include at least one number')
            .matches(/[!@#$%^&*(),.?":{}|<>]/)
            .withMessage('Password must include at least one special character'),
        check('phoneNumber', 'Phone Number is required').matches(/^\+?[0-9]{10,15}$/)
            .withMessage('Invalid phone number format. Must be 10-15 digits, optionally starting with +'),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        // Check if the authenticated user has permission to add staff
        if (req.user.role !== 'director' && req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Not authorized to add staff' });
        }

        const { fullName, email, password, role, phoneNumber } = req.body;

        try {
            // Check if a user with this email already exists
            let existingUser = await User.findOne({ email: email.toLowerCase() });
            if (existingUser) {
                return res.status(400).json({ msg: 'A user with this email already exists' });
            }

            // Create the new staff member
            const newUser = new User({
                fullName,
                email: email.toLowerCase(),
                password, // Password will be hashed by pre-save hook in User model
                role: role.toLowerCase(), // Ensure role is lowercase
                phoneNumber
            });

            await newUser.save();

            // Respond with success and the details of the new staff member
            res.json({
                status: 'ok',
                message: `Staff member (${newUser.role}) added successfully`,
                user: { // Details of the *newly added* user
                    _id: newUser._id,
                    fullName: newUser.fullName,
                    email: newUser.email,
                    role: newUser.role,
                    phoneNumber: newUser.phoneNumber,
                }
            });

        } catch (err) {
            console.error('Add staff error:', err.message);
            // Handle duplicate key error specifically
            if (err.code === 11000) {
                return res.status(400).json({ msg: 'A user with this email already exists' });
            }
            res.status(500).send('Server error during staff creation.');
        }
    }
);

module.exports = router;