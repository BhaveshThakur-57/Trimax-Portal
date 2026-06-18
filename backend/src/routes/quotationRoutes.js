const express = require('express');
const router = express.Router();
const {
  getAllQuotations,
  getQuotationById,
  createQuotation,
  updateQuotation,
  deleteQuotation,
  generatePDF,
  getQuotationStats,
  sendEmail,
  updateQuotationStatus
} = require('../controllers/quotationController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/stats', getQuotationStats);
router.get('/', getAllQuotations);
router.get('/:id/pdf', generatePDF);
router.get('/:id', getQuotationById);

router.post('/', authorize('admin'), createQuotation);
router.post('/:id/send', authorize('admin'), sendEmail);
router.put('/:id', authorize('admin'), updateQuotation);
router.patch('/:id/status', authorize('admin'), updateQuotationStatus);
router.delete('/:id', authorize('admin'), deleteQuotation);

module.exports = router;