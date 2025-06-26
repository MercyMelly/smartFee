
// const express = require('express');
// const cors = require('cors');
// const connectDB = require('./config/db');
// const dotenv = require('dotenv');

// dotenv.config();
// connectDB();

// const app = express();

// // --- DEBUGGING START ---
// app.use((req, res, next) => {
//     console.log(`[SERVER_DEBUG] Incoming request: ${req.method} ${req.originalUrl}`);
//     console.log(`[SERVER_DEBUG] Headers:`, req.headers['content-type'], req.headers['x-paystack-signature']);
//     next();
// });
// // --- DEBUGGING END ---

// app.use(cors());

// // IMPORTANT: Middleware to parse JSON and capture raw body for Paystack webhook
// app.use(express.json({
//     verify: (req, res, buf) => {
//         if (req.originalUrl === '/api/webhooks/paystack') {
//             try {
//                 req.rawBody = buf.toString();
//                 console.log('[SERVER_DEBUG] Raw body captured for Paystack webhook.');
//             } catch (e) {
//                 console.error('[SERVER_DEBUG] Error capturing raw body:', e.message);
//                 // If there's an error here, it indicates a problem with the incoming buffer itself.
//                 // This might indicate Paystack is sending something unexpected, or ngrok is corrupting.
//             }
//         }
//     }
// }));
// app.use(express.urlencoded({ extended: true }));

// const PORT = process.env.PORT || 3000;

// const authRoutes = require('./routes/auth');
// const studentRoutes = require('./routes/students');
// const paymentRoutes = require('./routes/payments');
// const reportsRoutes = require('./routes/reports');
// const dashboardRoutes = require('./routes/dashboard');
// const otpRoutes = require('./routes/otpRoutes');
// const feeRoutes = require('./routes/fee');
// const webhooksRoutes = require('./routes/webhooks'); // Corrected variable name for clarity

// app.use('/api', authRoutes);
// app.use('/api/students', studentRoutes);
// app.use('/api/payments', paymentRoutes);
// app.use('/api/reports', reportsRoutes);
// app.use('/api/dashboard', dashboardRoutes);
// app.use('/api/password', otpRoutes);
// app.use('/api/fees', feeRoutes);

// // NEW: Paystack Webhook and Pending Payments routes
// app.use('/api/webhooks', webhooksRoutes); // Use the variable name

// // --- DEBUGGING START ---
// // Catch-all route to log if no other route handled the request
// app.use((req, res, next) => {
//     console.warn(`[SERVER_DEBUG] 404 Not Found: No route handled ${req.method} ${req.originalUrl}`);
//     res.status(404).send('Cannot ' + req.method + ' ' + req.originalUrl);
// });
// // --- DEBUGGING END ---

// app.listen(PORT, '0.0.0.0', () => {
//     console.log(`Server running on http://0.0.0.0:${PORT}`);
//     console.log(`Current local time: ${new Date().toLocaleTimeString('en-KE', { timeZone: 'Africa/Nairobi' })}`);
// });




const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const dotenv = require('dotenv');

dotenv.config();
connectDB();

const app = express();

// --- DEBUGGING START --- (Keep this if you like)
app.use((req, res, next) => {
    console.log(`[SERVER_DEBUG] Incoming request: ${req.method} ${req.originalUrl}`);
    console.log(`[SERVER_DEBUG] Headers:`, req.headers['content-type'], req.headers['x-paystack-signature']);
    next();
});
// --- DEBUGGING END ---

app.use(cors());

// IMPORTANT: Middleware to parse JSON and capture raw body for Paystack webhook
app.use(express.json({
    verify: (req, res, buf) => {
        if (req.originalUrl === '/api/webhooks/paystack') {
            try {
                req.rawBody = buf.toString();
                console.log('[SERVER_DEBUG] Raw body captured for Paystack webhook.');
            } catch (e) {
                console.error('[SERVER_DEBUG] Error capturing raw body:', e.message);
            }
        }
    }
}));
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3000;

const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');
const paymentRoutes = require('./routes/payments');
const reportsRoutes = require('./routes/reports');
const dashboardRoutes = require('./routes/dashboard');
const otpRoutes = require('./routes/otpRoutes');
const feeRoutes = require('./routes/fee');
const webhooksRoutes = require('./routes/webhooks');
const smsRoutes = require('./routes/sms'); // NEW: Import SMS routes

app.use('/api', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/password', otpRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/webhooks', webhooksRoutes);
app.use('/api/sms', smsRoutes); // NEW: Register SMS routes

// --- DEBUGGING CATCH-ALL --- (Keep this to catch unhandled routes)
app.use((req, res, next) => {
    console.warn(`[SERVER_DEBUG] 404 Not Found: No route handled ${req.method} ${req.originalUrl}`);
    res.status(404).send('Cannot ' + req.method + ' ' + req.originalUrl);
});
// --- DEBUGGING END ---

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    console.log(`Current local time: ${new Date().toLocaleTimeString('en-KE', { timeZone: 'Africa/Nairobi' })}`);
});
