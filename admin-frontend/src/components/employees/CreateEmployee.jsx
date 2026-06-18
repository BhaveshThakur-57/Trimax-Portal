import React, { useState } from 'react';
import { UserPlus, Copy, Check } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const CreateEmployee = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [createdEmployee, setCreatedEmployee] = useState(null);
  const [copied, setCopied] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    department: '',
    designation: '',
    joiningDate: '',
    salary: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/api/auth/create-employee`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Employee created successfully!');
        setCreatedEmployee(data.data);
        
        // Reset form
        setFormData({
          name: '',
          email: '',
          password: '',
          department: '',
          designation: '',
          joiningDate: '',
          salary: ''
        });
      } else {
        setError(data.message || 'Failed to create employee');
      }
    } catch (err) {
      setError('Failed to create employee. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyCredentials = () => {
    const credentials = `
🎉 Welcome to the Team!

Login Credentials
-----------------------------------
Name: ${createdEmployee.name}
Employee ID: ${createdEmployee.employeeId}
Email: ${createdEmployee.email}
Temporary Password: ${createdEmployee.tempPassword}
Department: ${createdEmployee.department}
Designation: ${createdEmployee.designation}

Login URL: ${window.location.origin}

⚠️ Important: Please change your password after first login.
    `.trim();

    navigator.clipboard.writeText(credentials);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">
          <UserPlus size={28} style={{ marginRight: '10px' }} />
          Create New Employee
        </h1>
        <p className="page-subtitle">Add a new employee to the system</p>
      </div>

      {/* Success Card with Credentials */}
      {createdEmployee && (
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '30px',
          borderRadius: '12px',
          marginBottom: '30px',
          boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)'
        }}>
          <h3 style={{ 
            marginBottom: '20px', 
            fontSize: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            ✅ Employee Created Successfully!
          </h3>
          
          <div style={{
            background: 'rgba(255,255,255,0.15)',
            padding: '25px',
            borderRadius: '8px',
            marginBottom: '20px',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '15px' 
            }}>
              <div>
                <p style={{ fontSize: '12px', opacity: 0.8, marginBottom: '5px' }}>Name</p>
                <p style={{ fontSize: '16px', fontWeight: 'bold' }}>{createdEmployee.name}</p>
              </div>

              <div>
                <p style={{ fontSize: '12px', opacity: 0.8, marginBottom: '5px' }}>Employee ID</p>
                <p style={{ 
                  fontSize: '16px', 
                  fontWeight: 'bold',
                  
                  background: 'rgba(0,0,0,0.2)',
                  padding: '5px 10px',
                  borderRadius: '4px',
                  display: 'inline-block'
                }}>
                  {createdEmployee.employeeId}
                </p>
              </div>

              <div>
                <p style={{ fontSize: '12px', opacity: 0.8, marginBottom: '5px' }}>Email</p>
                <p style={{ fontSize: '16px', fontWeight: 'bold' }}>{createdEmployee.email}</p>
              </div>

              <div>
                <p style={{ fontSize: '12px', opacity: 0.8, marginBottom: '5px' }}>Temporary Password</p>
                <p style={{ 
                  fontSize: '16px', 
                  fontWeight: 'bold',
                  
                  background: 'rgba(0,0,0,0.2)',
                  padding: '5px 10px',
                  borderRadius: '4px',
                  display: 'inline-block'
                }}>
                  {createdEmployee.tempPassword}
                </p>
              </div>

              <div>
                <p style={{ fontSize: '12px', opacity: 0.8, marginBottom: '5px' }}>Department</p>
                <p style={{ fontSize: '16px', fontWeight: 'bold' }}>{createdEmployee.department}</p>
              </div>

              <div>
                <p style={{ fontSize: '12px', opacity: 0.8, marginBottom: '5px' }}>Designation</p>
                <p style={{ fontSize: '16px', fontWeight: 'bold' }}>{createdEmployee.designation}</p>
              </div>
            </div>
          </div>

          <button
            onClick={copyCredentials}
            style={{
              background: 'white',
              color: '#667eea',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              transition: 'all 0.3s'
            }}
          >
            {copied ? (
              <>
                <Check size={20} />
                Copied to Clipboard!
              </>
            ) : (
              <>
                <Copy size={20} />
                Copy Credentials
              </>
            )}
          </button>
          
          <p style={{ 
            marginTop: '15px', 
            fontSize: '14px', 
            opacity: 0.9,
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}>
            📧 Share these credentials with the employee via email or WhatsApp
          </p>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div style={{
          background: '#fee',
          color: '#c33',
          padding: '15px 20px',
          borderRadius: '8px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          border: '1px solid #fcc'
        }}>
          <span style={{ fontSize: '20px' }}>⚠️</span>
          {error}
        </div>
      )}

      {/* Create Employee Form */}
      <div className="card">
        <form onSubmit={handleSubmit}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '20px',
            marginBottom: '20px'
          }}>
            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
                placeholder="John Doe"
              />
            </div>

            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
                placeholder="employee@company.com"
              />
            </div>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '20px',
            marginBottom: '20px'
          }}>
            <div className="form-group">
              <label>Temporary Password *</label>
              <input
                type="text"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
                placeholder="TempPass@123"
              />
              <small style={{ color: '#666', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                Employee will change this on first login
              </small>
            </div>

            <div className="form-group">
              <label>Department *</label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({...formData, department: e.target.value})}
                required
              >
                <option value="">Select Department</option>
                <option value="IT">IT</option>
                <option value="HR">HR</option>
                <option value="Sales">Sales</option>
                <option value="Marketing">Marketing</option>
                <option value="Finance">Finance</option>
                <option value="Operations">Operations</option>
              </select>
            </div>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '20px',
            marginBottom: '20px'
          }}>
            <div className="form-group">
              <label>Designation *</label>
              <input
                type="text"
                value={formData.designation}
                onChange={(e) => setFormData({...formData, designation: e.target.value})}
                required
                placeholder="Software Engineer"
              />
            </div>

            <div className="form-group">
              <label>Joining Date *</label>
              <input
                type="date"
                value={formData.joiningDate}
                onChange={(e) => setFormData({...formData, joiningDate: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label>Salary (Optional)</label>
            <input
              type="number"
              value={formData.salary}
              onChange={(e) => setFormData({...formData, salary: e.target.value})}
              placeholder="50000"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '14px',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            {loading ? '⏳ Creating Employee...' : '✨ Create Employee'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateEmployee;