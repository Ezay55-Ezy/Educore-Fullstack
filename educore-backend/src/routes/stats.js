const express = require('express');
const router  = express.Router();
const statsController = require('../controllers/statsController');
const { protect, adminOnly } = require('../middleware/auth');

// GET admin stats
router.get('/',               protect, adminOnly, statsController.getAdminStats);

module.exports = router;
