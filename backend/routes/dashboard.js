const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
// Destructure the protect function from your auth middleware
const { protect } = require('../middleware/auth'); 

// Apply 'protect' middleware to the route that requires authentication
router.get('/summary', protect, dashboardController.getDashboardSummary);

module.exports = router;
