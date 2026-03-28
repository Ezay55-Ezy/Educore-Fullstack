const express = require('express');
const router  = express.Router();
const {
  getAllStudents, getStudentById, registerStudent, updateStudent, deleteStudent
} = require('../controllers/studentController');
const {
  getAllTeachers, registerTeacher, deleteTeacher
} = require('../controllers/teacherController');
const { protect, adminOnly, ownDataOnly } = require('../middleware/auth');

// All routes below require login
router.use(protect);

// ── Student routes ───────────────────────────────────────────
router.get('/',    adminOnly, getAllStudents);
router.post('/',   adminOnly, registerStudent);
router.get('/:id', ownDataOnly, getStudentById);
router.put('/:id', adminOnly, updateStudent);
router.delete('/:id', adminOnly, deleteStudent);

// ── Teacher management (Frontend currently expects these under /students) ───
router.get('/teachers', adminOnly, getAllTeachers);
router.post('/register-teacher', adminOnly, registerTeacher);
router.delete('/teachers/:id', adminOnly, deleteTeacher);

module.exports = router;
