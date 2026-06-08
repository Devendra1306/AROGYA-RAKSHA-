const express = require('express');
const router = express.Router();
const medicalController = require('../controllers/medical.controller');
const { protect } = require('../middleware/auth');

// Support optional authentication on /chat endpoint
const optionalAuth = (req, res, next) => {
  if (req.headers.authorization) {
    return protect(req, res, next);
  }
  next();
};

router.post('/chat', optionalAuth, medicalController.chat);

router.get('/history', protect, medicalController.getHistory);
router.get('/history/:id', protect, medicalController.getHistoryDetails);
router.delete('/history/:id', protect, medicalController.deleteHistory);

module.exports = router;
