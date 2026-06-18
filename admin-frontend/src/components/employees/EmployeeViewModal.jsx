import React from 'react';
import { X, Mail, Briefcase, Building, Phone, DollarSign, Calendar, UserCheck, Download, Laptop, FileText } from 'lucide-react';
import Badge from '../common/Badge';
import { formatDate } from '../../utils/helpers';

const EmployeeViewModal = ({ employee, attendance, onClose, onEdit }) => {
  if (!employee) return null;

  const calculateMonthlyStats = (attendanceData) => {
    if (!attendanceData) return { fullDays: 0, halfDays: 0, absent: 0, totalHours: 0, percentage: 0 };
    
    const records = Object.values(attendanceData);
    const fullDays = records.filter(r => r.status === 'full').length;
    const halfDays = records.filter(r => r.status === 'half').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const totalHours = records.reduce((sum, r) => sum + r.hours, 0);
    const percentage = Math.round(((fullDays + halfDays * 0.5) / records.length) * 100);
    
    return { fullDays, halfDays, absent, totalHours, percentage };
  };

  const generateSalarySlip = () => {
    const stats = calculateMonthlyStats(attendance);
    const month = new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    const salary = typeof employee.salary === 'number' ? employee.salary : parseInt(employee.salary.replace(/[^0-9]/g, '')) || 50000;
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Salary Slip - ${employee.name}</title>
  <style>
    body {  max-width: 800px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; border-bottom: 3px solid #4F46E5; padding-bottom: 20px; margin-bottom: 30px; }
    .company-name { color: #4F46E5; font-size: 28px; font-weight: bold; margin-bottom: 5px; }
    .slip-title { color: #666; font-size: 18px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 30px 0; }
    .info-item { padding: 10px; background: #F9FAFB; border-left: 3px solid #4F46E5; }
    .info-label { color: #666; font-size: 12px; text-transform: uppercase; }
    .info-value { color: #111; font-size: 16px; font-weight: 600; margin-top: 5px; }
    .section { margin: 30px 0; }
    .section-title { font-size: 16px; font-weight: bold; color: #4F46E5; margin-bottom: 15px; border-bottom: 2px solid #E5E7EB; padding-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #E5E7EB; }
    th { background: #F9FAFB; font-weight: 600; color: #666; }
    .amount { text-align: right; font-weight: 600; }
    .total-row { background: #4F46E5; color: white; font-weight: bold; font-size: 18px; }
    .footer { margin-top: 50px; padding-top: 20px; border-top: 2px solid #E5E7EB; text-align: center; color: #666; font-size: 12px; }
    .signature { margin-top: 60px; display: flex; justify-content: space-between; }
    .signature div { text-align: center; }
    .signature-line { border-top: 2px solid #111; width: 200px; margin: 0 auto; padding-top: 10px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-name">Trimax Solutions</div>
    <div class="slip-title">Salary Slip - ${month}</div>
  </div>

  <div class="info-grid">
    <div class="info-item">
      <div class="info-label">Employee Name</div>
      <div class="info-value">${employee.name}</div>
    </div>
    <div class="info-item">
      <div class="info-label">Employee ID</div>
      <div class="info-value">${employee.employeeId || 'N/A'}</div>
    </div>
    <div class="info-item">
      <div class="info-label">Designation</div>
      <div class="info-value">${employee.designation}</div>
    </div>
    <div class="info-item">
      <div class="info-label">Department</div>
      <div class="info-value">${employee.department}</div>
    </div>
    <div class="info-item">
      <div class="info-label">Working Type</div>
      <div class="info-value">${employee.workingType || 'Office'}</div>
    </div>
    <div class="info-item">
      <div class="info-label">Payment Month</div>
      <div class="info-value">${month}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Attendance Summary</div>
    <table>
      <tr>
        <th>Metric</th>
        <th class="amount">Value</th>
      </tr>
      <tr>
        <td>Full Days Worked</td>
        <td class="amount">${stats.fullDays}</td>
      </tr>
      <tr>
        <td>Half Days Worked</td>
        <td class="amount">${stats.halfDays}</td>
      </tr>
      <tr>
        <td>Days Absent</td>
        <td class="amount">${stats.absent}</td>
      </tr>
      <tr>
        <td>Total Hours</td>
        <td class="amount">${stats.totalHours} hours</td>
      </tr>
      <tr>
        <td>Attendance Percentage</td>
        <td class="amount">${stats.percentage}%</td>
      </tr>
    </table>
  </div>

  <div class="section">
    <div class="section-title">Salary Breakdown</div>
    <table>
      <tr>
        <th>Component</th>
        <th class="amount">Amount (₹)</th>
      </tr>
      <tr>
        <td>Basic Salary</td>
        <td class="amount">${salary.toLocaleString('en-IN')}</td>
      </tr>
      <tr>
        <td>HRA (40%)</td>
        <td class="amount">${(salary * 0.4).toLocaleString('en-IN')}</td>
      </tr>
      <tr>
        <td>Transport Allowance</td>
        <td class="amount">3,000</td>
      </tr>
      <tr>
        <td>Professional Tax</td>
        <td class="amount">-200</td>
      </tr>
      <tr class="total-row">
        <td>Net Salary</td>
        <td class="amount">₹${(salary * 1.4 + 3000 - 200).toLocaleString('en-IN')}</td>
      </tr>
    </table>
  </div>

  <div class="signature">
    <div>
      <div class="signature-line">Employee Signature</div>
    </div>
    <div>
      <div class="signature-line">Authorized Signatory</div>
    </div>
  </div>

  <div class="footer">
    <p>This is a computer-generated document. No signature is required.</p>
    <p>Generated on ${new Date().toLocaleDateString('en-IN')} | Trimax Solutions Pvt. Ltd.</p>
  </div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `salary_slip_${employee.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.html`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const stats = calculateMonthlyStats(attendance);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container employee-view-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Employee Details</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          <div className="employee-profile">
            <div className="profile-avatar">
              {employee.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </div>
            <div className="profile-info">
              <h3>{employee.name}</h3>
              <p>{employee.designation}</p>
              <Badge status={employee.status}>{employee.status}</Badge>
            </div>
          </div>

          <div className="details-grid">
            <div className="detail-item">
              <div className="detail-icon">
                <Mail size={20} />
              </div>
              <div>
                <p className="detail-label">EMAIL</p>
                <p className="detail-value">{employee.email}</p>
              </div>
            </div>

            <div className="detail-item">
              <div className="detail-icon">
                <Phone size={20} />
              </div>
              <div>
                <p className="detail-label">PHONE</p>
                <p className="detail-value">{employee.phone}</p>
              </div>
            </div>

            <div className="detail-item">
              <div className="detail-icon">
                <Building size={20} />
              </div>
              <div>
                <p className="detail-label">DEPARTMENT</p>
                <p className="detail-value">{employee.department}</p>
              </div>
            </div>

            <div className="detail-item">
              <div className="detail-icon">
                <Briefcase size={20} />
              </div>
              <div>
                <p className="detail-label">DESIGNATION</p>
                <p className="detail-value">{employee.designation}</p>
              </div>
            </div>

            <div className="detail-item">
              <div className="detail-icon">
                <DollarSign size={20} />
              </div>
              <div>
                <p className="detail-label">SALARY</p>
                <p className="detail-value">{employee.salary}</p>
              </div>
            </div>

            <div className="detail-item">
              <div className="detail-icon">
                <UserCheck size={20} />
              </div>
              <div>
                <p className="detail-label">REPORTING TO</p>
                <p className="detail-value">{employee.reportingTo}</p>
              </div>
            </div>

            <div className="detail-item">
              <div className="detail-icon">
                <Calendar size={20} />
              </div>
              <div>
                <p className="detail-label">JOIN DATE</p>
                <p className="detail-value">{formatDate(employee.joinDate)}</p>
              </div>
            </div>

            <div className="detail-item">
              <div className="detail-icon">
                <UserCheck size={20} />
              </div>
              <div>
                <p className="detail-label">STATUS</p>
                <p className="detail-value">{employee.status}</p>
              </div>
            </div>

            <div className="detail-item">
              <div className="detail-icon">
                <Laptop size={20} />
              </div>
              <div>
                <p className="detail-label">WORKING TYPE</p>
                <p className="detail-value">{employee.workingType || 'Office'}</p>
              </div>
            </div>

            <div className="detail-item">
              <div className="detail-icon">
                <FileText size={20} />
              </div>
              <div>
                <p className="detail-label">EMPLOYEE ID</p>
                <p className="detail-value">{employee.employeeId || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div className="attendance-summary">
            <h3>Monthly Attendance Summary</h3>
            <div className="summary-grid">
              <div className="summary-item">
                <p className="summary-label">Full Days</p>
                <p className="summary-value">{stats.fullDays}</p>
              </div>
              <div className="summary-item">
                <p className="summary-label">Half Days</p>
                <p className="summary-value">{stats.halfDays}</p>
              </div>
              <div className="summary-item">
                <p className="summary-label">Absent</p>
                <p className="summary-value">{stats.absent}</p>
              </div>
              <div className="summary-item">
                <p className="summary-label">Total Hours</p>
                <p className="summary-value">{stats.totalHours}h</p>
              </div>
              <div className="summary-item">
                <p className="summary-label">Attendance %</p>
                <p className="summary-value">{stats.percentage}%</p>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
          <button className="btn-success" onClick={generateSalarySlip}>
            <Download size={18} />
            Download Salary Slip
          </button>
          <button className="btn-primary" onClick={() => onEdit(employee)}>
            Edit Employee
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeViewModal;