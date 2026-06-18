const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

const fmt = (amount) => `Rs.${(amount || 0).toLocaleString('en-IN')}`;


// ════════════════════════════════════════════════════════════════════════════
//  1.  QUOTATION PDF
// ════════════════════════════════════════════════════════════════════════════
const generateQuotationPDF = (quotation, res) => {
  try {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 40, bottom: 60, left: 50, right: 50 }
    });

    res.setHeader('Content-Type', 'application/pdf');
    const filename = quotation.invoiceNumber || quotation.quotationNumber || 'Document';
    res.setHeader('Content-Disposition', `attachment; filename=Quotation-${filename}.pdf`);
    doc.pipe(res);

    const primaryColor = '#5a67d8';
    const textColor    = '#222';
    const pageWidth    = doc.page.width;
    const headerY      = 40;

    // ── Header ──────────────────────────────────────────
    doc.fontSize(9).fillColor(textColor).font('Helvetica')
      .text('Mob: +91 8588942008',          50, headerY)
      .text('Email: info@trimaxconnect.in', 50, headerY + 12);

    const logoPath = path.join(__dirname, '../assets/logo.png');
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, pageWidth - 160, headerY - 5, { width: 110 });
    }

    doc.moveTo(50, headerY + 30).lineTo(pageWidth - 50, headerY + 30)
      .strokeColor(primaryColor).lineWidth(2).stroke();

    // ── Title ────────────────────────────────────────────
    doc.fontSize(22).fillColor(primaryColor).font('Helvetica-Bold')
      .text('QUOTATION', 50, headerY + 45);

    // ── Bill To ──────────────────────────────────────────
    let yPos = headerY + 85;

    doc.fontSize(10).fillColor(textColor).font('Helvetica-Bold').text('Bill To:', 50, yPos);
    yPos += 15;
    doc.fontSize(11).text(quotation.customer.name || '', 50, yPos);
    yPos += 14;
    doc.fontSize(9).font('Helvetica').text(quotation.customer.email || '', 50, yPos);
    yPos += 12;
    doc.text(quotation.customer.phone || '', 50, yPos);
    yPos += 12;
    if (quotation.customer.company) { doc.text(quotation.customer.company, 50, yPos); yPos += 12; }
    if (quotation.customer.address) { doc.text(quotation.customer.address, 50, yPos); yPos += 12; }
    if (quotation.customer.gst)     { doc.text(`GST: ${quotation.customer.gst}`, 50, yPos); }

    // ── Meta Right ───────────────────────────────────────
    const rightStart = pageWidth - 220;
    let metaY = headerY + 85;

    doc.fontSize(9).font('Helvetica-Bold').text('Quotation #:', rightStart, metaY);
    doc.font('Helvetica').text(quotation.invoiceNumber || quotation.quotationNumber || '', rightStart + 90, metaY, { width: 120, lineBreak: false });
    metaY += 14;
    doc.font('Helvetica-Bold').text('Date:', rightStart, metaY);
    doc.font('Helvetica').text(new Date(quotation.createdAt).toLocaleDateString('en-IN'), rightStart + 90, metaY, { lineBreak: false });
    metaY += 14;
    doc.font('Helvetica-Bold').text('Valid Until:', rightStart, metaY);
    doc.font('Helvetica').text(quotation.dueDate ? new Date(quotation.dueDate).toLocaleDateString('en-IN') : '-', rightStart + 90, metaY, { lineBreak: false });

    // ── Items Table ──────────────────────────────────────
    yPos = 220;

    doc.rect(50, yPos, pageWidth - 100, 25).fillAndStroke('#f1f3f5', '#dee2e6');
    doc.fillColor(textColor).fontSize(9).font('Helvetica-Bold')
      .text('#',              60, yPos + 7)
      .text('Service / Item', 90, yPos + 7)
      .text('Qty',           300, yPos + 7)
      .text('Price',         340, yPos + 7)
      .text('Tax%',          400, yPos + 7)
      .text('Amount',        460, yPos + 7);

    yPos += 30;
    doc.font('Helvetica').fontSize(9).fillColor(textColor);

    quotation.items.forEach((item, index) => {
      const bg = index % 2 === 0 ? '#f9fafb' : 'white';
      doc.rect(50, yPos - 4, pageWidth - 100, 20).fillColor(bg).fill();
      doc.fillColor(textColor)
        .text(String(index + 1),           60, yPos)
        .text(item.serviceName || '',       90, yPos, { width: 200, lineBreak: false })
        .text(String(item.quantity || 0),  300, yPos)
        .text(fmt(item.unitPrice),         340, yPos)
        .text(`${item.tax || 0}%`,         400, yPos)
        .text(fmt(item.amount),            460, yPos);
      yPos += 20;
    });

    // ── Totals ───────────────────────────────────────────
    yPos += 15;
    doc.moveTo(350, yPos).lineTo(pageWidth - 50, yPos).strokeColor('#dee2e6').lineWidth(1).stroke();
    yPos += 8;

    const addRow = (label, value, bold = false) => {
      bold ? doc.font('Helvetica-Bold').fontSize(10) : doc.font('Helvetica').fontSize(9);
      doc.fillColor(textColor).text(label, 350, yPos).text(value, 460, yPos);
      yPos += 16;
    };

    const totalDiscount = (quotation.items || []).reduce((acc, item) => {
      const q = Number(item.quantity || 0);
      const p = Number(item.unitPrice || 0);
      const d = Number(item.discount || 0);
      return acc + (q * p * d / 100);
    }, 0);

    addRow('Subtotal:',   fmt(quotation.subtotal));
    if (totalDiscount > 0) {
      addRow('Discount:',  `-${fmt(totalDiscount)}`);
    }
    addRow('Tax (GST):',  fmt(quotation.gstAmount || 0));
    if (quotation.shipping > 0) {
      addRow('Shipping:', fmt(quotation.shipping));
    }
    doc.moveTo(350, yPos).lineTo(pageWidth - 50, yPos).strokeColor(primaryColor).lineWidth(1.5).stroke();
    yPos += 6;
    addRow('Grand Total:', fmt(quotation.total || 0), true);

    // ── Notes ────────────────────────────────────────────
    if (quotation.notes) {
      yPos += 20;
      doc.fontSize(10).fillColor(primaryColor).font('Helvetica-Bold').text('Notes:', 50, yPos);
      doc.fontSize(9).fillColor(textColor).font('Helvetica')
        .text(quotation.notes, 50, yPos + 14, { width: pageWidth - 100 });
      yPos += 40;
    }

    // ── Signature ────────────────────────────────────────
    if (quotation.signature) {
      try {
        const base64Data = quotation.signature.replace(/^data:image\/(png|jpeg);base64,/, "");
        const imgBuffer = Buffer.from(base64Data, 'base64');
        yPos += 20;
        doc.fontSize(10).fillColor(primaryColor).font('Helvetica-Bold').text('Authorized Signature:', pageWidth - 220, yPos);
        yPos += 15;
        doc.image(imgBuffer, pageWidth - 220, yPos, { width: 150 });
        yPos += 60; // Approximate height of signature
      } catch (err) {
        console.error("Failed to parse signature:", err);
      }
    }

    // ── Terms ────────────────────────────────────────────
    if (quotation.terms) {
      yPos += 10;
      doc.fontSize(10).fillColor(primaryColor).font('Helvetica-Bold').text('Terms & Conditions:', 50, yPos);
      doc.fontSize(9).fillColor(textColor).font('Helvetica')
        .text(quotation.terms, 50, yPos + 14, { width: pageWidth - 100 });
      yPos += 50;
    }

    // ── Footer ───────────────────────────────────────────
    yPos += 20;
    doc.moveTo(50, yPos).lineTo(pageWidth - 50, yPos)
      .strokeColor(primaryColor).lineWidth(1).stroke();

    doc.fontSize(8).font('Helvetica').fillColor(textColor)
      .text('Sector-44, Noida UP - 201301', 50, yPos + 8,
        { align: 'center', width: pageWidth - 100 })
      .text('Mob: +91 8588942008 | Email: info@trimaxconnect.in | Website: www.trimaxconnect.in',
        50, yPos + 20, { align: 'center', width: pageWidth - 100 });

    doc.end();

  } catch (error) {
    console.error('PDF Generation Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'PDF generation failed' });
    }
  }
};


