const express = require('express');
const router = express.Router();
const {
    getDashboardSummary,
    getRecentCycles,
    getComplianceChart,
    getMonthlyStats,
    getEquipmentStatusChart,
    getEquipmentUsage,
    getRecentNotifications
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

router.get('/summary', protect, getDashboardSummary);
router.get('/cycles', protect, getRecentCycles);
router.get('/compliance-trend', protect, getComplianceChart);
router.get('/monthly-stats', protect, getMonthlyStats);
router.get('/equipment-status', protect, getEquipmentStatusChart);
router.get('/equipment-usage', protect, getEquipmentUsage);
router.get('/recent-notifications', protect, getRecentNotifications);

module.exports = router;
