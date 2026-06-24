const User = require('../models/User');
const { createNotification } = require('./notificationController');
const { stripDangerousFields, PROTECTED_USER_FIELDS } = require('../middleware/sanitize');

// GET ALL USERS
exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

// GET SINGLE USER
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.isActive ? 'Active' : 'Inactive',
      employeeId: user.employeeId,
      department: user.department,
      designation: user.designation,
      salary: user.salary,
      phone: user.phone || null,
      address: user.address || null,
      workingType: user.workingType || 'Office',
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    res.status(200).json({
      success: true,
      data: userData
    });
  } catch (error) {
    next(error);
  }
};

// CREATE USER
exports.createUser = async (req, res, next) => {
  try {
    const safeBody = stripDangerousFields(req.body, PROTECTED_USER_FIELDS);
    const {
      name, email,
      department, designation, salary,
      joiningDate, phone, address, workingType
    } = safeBody;

    // Use a default password if not provided (admin creating user)
    const password = req.body.password || 'User@123';
    // Only allow admin to set role directly during creation
    const role = req.body.role || 'employee';

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      department,
      designation,
      salary,
      joiningDate,
      phone: phone || null,
      address: address || null,
      workingType: workingType || 'Office',
    });

    // Create notifications for admins
    try {
      const adminUsers = await User.find({ role: 'admin' });
      for (const admin of adminUsers) {
        try {
          await createNotification(
            admin._id,
            'New User Created',
            `${user.name} (${user.email}) has been added`,
            'user',
            `/users/${user._id}`
          );
        } catch (notifErr) {}
      }
    } catch (notifMainErr) {}

    // Exclude password from response
    const createdUser = await User.findById(user._id).select('-password');

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: createdUser
    });
  } catch (error) {
    next(error);
  }
};

// UPDATE USER
exports.updateUser = async (req, res, next) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      email: req.body.email,
      role: req.body.role,
      department: req.body.department,
      designation: req.body.designation,
      salary: req.body.salary,
      joiningDate: req.body.joiningDate,
      phone: req.body.phone || null,
      address: req.body.address || null,
      workingType: req.body.workingType || 'Office',
    };

    if (req.body.status) {
      fieldsToUpdate.isActive = req.body.status === 'Active';
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      fieldsToUpdate,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// DELETE USER
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {},
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// MAKE ADMIN
exports.makeAdmin = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role: 'admin' },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user,
      message: `${user.name} is now Admin`
    });
  } catch (error) {
    next(error);
  }
};

// REMOVE ADMIN
exports.removeAdmin = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role: 'employee' },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user,
      message: `${user.name} admin role removed`
    });
  } catch (error) {
    next(error);
  }
};