const express = require('express');
const router = express.Router();
const medicineController = require('../controllers/medicine.controller');
const { protect } = require('../middleware/auth');

const optionalAuth = (req, res, next) => {
  if (req.headers.authorization) {
    return protect(req, res, next);
  }
  next();
};

router.get('/search', medicineController.search);
router.post('/compare', medicineController.compare);
router.post('/scan', optionalAuth, medicineController.scan);
router.post('/ask', optionalAuth, medicineController.ask);
router.get('/rag-lookup', medicineController.ragLookup);
router.get('/:id', medicineController.getDetails);

module.exports = router;

