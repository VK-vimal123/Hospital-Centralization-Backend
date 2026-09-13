const express = require('express');
const router = express.Router();
const { getTrays, addTray, updateTrayStatus } = require('../controllers/inventoryController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/trays')
    .get(protect, getTrays)
    .post(protect, authorize('admin', 'sterilization_staff'), addTray);

router.route('/trays/:barcode')
    .put(protect, authorize('admin', 'sterilization_staff', 'supervisor'), updateTrayStatus);

module.exports = router;
