const express = require('express');
const {
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee
} = require('../controllers/employeeController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// ✅ All employee management routes require admin
// (employees have their own /auth/me endpoint to view their own data)
router.use(protect);
router.use(authorize('admin'));

router
  .route('/')
  .get(getEmployees)
  .post(createEmployee);

router
  .route('/:id')
  .get(getEmployee)
  .put(updateEmployee)
  .delete(deleteEmployee);

module.exports = router;