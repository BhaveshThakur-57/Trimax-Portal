const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendWelcomeEmail, sendPasswordResetEmail } = require('../utils/emailService');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Normalize role — handles case mismatch & legacy "user" role
function normalizeRole(role) {
  if (!role) return 'employee';
  const r = role.toLowerCase().trim();
  if (r === 'user') return 'employee';
  return r;
}

// Generate unique Employee ID
const generateEmployeeId = async () => {
  const lastEmployee = await User.findOne(
    { employeeId: { $exists: true, $ne: null } },
    { employeeId: 1 }
  ).sort({ employeeId: -1 });

  let nextNum = 1;
  if (lastEmployee && lastEmployee.employeeId) {
    const lastNum = parseInt(lastEmployee.employeeId.replace('EMP', ''), 10);
    if (!isNaN(lastNum)) nextNum = lastNum + 1;
  }

  let employeeId;
  let isUnique = false;
  while (!isUnique) {
    employeeId = `EMP${String(nextNum).padStart(4, '0')}`;
    const exists = await User.findOne({ employeeId });
    if (!exists) {
      isUnique = true;
    } else {
      nextNum++;
    }
  }

  return employeeId;
};

// @desc    Register first admin
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Only allow registration if no admin exists (first-time setup)
    const adminExists = await User.findOne({ role: 'admin' });
    
    if (adminExists) {
      return res.status(403).json({
        success: false,
        message: 'Registration is disabled. Please contact admin to create your account.'
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: 'admin'
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Admin account created successfully!',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated. Please contact admin.'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: normalizeRole(user.role),
        employeeId: user.employeeId,
        department: user.department,
        designation: user.designation,
        profilePicture: user.profilePicture,
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    // Normalize role in response
    const userData = user.toObject();
    userData.role = normalizeRole(userData.role);
    
    res.status(200).json({
      success: true,
      data: userData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create employee
// @route   POST /api/auth/create-employee
// @access  Private/Admin
exports.createEmployee = async (req, res) => {
  try {
    const { name, email, password, department, designation, joiningDate, salary, phone, address, workingType } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    const employeeId = await generateEmployeeId();

    // Store raw password temporarily for welcome email before hashing
    const rawPassword = password;

    const employee = await User.create({
      name,
      email,
      password,
      role: 'employee',
      employeeId,
      department,
      designation,
      joiningDate: joiningDate || Date.now(),
      salary,
      phone: phone || '',
      address: address || '',
      workingType: workingType || 'Office',
      createdBy: req.user.id
    });

    const createdEmployee = await User.findById(employee._id);

    // Send welcome email with raw password (not stored in DB)
    try {
      await sendWelcomeEmail({
        name: createdEmployee.name,
        email: createdEmployee.email,
        employeeId: createdEmployee.employeeId,
        tempPassword: rawPassword,
        department: createdEmployee.department,
        designation: createdEmployee.designation
      });
    } catch (emailError) {
      console.error('Email send failed:', emailError.message);
    }

    res.status(201).json({
      success: true,
      message: 'Employee created successfully! Welcome email has been sent.',
      data: {
        _id: createdEmployee._id,
        name: createdEmployee.name,
        email: createdEmployee.email,
        employeeId: createdEmployee.employeeId,
        department: createdEmployee.department,
        designation: createdEmployee.designation,
        phone: createdEmployee.phone,
        address: createdEmployee.address,
        workingType: createdEmployee.workingType,
        role: createdEmployee.role
      }
    });
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all employees
// @route   GET /api/auth/employees
// @access  Private/Admin
exports.getAllEmployees = async (req, res) => {
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
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user found with this email'
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    const resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    user.resetPasswordToken = resetPasswordToken;
    user.resetPasswordExpire = resetPasswordExpire;
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    try {
      const emailResult = await sendPasswordResetEmail(user.email, user.name, resetUrl);
      
      if (emailResult.success) {
        res.status(200).json({
          success: true,
          message: 'Password reset email sent successfully! Please check your inbox.'
        });
      } else {
        throw new Error('Email sending failed');
      }
    } catch (emailError) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        success: false,
        message: 'Failed to send password reset email. Please try again later.'
      });
    }

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:resetToken
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { password } = req.body;

    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resetToken)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful! You can now login with your new password.'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/update-profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, dateOfBirth, address, emergencyContact } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (name)             user.name = name;
    if (phone)            user.phone = phone;
    if (dateOfBirth)      user.dateOfBirth = dateOfBirth;
    if (address)          user.address = address;
    if (emergencyContact) user.emergencyContact = emergencyContact;

    await user.save();

    res.status(200).json({ success: true, message: 'Profile updated', data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Upload/Update profile picture
// @route   PUT /api/auth/upload-profile-picture
// @access  Private
exports.uploadProfilePicture = async (req, res) => {
  try {
    const { profilePicture } = req.body;

    if (!profilePicture) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a profile picture'
      });
    }

    if (!profilePicture.startsWith('data:image')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image format. Please upload a valid image.'
      });
    }

    const maxSize = 6850000;
    if (profilePicture.length > maxSize) {
      return res.status(400).json({
        success: false,
        message: 'Image size should be less than 5MB'
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.profilePicture = profilePicture;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile picture updated successfully!',
      data: {
        profilePicture: user.profilePicture
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Remove profile picture
// @route   DELETE /api/auth/remove-profile-picture
// @access  Private
exports.removeProfilePicture = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.profilePicture) {
      return res.status(400).json({
        success: false,
        message: 'No profile picture to remove'
      });
    }

    user.profilePicture = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile picture removed successfully!'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};