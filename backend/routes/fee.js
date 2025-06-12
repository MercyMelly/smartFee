const express = require('express');
const router = express.Router();
const feeController = require('../controllers/feeController');

router.get('/structure', feeController.getFeeStructure);


module.exports = router;
