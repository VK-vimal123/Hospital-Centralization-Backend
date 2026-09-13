const express = require('express');
const router = express.Router();

const { getUsers, createUser } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', protect, authorize('Admin'), getUsers);
router.post('/', protect, authorize('Admin'), createUser);

module.exports = router;
