const express = require('express');
const router  = express.Router();
const reportCardController = require('../controllers/reportCardController');
const { protect } = require('../middleware/auth');

// GET report card for student/teacher
router.get('/',               protect, reportCardController.getReportCard);

module.exports = router;
