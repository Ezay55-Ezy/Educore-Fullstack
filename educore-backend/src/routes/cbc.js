const express = require('express');
const router  = express.Router();
const cbcController = require('../controllers/cbcController');
const { protect, teacherOnly } = require('../middleware/auth');

router.get('/learning-areas',      protect, cbcController.getLearningAreas);
router.get('/strands/:learningAreaId', protect, cbcController.getStrands);
router.get('/sub-strands/:strandId',  protect, cbcController.getSubStrands);
router.get('/assessments/:studentId', protect, cbcController.getStudentAssessments);

router.post('/assessments', protect, teacherOnly, cbcController.submitAssessment);

module.exports = router;
