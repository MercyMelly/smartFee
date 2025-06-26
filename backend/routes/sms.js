// backend/routes/sms.js

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Your authentication middleware
const smsController = require('../controllers/smsController'); // Import the SMS controller


router.post('/send-to-parent', auth, smsController.sendIndividualSmsToParent);

router.post('/send-outstanding-balances', auth, smsController.sendOutstandingBalanceSms);

module.exports = router;
