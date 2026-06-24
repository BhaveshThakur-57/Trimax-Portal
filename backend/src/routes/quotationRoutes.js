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

// ✅ All quotation routes require admin (financial data)
router.use(protect);
router.use(authorize('admin'));

router.get('/stats', getQuotationStats);
router.get('/', getAllQuotations);
router.get('/:id/pdf', generatePDF);
router.get('/:id', getQuotationById);

router.post('/', createQuotation);
router.post('/:id/send', sendEmail);
router.put('/:id', updateQuotation);
router.patch('/:id/status', updateQuotationStatus);
router.delete('/:id', deleteQuotation);

module.exports = router;