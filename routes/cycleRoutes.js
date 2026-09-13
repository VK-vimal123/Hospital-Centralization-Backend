const express = require('express');
const router = express.Router();
const { recordCycle, getCycles, getCycleById, deleteCycle } = require('../controllers/cycleController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getCycles)
    .post(protect, recordCycle);

router.route('/:id')
    .get(protect, getCycleById)
    .delete(protect, authorize('Admin'), deleteCycle);

module.exports = router;
