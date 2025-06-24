// // backend/middleware/auth.js (updated for single-school)
// const jwt = require('jsonwebtoken');
// require('dotenv').config(); 

// module.exports = function (req, res, next) {
//     // Get token from header
//     const token = req.header('x-auth-token');

//     // Check if no token
//     if (!token) {
//         return res.status(401).json({ msg: 'No token, authorization denied' });
//     }

//     // Verify token
//     try {
//         // jwt.verify takes the token and your secret
//         const decoded = jwt.verify(token, process.env.JWT_SECRET);

//         // Attach user information from the token payload to the request object
//         // For a single-school setup, we only need user ID and role
//         req.user = {
//             id: decoded.user.id,
//             role: decoded.user.role,
//             // schoolId: decoded.user.schoolId // <--- REMOVED: No longer needed for single-school
//         };

//         next(); // Move to the next middleware/route handler
//     } catch (err) {
//         console.error('Auth middleware error:', err.message);
//         // Handle specific JWT errors
//         if (err.name === 'TokenExpiredError') {
//             return res.status(401).json({ msg: 'Token expired' });
//         }
//         if (err.name === 'JsonWebTokenError') {
//             return res.status(401).json({ msg: 'Token is not valid' });
//         }
//         res.status(500).json({ msg: 'Server Error during token verification' });
//     }
// };


const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

module.exports = function (req, res, next) {
    // Get token from header
    const token = req.header('x-auth-token');

    console.log('[AUTH_DEBUG] Received token:', token ? 'Token present' : 'No token');

    // Check if not token
    if (!token) {
        console.log('[AUTH_DEBUG] No token provided. Denying access (401).');
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    // Verify token
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user; // This line is crucial for populating req.user
        console.log('[AUTH_DEBUG] Token verified. req.user set to:', req.user);
        next(); // Proceed to the next middleware/route handler
    } catch (err) {
        console.error('[AUTH_DEBUG] Token verification failed:', err.message);
        res.status(401).json({ msg: 'Token is not valid' }); // Deny if token is invalid
    }
};
