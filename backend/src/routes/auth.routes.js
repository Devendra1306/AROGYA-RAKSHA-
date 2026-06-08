const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');

router.post('/register', authController.register);
router.post('/login', authController.login);

router.get('/profile', protect, authController.getProfile);
router.post('/profile/setup', protect, authController.setupProfile);
router.delete('/profile/delete', protect, authController.deleteAccount);
router.get('/profile/export-pdf', protect, authController.exportPDF);

module.exports = router;
