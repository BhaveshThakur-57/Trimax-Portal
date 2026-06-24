const express = require('express');
const {
  getInquiries,
  getInquiry,
  createInquiry,
  updateInquiry,
  deleteInquiry,
  updateInquiryStatus
} = require('../controllers/inquiryController');
const { protect, authorize } = require('../middleware/auth');
const { publicLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// ✅ Public route — with rate limiting to prevent spam
router.post('/', publicLimiter, createInquiry);

// ✅ Protected + Admin-only routes (was accessible by any employee before)
router.use(protect);
router.use(authorize('admin'));

router.get('/', getInquiries);
router.get('/:id', getInquiry);
router.put('/:id', updateInquiry);
router.patch('/:id/status', updateInquiryStatus);
router.delete('/:id', deleteInquiry);

module.exports = router;