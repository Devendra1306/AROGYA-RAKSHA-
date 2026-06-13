const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');

// Since Firebase handles authentication, we only need routes to sync user data
// and fetch/manage the user profile.
router.post('/register', protect, authController.syncUser);
router.get('/profile', protect, authController.getProfile);
router.post('/profile/setup', protect, authController.setupProfile);
router.delete('/profile/delete', protect, authController.deleteAccount);
router.get('/profile/export-pdf', protect, authController.exportPDF);

module.exports = router;
