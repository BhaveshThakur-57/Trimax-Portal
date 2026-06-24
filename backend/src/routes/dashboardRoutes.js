const express = require('express');
const {
  getDashboardStats,
  getRecentActivities
} = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// ✅ All dashboard routes require admin (was missing authorize before)
router.use(protect);
router.use(authorize('admin'));

router.get('/stats', getDashboardStats);
router.get('/activities', getRecentActivities);

module.exports = router;