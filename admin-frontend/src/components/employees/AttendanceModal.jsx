import React, { useState } from 'react';
import { X, Calendar, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const AttendanceModal = ({ employee, attendance, onClose }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  if (!employee) return null;

  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getMonthName = (month) => {
    return new Date(2000, month, 1).toLocaleDateString('en-IN', { month: 'long' });
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
    const firstDay = new Date(selectedYear, selectedMonth, 1).getDay();
    const today = new Date();
    const days = [];

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayAttendance = attendance?.[dateKey];
      const isFuture = new Date(selectedYear, selectedMonth, day) > today;
      const isToday = 
        day === today.getDate() && 
        selectedMonth === today.getMonth() && 
        selectedYear === today.getFullYear();

      let statusClass = '';
      let statusIcon = null;
      let statusText = 'No Data';

      if (isFuture) {
        statusClass = 'future';
        statusText = 'Future';
      } else if (dayAttendance) {
        if (dayAttendance.status === 'full') {
          statusClass = 'present';
          statusIcon = <CheckCircle size={16} />;
          statusText = `Full Day (${dayAttendance.hours}h)`;
        } else if (dayAttendance.status === 'half') {
          statusClass = 'half-day';
          statusIcon = <AlertCircle size={16} />;
          statusText = `Half Day (${dayAttendance.hours}h)`;
        } else {
          statusClass = 'absent';
          statusIcon = <XCircle size={16} />;
          statusText = 'Absent';
        }
      }

      days.push(
        <div 
          key={day} 
          className={`calendar-day ${statusClass} ${isToday ? 'today' : ''}`}
          title={statusText}
        >
          <span className="day-number">{day}</span>
          {statusIcon && <span className="day-icon">{statusIcon}</span>}
        </div>
      );
    }

    return days;
  };

  const calculateStats = () => {
    if (!attendance) return { fullDays: 0, halfDays: 0, absent: 0, totalHours: 0, percentage: 0 };
    
    const monthData = Object.entries(attendance).filter(([dateKey]) => {
      const [year, month] = dateKey.split('-');
      return parseInt(year) === selectedYear && parseInt(month) === selectedMonth + 1;
    });

    const fullDays = monthData.filter(([, data]) => data.status === 'full').length;
    const halfDays = monthData.filter(([, data]) => data.status === 'half').length;
    const absent = monthData.filter(([, data]) => data.status === 'absent').length;
    const totalHours = monthData.reduce((sum, [, data]) => sum + data.hours, 0);
    const workingDays = monthData.length;
    const percentage = workingDays > 0 ? Math.round(((fullDays + halfDays * 0.5) / workingDays) * 100) : 0;

    return { fullDays, halfDays, absent, totalHours, percentage, workingDays };
  };

  const stats = calculateStats();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container attendance-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Attendance Record</h2>
            <p className="employee-name">{employee.name} - {employee.designation}</p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          <div className="attendance-controls">
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="month-select"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={i}>{getMonthName(i)}</option>
              ))}
            </select>
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="year-select"
            >
              {Array.from({ length: 5 }, (_, i) => {
                const year = new Date().getFullYear() - 2 + i;
                return <option key={year} value={year}>{year}</option>;
              })}
            </select>
          </div>

          <div className="attendance-stats">
            <div className="stat-card present-card">
              <CheckCircle size={20} />
              <div>
                <p className="stat-value">{stats.fullDays}</p>
                <p className="stat-label">Full Days</p>
              </div>
            </div>
            <div className="stat-card half-card">
              <AlertCircle size={20} />
              <div>
                <p className="stat-value">{stats.halfDays}</p>
                <p className="stat-label">Half Days</p>
              </div>
            </div>
            <div className="stat-card absent-card">
              <XCircle size={20} />
              <div>
                <p className="stat-value">{stats.absent}</p>
                <p className="stat-label">Absent</p>
              </div>
            </div>
            <div className="stat-card hours-card">
              <Clock size={20} />
              <div>
                <p className="stat-value">{stats.totalHours}h</p>
                <p className="stat-label">Total Hours</p>
              </div>
            </div>
            <div className="stat-card percentage-card">
              <Calendar size={20} />
              <div>
                <p className="stat-value">{stats.percentage}%</p>
                <p className="stat-label">Attendance</p>
              </div>
            </div>
          </div>

          <div className="calendar-container">
            <div className="calendar-header">
              <div>Sun</div>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
            </div>
            <div className="calendar-grid">
              {renderCalendar()}
            </div>
          </div>

          <div className="legend">
            <div className="legend-item">
              <div className="legend-box present"></div>
              <span>Full Day</span>
            </div>
            <div className="legend-item">
              <div className="legend-box half-day"></div>
              <span>Half Day</span>
            </div>
            <div className="legend-item">
              <div className="legend-box absent"></div>
              <span>Absent</span>
            </div>
            <div className="legend-item">
              <div className="legend-box future"></div>
              <span>Future</span>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AttendanceModal;