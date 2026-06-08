const express = require('express');
const router = express.Router();
const assessmentController = require('../controllers/assessment.controller');
const { protect } = require('../middleware/auth');

router.post('/generate', protect, assessmentController.generate);
router.get('/latest', protect, assessmentController.getLatest);
router.get('/history', protect, assessmentController.getHistory);

module.exports = router;
