const express = require('express');
const router = express.Router();
const { getAuditLogs } = require('../controllers/auditLogController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Only admins can view audit logs; no DELETE or UPDATE routes (immutable)
router.get('/', protect, authorize('Admin'), getAuditLogs);

module.exports = router;
