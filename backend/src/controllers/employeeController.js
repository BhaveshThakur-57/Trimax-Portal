const User = require('../models/User');
const { stripDangerousFields, PROTECTED_EMPLOYEE_UPDATE_FIELDS } = require('../middleware/sanitize');

// @desc    Get all employees (role='employee' from User model)
// @route   GET /api/employees
// @access  Private/Admin
exports.getEmployees = async (req, res, next) => {
  try {
    const employees = await User.find({ role: 'employee' })
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: employees.length,
      data: employees
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single employee
// @route   GET /api/employees/:id
// @access  Private/Admin
exports.getEmployee = async (req, res, next) => {
  try {
    const employee = await User.findById(req.params.id).select('-password');
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: employee
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new employee
// @route   POST /api/employees
// @access  Private/Admin
exports.createEmployee = async (req, res, next) => {
  try {
    // Only accept explicit fields to avoid mass-assignment
    const { name, email, password, department, designation, phone, salary, workingType } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    const employee = await User.create({
      name,
      email,
      password: password || 'User@123',
      department,
      designation,
      phone,
      salary,
      workingType: workingType || 'Office',
      role: 'employee',
      createdBy: req.user._id
    });

    const created = await User.findById(employee._id).select('-password');
    
    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: created
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update employee
// @route   PUT /api/employees/:id
// @access  Private/Admin
exports.updateEmployee = async (req, res, next) => {
  try {
    // Strip protected fields so admin cannot accidentally change them (like role to admin, password, etc)
    const safeBody = stripDangerousFields(req.body, PROTECTED_EMPLOYEE_UPDATE_FIELDS);

    const employee = await User.findByIdAndUpdate(
      req.params.id,
      safeBody,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: employee
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete employee
// @route   DELETE /api/employees/:id
// @access  Private/Admin
exports.deleteEmployee = async (req, res, next) => {
  try {
    const employee = await User.findByIdAndDelete(req.params.id);
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {},
      message: 'Employee deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};