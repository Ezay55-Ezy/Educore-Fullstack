const express = require('express');
const router  = express.Router();
const {
  getAllStudents, getStudentById
} = require('../controllers/studentController');
const { protect, adminOnly, ownDataOnly } = require('../middleware/auth');

// All routes below require login
router.use(protect);

// ── Student routes ───────────────────────────────────────────
router.get('/',    adminOnly, getAllStudents);
router.get('/:id', ownDataOnly, getStudentById);

module.exports = router;
