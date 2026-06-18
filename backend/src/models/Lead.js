// backend/src/models/Lead.js
const mongoose = require('mongoose');

const remarkSchema = new mongoose.Schema({
  text:        { type: String, required: true },
  addedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  addedByName: { type: String },
  createdAt:   { type: Date, default: Date.now },
});

const activitySchema = new mongoose.Schema({
  type: { type: String, enum: ['STATUS_CHANGE', 'REMARK', 'CREATION', 'EMAIL', 'CALL', 'SYSTEM'], required: true },
  description: { type: String, required: true },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  performedByName: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const leadSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true },
  phone:        { type: String, required: true, trim: true },
  email:        { type: String, trim: true, lowercase: true, default: '' },
  company:      { type: String, trim: true, default: '' },
  source: {
    type: String,
    enum: ['Website', 'Referral', 'Social Media', 'Cold Call', 'Email', 'Walk-in', 'Other'],
    default: 'Other',
  },
  status: {
    type: String,
    enum: ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Won', 'Lost'],
    default: 'New',
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium',
  },
  dealValue:    { type: Number, default: 0 },
  score:        { type: Number, default: 0 },
  followUpDate: { type: Date },
  remarks:      [remarkSchema],
  activities:   [activitySchema],
  assignedTo:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// Pre-save hook to calculate score based on data
leadSchema.pre('save', function(next) {
  let newScore = 0;
  
  // Base points on priority
  if (this.priority === 'High') newScore += 30;
  else if (this.priority === 'Medium') newScore += 15;
  else if (this.priority === 'Low') newScore += 5;

  // Base points on source
  if (this.source === 'Referral') newScore += 25;
  else if (this.source === 'Website') newScore += 20;
  else if (this.source === 'Email') newScore += 15;
  else newScore += 10;

  // Status points
  if (this.status === 'Qualified') newScore += 20;
  else if (this.status === 'Proposal Sent') newScore += 30;
  else if (this.status === 'Contacted') newScore += 10;
  
  // Deal value points (1 point per 10,000 value, max 20)
  if (this.dealValue > 0) {
    const valuePoints = Math.min(Math.floor(this.dealValue / 10000), 20);
    newScore += valuePoints;
  }

  this.score = Math.min(newScore, 100); // Cap at 100
  next();
});

module.exports = mongoose.model('Lead', leadSchema);