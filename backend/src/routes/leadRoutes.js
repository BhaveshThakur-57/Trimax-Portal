// backend/src/routes/leadRoutes.js
const express    = require('express');
const router     = express.Router();
const { protect } = require('../middleware/auth');
const {
  getAllLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
  addRemark,
  getLeadStats,
  updateLeadStatus,
} = require('../controllers/leadController');

router.get('/', protect, getAllLeads);
router.get('/stats', protect, getLeadStats);
router.get('/:id', protect, getLeadById);
router.post('/', protect, createLead);
router.put('/:id', protect, updateLead);
router.patch('/:id/status', protect, updateLeadStatus);
router.delete('/:id', protect, deleteLead);
router.post('/:id/remark', protect, addRemark);

module.exports = router;