const express = require('express');
const router = express.Router();
const {
    checkCompliance,
    getComplianceSummary,
    getEquipmentCompliance,
    getProfiles,
    verifyCycle
} = require('../controllers/complianceController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/check', protect, checkCompliance);
router.get('/summary', protect, getComplianceSummary);
router.get('/equipment', protect, getEquipmentCompliance);
router.get('/profiles', protect, getProfiles);
router.post('/verify/:id', protect, authorize('Admin'), verifyCycle);

module.exports = router;
