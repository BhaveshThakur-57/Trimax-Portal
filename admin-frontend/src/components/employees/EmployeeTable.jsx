import React from 'react';
import { Eye, Edit, Trash2, Calendar } from 'lucide-react';
import Badge from '../common/Badge';
import { formatDate } from '../../utils/helpers';

const EmployeeTable = ({ employees, onView, onEdit, onDelete, onAttendance }) => {
  return (
    <div className="employee-table-wrapper">
      <table className="employee-table">
        <thead>
          <tr>
            <th>EMPLOYEE</th>
            <th>EMPLOYEE ID</th>
            <th>DESIGNATION</th>
            <th>DEPARTMENT</th>
            <th>WORKING TYPE</th>
            <th>PHONE</th>
            <th>JOIN DATE</th>
            <th>STATUS</th>
            <th>ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          {employees.length === 0 ? (
            <tr>
              <td colSpan="9" className="empty-state">
                No employees found
              </td>
            </tr>
          ) : (
            employees.map((employee) => (
              <tr key={employee._id}>
                <td>
                  <div className="employee-cell">
                    <div className="employee-avatar">
                      {employee.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </div>
                    <div className="employee-info">
                      <span className="employee-name">{employee.name}</span>
                      <span className="employee-email">{employee.email}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="employee-id">{employee.employeeId || 'N/A'}</span>
                </td>
                <td>{employee.designation}</td>
                <td>
                  <span className="department-tag">{employee.department}</span>
                </td>
                <td>
                  <Badge status={employee.workingType === 'Office' ? 'Active' : 'On Leave'}>
                    {employee.workingType || 'Office'}
                  </Badge>
                </td>
                <td>{employee.phone}</td>
                <td>{formatDate(employee.joinDate)}</td>
                <td>
                  <Badge status={employee.status}>{employee.status}</Badge>
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="action-btn view-btn"
                      title="View"
                      onClick={() => onView(employee._id)}
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      className="action-btn attendance-btn"
                      title="Attendance"
                      onClick={() => onAttendance(employee._id)}
                      style={{ color: '#8b5cf6' }}
                    >
                      <Calendar size={18} />
                    </button>
                    <button
                      className="action-btn edit-btn"
                      title="Edit"
                      onClick={() => onEdit(employee._id)}
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      className="action-btn delete-btn"
                      title="Delete"
                      onClick={() => onDelete(employee._id)}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default EmployeeTable;