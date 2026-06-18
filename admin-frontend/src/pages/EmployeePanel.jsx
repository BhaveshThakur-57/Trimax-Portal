import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { FileText, Camera, Clock, Calendar, LogOut } from 'lucide-react';

const EmployeePanel = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('attendance');
  const [attendanceData, setAttendanceData] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState(null);

  // Mark Attendance
  const markAttendance = () => {
    const today = new Date().toLocaleDateString('en-IN');
    
    // Check if already marked today
    if (todayAttendance) {
      alert('Attendance already marked for today!');
      return;
    }

    // Selfie capture karo (camera permission)
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        // Camera open karo
        const video = document.createElement('video');
        video.srcObject = stream;
        video.play();

        // Capture button
        setTimeout(() => {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          canvas.getContext('2d').drawImage(video, 0, 0);
          
          const selfie = canvas.toDataURL('image/jpeg');
          
          // Save attendance
          const newAttendance = {
            date: today,
            time: new Date().toLocaleTimeString('en-IN'),
            selfie: selfie,
            status: 'Present'
          };

          setTodayAttendance(newAttendance);
          setAttendanceData([newAttendance, ...attendanceData]);
          
          // Stop camera
          stream.getTracks().forEach(track => track.stop());
          
          alert('Attendance marked successfully!');
        }, 2000);
      })
      .catch(err => {
        console.error('Camera access denied:', err);
        alert('Please allow camera access to mark attendance');
      });
  };

  return (
    <div className="employee-panel">
      {/* Header */}
      <header className="employee-header">
        <div className="employee-info">
          <div className="employee-avatar">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2>{user?.name}</h2>
            <p className="employee-email">{user?.email}</p>
            <span className="employee-badge">Employee</span>
          </div>
        </div>
        <button className="logout-btn" onClick={logout}>
          <LogOut size={20} />
          Logout
        </button>
      </header>

      {/* Navigation Tabs */}
      <div className="employee-tabs">
        <button 
          className={`tab ${activeTab === 'attendance' ? 'active' : ''}`}
          onClick={() => setActiveTab('attendance')}
        >
          <Clock size={20} />
          Attendance
        </button>
        <button 
          className={`tab ${activeTab === 'offer-letter' ? 'active' : ''}`}
          onClick={() => setActiveTab('offer-letter')}
        >
          <FileText size={20} />
          Offer Letter
        </button>
        <button 
          className={`tab ${activeTab === 'documents' ? 'active' : ''}`}
          onClick={() => setActiveTab('documents')}
        >
          <FileText size={20} />
          My Documents
        </button>
      </div>

      {/* Content */}
      <div className="employee-content">
        {/* Attendance Tab */}
        {activeTab === 'attendance' && (
          <div className="attendance-section">
            <div className="attendance-header">
              <h3>Daily Attendance</h3>
              <button className="mark-attendance-btn" onClick={markAttendance}>
                <Camera size={20} />
                Mark Today's Attendance
              </button>
            </div>

            {/* Today's Status */}
            <div className="today-status">
              {todayAttendance ? (
                <div className="status-card present">
                  <h4>✅ Attendance Marked</h4>
                  <p>Time: {todayAttendance.time}</p>
                  {todayAttendance.selfie && (
                    <img 
                      src={todayAttendance.selfie} 
                      alt="Selfie"
                      className="attendance-selfie"
                    />
                  )}
                </div>
              ) : (
                <div className="status-card pending">
                  <h4>⏳ Not Marked Yet</h4>
                  <p>Please mark your attendance for today</p>
                </div>
              )}
            </div>

            {/* Attendance History */}
            <div className="attendance-history">
              <h4>Attendance History</h4>
              {attendanceData.length === 0 ? (
                <p className="no-data">No attendance records yet</p>
              ) : (
                <table className="attendance-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Status</th>
                      <th>Selfie</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceData.map((record, index) => (
                      <tr key={index}>
                        <td>{record.date}</td>
                        <td>{record.time}</td>
                        <td>
                          <span className="status-badge present">
                            {record.status}
                          </span>
                        </td>
                        <td>
                          {record.selfie && (
                            <img 
                              src={record.selfie} 
                              alt="Selfie"
                              className="table-selfie"
                            />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Offer Letter Tab */}
        {activeTab === 'offer-letter' && (
          <div className="offer-letter-section">
            <div className="offer-letter-card">
              <div className="letter-header">
                <h2>Offer Letter</h2>
                <button className="download-btn">
                  <FileText size={18} />
                  Download PDF
                </button>
              </div>
              
              <div className="letter-content">
                <div className="company-letterhead">
                  <h1>Trimax Solutions</h1>
                  <p>Nagpur, Maharashtra, India</p>
                </div>

                <div className="letter-body">
                  <p className="letter-date">Date: {new Date().toLocaleDateString('en-IN')}</p>
                  
                  <p>Dear <strong>{user?.name}</strong>,</p>
                  
                  <p>We are pleased to offer you the position of <strong>Software Developer</strong> at Trimax Solutions.</p>
                  
                  <h4>Terms of Employment:</h4>
                  <ul>
                    <li>Position: Software Developer</li>
                    <li>Department: IT Department</li>
                    <li>Start Date: As mutually agreed</li>
                    <li>Salary: As per discussion</li>
                    <li>Reporting To: Technical Manager</li>
                  </ul>

                  <p>We look forward to working with you.</p>

                  <div className="letter-signature">
                    <p><strong>Best Regards,</strong></p>
                    <p>HR Department</p>
                    <p>Trimax Solutions</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Documents Tab */}
        {activeTab === 'documents' && (
          <div className="documents-section">
            <h3>My Documents</h3>
            <div className="documents-grid">
              <div className="document-card">
                <FileText size={40} />
                <h4>Offer Letter</h4>
                <button className="view-btn">View</button>
              </div>
              <div className="document-card">
                <FileText size={40} />
                <h4>ID Card</h4>
                <button className="view-btn">View</button>
              </div>
              <div className="document-card">
                <FileText size={40} />
                <h4>Payslips</h4>
                <button className="view-btn">View</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeePanel;