const express = require('express');
const router  = express.Router();
const settingsController = require('../controllers/settingsController');
const { protect, adminOnly } = require('../middleware/auth');

// GET settings is public to logged in users
router.get('/', protect, settingsController.getSettings);

// Only admin and teacher can update settings (per requirement)
router.put('/', protect, settingsController.updateSetting);

module.exports = router;
