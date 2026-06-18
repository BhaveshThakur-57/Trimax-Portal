import React, { useState, useEffect } from 'react';
import { X, User, Mail, Briefcase, Building, Phone, DollarSign, Calendar, UserCheck, Laptop } from 'lucide-react';
import { departments } from '../../data/mockData';

const EmployeeModal = ({ employee, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    designation: '',
    department: 'Engineering',
    phone: '',
    salary: '',
    workingType: 'Office',
    reportingTo: '',
    status: 'Active',
    joinDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (employee) {
      setFormData({
        ...employee,
        workingType: employee.workingType || 'Office',
        joinDate: employee.joinDate ? new Date(employee.joinDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      });
    }
  }, [employee]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container employee-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{employee ? 'Edit Employee' : 'Add New Employee'}</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-row">
            <div className="form-group">
              <label>Full Name *</label>
              <div className="input-group">
                <User size={20} className="input-icon" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Email *</label>
              <div className="input-group">
                <Mail size={20} className="input-icon" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@trimax.com"
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Designation *</label>
              <div className="input-group">
                <Briefcase size={20} className="input-icon" />
                <input
                  type="text"
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  placeholder="Senior Developer"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Department *</label>
              <div className="input-group">
                <Building size={20} className="input-icon" />
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  required
                >
                  {departments.filter(d => d !== 'All Departments').map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Phone *</label>
              <div className="input-group">
                <Phone size={20} className="input-icon" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Salary *</label>
              <div className="input-group">
                <DollarSign size={20} className="input-icon" />
                <input
                  type="text"
                  name="salary"
                  value={formData.salary}
                  onChange={handleChange}
                  placeholder="₹50,000"
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Working Type *</label>
              <div className="input-group">
                <Laptop size={20} className="input-icon" />
                <select
                  name="workingType"
                  value={formData.workingType}
                  onChange={handleChange}
                  required
                >
                  <option value="Office">Office</option>
                  <option value="Work From Home">Work From Home</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Reporting To *</label>
              <div className="input-group">
                <UserCheck size={20} className="input-icon" />
                <input
                  type="text"
                  name="reportingTo"
                  value={formData.reportingTo}
                  onChange={handleChange}
                  placeholder="Tech Lead"
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Join Date *</label>
              <div className="input-group">
                <Calendar size={20} className="input-icon" />
                <input
                  type="date"
                  name="joinDate"
                  value={formData.joinDate}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Status *</label>
              <div className="input-group">
                <UserCheck size={20} className="input-icon" />
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                >
                  <option value="Active">Active</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {employee ? 'Update Employee' : 'Add Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeeModal;