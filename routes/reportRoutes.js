const express = require('express');
const router = express.Router();
const { generateReport } = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', protect, authorize('Admin'), generateReport);

module.exports = router;
