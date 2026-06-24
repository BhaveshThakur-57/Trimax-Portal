const express = require('express');
const { 
  register, 
  login, 
  getMe, 
  forgotPassword, 
  resetPassword,
  updateProfile,
  changePassword,
  createEmployee: createEmployeeAuth,
  getAllEmployees,
  uploadProfilePicture,
  removeProfilePicture
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Public routes — with strict rate limiting (5 req/min/IP)
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/forgot-password', authLimiter, forgotPassword);
router.put('/reset-password/:resetToken', authLimiter, resetPassword);

// Protected routes (any logged-in user)
router.get('/me', protect, getMe);
router.put('/update-profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);
router.put('/upload-profile-picture', protect, uploadProfilePicture);
router.delete('/remove-profile-picture', protect, removeProfilePicture);

// Admin only routes
router.post('/create-employee', protect, authorize('admin'), createEmployeeAuth);
router.get('/employees', protect, authorize('admin'), getAllEmployees);

module.exports = router;