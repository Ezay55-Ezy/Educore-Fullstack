const express = require('express');
const router  = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Public
router.post('/login',           authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-reset-code', authController.verifyResetCode);
router.post('/reset-password',  authController.resetPassword);

// Protected
router.get('/me',               protect, authController.getMe);
router.get('/profile',          protect, authController.getProfile);
router.put('/profile',          protect, authController.updateProfile);
router.put('/change-password',  protect, authController.changePassword);

module.exports = router;
