const express = require('express');
const router = express.Router();
const { loginUser, registerUser, getUserProfile, updateUserProfile, googleLogin } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', googleLogin);
router.get('/me', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);

module.exports = router;
