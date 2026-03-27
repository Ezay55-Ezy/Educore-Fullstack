const express = require('express');
const router  = express.Router();
const classController = require('../controllers/classController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/',    protect, classController.getClasses);
router.post('/',   protect, adminOnly, classController.createClass);
router.put('/:id', protect, adminOnly, classController.updateClass);
router.delete('/:id', protect, adminOnly, classController.deleteClass);

module.exports = router;
