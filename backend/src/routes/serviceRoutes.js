// routes/serviceRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getServices,
  getService,
  createService,
  updateService,
  deleteService
} = require('../controllers/serviceController');

// ✅ Public read routes (services are publicly visible)
router.get('/', getServices);
router.get('/:id', getService);

// ✅ Admin-only write routes (was COMPLETELY UNPROTECTED before)
router.post('/', protect, authorize('admin'), createService);
router.put('/:id', protect, authorize('admin'), updateService);
router.delete('/:id', protect, authorize('admin'), deleteService);

module.exports = router;