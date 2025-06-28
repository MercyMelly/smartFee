const express = require('express');
const router = express.Router();
const { check } = require('express-validator'); 
require('dotenv').config();

const { protect, authorize } = require('../middleware/auth'); 
const { loginUser, signupUser, parentSignup, addStaff } = require('../controllers/authController'); 

// --- User Signup Route (For initial staff/admin registration) ---
router.post('/signup',
    [
        check('fullName', 'Full Name is required').not().isEmpty(),
        check('email', 'Please include a valid email').isEmail(),
        check('password', 'Password is required').isLength({ min: 8 })
            .withMessage('Password must be at least 8 characters long')
            // Corrected: .matches(regex).withMessage(message)
            .matches(/[a-z]/).withMessage('Password must include at least one lowercase letter') 
            .matches(/[A-Z]/).withMessage('Password must include at least one uppercase letter') 
            .matches(/\d/).withMessage('Password must include at least one number') 
            .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Password must include at least one special character'), 
        check('phoneNumber', 'Phone Number is required').matches(/^\+?[0-9]{10,15}$/)
            .withMessage('Invalid phone number format. Must be 10-15 digits, optionally starting with +'),
    ],
    signupUser 
);

// --- User Login Route ---
router.post('/login',
    [
        check('email', 'Please include a valid email').isEmail(),
        check('password', 'Password is required').exists()
    ],
    loginUser 
);

// --- Add Staff Route (Admin/Director Only) ---
router.post('/add-staff',
    protect, 
    authorize(['director', 'admin']), 
    [
        check('fullName', 'Full Name is required').not().isEmpty(),
        check('email', 'Please include a valid email').isEmail(),
        check('password', 'Password is required').isLength({ min: 8 })
            .withMessage('Password must be at least 8 characters long')
            // Corrected: .matches(regex).withMessage(message)
            .matches(/[a-z]/).withMessage('Password must include at least one lowercase letter') 
            .matches(/[A-Z]/).withMessage('Password must include at least one uppercase letter') 
            .matches(/\d/).withMessage('Password must include at least one number') 
            .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Password must include at least one special character'), 
        check('phoneNumber', 'Phone Number is required').matches(/^\+?[0-9]{10,15}$/)
            .withMessage('Invalid phone number format. Must be 10-15 digits, optionally starting with +'),
    ],
    addStaff 
);

// --- NEW PARENT SIGNUP ROUTE ---
router.post('/parent-signup',
    [
        check('fullName', 'Full Name is required').not().isEmpty(),
        check('email', 'Please include a valid email').isEmail(),
        check('password', 'Password is required').isLength({ min: 8 })
            .withMessage('Password must be at least 8 characters long')
            // Corrected: .matches(regex).withMessage(message)
            .matches(/[a-z]/).withMessage('Must include a lowercase letter') 
            .matches(/[A-Z]/).withMessage('Must include an uppercase letter') 
            .matches(/\d/).withMessage('Must include a number') 
            .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Must include a special character'), 
        check('phoneNumber', 'Phone Number is required').matches(/^\+?[0-9]{10,15}$/)
            .withMessage('Invalid phone number format. Must be 10-15 digits, optionally starting with +'),
    ],
    parentSignup 
);

module.exports = router;
