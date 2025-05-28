const express = require('express');
const router = express.Router();
const { getOutstandingByClass } = require('../controllers/reportsController');
const { generateBalanceReportPDF } = require('../controllers/reportsController');
const { sendOutstandingBalanceAlerts } = require('../controllers/reportsController');
const { getDefaultersList } = require('../controllers/reportsController');
const { getDashboardStats } = require('../controllers/reportsController');
const { downloadOutstandingPDF } = require('../controllers/reportsController');


router.get('/outstandingByClass', getOutstandingByClass);
router.get('/balancePdf', generateBalanceReportPDF);
router.post('/sendBalanceAlerts', sendOutstandingBalanceAlerts);
router.get('/defaulters', getDefaultersList);
router.get('/dashboardStats', getDashboardStats);
router.get('/outstanding/pdf', downloadOutstandingPDF);

module.exports = router;

