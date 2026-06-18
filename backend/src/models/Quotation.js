// models/Quotation.js

const mongoose = require('mongoose');

const quotationItemSchema = new mongoose.Schema({
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service'
  },

  serviceName: {
    type: String,
    default: ''
  },

  description: {
    type: String,
    required: true
  },

  quantity: {
    type: Number,
    required: true,
    default: 1
  },

  unitPrice: {
    type: Number,
    required: true
  },

  discount: {
    type: Number,
    default: 0
  },

  tax: {
    type: Number,
    default: 18
  },

  amount: {
    type: Number,
    required: true
  }
});

const quotationSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    unique: true,
    required: false
  },

  customer: {
    name: {
      type: String,
      required: true
    },

    code: String,

    address: String,

    email: {
      type: String,
      required: true
    },

    phone: {
      type: String,
      required: true
    },

    gst: String,

    company: String
  },

  billTo: {
    name: String,
    address: String
  },

  shipTo: {
    name: String,
    address: String
  },

  poNumber: String,

  salesRep: String,

  shipDate: Date,

  shipVia: String,

  terms: String,

  dueDate: Date,

  items: [quotationItemSchema],

  subtotal: {
    type: Number,
    required: true,
    default: 0
  },

  gst: {
    type: Number,
    default: 10
  },

  gstAmount: {
    type: Number,
    default: 0
  },

  shipping: {
    type: Number,
    default: 0
  },

  total: {
    type: Number,
    required: true
  },

  paid: {
    type: Number,
    default: 0
  },

  totalDue: {
    type: Number,
    required: true
  },

  status: {
    type: String,
    enum: [
      'Draft',
      'Sent',
      'Accepted',
      'Rejected',
      'Paid',
      'Overdue',
      'Cancelled'
    ],
    default: 'Draft'
  },

  sentAt: Date,
  acceptedAt: Date,
  rejectedAt: Date,

  notes: String,

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  template: {
    type: String,
    enum: ['Modern', 'Classic', 'Minimal'],
    default: 'Modern'
  },

  signature: {
    type: String
  },

  version: {
    type: Number,
    default: 1
  },

  versionHistory: [{
    version: Number,
    updatedAt: Date,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    changes: String,
    snapshot: mongoose.Schema.Types.Mixed
  }]

}, {
  timestamps: true
});

// Auto-generate quotation number
quotationSchema.pre('save', async function (next) {

  try {

    if (this.isNew && !this.invoiceNumber) {

      const date = new Date();

      const year = date.getFullYear();

      const month = String(
        date.getMonth() + 1
      ).padStart(2, '0');

      const lastInvoice = await this.constructor.findOne({
        invoiceNumber: new RegExp(`^QT${year}${month}`)
      }).sort({ invoiceNumber: -1 });

      let nextNumber = 1000;

      if (lastInvoice?.invoiceNumber) {

        const lastNumber = parseInt(
          lastInvoice.invoiceNumber.slice(-4)
        );

        if (!isNaN(lastNumber)) {
          nextNumber = lastNumber + 1;
        }
      }

      this.invoiceNumber =
        `QT${year}${month}${nextNumber}`;
    }

    next();

  } catch (error) {

    next(error);
  }
});

module.exports = mongoose.model(
  'Quotation',
  quotationSchema
);