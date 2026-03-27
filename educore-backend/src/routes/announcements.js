const express = require('express');
const router  = express.Router();
const announcementController = require('../controllers/announcementController');
const { protect, adminOnly } = require('../middleware/auth');

// Public to all logged in users
router.get('/',               protect, announcementController.getAnnouncements);

// Admin only
router.post('/',              protect, adminOnly, announcementController.createAnnouncement);
router.put('/:id',            protect, adminOnly, announcementController.updateAnnouncement);
router.delete('/:id',         protect, adminOnly, announcementController.deleteAnnouncement);

module.exports = router;
