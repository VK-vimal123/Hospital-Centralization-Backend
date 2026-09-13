const express = require('express');
const router = express.Router();
const { startCycle, completeCycle } = require('../controllers/cycleV1Controller');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, authorize('admin', 'sterilization_staff'), startCycle);

router.route('/:id/complete')
    .put(protect, authorize('admin', 'sterilization_staff'), completeCycle);

module.exports = router;
