const jwt = require('jsonwebtoken');
const User = require('../models/user'); // Ensure correct path to your User model
const { validationResult } = require('express-validator'); // For validation results

// Helper function to generate JWT token
const generateToken = (id, role) => {
    const payload = {
        user: {
            id: id,
            role: role
        }
    };
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// @desc    Authenticate user & get token (Login)
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
        let user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        const token = generateToken(user.id, user.role);

        res.json({
            status: 'ok',
            token,
            user: {
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                phoneNumber: user.phoneNumber,
            },
        });

    } catch (err) {
        console.error('Login error:', err.message);
        res.status(500).json({ message: 'Server error during login', error: err.message });
    }
};

// @desc    Register a new staff/admin/director user (initial signup)
// @route   POST /api/auth/signup
// @access  Public
const signupUser = async (req, res) => {
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

        const newUser = new User({
            fullName,
            email: email.toLowerCase(),
            phoneNumber,
            password,
            role: 'director' // Default role for initial signup (e.g., first user for the school)
        });

        await newUser.save();
        const token = generateToken(newUser.id, newUser.role);

        res.json({
            status: 'ok',
            message: 'User registered successfully',
            token,
            user: {
                _id: newUser._id,
                fullName: newUser.fullName,
                email: newUser.email,
                role: newUser.role,
                phoneNumber: newUser.phoneNumber,
            },
        });

    } catch (err) {
        console.error('User registration error:', err.message);
        if (err.code === 11000) {
            return res.status(400).json({ msg: 'A user with this email already exists.' });
        }
        res.status(500).send('Server error during user registration.');
    }
};


// @desc    Register a new parent user
// @route   POST /api/auth/parent-signup
// @access  Public
const parentSignup = async (req, res) => {
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

        const newUser = new User({
            fullName,
            email: email.toLowerCase(),
            phoneNumber,
            password,
            role: 'parent' // Role is hardcoded to 'parent' here
        });

        await newUser.save();
        const token = generateToken(newUser.id, newUser.role);

        res.json({
            status: 'ok',
            message: 'Parent account registered successfully',
            token,
            user: {
                _id: newUser._id,
                fullName: newUser.fullName,
                email: newUser.email,
                role: newUser.role,
                phoneNumber: newUser.phoneNumber,
            },
        });

    } catch (err) {
        console.error('Parent registration error:', err.message);
        if (err.code === 11000) {
            return res.status(400).json({ msg: 'A user with this email already exists.' });
        }
        res.status(500).send('Server error during parent registration.');
    }
};

// @desc    Add a new staff member (Admin/Director only)
// @route   POST /api/auth/add-staff
// @access  Private (Admin/Director)
const addStaff = async (req, res) => {
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
        let existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ msg: 'A user with this email already exists' });
        }

        const newUser = new User({
            fullName,
            email: email.toLowerCase(),
            phoneNumber,
            password,
            role: role.toLowerCase(), // Role is passed from the request body for staff
        });

        await newUser.save();

        res.json({
            status: 'ok',
            message: `Staff member (${newUser.role}) added successfully`,
            user: {
                _id: newUser._id,
                fullName: newUser.fullName,
                email: newUser.email,
                role: newUser.role,
                phoneNumber: newUser.phoneNumber,
            }
        });

    } catch (err) {
        console.error('Add staff error:', err.message);
        if (err.code === 11000) {
            return res.status(400).json({ msg: 'A user with this email already exists' });
        }
        res.status(500).send('Server error during staff creation.');
    }
};


module.exports = {
    loginUser,
    signupUser, // The original signup (for director/staff)
    parentSignup, // The new parent-specific signup
    addStaff, // The add staff function
};
