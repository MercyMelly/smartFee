// backend/routes/sms.js

const express = require('express');
const router = express.Router();
// Destructure the protect and authorize functions from your auth middleware
const { protect, authorize } = require('../middleware/auth'); 
const smsController = require('../controllers/smsController'); // Import the SMS controller


router.post('/send-to-parent', protect, smsController.sendIndividualSmsToParent); // Fixed: using 'protect'

router.post('/send-outstanding-balances', protect, smsController.sendOutstandingBalanceSms); // Fixed: using 'protect'

module.exports = router;