// ════════════════════════════════════════════════════════════════════════════
//  2.  INVOICE PDF
// ════════════════════════════════════════════════════════════════════════════
const generateInvoicePDF = (quotation, res) => {
  try {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 40, bottom: 60, left: 50, right: 50 }
    });

    const filename = quotation.invoiceNumber || quotation.quotationNumber || 'Invoice';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Invoice-${filename}.pdf`);
    doc.pipe(res);

    const template = quotation.template || 'Modern';
    
    // Theme configurations
    const themes = {
      Modern: { primary: '#5a67d8', text: '#222', bg: '#f1f3f5', font: 'Helvetica', fontBold: 'Helvetica-Bold' },
      Classic: { primary: '#000000', text: '#000000', bg: '#ffffff', font: 'Times-Roman', fontBold: 'Times-Bold' },
      Minimal: { primary: '#64748b', text: '#334155', bg: '#f8fafc', font: 'Helvetica', fontBold: 'Helvetica-Bold' }
    };
    
    const theme = themes[template] || themes.Modern;
    
    const primaryColor = theme.primary;
    const textColor    = theme.text;
    const pageWidth    = doc.page.width;
    const headerY      = 40;

    // ── Header ──────────────────────────────────────────
    doc.fontSize(9).fillColor(textColor).font(theme.font)
      .text('Mob: +91 8588942008',          50, headerY)
      .text('Email: info@trimaxconnect.in', 50, headerY + 12);

    const logoPath = path.join(__dirname, '../assets/logo.png');
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, pageWidth - 160, headerY - 5, { width: 110 });
    }

    doc.moveTo(50, headerY + 30).lineTo(pageWidth - 50, headerY + 30)
      .strokeColor(primaryColor).lineWidth(template === 'Classic' ? 1 : 2).stroke();

    // ── Title ────────────────────────────────────────────
    doc.fontSize(22).fillColor(primaryColor).font(theme.fontBold)
      .text(quotation.invoiceNumber ? 'INVOICE' : 'QUOTATION', 50, headerY + 45);

    // ── Bill To ──────────────────────────────────────────
    let yPos = headerY + 85;

    doc.fontSize(10).fillColor(textColor).font(theme.fontBold).text('Bill To:', 50, yPos);
    yPos += 15;
    doc.fontSize(11).font(theme.font)
      .text(quotation.billTo || quotation.customer?.name || '', 50, yPos, { width: 250 });
    yPos += 30;

    if (quotation.shipTo) {
      doc.fontSize(10).font(theme.fontBold).fillColor(textColor).text('Ship To:', 50, yPos);
      yPos += 15;
      doc.fontSize(9).font(theme.font).text(quotation.shipTo, 50, yPos, { width: 250 });
      yPos += 25;
    }

    // ── Meta Right ───────────────────────────────────────
    let metaY = headerY + 85;
    const rightStart = pageWidth - 220;

    const metaRows = [
      { label: 'Invoice #:',  val: quotation.invoiceNumber || '' },
      { label: 'Date:',       val: new Date(quotation.createdAt).toLocaleDateString('en-IN') },
      { label: 'Due Date:',   val: quotation.dueDate ? new Date(quotation.dueDate).toLocaleDateString('en-IN') : '-' },
      { label: 'PO Number:',  val: quotation.poNumber  || '-' },
      { label: 'Sales Rep:',  val: quotation.salesRep  || '-' },
    ];

    metaRows.forEach(({ label, val }) => {
      doc.fontSize(9).font(theme.fontBold).fillColor(textColor).text(label, rightStart, metaY);
      doc.font(theme.font).text(val, rightStart + 90, metaY, { width: 120, lineBreak: false });
      metaY += 14;
    });

    // ── Items Table ──────────────────────────────────────
    yPos = Math.max(yPos, metaY) + 20;

    if (template === 'Classic') {
      doc.moveTo(50, yPos).lineTo(pageWidth - 50, yPos).strokeColor('#000').lineWidth(1).stroke();
      doc.moveTo(50, yPos + 25).lineTo(pageWidth - 50, yPos + 25).strokeColor('#000').lineWidth(1).stroke();
    } else {
      doc.rect(50, yPos, pageWidth - 100, 25).fillAndStroke(theme.bg, template === 'Minimal' ? theme.bg : '#dee2e6');
    }
    
    doc.fillColor(textColor).fontSize(9).font(theme.fontBold)
      .text('#',              60, yPos + 7)
      .text('Item / Service', 80, yPos + 7)
      .text('Qty',           280, yPos + 7)
      .text('Unit Price',    320, yPos + 7)
      .text('Amount',        460, yPos + 7);

    yPos += 30;
    doc.font(theme.font).fontSize(9).fillColor(textColor);

    (quotation.items || []).forEach((item, index) => {
      const bg = index % 2 === 0 ? (template === 'Classic' ? '#fff' : '#f9fafb') : 'white';
      if (template !== 'Classic' && template !== 'Minimal') {
        doc.rect(50, yPos - 4, pageWidth - 100, 20).fillColor(bg).fill();
      }
      doc.fillColor(textColor)
        .text(String(index + 1),                               60, yPos)
        .text(item.description || item.serviceName || '',      80, yPos, { width: 190, lineBreak: false })
        .text(String(item.quantity || 0),                     280, yPos)
        .text(fmt(item.unitPrice),                            320, yPos)
        .text(fmt(item.amount),                               460, yPos);
      yPos += 20;
    });

    if (template === 'Classic') {
      doc.moveTo(50, yPos).lineTo(pageWidth - 50, yPos).strokeColor('#000').lineWidth(1).stroke();
    }

    // ── Totals ───────────────────────────────────────────
    yPos += 20;
    const totalsX = pageWidth - 220;

    const totalsData = [
      { label: 'Subtotal:',                val: fmt(quotation.subtotal  || 0) },
      { label: `GST (${quotation.gst || 0}%):`, val: fmt(quotation.gstAmount || 0) },
      { label: 'Shipping:',                val: fmt(quotation.shipping  || 0) },
      { label: 'Total:',                   val: fmt(quotation.total     || 0) },
      { label: 'Paid:',                    val: fmt(quotation.paid      || 0) },
      { label: 'Total Due:',               val: fmt(quotation.totalDue  || 0) },
    ];

    totalsData.forEach(({ label, val }, i) => {
      const isFinal = i === totalsData.length - 1;
      
      if (isFinal && template === 'Classic') {
        doc.moveTo(totalsX, yPos - 5).lineTo(pageWidth - 50, yPos - 5).strokeColor('#000').lineWidth(1).stroke();
      }
      
      doc.fontSize(isFinal ? 11 : 9)
        .font(isFinal ? theme.fontBold : theme.font)
        .fillColor(isFinal ? primaryColor : textColor)
        .text(label, totalsX, yPos)
        .text(val, totalsX + 100, yPos, { lineBreak: false });
      yPos += isFinal ? 18 : 14;
    });

    // ── Notes ────────────────────────────────────────────
    if (quotation.notes) {
      yPos += 10;
      doc.fontSize(9).font(theme.fontBold).fillColor(textColor).text('Notes:', 50, yPos);
      yPos += 14;
      doc.font(theme.font).text(quotation.notes, 50, yPos, { width: pageWidth - 100 });
      yPos += 30;
    }
    
    // ── Signature ────────────────────────────────────────
    if (quotation.signature) {
      try {
        const base64Data = quotation.signature.replace(/^data:image\/(png|jpeg);base64,/, "");
        const imgBuffer = Buffer.from(base64Data, 'base64');
        yPos += 20;
        doc.fontSize(10).font(theme.fontBold).text('Authorized Signature:', pageWidth - 220, yPos);
        yPos += 15;
        doc.image(imgBuffer, pageWidth - 220, yPos, { width: 150 });
        yPos += 60; // Approximate height of signature
      } catch (err) {
        console.error("Failed to parse signature:", err);
      }
    }

    // ── Footer ───────────────────────────────────────────
    yPos = Math.max(yPos + 10, doc.page.height - 100); // ensure footer is at bottom
    doc.moveTo(50, yPos).lineTo(pageWidth - 50, yPos)
      .strokeColor(primaryColor).lineWidth(1).stroke();

    doc.fontSize(8).font(theme.font).fillColor(textColor)
      .text('Sector-44, Noida UP - 201301', 50, yPos + 8,
        { align: 'center', width: pageWidth - 100 })
      .text('Mob: +91 8588942008 | Email: info@trimaxconnect.in | Website: www.trimaxconnect.in',
        50, yPos + 18, { align: 'center', width: pageWidth - 100 });

    doc.end();

  } catch (error) {
    console.error('Invoice PDF Generation Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Invoice PDF generation failed' });
    }
  }
};


const generateInvoicePDFBuffer = (quotation) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 40, bottom: 60, left: 50, right: 50 }
      });

      const buffers = [];
      doc.on('data', (data) => buffers.push(data));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const template = quotation.template || 'Modern';
      
      // Theme configurations
      const themes = {
        Modern: { primary: '#5a67d8', text: '#222', bg: '#f1f3f5', font: 'Helvetica', fontBold: 'Helvetica-Bold' },
        Classic: { primary: '#000000', text: '#000000', bg: '#ffffff', font: 'Times-Roman', fontBold: 'Times-Bold' },
        Minimal: { primary: '#64748b', text: '#334155', bg: '#f8fafc', font: 'Helvetica', fontBold: 'Helvetica-Bold' }
      };
      
      const theme = themes[template] || themes.Modern;
      
      const primaryColor = theme.primary;
      const textColor    = theme.text;
      const pageWidth    = doc.page.width;
      const headerY      = 40;

      // ── Header ──────────────────────────────────────────
      doc.fontSize(9).fillColor(textColor).font(theme.font)
        .text('Mob: +91 8588942008',          50, headerY)
        .text('Email: info@trimaxconnect.in', 50, headerY + 12);

      const logoPath = path.join(__dirname, '../assets/logo.png');
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, pageWidth - 160, headerY - 5, { width: 110 });
      }

      doc.moveTo(50, headerY + 30).lineTo(pageWidth - 50, headerY + 30)
        .strokeColor(primaryColor).lineWidth(template === 'Classic' ? 1 : 2).stroke();

      // ── Title ────────────────────────────────────────────
      doc.fontSize(22).fillColor(primaryColor).font(theme.fontBold)
        .text(quotation.invoiceNumber ? 'INVOICE' : 'QUOTATION', 50, headerY + 45);

      // ── Bill To ──────────────────────────────────────────
      let yPos = headerY + 85;

      doc.fontSize(10).fillColor(textColor).font(theme.fontBold).text('Bill To:', 50, yPos);
      yPos += 15;
      doc.fontSize(11).font(theme.font)
        .text(quotation.billTo || quotation.customer?.name || '', 50, yPos, { width: 250 });
      yPos += 30;

      if (quotation.shipTo) {
        doc.fontSize(10).font(theme.fontBold).fillColor(textColor).text('Ship To:', 50, yPos);
        yPos += 15;
        doc.fontSize(9).font(theme.font).text(quotation.shipTo, 50, yPos, { width: 250 });
        yPos += 25;
      }

      // ── Meta Right ───────────────────────────────────────
      let metaY = headerY + 85;
      const rightStart = pageWidth - 220;

      const metaRows = [
        { label: 'Invoice #:',  val: quotation.invoiceNumber || '' },
        { label: 'Date:',       val: new Date(quotation.createdAt).toLocaleDateString('en-IN') },
        { label: 'Due Date:',   val: quotation.dueDate ? new Date(quotation.dueDate).toLocaleDateString('en-IN') : '-' },
        { label: 'PO Number:',  val: quotation.poNumber  || '-' },
        { label: 'Sales Rep:',  val: quotation.salesRep  || '-' },
      ];

      metaRows.forEach(({ label, val }) => {
        doc.fontSize(9).font(theme.fontBold).fillColor(textColor).text(label, rightStart, metaY);
        doc.font(theme.font).text(val, rightStart + 90, metaY, { width: 120, lineBreak: false });
        metaY += 14;
      });

      // ── Items Table ──────────────────────────────────────
      yPos = Math.max(yPos, metaY) + 20;

      if (template === 'Classic') {
        doc.moveTo(50, yPos).lineTo(pageWidth - 50, yPos).strokeColor('#000').lineWidth(1).stroke();
        doc.moveTo(50, yPos + 25).lineTo(pageWidth - 50, yPos + 25).strokeColor('#000').lineWidth(1).stroke();
      } else {
        doc.rect(50, yPos, pageWidth - 100, 25).fillAndStroke(theme.bg, template === 'Minimal' ? theme.bg : '#dee2e6');
      }
      
      doc.fillColor(textColor).fontSize(9).font(theme.fontBold)
        .text('#',              60, yPos + 7)
        .text('Item / Service', 80, yPos + 7)
        .text('Qty',           280, yPos + 7)
        .text('Unit Price',    320, yPos + 7)
        .text('Amount',        460, yPos + 7);

      yPos += 30;
      doc.font(theme.font).fontSize(9).fillColor(textColor);

      (quotation.items || []).forEach((item, index) => {
        const bg = index % 2 === 0 ? (template === 'Classic' ? '#fff' : '#f9fafb') : 'white';
        if (template !== 'Classic' && template !== 'Minimal') {
          doc.rect(50, yPos - 4, pageWidth - 100, 20).fillColor(bg).fill();
        }
        doc.fillColor(textColor)
          .text(String(index + 1),                               60, yPos)
          .text(item.description || item.serviceName || '',      80, yPos, { width: 190, lineBreak: false })
          .text(String(item.quantity || 0),                     280, yPos)
          .text(fmt(item.unitPrice),                            320, yPos)
          .text(fmt(item.amount),                               460, yPos);
        yPos += 20;
      });

      if (template === 'Classic') {
        doc.moveTo(50, yPos).lineTo(pageWidth - 50, yPos).strokeColor('#000').lineWidth(1).stroke();
      }

      // ── Totals ───────────────────────────────────────────
      yPos += 20;
      const totalsX = pageWidth - 220;

      const totalsData = [
        { label: 'Subtotal:',                val: fmt(quotation.subtotal  || 0) },
        { label: `GST (${quotation.gst || 0}%):`, val: fmt(quotation.gstAmount || 0) },
        { label: 'Shipping:',                val: fmt(quotation.shipping  || 0) },
        { label: 'Total:',                   val: fmt(quotation.total     || 0) },
        { label: 'Paid:',                    val: fmt(quotation.paid      || 0) },
        { label: 'Total Due:',               val: fmt(quotation.totalDue  || 0) },
      ];

      totalsData.forEach(({ label, val }, i) => {
        const isFinal = i === totalsData.length - 1;
        
        if (isFinal && template === 'Classic') {
          doc.moveTo(totalsX, yPos - 5).lineTo(pageWidth - 50, yPos - 5).strokeColor('#000').lineWidth(1).stroke();
        }
        
        doc.fontSize(isFinal ? 11 : 9)
          .font(isFinal ? theme.fontBold : theme.font)
          .fillColor(isFinal ? primaryColor : textColor)
          .text(label, totalsX, yPos)
          .text(val, totalsX + 100, yPos, { lineBreak: false });
        yPos += isFinal ? 18 : 14;
      });

      // ── Notes ────────────────────────────────────────────
      if (quotation.notes) {
        yPos += 10;
        doc.fontSize(9).font(theme.fontBold).fillColor(textColor).text('Notes:', 50, yPos);
        yPos += 14;
        doc.font(theme.font).text(quotation.notes, 50, yPos, { width: pageWidth - 100 });
        yPos += 30;
      }
      
      // ── Signature ────────────────────────────────────────
      if (quotation.signature) {
        try {
          const base64Data = quotation.signature.replace(/^data:image\/(png|jpeg);base64,/, "");
          const imgBuffer = Buffer.from(base64Data, 'base64');
          yPos += 20;
          doc.fontSize(10).font(theme.fontBold).text('Authorized Signature:', pageWidth - 220, yPos);
          yPos += 15;
          doc.image(imgBuffer, pageWidth - 220, yPos, { width: 150 });
          yPos += 60; // Approximate height of signature
        } catch (err) {
          console.error("Failed to parse signature:", err);
        }
      }

      // ── Footer ───────────────────────────────────────────
      yPos = Math.max(yPos + 10, doc.page.height - 100); // ensure footer is at bottom
      doc.moveTo(50, yPos).lineTo(pageWidth - 50, yPos)
        .strokeColor(primaryColor).lineWidth(1).stroke();

      doc.fontSize(8).font(theme.font).fillColor(textColor)
        .text('Sector-44, Noida UP - 201301', 50, yPos + 8,
          { align: 'center', width: pageWidth - 100 })
        .text('Mob: +91 8588942008 | Email: info@trimaxconnect.in | Website: www.trimaxconnect.in',
          50, yPos + 18, { align: 'center', width: pageWidth - 100 });

      doc.end();

    } catch (error) {
      reject(error);
    }
  });
};

const generateQuotationPDFBuffer = (quotation) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 40, bottom: 60, left: 50, right: 50 }
      });

      const buffers = [];
      doc.on('data', (data) => buffers.push(data));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const primaryColor = '#5a67d8';
      const textColor    = '#222';
      const pageWidth    = doc.page.width;
      const headerY      = 40;

      // ── Header ──────────────────────────────────────────
      doc.fontSize(9).fillColor(textColor).font('Helvetica')
        .text('Mob: +91 8588942008',          50, headerY)
        .text('Email: info@trimaxconnect.in', 50, headerY + 12);

      const logoPath = path.join(__dirname, '../assets/logo.png');
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, pageWidth - 160, headerY - 5, { width: 110 });
      }

      doc.moveTo(50, headerY + 30).lineTo(pageWidth - 50, headerY + 30)
        .strokeColor(primaryColor).lineWidth(2).stroke();

      // ── Title ────────────────────────────────────────────
      doc.fontSize(22).fillColor(primaryColor).font('Helvetica-Bold')
        .text('QUOTATION', 50, headerY + 45);

      // ── Bill To ──────────────────────────────────────────
      let yPos = headerY + 85;

      doc.fontSize(10).fillColor(textColor).font('Helvetica-Bold').text('Bill To:', 50, yPos);
      yPos += 15;
      doc.fontSize(11).text(quotation.customer.name || '', 50, yPos);
      yPos += 14;
      doc.fontSize(9).font('Helvetica').text(quotation.customer.email || '', 50, yPos);
      yPos += 12;
      doc.text(quotation.customer.phone || '', 50, yPos);
      yPos += 12;
      if (quotation.customer.company) { doc.text(quotation.customer.company, 50, yPos); yPos += 12; }
      if (quotation.customer.address) { doc.text(quotation.customer.address, 50, yPos); yPos += 12; }
      if (quotation.customer.gst)     { doc.text(`GST: ${quotation.customer.gst}`, 50, yPos); }

      // ── Meta Right ───────────────────────────────────────
      const rightStart = pageWidth - 220;
      let metaY = headerY + 85;

      doc.fontSize(9).font('Helvetica-Bold').text('Quotation #:', rightStart, metaY);
      doc.font('Helvetica').text(quotation.invoiceNumber || quotation.quotationNumber || '', rightStart + 90, metaY, { width: 120, lineBreak: false });
      metaY += 14;
      doc.font('Helvetica-Bold').text('Date:', rightStart, metaY);
      doc.font('Helvetica').text(new Date(quotation.createdAt).toLocaleDateString('en-IN'), rightStart + 90, metaY, { lineBreak: false });
      metaY += 14;
      doc.font('Helvetica-Bold').text('Valid Until:', rightStart, metaY);
      doc.font('Helvetica').text(quotation.dueDate ? new Date(quotation.dueDate).toLocaleDateString('en-IN') : '-', rightStart + 90, metaY, { lineBreak: false });

      // ── Items Table ──────────────────────────────────────
      yPos = 220;

      doc.rect(50, yPos, pageWidth - 100, 25).fillAndStroke('#f1f3f5', '#dee2e6');
      doc.fillColor(textColor).fontSize(9).font('Helvetica-Bold')
        .text('#',              60, yPos + 7)
        .text('Service / Item', 90, yPos + 7)
        .text('Qty',           300, yPos + 7)
        .text('Price',         340, yPos + 7)
        .text('Tax%',          400, yPos + 7)
        .text('Amount',        460, yPos + 7);

      yPos += 30;
      doc.font('Helvetica').fontSize(9).fillColor(textColor);

      (quotation.items || []).forEach((item, index) => {
        const bg = index % 2 === 0 ? '#f9fafb' : 'white';
        doc.rect(50, yPos - 4, pageWidth - 100, 20).fillColor(bg).fill();
        doc.fillColor(textColor)
          .text(String(index + 1),           60, yPos)
          .text(item.serviceName || '',       90, yPos, { width: 200, lineBreak: false })
          .text(String(item.quantity || 0),  300, yPos)
          .text(fmt(item.unitPrice),         340, yPos)
          .text(`${item.tax || 0}%`,         400, yPos)
          .text(fmt(item.amount),            460, yPos);
        yPos += 20;
      });

      // ── Totals ───────────────────────────────────────────
      yPos += 15;
      doc.moveTo(350, yPos).lineTo(pageWidth - 50, yPos).strokeColor('#dee2e6').lineWidth(1).stroke();
      yPos += 8;

      const addRow = (label, value, bold = false) => {
        bold ? doc.font('Helvetica-Bold').fontSize(10) : doc.font('Helvetica').fontSize(9);
        doc.fillColor(textColor).text(label, 350, yPos).text(value, 460, yPos);
        yPos += 16;
      };

      const totalDiscount = (quotation.items || []).reduce((acc, item) => {
        const q = Number(item.quantity || 0);
        const p = Number(item.unitPrice || 0);
        const d = Number(item.discount || 0);
        return acc + (q * p * d / 100);
      }, 0);

      addRow('Subtotal:',   fmt(quotation.subtotal));
      if (totalDiscount > 0) {
        addRow('Discount:',  `-${fmt(totalDiscount)}`);
      }
      addRow('Tax (GST):',  fmt(quotation.gstAmount || 0));
      if (quotation.shipping > 0) {
        addRow('Shipping:', fmt(quotation.shipping));
      }
      doc.moveTo(350, yPos).lineTo(pageWidth - 50, yPos).strokeColor(primaryColor).lineWidth(1.5).stroke();
      yPos += 6;
      addRow('Grand Total:', fmt(quotation.total || 0), true);

      // ── Notes ────────────────────────────────────────────
      if (quotation.notes) {
        yPos += 20;
        doc.fontSize(10).fillColor(primaryColor).font('Helvetica-Bold').text('Notes:', 50, yPos);
        doc.fontSize(9).fillColor(textColor).font('Helvetica')
          .text(quotation.notes, 50, yPos + 14, { width: pageWidth - 100 });
        yPos += 40;
      }

      // ── Signature ────────────────────────────────────────
      if (quotation.signature) {
        try {
          const base64Data = quotation.signature.replace(/^data:image\/(png|jpeg);base64,/, "");
          const imgBuffer = Buffer.from(base64Data, 'base64');
          yPos += 20;
          doc.fontSize(10).fillColor(primaryColor).font('Helvetica-Bold').text('Authorized Signature:', pageWidth - 220, yPos);
          yPos += 15;
          doc.image(imgBuffer, pageWidth - 220, yPos, { width: 150 });
          yPos += 60; // Approximate height of signature
        } catch (err) {
          console.error("Failed to parse signature:", err);
        }
      }

      // ── Terms ────────────────────────────────────────────
      if (quotation.terms) {
        yPos += 10;
        doc.fontSize(10).fillColor(primaryColor).font('Helvetica-Bold').text('Terms & Conditions:', 50, yPos);
        doc.fontSize(9).fillColor(textColor).font('Helvetica')
          .text(quotation.terms, 50, yPos + 14, { width: pageWidth - 100 });
        yPos += 50;
      }

      // ── Footer ───────────────────────────────────────────
      yPos += 20;
      doc.moveTo(50, yPos).lineTo(pageWidth - 50, yPos)
        .strokeColor(primaryColor).lineWidth(1).stroke();

      doc.fontSize(8).font('Helvetica').fillColor(textColor)
        .text('Sector-44, Noida UP - 201301', 50, yPos + 8,
          { align: 'center', width: pageWidth - 100 })
        .text('Mob: +91 8588942008 | Email: info@trimaxconnect.in | Website: www.trimaxconnect.in',
          50, yPos + 20, { align: 'center', width: pageWidth - 100 });

      doc.end();

    } catch (error) {
      reject(error);
    }
  });
};

// ── Exports ──────────────────────────────────────────────────────────────────
module.exports = { generateQuotationPDF, generateInvoicePDF, generateInvoicePDFBuffer, generateQuotationPDFBuffer };