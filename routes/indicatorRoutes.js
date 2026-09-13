const express = require('express');
const router = express.Router();
const { addIndicator } = require('../controllers/indicatorController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, authorize('admin', 'sterilization_staff'), addIndicator);

module.exports = router;
