const express = require('express');
const router = express.Router();
const hospitalController = require('../controllers/hospital.controller');

router.get('/nearby', hospitalController.getNearby);
router.post('/ai-search', hospitalController.aiSearch);
router.get('/:id', hospitalController.getDetails);

module.exports = router;

