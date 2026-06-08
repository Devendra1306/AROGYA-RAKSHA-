const express = require('express');
const router = express.Router();
const remedyController = require('../controllers/remedy.controller');
const { protect } = require('../middleware/auth');

const optionalAuth = (req, res, next) => {
  if (req.headers.authorization) {
    return protect(req, res, next);
  }
  next();
};

router.post('/search', optionalAuth, remedyController.search);
router.post('/ingredients', optionalAuth, remedyController.matchKitchenIngredients);
router.get('/popular', remedyController.getPopular);

module.exports = router;

