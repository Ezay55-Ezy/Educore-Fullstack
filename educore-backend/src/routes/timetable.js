const express = require('express');
const router  = express.Router();
const timetableController = require('../controllers/timetableController');
const { protect, adminOnly } = require('../middleware/auth');

// GET timetable for student/teacher
router.get('/',               protect, timetableController.getTimetable);

// Admin only POST timetable entry
router.post('/',              protect, adminOnly, timetableController.createTimetableEntry);

module.exports = router;
