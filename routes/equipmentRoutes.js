const express = require('express');
const router = express.Router();
const {
    getEquipment,
    getEquipmentById,
    getEquipmentByQR,
    createEquipment,
    updateEquipment,
    deleteEquipment
} = require('../controllers/equipmentController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public QR scan endpoint (no auth needed for scanning)
router.get('/qr/:equipment_id', getEquipmentByQR);

// Protected routes
router.route('/')
    .get(protect, getEquipment)
    .post(protect, authorize('Admin', 'Sterilization Staff'), createEquipment);

router.route('/:id')
    .get(protect, getEquipmentById)
    .put(protect, authorize('Admin', 'Sterilization Staff'), updateEquipment)
    .delete(protect, deleteEquipment);

module.exports = router;
