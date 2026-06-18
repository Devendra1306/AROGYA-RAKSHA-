const express = require('express');
const router = express.Router();
const dietController = require('../controllers/diet.controller');
const { protect } = require('../middleware/auth');

router.post('/generate', protect, dietController.generate);
router.get('/current', protect, dietController.getCurrent);
router.post('/update-weight', protect, dietController.updateWeight);
router.post('/analyze-food', protect, dietController.analyzeFood);
router.post('/swap-meal', protect, dietController.swapMeal);
router.post('/add-extra-food', protect, dietController.addExtraFood);
router.post('/clear-extra-foods', protect, dietController.clearExtraFoods);
router.post('/remove-food-log', protect, dietController.removeFoodLog);
router.post('/refresh-recipes', protect, dietController.refreshRecipes);

module.exports = router;

