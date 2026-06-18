import React, { useState, useEffect } from 'react';
import { CalendarDays, Calendar, AlertCircle, Award, Plus } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const MyLeaves = () => {
  const [leaveApplications, setLeaveApplications] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState({
    casual: { total: 12, used: 0 },
    sick:   { total: 10, used: 0 },
    earned: { total: 15, used: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [leaveType, setLeaveType] = useState('casual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchMyLeaves();
  }, []);

  const fetchMyLeaves = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/leaves/my`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setLeaveApplications(data.data);

        // Calculate used leaves from approved applications
        const used = { casual: 0, sick: 0, earned: 0 };
        data.data.forEach(leave => {
          if (leave.status === 'Approved') {
            const key = leave.type.split(' ')[0].toLowerCase(); // "Casual Leave" → "casual"
            if (used[key] !== undefined) used[key] += leave.days;
          }
        });
        setLeaveBalance(prev => ({
          casual: { ...prev.casual, used: used.casual },
          sick:   { ...prev.sick,   used: used.sick   },
          earned: { ...prev.earned, used: used.earned  }
        }));
      }
    } catch (error) {
      console.error('Error fetching leaves:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyLeave = async () => {
    if (!startDate || !endDate || !reason) {
      alert('Please fill all fields!');
      return;
    }

    const start = new Date(startDate);
    const end   = new Date(endDate);
    if (end < start) {
      alert('End date cannot be before start date!');
      return;
    }
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    const available = leaveBalance[leaveType].total - leaveBalance[leaveType].used;

    if (days > available) {
      alert(`Not enough ${leaveType} leaves! Available: ${available} days`);
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/leaves`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: leaveType.charAt(0).toUpperCase() + leaveType.slice(1) + ' Leave',
          startDate,
          endDate,
          days,
          reason
        })
      });

      const data = await response.json();

      if (data.success) {
        alert('Leave application submitted successfully! ✅');
        setShowLeaveForm(false);
        setStartDate('');
        setEndDate('');
        setReason('');
        setLeaveType('casual');
        fetchMyLeaves(); // Refresh list
      } else {
        alert('❌ ' + data.message);
      }
    } catch (error) {
      alert('❌ Failed to submit leave application');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-gray-500">Loading leaves...</div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
        <div className="flex items-center gap-5">
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-[20px] bg-gradient-to-br from-brand-600 to-blue-600 flex items-center justify-center text-white shadow-xl shadow-brand-500/20 overflow-hidden group shrink-0">
            <div className="absolute inset-0 bg-white/20 blur-md rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CalendarDays size={30} strokeWidth={2.5} className="relative z-10 drop-shadow-md group-hover:scale-110 transition-transform duration-300" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-[34px] font-black font-display text-transparent bg-clip-text bg-gradient-to-r from-slate-700 via-brand-800 to-brand-600 tracking-tight leading-tight pb-1 mb-0.5">
              Leave Management
            </h1>
            <p className="text-[14px] sm:text-[15px] font-medium text-slate-500">
              Apply and track your leave requests
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowLeaveForm(!showLeaveForm)}
          className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-medium"
        >
          <Plus size={18} />
          Apply Leave
        </button>
      </div>

      {/* Leave Application Form */}
      {showLeaveForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-4 sm:mb-6">Apply for Leave</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Leave Type</label>
              <select
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="casual">Casual Leave</option>
                <option value="sick">Sick Leave</option>
                <option value="earned">Earned Leave</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Available Balance</label>
              <div className="px-4 py-2 bg-green-50 border border-green-200 rounded-lg text-green-700 font-medium">
                {leaveBalance[leaveType].total - leaveBalance[leaveType].used} days remaining
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter reason for leave"
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mt-4 sm:mt-6">
            <button
              onClick={handleApplyLeave}
              disabled={submitting}
              className="flex-1 sm:flex-none px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Application'}
            </button>
            <button
              onClick={() => setShowLeaveForm(false)}
              className="flex-1 sm:flex-none px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Leave Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {/* Casual Leave */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Casual Leave</h3>
            <div className="p-2 bg-blue-100 rounded-lg shrink-0">
              <Calendar className="text-blue-600" size={20} />
            </div>
          </div>
          <div className="text-[36px] font-bold font-display tracking-tight text-blue-600 mb-2">
            {leaveBalance.casual.total - leaveBalance.casual.used}
          </div>
          <p className="text-sm text-gray-600">
            {leaveBalance.casual.used} used of {leaveBalance.casual.total}
          </p>
          <div className="mt-4 bg-gray-100 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${((leaveBalance.casual.total - leaveBalance.casual.used) / leaveBalance.casual.total) * 100}%` }}
            />
          </div>
        </div>

        {/* Sick Leave */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Sick Leave</h3>
            <div className="p-2 bg-red-100 rounded-lg shrink-0">
              <AlertCircle className="text-red-600" size={20} />
            </div>
          </div>
          <div className="text-[36px] font-bold font-display tracking-tight text-red-600 mb-2">
            {leaveBalance.sick.total - leaveBalance.sick.used}
          </div>
          <p className="text-sm text-gray-600">
            {leaveBalance.sick.used} used of {leaveBalance.sick.total}
          </p>
          <div className="mt-4 bg-gray-100 rounded-full h-2">
            <div
              className="bg-red-500 h-2 rounded-full transition-all"
              style={{ width: `${((leaveBalance.sick.total - leaveBalance.sick.used) / leaveBalance.sick.total) * 100}%` }}
            />
          </div>
        </div>

        {/* Earned Leave */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Earned Leave</h3>
            <div className="p-2 bg-green-100 rounded-lg shrink-0">
              <Award className="text-green-600" size={20} />
            </div>
          </div>
          <div className="text-[36px] font-bold font-display tracking-tight text-green-600 mb-2">
            {leaveBalance.earned.total - leaveBalance.earned.used}
          </div>
          <p className="text-sm text-gray-600">
            {leaveBalance.earned.used} used of {leaveBalance.earned.total}
          </p>
          <div className="mt-4 bg-gray-100 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all"
              style={{ width: `${((leaveBalance.earned.total - leaveBalance.earned.used) / leaveBalance.earned.total) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Leave History */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-100">
          <h2 className="text-base sm:text-lg font-semibold text-gray-800">Leave History</h2>
        </div>

        {/* Mobile Cards View */}
        <div className="sm:hidden divide-y divide-gray-100">
          {leaveApplications.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-400">
              No leave applications yet
            </div>
          ) : (
            leaveApplications.map(leave => (
              <div key={leave._id} className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-900">{leave.type}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    leave.status === 'Approved'
                      ? 'bg-green-100 text-green-800'
                      : leave.status === 'Pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {leave.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>{new Date(leave.startDate).toLocaleDateString()} – {new Date(leave.endDate).toLocaleDateString()}</span>
                  <span className="font-medium text-gray-700">{leave.days} days</span>
                </div>
                <p className="text-xs text-gray-600">{leave.reason}</p>
                <p className="text-xs text-gray-400">Applied: {new Date(leave.appliedOn).toLocaleDateString()}</p>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applied On</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leaveApplications.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-400">
                    No leave applications yet
                  </td>
                </tr>
              ) : (
                leaveApplications.map(leave => (
                  <tr key={leave._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{leave.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(leave.startDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(leave.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{leave.days} days</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{leave.reason}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        leave.status === 'Approved'
                          ? 'bg-green-100 text-green-800'
                          : leave.status === 'Pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {leave.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(leave.appliedOn).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MyLeaves;