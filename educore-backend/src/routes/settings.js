const express = require('express');
const router  = express.Router();
const settingsController = require('../controllers/settingsController');
const { protect, adminOnly } = require('../middleware/auth');

// GET settings is public to logged in users
router.get('/', protect, settingsController.getSettings);

// Institution settings (Public to all logged in users, updated by Admin/Teacher)
router.get('/institution', protect, settingsController.getInstitutionName);
router.post('/institution', protect, settingsController.updateInstitutionName);

// Only admin and teacher can update settings (per requirement)
router.put('/', protect, settingsController.updateSetting);

// Update profile (email, phone, address)
router.put('/profile', protect, settingsController.updateProfile);

module.exports = router;
