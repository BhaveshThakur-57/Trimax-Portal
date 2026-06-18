const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  markAttendance,
  autoMarkAttendance,
  getAllAttendance,
  getMyAttendance,
  deleteAttendance,
  checkoutAttendance,
  updateCheckIn,
} = require('../controllers/attendanceController');

// Admin routes
router.post('/mark',  protect, authorize('admin'), markAttendance);
router.get('/all',    protect, authorize('admin'), getAllAttendance);
router.delete('/:id', protect, authorize('admin'), deleteAttendance);

// Employee routes
router.get('/my-attendance',   protect, getMyAttendance);
router.post('/auto-mark',      protect, autoMarkAttendance);
router.post('/checkout',       protect, checkoutAttendance);
router.patch('/update-checkin', protect, updateCheckIn);

module.exports = router;