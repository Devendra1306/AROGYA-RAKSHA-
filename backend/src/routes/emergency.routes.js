const express = require('express');
const router = express.Router();
const emergencyController = require('../controllers/emergency.controller');
const { protect } = require('../middleware/auth');

router.post('/analyze', emergencyController.analyze);
router.get('/categories', emergencyController.getCategories);
router.get('/details/:id', emergencyController.getDetails);

router.get('/emergency-contact', protect, emergencyController.getContacts);
router.post('/emergency-contact', protect, emergencyController.saveContact);
router.post('/share-location', protect, emergencyController.shareLocation);

module.exports = router;
