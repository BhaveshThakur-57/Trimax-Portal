const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  applyLeave,
  getMyLeaves,
  getAllLeaves,
  updateLeaveStatus
} = require('../controllers/leaveController');

// Admin routes
router.get('/all',          protect, authorize('admin'), getAllLeaves);
router.patch('/:id/status', protect, authorize('admin'), updateLeaveStatus);

// Employee routes
router.post('/',  protect, applyLeave);
router.get('/my', protect, getMyLeaves);

module.exports = router;