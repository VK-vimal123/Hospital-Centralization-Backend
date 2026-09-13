const express = require('express');
const router = express.Router();
const {
    getMaintenance,
    getMaintenanceById,
    createMaintenance,
    updateMaintenance,
    deleteMaintenance
} = require('../controllers/maintenanceController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getMaintenance)
    .post(protect, createMaintenance);

router.route('/:id')
    .get(protect, getMaintenanceById)
    .put(protect, updateMaintenance)
    .delete(protect, authorize('Admin'), deleteMaintenance);

module.exports = router;
