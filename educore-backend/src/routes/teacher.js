const express = require('express');
const router  = express.Router();
const {
  getGrades, getClassesByGrade, getClassStudents,
  getAttendance, saveAttendance,
  getLearningAreas
} = require('../controllers/teacherController');
const { protect } = require('../middleware/auth');

// All teacher routes require login
router.use(protect);

router.get('/grades',                 getGrades);
router.get('/grades/:grade/classes',  getClassesByGrade);
router.get('/classes/:id/students',   getClassStudents);
router.get('/attendance',             getAttendance);
router.post('/attendance',            saveAttendance);
router.get('/learning-areas',         getLearningAreas);

module.exports = router;
