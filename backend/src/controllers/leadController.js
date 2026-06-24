// backend/src/controllers/leadController.js

const Lead = require('../models/Lead');
const User = require('../models/User');
const { createNotification } = require('./notificationController');
const { escapeRegex } = require('../middleware/sanitize');

// ── Helper: check if user has access to the leads module ──
const hasLeadAccess = (user) => {
  if (!user) return false;
  if (user.role === 'admin') return true;
  if ((user.department || '').toLowerCase() === 'sales') return true;
  return false;
};

// ── Helper: check if user owns/is assigned to a specific lead ──
const canModifyLead = (user, lead) => {
  if (user.role === 'admin') return true;
  
  // Convert objectIds to string for safe comparison
  const userIdStr = user._id.toString();
  const assignedStr = lead.assignedTo ? lead.assignedTo.toString() : null;
  const createdStr = lead.createdBy ? lead.createdBy.toString() : null;

  if (assignedStr === userIdStr) return true;
  if (createdStr === userIdStr) return true;
  
  return false;
};

// ── GET all leads ──
exports.getAllLeads = async (req, res, next) => {
  try {
    if (!hasLeadAccess(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Sales department only.'
      });
    }

    const { status, priority, source, assignedTo, search } = req.query;
    const filter = {};

    // If not admin, restrict visibility to leads they created or are assigned to
    if (req.user.role !== 'admin') {
      filter.$or = [
        { assignedTo: req.user._id },
        { createdBy: req.user._id }
      ];
    }

    if (status && status !== 'all') filter.status = status;
    if (priority && priority !== 'all') filter.priority = priority;
    if (source && source !== 'all') filter.source = source;
    
    // Admin filtering by a specific assigned user
    if (assignedTo && assignedTo !== 'all' && req.user.role === 'admin') {
      filter.assignedTo = assignedTo;
    }

    if (search) {
      const safeSearch = escapeRegex(search);
      
      // If $or already exists (for ownership), we must use $and to combine them
      const searchFilter = {
        $or: [
          { name: { $regex: safeSearch, $options: 'i' } },
          { phone: { $regex: safeSearch, $options: 'i' } },
          { email: { $regex: safeSearch, $options: 'i' } },
          { company: { $regex: safeSearch, $options: 'i' } },
        ]
      };

      if (filter.$or) {
        filter.$and = [ { $or: filter.$or }, searchFilter ];
        delete filter.$or;
      } else {
        filter.$or = searchFilter.$or;
      }
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
    next(err);
  }
};

// ── GET single lead ──
exports.getLeadById = async (req, res, next) => {
  try {
    if (!hasLeadAccess(req.user)) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const lead = await Lead.findById(req.params.id)
      .populate('assignedTo', 'name employeeId department')
      .populate('createdBy', 'name');

    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    if (!canModifyLead(req.user, lead)) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this lead.' });
    }

    res.json({ success: true, data: lead });

  } catch (err) {
    next(err);
  }
};

// ── CREATE lead ──
exports.createLead = async (req, res, next) => {
  try {
    if (!hasLeadAccess(req.user)) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const {
      name, phone, email, company, source, status,
      priority, dealValue, followUpDate, assignedTo
    } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Name and phone are required' });
    }

    const lead = await Lead.create({
      name, phone, email, company, source, status, priority,
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

    // Notify admins
    const admins = await User.find({ role: { $regex: /^admin$/i } });
    for (const admin of admins) {
      try {
        await createNotification(
          admin._id,
          'New Lead Created',
          `${lead.name} added as a new lead`,
          'user',
          `/leads/${lead._id}`
        );
      } catch (e) {}
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
    next(err);
  }
};

// ── UPDATE lead ──
exports.updateLead = async (req, res, next) => {
  try {
    if (!hasLeadAccess(req.user)) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const leadCheck = await Lead.findById(req.params.id);
    if (!leadCheck) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    if (!canModifyLead(req.user, leadCheck)) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this lead.' });
    }

    const {
      name, phone, email, company, source, status,
      priority, dealValue, followUpDate, assignedTo
    } = req.body;

    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      {
        name, phone, email, company, source, status, priority,
        dealValue: dealValue || 0,
        followUpDate: followUpDate || null,
        assignedTo: assignedTo || null
      },
      { new: true }
    )
      .populate('assignedTo', 'name employeeId')
      .populate('createdBy', 'name');

    res.json({
      success: true,
      data: lead,
      message: 'Lead updated successfully'
    });

  } catch (err) {
    next(err);
  }
};

// ── DELETE lead ──
exports.deleteLead = async (req, res, next) => {
  try {
    if (!hasLeadAccess(req.user)) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const leadCheck = await Lead.findById(req.params.id);
    if (!leadCheck) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    // Only admin or the creator can delete a lead
    if (req.user.role !== 'admin' && leadCheck.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only admin or the creator can delete this lead.' });
    }

    await Lead.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Lead deleted successfully'
    });

  } catch (err) {
    next(err);
  }
};

// ── UPDATE lead status ──
exports.updateLeadStatus = async (req, res, next) => {
  try {
    if (!hasLeadAccess(req.user)) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const { status } = req.body;

    const oldLead = await Lead.findById(req.params.id);
    if (!oldLead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    if (!canModifyLead(req.user, oldLead)) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this lead.' });
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

    res.json({
      success: true,
      data: lead,
      message: 'Lead status updated successfully'
    });

  } catch (err) {
    next(err);
  }
};

// ── ADD remark to lead ──
exports.addRemark = async (req, res, next) => {
  try {
    if (!hasLeadAccess(req.user)) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Remark text is required' });
    }

    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    if (!canModifyLead(req.user, lead)) {
      return res.status(403).json({ success: false, message: 'Not authorized to comment on this lead.' });
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
    next(err);
  }
};

// ── GET stats ──
exports.getLeadStats = async (req, res, next) => {
  try {
    if (!hasLeadAccess(req.user)) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const filter = {};
    
    // Apply ownership filtering for non-admins
    if (req.user.role !== 'admin') {
      filter.$or = [
        { assignedTo: req.user._id },
        { createdBy: req.user._id }
      ];
    }

    const [total, statusCounts] = await Promise.all([
      Lead.countDocuments(filter),
      Lead.aggregate([
        { $match: filter },
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
      if (stats[s._id] !== undefined) {
        stats[s._id] = s.count;
      }
    });

    // Add value filter matching
    const matchFilter = { status: { $nin: ['Lost'] }, ...filter };
    
    const valueAggregation = await Lead.aggregate([
      { $match: matchFilter },
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
    next(err);
  }
};