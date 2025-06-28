const jwt = require('jsonwebtoken');
const User = require('../models/user'); 

const protect = async (req, res, next) => {
    // Get token from 'x-auth-token' header
    const token = req.header('x-auth-token'); // Reverted to look for x-auth-token

    console.log('[AUTH_DEBUG] Received token:', token ? 'Token present' : 'No token');

    // Check if not token
    if (!token) {
        console.log('[AUTH_DEBUG] No token provided. Denying access (401).');
        return res.status(401).json({ message: 'Not authorized, no token' }); // Changed 'msg' to 'message' for consistency
    }

    // Verify token
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Ensure decoded.user.id or decoded.id exists, based on your JWT payload structure.
        // Your current backend generates payload as { user: { id: newUser.id, role: newUser.role } }
        // So, it should be decoded.user.id
        req.user = await User.findById(decoded.user.id).select('-password'); // Fetch user from DB

        if (!req.user) {
            console.log('[AUTH_DEBUG] Token valid, but user not found in DB. Denying access (401).');
            return res.status(401).json({ message: 'Not authorized, user not found' });
        }

        console.log('[AUTH_DEBUG] Token verified. req.user set to:', req.user.email, req.user.role);
        next(); // Proceed to the next middleware/route handler
    } catch (error) {
        console.error('[AUTH_DEBUG] Token verification failed:', error.message);
        return res.status(401).json({ message: 'Not authorized, token failed' }); // Changed 'msg' to 'message' for consistency
    }
};

const authorize = (roles = []) => {
    if (typeof roles === 'string') {
        roles = [roles];
    }
    return (req, res, next) => {
        if (!req.user || (roles.length > 0 && !roles.includes(req.user.role))) {
            return res.status(403).json({ message: `Forbidden: User role '${req.user.role}' not allowed to access this resource.` });
        }
        next();
    };
};

module.exports = { protect, authorize };


// const jwt = require('jsonwebtoken');
// const dotenv = require('dotenv');

// dotenv.config();

// module.exports = function (req, res, next) {
//     // Get token from header
//     const token = req.header('x-auth-token');

//     console.log('[AUTH_DEBUG] Received token:', token ? 'Token present' : 'No token');

//     // Check if not token
//     if (!token) {
//         console.log('[AUTH_DEBUG] No token provided. Denying access (401).');
//         return res.status(401).json({ msg: 'No token, authorization denied' });
//     }

//     // Verify token
//     try {
//         const decoded = jwt.verify(token, process.env.JWT_SECRET);
//         req.user = decoded.user; // This line is crucial for populating req.user
//         console.log('[AUTH_DEBUG] Token verified. req.user set to:', req.user);
//         next(); // Proceed to the next middleware/route handler
//     } catch (err) {
//         console.error('[AUTH_DEBUG] Token verification failed:', err.message);
//         res.status(401).json({ msg: 'Token is not valid' }); // Deny if token is invalid
//     }
// };
