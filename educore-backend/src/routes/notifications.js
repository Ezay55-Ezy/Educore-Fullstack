const express = require('express');
const router  = express.Router();
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

// All notification routes are protected
router.use(protect);

router.get('/',               notificationController.getNotifications);
router.put('/read-all',       notificationController.markAllAsRead);
router.put('/:id',            notificationController.markAsRead);
router.delete('/:id',         notificationController.deleteNotification);

module.exports = router;
