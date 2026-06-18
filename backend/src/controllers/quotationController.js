const Quotation = require('../models/Quotation');
const Service = require('../models/Service');
const User = require('../models/User');

const { generateInvoicePDF } = require('../utils/pdfGenerator');
const { createNotification } = require('./notificationController');

// ======================================================
// GET ALL QUOTATIONS
// ======================================================

exports.getAllQuotations = async (req, res) => {

  try {

    const { status, search } = req.query;

    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search) {

      query.$or = [
        {
          invoiceNumber: {
            $regex: search,
            $options: 'i'
          }
        },

        {
          'customer.name': {
            $regex: search,
            $options: 'i'
          }
        }
      ];
    }

    const quotations = await Quotation.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: quotations.length,
      data: quotations
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch quotations',
      error: error.message
    });
  }
};

// ======================================================
// GET SINGLE QUOTATION
// ======================================================

exports.getQuotationById = async (req, res) => {

  try {

    const quotation = await Quotation.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!quotation) {

      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    res.json({
      success: true,
      data: quotation
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ======================================================
// CREATE QUOTATION
// ======================================================

exports.createQuotation = async (req, res) => {

  try {

    const {
      customer,
      billTo,
      shipTo,
      poNumber,
      salesRep,
      shipDate,
      shipVia,
      terms,
      dueDate,
      items,
      gst,
      shipping,
      paid,
      notes,
      template,
      signature
    } = req.body;

    let subtotal = 0;

    const processedItems = items.map(item => {

      const quantity = Number(item.quantity || 0);

      const unitPrice = Number(item.unitPrice || 0);

      const discount = Number(item.discount || 0);

      const tax = Number(item.tax || 0);

      const sub = quantity * unitPrice;

      const discountAmount = (sub * discount) / 100;

      const taxable = sub - discountAmount;

      const taxAmount = (taxable * tax) / 100;

      const amount = taxable + taxAmount;

      subtotal += amount;

      const processedItem = {
        ...item,
        amount
      };

      if (!processedItem.service) {
        delete processedItem.service;
      }

      return processedItem;
    });

    const gstAmount = (subtotal * (gst || 0)) / 100;

    const total =
      subtotal +
      gstAmount +
      Number(shipping || 0);

    const totalDue =
      total -
      Number(paid || 0);

    const quotation = await Quotation.create({

      customer,
      billTo,
      shipTo,
      poNumber,
      salesRep,
      shipDate,
      shipVia,
      terms,
      dueDate,

      items: processedItems,

      subtotal,

      gst: gst || 0,

      gstAmount,

      shipping: shipping || 0,

      total,

      paid: paid || 0,

      totalDue,

      notes,
      
      template: template || 'Modern',
      
      signature: signature || '',

      version: 1,

      versionHistory: [],

      createdBy: req.user._id
    });

    // NOTIFICATION

    const admins = await User.find({
      role: { $regex: /^admin$/i }
    });

    for (const admin of admins) {

      await createNotification(
        admin._id,
        'New Quotation Created',
        `Quotation created for ${customer?.name || 'Customer'}`,
        'general',
        `/quotations/${quotation._id}`
      );
    }

    res.status(201).json({
      success: true,
      message: 'Quotation created successfully',
      data: quotation
    });

  } catch (error) {

    console.error('Quotation create error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to create quotation',
      error: error.message
    });
  }
};

// ======================================================
// UPDATE QUOTATION
// ======================================================

exports.updateQuotation = async (req, res) => {

  try {

    const quotation = await Quotation.findById(req.params.id);

    if (!quotation) {

      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    const {
      customer,
      billTo,
      shipTo,
      poNumber,
      salesRep,
      shipDate,
      shipVia,
      terms,
      dueDate,
      items,
      gst,
      shipping,
      paid,
      notes,
      status,
      template,
      signature
    } = req.body;

    if (items) {

      let subtotal = 0;

      const processedItems = items.map(item => {

        const quantity = Number(item.quantity || 0);

        const unitPrice = Number(item.unitPrice || 0);

        const discount = Number(item.discount || 0);

        const tax = Number(item.tax || 0);

        const sub = quantity * unitPrice;

        const discountAmount =
          (sub * discount) / 100;

        const taxable =
          sub - discountAmount;

        const taxAmount =
          (taxable * tax) / 100;

        const amount =
          taxable + taxAmount;

        subtotal += amount;

        const processedItem = {
          ...item,
          amount
        };

        if (!processedItem.service) {
          delete processedItem.service;
        }

        return processedItem;
      });

      const gstAmount =
        (subtotal * (gst || quotation.gst)) / 100;

      const total =
        subtotal +
        gstAmount +
        Number(
          shipping !== undefined
            ? shipping
            : quotation.shipping
        );

      const totalDue =
        total -
        Number(
          paid !== undefined
            ? paid
            : quotation.paid
        );

      quotation.items = processedItems;

      quotation.subtotal = subtotal;

      quotation.gstAmount = gstAmount;

      quotation.total = total;

      quotation.totalDue = totalDue;
    }

    if (customer) quotation.customer = customer;

    if (billTo) quotation.billTo = billTo;

    if (shipTo) quotation.shipTo = shipTo;

    if (poNumber !== undefined)
      quotation.poNumber = poNumber;

    if (salesRep !== undefined)
      quotation.salesRep = salesRep;

    if (shipDate !== undefined)
      quotation.shipDate = shipDate;

    if (shipVia !== undefined)
      quotation.shipVia = shipVia;

    if (terms !== undefined)
      quotation.terms = terms;

    if (dueDate !== undefined)
      quotation.dueDate = dueDate;

    if (gst !== undefined)
      quotation.gst = gst;

    if (shipping !== undefined)
      quotation.shipping = shipping;

    if (paid !== undefined)
      quotation.paid = paid;

    if (notes !== undefined)
      quotation.notes = notes;

    if (status)
      quotation.status = status;
      
    if (template)
      quotation.template = template;
      
    if (signature !== undefined)
      quotation.signature = signature;

    // Track Version History
    const snapshot = {
      items: quotation.items,
      subtotal: quotation.subtotal,
      total: quotation.total,
      notes: quotation.notes,
      template: quotation.template
    };

    quotation.versionHistory.push({
      version: quotation.version,
      updatedAt: new Date(),
      updatedBy: req.user._id,
      changes: 'Quotation updated',
      snapshot
    });

    quotation.version += 1;

    await quotation.save();

    res.json({
      success: true,
      message: 'Quotation updated successfully',
      data: quotation
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ======================================================
// UPDATE QUOTATION STATUS
// ======================================================

exports.updateQuotationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    const updateData = { status };

    if (status === 'Accepted') {
      updateData.acceptedAt = new Date();
    } else if (status === 'Rejected') {
      updateData.rejectedAt = new Date();
    } else if (status === 'Sent') {
      updateData.sentAt = new Date();
    }

    const quotation = await Quotation.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: false }
    );

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    res.json({
      success: true,
      message: 'Quotation status updated successfully',
      data: quotation
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ======================================================
// DELETE
// ======================================================

exports.deleteQuotation = async (req, res) => {

  try {

    const quotation =
      await Quotation.findByIdAndDelete(
        req.params.id
      );

    if (!quotation) {

      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    res.json({
      success: true,
      message: 'Quotation deleted successfully'
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ======================================================
// PDF
// ======================================================

exports.generatePDF = async (req, res) => {

  try {

    const quotation =
      await Quotation.findById(req.params.id)
        .populate('createdBy', 'name email');

    if (!quotation) {

      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    const { generateQuotationPDF } = require('../utils/pdfGenerator');
    await generateQuotationPDF(
      quotation,
      res
    );

  } catch (error) {

    console.error(error);

    if (!res.headersSent) {

      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
};

// ======================================================
// STATS
// ======================================================

exports.getQuotationStats = async (req, res) => {

  try {

    const total =
      await Quotation.countDocuments();

    const draft =
      await Quotation.countDocuments({
        status: 'Draft'
      });

    const sent =
      await Quotation.countDocuments({
        status: 'Sent'
      });

    const accepted =
      await Quotation.countDocuments({
        status: 'Accepted'
      });

    const rejected =
      await Quotation.countDocuments({
        status: 'Rejected'
      });

    const totalValueResult =
      await Quotation.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: '$total' }
          }
        }
      ]);

    const acceptedValueResult =
      await Quotation.aggregate([
        {
          $match: {
            status: 'Accepted'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$total' }
          }
        }
      ]);
      
    const monthlyTrendsResult =
      await Quotation.aggregate([
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
            totalValue: { $sum: '$total' },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: -1 } },
        { $limit: 6 }
      ]);

    const conversionRate =
      total > 0
        ? ((accepted / total) * 100).toFixed(2)
        : 0;

    res.json({
      success: true,

      data: {

        total,

        draft,

        sent,

        accepted,

        rejected,

        conversionRate,

        totalValue:
          totalValueResult[0]?.total || 0,

        acceptedValue:
          acceptedValueResult[0]?.total || 0,
          
        monthlyTrends: monthlyTrendsResult
      }
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ======================================================
// EMAIL
// ======================================================

const { sendQuotationEmail } = require('../utils/emailService');

exports.sendEmail = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }

    const emailResult = await sendQuotationEmail(quotation);
    
    if (!emailResult.success) {
      return res.status(500).json({ success: false, message: emailResult.error });
    }

    quotation.status = 'Sent';
    quotation.sentAt = new Date();
    await quotation.save();

    res.json({ success: true, message: 'Quotation sent successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
};