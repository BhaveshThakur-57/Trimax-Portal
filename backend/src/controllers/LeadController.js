// backend/src/controllers/leadController.js

const Lead = require('../models/Lead');
const User = require('../models/User');
const { createNotification } = require('./notificationController');

// ── Helper: check if user has access (Admin OR Sales dept) ──
const hasLeadAccess = (user) => {
  if (!user) return false;
  if (user.role === 'admin') return true;
  if ((user.department || '').toLowerCase() === 'sales') return true;
  return false;
};

// ── GET all leads ──
exports.getAllLeads = async (req, res) => {
  try {

    if (!hasLeadAccess(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Sales department only.'
      });
    }

    const { status, priority, source, assignedTo, search } = req.query;

    const filter = {};

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (priority && priority !== 'all') {
      filter.priority = priority;
    }

    if (source && source !== 'all') {
      filter.source = source;
    }

    if (assignedTo && assignedTo !== 'all') {
      filter.assignedTo = assignedTo;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
      ];
    }

    const leads = await Lead.find(filter)
      .populate('assignedTo', 'name employeeId')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: leads
    });

  } catch (err) {

    console.error('Get leads error:', err);

    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// ── GET single lead ──
exports.getLeadById = async (req, res) => {
  try {

    if (!hasLeadAccess(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied.'
      });
    }

    const lead = await Lead.findById(req.params.id)
      .populate('assignedTo', 'name employeeId department')
      .populate('createdBy', 'name');

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    res.json({
      success: true,
      data: lead
    });

  } catch (err) {

    console.error('Get lead error:', err);

    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// ── CREATE lead ──
exports.createLead = async (req, res) => {
  try {

    if (!hasLeadAccess(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied.'
      });
    }

    const {
      name,
      phone,
      email,
      company,
      source,
      status,
      priority,
      dealValue,
      followUpDate,
      assignedTo
    } = req.body;

    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Name and phone are required'
      });
    }

    const lead = await Lead.create({
      name,
      phone,
      email,
      company,
      source,
      status,
      priority,
      dealValue: dealValue || 0,
      followUpDate: followUpDate || null,
      assignedTo: assignedTo || null,
      createdBy: req.user._id,
      activities: [{
        type: 'CREATION',
        description: 'Lead created',
        performedBy: req.user._id,
        performedByName: req.user.name,
        createdAt: new Date()
      }]
    });

    // ✅ Notify admins
    const admins = await User.find({
      role: { $regex: /^admin$/i }
    });

    for (const admin of admins) {

      await createNotification(
        admin._id,
        'New Lead Created',
        `${lead.name} added as a new lead`,
        'user',
        `/leads/${lead._id}`
      );

    }

    const populated = await Lead.findById(lead._id)
      .populate('assignedTo', 'name employeeId')
      .populate('createdBy', 'name');

    res.status(201).json({
      success: true,
      data: populated,
      message: 'Lead created successfully'
    });

  } catch (err) {

    console.error('Lead create error:', err);

    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// ── UPDATE lead ──
exports.updateLead = async (req, res) => {
  try {

    if (!hasLeadAccess(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied.'
      });
    }

    const {
      name,
      phone,
      email,
      company,
      source,
      status,
      priority,
      dealValue,
      followUpDate,
      assignedTo
    } = req.body;

    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      {
        name,
        phone,
        email,
        company,
        source,
        status,
        priority,
        dealValue: dealValue || 0,
        followUpDate: followUpDate || null,
        assignedTo: assignedTo || null
      },
      {
        new: true
      }
    )
      .populate('assignedTo', 'name employeeId')
      .populate('createdBy', 'name');

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    res.json({
      success: true,
      data: lead,
      message: 'Lead updated successfully'
    });

  } catch (err) {

    console.error('Lead update error:', err);

    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// ── DELETE lead ──
exports.deleteLead = async (req, res) => {
  try {

    if (!hasLeadAccess(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied.'
      });
    }

    const lead = await Lead.findByIdAndDelete(req.params.id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    res.json({
      success: true,
      message: 'Lead deleted successfully'
    });

  } catch (err) {

    console.error('Delete lead error:', err);

    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// ── UPDATE lead status ──
exports.updateLeadStatus = async (req, res) => {
  try {
    if (!hasLeadAccess(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied.'
      });
    }

    const { status } = req.body;

    const oldLead = await Lead.findById(req.params.id);
    if (!oldLead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      { 
        status,
        $push: {
          activities: {
            type: 'STATUS_CHANGE',
            description: `Status changed from ${oldLead.status} to ${status}`,
            performedBy: req.user._id,
            performedByName: req.user.name,
            createdAt: new Date()
          }
        }
      },
      { new: true }
    )
      .populate('assignedTo', 'name employeeId')
      .populate('createdBy', 'name');

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    res.json({
      success: true,
      data: lead,
      message: 'Lead status updated successfully'
    });

  } catch (err) {
    console.error('Lead status update error:', err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// ── ADD remark to lead ──
exports.addRemark = async (req, res) => {
  try {

    if (!hasLeadAccess(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied.'
      });
    }

    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Remark text is required'
      });
    }

    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    lead.remarks.unshift({
      text: text.trim(),
      addedBy: req.user._id,
      addedByName: req.user.name,
      createdAt: new Date(),
    });

    lead.activities.push({
      type: 'REMARK',
      description: `Added remark: "${text.trim()}"`,
      performedBy: req.user._id,
      performedByName: req.user.name,
      createdAt: new Date()
    });

    await lead.save();

    const populated = await Lead.findById(lead._id)
      .populate('assignedTo', 'name employeeId')
      .populate('createdBy', 'name');

    res.json({
      success: true,
      data: populated,
      message: 'Remark added successfully'
    });

  } catch (err) {

    console.error('Add remark error:', err);

    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// ── GET stats ──
exports.getLeadStats = async (req, res) => {
  try {

    if (!hasLeadAccess(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied.'
      });
    }

    const [total, statusCounts] = await Promise.all([
      Lead.countDocuments(),
      Lead.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),
    ]);

    const stats = {
      total,
      New: 0,
      Contacted: 0,
      Qualified: 0,
      'Proposal Sent': 0,
      Won: 0,
      Lost: 0,
      totalValue: 0
    };

    statusCounts.forEach((s) => {
      stats[s._id] = s.count;
    });

    const valueAggregation = await Lead.aggregate([
      { $match: { status: { $nin: ['Lost'] } } },
      { $group: { _id: null, total: { $sum: '$dealValue' } } }
    ]);
    
    if (valueAggregation.length > 0) {
      stats.totalValue = valueAggregation[0].total;
    }

    res.json({
      success: true,
      data: stats
    });

  } catch (err) {

    console.error('Lead stats error:', err);

    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};