const express = require('express');
const router  = express.Router();
const {
  getGrades, getClassesByGrade, getClassStudents,
  getAttendance, saveAttendance,
  getLearningAreas,
  registerTeacher, deleteTeacher, getAllTeachers
} = require('../controllers/teacherController');
const { protect, adminOnly } = require('../middleware/auth');

// All teacher routes require login
router.use(protect);

router.get('/grades',                 getGrades);
router.get('/grades/:grade/classes',  getClassesByGrade);
router.get('/classes/:id/students',   getClassStudents);
router.get('/attendance',             getAttendance);
router.post('/attendance',            saveAttendance);
router.get('/learning-areas',         getLearningAreas);

// Admin-only teacher management
router.get('/', adminOnly, getAllTeachers);
router.post('/', adminOnly, registerTeacher);
router.delete('/:id', adminOnly, deleteTeacher);

module.exports = router;
