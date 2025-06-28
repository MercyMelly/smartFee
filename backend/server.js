const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const dotenv = require('dotenv');

dotenv.config();
connectDB();

const app = express();

// Middleware to parse JSON bodies and specifically store rawBody for webhooks
// This MUST come BEFORE any other body-parsing middleware for the webhook route.

app.use(express.json({
    verify: (req, res, buf) => {
        // CRITICAL FIX: The ONLY webhook route should be /api/payments/webhook
        // Paystack MUST be configured to send webhooks to YOUR_BACKEND_URL/api/payments/webhook
        if (req.originalUrl === '/api/payments/webhook') { 
            try {
                req.rawBody = buf.toString();
                console.log('[SERVER_DEBUG] Raw body captured for Paystack webhook at /api/payments/webhook.');
            } catch (e) {
                console.error('[SERVER_DEBUG] Error capturing raw body for webhook:', e.message);
            }
        }
    }
}));
// For URL-encoded bodies (e.g., form submissions). Make sure it's after the rawBody middleware for webhooks.
app.use(express.urlencoded({ extended: true }));

app.use(cors()); // Enable CORS for all routes

// Basic URL logging for debug
app.use((req, res, next) => {
    console.log(`[SERVER_DEBUG] Incoming request: ${req.method} ${req.originalUrl}`);
    console.log(`[SERVER_DEBUG] Headers: Content-Type=${req.headers['content-type'] || 'undefined'}, X-Paystack-Signature=${req.headers['x-paystack-signature'] || 'undefined'}`);
    next();
});

const PORT = process.env.PORT || 3000;

// Import your routes
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');
const paymentRoutes = require('./routes/payments'); // This is your main payments route
const reportsRoutes = require('./routes/reports');
const dashboardRoutes = require('./routes/dashboard');
const otpRoutes = require('./routes/otpRoutes');
const feeRoutes = require('./routes/fee');
// const webhooksRoutes = require('./routes/webhooks'); // <--- REMOVE OR COMMENT THIS LINE IF IT STILL EXISTS IN YOUR server.js
const smsRoutes = require('./routes/sms'); 
const parentRoutes = require('./routes/parents');
const pricesRoutes = require('./routes/prices'); 
const ussdController = require('./controllers/ussdController');

// Mount your routes
app.use('/api/auth', authRoutes); 
app.use('/api/students', studentRoutes);
app.use('/api/payments', paymentRoutes); // This route now handles ALL payment logic, including the webhook
app.use('/api/reports', reportsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/password', otpRoutes);
app.use('/api/fees', feeRoutes);
// app.use('/api/webhooks', webhooksRoutes); // <--- ENSURE THIS LINE IS REMOVED OR COMMENTED OUT
app.use('/api/sms', smsRoutes); 
app.use('/api/parents', parentRoutes);
app.use('/api/prices', pricesRoutes); 
app.post('/api/ussd', ussdController.ussdCallback); 

// General 404 handler (should be last route middleware)
app.use((req, res, next) => {
    console.warn(`[SERVER_DEBUG] 404 Not Found: No route handled ${req.method} ${req.originalUrl}`);
    res.status(404).send('Cannot ' + req.method + ' ' + req.originalUrl);
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    console.log(`Current local time: ${new Date().toLocaleTimeString('en-KE', { timeZone: 'Africa/Nairobi' })}`);
});
