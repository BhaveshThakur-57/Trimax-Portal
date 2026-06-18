const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

// ── Initialize Nodemailer ────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// ── Helper ───────────────────────────────────────────────────────────────────
const fmt = (amount) => `Rs.${(amount || 0).toLocaleString('en-IN')}`;


// ════════════════════════════════════════════════════════════════════════════
//  1.  WELCOME EMAIL  (new employee credentials)
// ════════════════════════════════════════════════════════════════════════════
const sendWelcomeEmail = async (employeeData) => {
  try {
    const { name, email, employeeId, tempPassword, department, designation } = employeeData;

    const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f5f5f5;
        }
        .email-container {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 40px 30px;
          text-align: center;
        }
        .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
        .header p  { margin: 10px 0 0 0; font-size: 16px; opacity: 0.95; }
        .content   { padding: 30px; }
        .greeting  { font-size: 18px; color: #333; margin-bottom: 20px; }
        .credentials-box {
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          border-radius: 10px;
          padding: 25px;
          margin: 25px 0;
          border: 2px solid #667eea;
        }
        .credentials-box h3 {
          margin: 0 0 20px 0;
          color: #667eea;
          font-size: 18px;
        }
        .credential-item {
          margin: 15px 0;
          background: white;
          padding: 12px 15px;
          border-radius: 6px;
          border-left: 3px solid #667eea;
        }
        .credential-item label {
          font-weight: 600;
          color: #666;
          display: block;
          font-size: 12px;
          margin-bottom: 5px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .credential-item .value {
          font-size: 16px;
          color: #333;
          font-family: 'Courier New', monospace;
          font-weight: bold;
        }
        .password-item  { background: #fff3cd; border-left: 3px solid #ffc107; }
        .password-value {
          color: #d63031;
          font-size: 18px;
          padding: 8px 12px;
          background: white;
          border-radius: 4px;
          display: inline-block;
          border: 2px dashed #d63031;
        }
        .warning-box {
          background: #fff3cd;
          border-left: 4px solid #ffc107;
          padding: 20px;
          margin: 25px 0;
          border-radius: 6px;
        }
        .warning-box strong { color: #856404; font-size: 16px; display: block; margin-bottom: 10px; }
        .warning-box ul     { margin: 10px 0; padding-left: 20px; color: #856404; }
        .warning-box li     { margin: 8px 0; }
        .login-button       { text-align: center; margin: 30px 0; }
        .login-button a {
          display: inline-block;
          padding: 15px 40px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-decoration: none;
          border-radius: 8px;
          font-weight: bold;
          font-size: 16px;
          box-shadow: 0 4px 15px rgba(102,126,234,0.4);
        }
        .info-text { color: #666; font-size: 15px; line-height: 1.8; margin: 15px 0; }
        .footer {
          text-align: center;
          padding: 25px 30px;
          background: #f9f9f9;
          border-top: 1px solid #e0e0e0;
          color: #666;
          font-size: 14px;
        }
        .footer p { margin: 5px 0; }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>🎉 Welcome to Trimax Connect!</h1>
          <p>Your employee account has been created successfully</p>
        </div>
        <div class="content">
          <p class="greeting">Hello <strong>${name}</strong>,</p>
          <p class="info-text">
            Welcome aboard! We're excited to have you join our team at Trimax Connect.
            Your employee account has been set up and you can now access our system
            to manage your work, track attendance, and collaborate with your team.
          </p>
          <div class="credentials-box">
            <h3>🔐 Your Login Credentials</h3>
            <div class="credential-item">
              <label>Employee ID</label>
              <div class="value">${employeeId}</div>
            </div>
            <div class="credential-item">
              <label>Email Address (Username)</label>
              <div class="value">${email}</div>
            </div>
            <div class="credential-item password-item">
              <label>Temporary Password</label>
              <div class="password-value">${tempPassword}</div>
            </div>
            <div class="credential-item">
              <label>Department</label>
              <div class="value">${department}</div>
            </div>
            <div class="credential-item">
              <label>Designation</label>
              <div class="value">${designation}</div>
            </div>
          </div>
          <div class="warning-box">
            <strong>⚠️ Important Security Notice</strong>
            <ul>
              <li>This is a <strong>temporary password</strong> for first-time login only</li>
              <li>You <strong>must change</strong> your password immediately after logging in</li>
              <li><strong>Never share</strong> your credentials with anyone</li>
              <li>Keep this email secure and <strong>delete it</strong> after changing your password</li>
              <li>If you didn't request this account, please contact IT support immediately</li>
            </ul>
          </div>
          <div class="login-button">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login">
              🚀 Login to Your Account
            </a>
          </div>
          <p class="info-text">
            If you have any questions or need assistance, please contact your administrator or HR team.
          </p>
          <p class="info-text" style="margin-top:30px;">
            Best regards,<br><strong>Trimax Connect HR Team</strong>
          </p>
        </div>
        <div class="footer">
          <p><strong>📧 This is an automated message. Please do not reply to this email.</strong></p>
          <p>© ${new Date().getFullYear()} Trimax Connect. All rights reserved.</p>
          <p style="margin-top:10px;font-size:12px;color:#999;">
            If the login button doesn't work, copy and paste this link:<br>
            ${process.env.FRONTEND_URL || 'http://localhost:3000'}/login
          </p>
        </div>
      </div>
    </body>
    </html>
    `;

    const emailText = `
🎉 Welcome to Trimax Connect!

Hello ${name},

Your employee account has been created successfully!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔐 YOUR LOGIN CREDENTIALS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Employee ID  : ${employeeId}
Email        : ${email}
Temp Password: ${tempPassword}
Department   : ${department}
Designation  : ${designation}

Login URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/login

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ IMPORTANT SECURITY NOTICE:
- This is a TEMPORARY password for first-time login only
- You MUST change your password immediately after logging in
- NEVER share your credentials with anyone

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Best regards,
Trimax Connect HR Team
---
This is an automated message. Please do not reply.
    `;

    const info = await transporter.sendMail({
      from: `TRIMAX <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `🎉 Welcome to Trimax Connect - Your Account Details [${employeeId}]`,
      html: emailHtml,
      text: emailText,
    });

    console.log('✅ Welcome email sent to:', email, '| ID:', info.messageId);
    return { success: true, messageId: info.messageId, message: 'Welcome email sent successfully' };

  } catch (error) {
    console.error('❌ Error sending welcome email:', error);
    return { success: false, error: error.message };
  }
};


// ════════════════════════════════════════════════════════════════════════════
//  2.  PASSWORD RESET EMAIL
// ════════════════════════════════════════════════════════════════════════════
const sendPasswordResetEmail = async (email, name, resetUrl) => {
  try {
    const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6; color: #333;
          max-width: 600px; margin: 0 auto;
          padding: 20px; background-color: #f5f5f5;
        }
        .email-container {
          background: white; border-radius: 12px;
          overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white; padding: 40px 30px; text-align: center;
        }
        .header h1 { margin: 0; font-size: 28px; }
        .content   { padding: 30px; }
        .button-container { text-align: center; margin: 30px 0; }
        .reset-button {
          display: inline-block; padding: 15px 40px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white; text-decoration: none;
          border-radius: 8px; font-weight: bold; font-size: 16px;
          box-shadow: 0 4px 15px rgba(102,126,234,0.4);
        }
        .warning-box {
          background: #fff3cd; border-left: 4px solid #ffc107;
          padding: 20px; margin: 25px 0; border-radius: 6px;
        }
        .footer {
          text-align: center; padding: 25px 30px;
          background: #f9f9f9; border-top: 1px solid #e0e0e0;
          color: #666; font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>🔐 Password Reset Request</h1>
        </div>
        <div class="content">
          <p>Hello <strong>${name}</strong>,</p>
          <p>You recently requested to reset your password for your Trimax Connect account.
             Click the button below to reset it:</p>
          <div class="button-container">
            <a href="${resetUrl}" class="reset-button">Reset Password</a>
          </div>
          <div class="warning-box">
            <strong>⚠️ Security Notice:</strong>
            <ul style="margin:10px 0;padding-left:20px;">
              <li>This link will expire in <strong>10 minutes</strong></li>
              <li>If you didn't request this, please ignore this email</li>
              <li>Your password won't change until you access the link above</li>
            </ul>
          </div>
          <p style="color:#666;font-size:14px;margin-top:30px;">
            If the button doesn't work, copy and paste this link:<br>
            <a href="${resetUrl}" style="color:#667eea;word-break:break-all;">${resetUrl}</a>
          </p>
        </div>
        <div class="footer">
          <p><strong>This is an automated message. Please do not reply.</strong></p>
          <p>© ${new Date().getFullYear()} Trimax Connect. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
    `;

    const info = await transporter.sendMail({
      from: `TRIMAX <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🔐 Password Reset Request - Trimax Connect',
      html: emailHtml,
    });

    console.log('✅ Password reset email sent to:', email);
    return { success: true, messageId: info.messageId };

  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    return { success: false, error: error.message };
  }
};


// ════════════════════════════════════════════════════════════════════════════
//  3.  QUOTATION EMAIL  (PDF attached)
// ════════════════════════════════════════════════════════════════════════════

const { generateQuotationPDFBuffer } = require('./pdfGenerator');

/**
 * Sends a quotation email with PDF attachment to the customer.
 *
 * @param {Object} quotation  - Full quotation document from DB
 */
const sendQuotationEmail = async (quotation) => {
  try {
    const pdfBuffer = await generateQuotationPDFBuffer(quotation);
    const { customer } = quotation;

    const validUntilDate = new Date(quotation.dueDate || quotation.validUntil || new Date()).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'long', year: 'numeric'
    });

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; color: #374151; margin: 0; padding: 0; background: #f9fafb; }
          .container { max-width: 600px; margin: 30px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
          .header { background: linear-gradient(135deg, #667eea, #764ba2); padding: 30px 40px; color: white; }
          .header h1 { margin: 0; font-size: 24px; }
          .header p  { margin: 6px 0 0; opacity: 0.85; font-size: 14px; }
          .body { padding: 32px 40px; }
          .body p { font-size: 15px; line-height: 1.6; margin: 0 0 16px; }
          .info-box { background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 24px 0; }
          .info-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; border-bottom: 1px solid #e5e7eb; }
          .info-row:last-child { border-bottom: none; font-weight: bold; font-size: 15px; color: #4f46e5; }
          .info-label { color: #6b7280; }
          .footer { background: #f9fafb; padding: 20px 40px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Trimax Connect</h1>
            <p>Professional IT Services &amp; Solutions</p>
          </div>
          <div class="body">
            <p>Dear <strong>${customer.name}</strong>,</p>
            <p>Thank you for your interest. Please find your quotation details below and attached as PDF.</p>
            <div class="info-box">
              <div class="info-row">
                <span class="info-label">Quotation Number</span>
                <span>${quotation.invoiceNumber || quotation.quotationNumber || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Valid Until</span>
                <span>${validUntilDate}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Grand Total</span>
                <span>${fmt(quotation.total || quotation.grandTotal)}</span>
              </div>
            </div>
            <p>Please review the attached PDF. Feel free to contact us for any questions.</p>
            <p style="color:#6b7280;font-size:13px;">
              This quotation is valid until <strong>${validUntilDate}</strong>.
            </p>
          </div>
          <div class="footer">
            <p>Trimax Connect | info@trimaxconnect.in</p>
            <p>Sector-44, Noida UP - 201301 | www.trimaxconnect.in</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const info = await transporter.sendMail({
      from: `TRIMAX <${process.env.EMAIL_USER}>`,
      to: customer.email,
      subject: `Quotation ${quotation.invoiceNumber || quotation.quotationNumber || 'Details'} from Trimax Connect`,
      html: emailHtml,
      attachments: [
        {
          filename: `Quotation-${quotation.invoiceNumber || quotation.quotationNumber || 'Document'}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    console.log('✅ Quotation email sent to:', customer.email, '| ID:', info.messageId);
    return { success: true, messageId: info.messageId };

  } catch (error) {
    console.error('❌ Quotation email service error:', error.message);
    return { success: false, error: error.message };
  }
};


// ════════════════════════════════════════════════════════════════════════════
//  4.  FOLLOW-UP EMAIL (Inquiries)
// ════════════════════════════════════════════════════════════════════════════
const sendFollowUpEmail = async (inquiry) => {
  try {
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; color: #374151; margin: 0; padding: 0; background: #f9fafb; }
          .container { max-width: 600px; margin: 30px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
          .header { background: linear-gradient(135deg, #667eea, #764ba2); padding: 30px 40px; color: white; }
          .header h1 { margin: 0; font-size: 24px; }
          .body { padding: 32px 40px; }
          .body p { font-size: 15px; line-height: 1.6; margin: 0 0 16px; }
          .footer { background: #f9fafb; padding: 20px 40px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Checking In</h1>
            <p>Trimax Connect</p>
          </div>
          <div class="body">
            <p>Dear <strong>${inquiry.name}</strong>,</p>
            <p>We recently received your inquiry regarding "<strong>${inquiry.subject}</strong>" and wanted to follow up with you. We hope our team was able to assist you.</p>
            <p>If you have any further questions or if there is anything else we can help you with, please feel free to reply directly to this email.</p>
            <p>We value your interest in our services and look forward to hearing from you.</p>
          </div>
          <div class="footer">
            <p>Trimax Connect | info@trimaxconnect.in</p>
            <p>Sector-44, Noida UP - 201301 | www.trimaxconnect.in</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const info = await transporter.sendMail({
      from: `TRIMAX <${process.env.EMAIL_USER}>`,
      to: inquiry.email,
      subject: `Following up: ${inquiry.subject}`,
      html: emailHtml,
    });

    console.log('✅ Follow-up email sent to:', inquiry.email);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Follow-up email error:', error.message);
    return { success: false, error: error.message };
  }
};

// ── Exports ──────────────────────────────────────────────────────────────────
module.exports = {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendQuotationEmail,
  sendFollowUpEmail,
};