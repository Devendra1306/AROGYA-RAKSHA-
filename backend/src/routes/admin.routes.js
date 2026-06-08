const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { protect, authorize } = require('../middleware/auth');

// Shield all admin routes with protect & authorize middlewares
router.use(protect, authorize('Admin', 'SuperAdmin'));

router.get('/kpis', adminController.getKPIs);
router.get('/charts', adminController.getChartData);
router.get('/users', adminController.getUsers);
router.post('/users/:id/suspend', adminController.suspendUser);

module.exports = router;
