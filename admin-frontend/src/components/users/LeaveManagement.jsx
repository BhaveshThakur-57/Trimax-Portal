import React, { useState, useEffect } from 'react';
import { Search, CheckCircle, X, Clock, AlertCircle, CalendarDays } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// ── Config ──
const STATUS_CFG = {
  Pending: { bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock, grad: 'from-amber-500 to-orange-400', cardBg: 'bg-amber-50', border: 'border-amber-100', val: 'text-amber-600' },
  Approved: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle, grad: 'from-emerald-500 to-teal-500', cardBg: 'bg-emerald-50', border: 'border-emerald-100', val: 'text-emerald-600' },
  Rejected: { bg: 'bg-red-100', text: 'text-red-700', icon: X, grad: 'from-red-500 to-rose-500', cardBg: 'bg-red-50', border: 'border-red-100', val: 'text-red-600' },
};

const TYPE_CFG = {
  'Casual Leave': { bg: 'bg-blue-100', text: 'text-blue-700' },
  'Sick Leave': { bg: 'bg-rose-100', text: 'text-rose-700' },
  'Earned Leave': { bg: 'bg-emerald-100', text: 'text-emerald-700' },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CFG[status] || { bg: 'bg-slate-100', text: 'text-slate-600', icon: AlertCircle };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
      <Icon size={11} strokeWidth={2.5} /> {status}
    </span>
  );
};

const TypeBadge = ({ type }) => {
  const cfg = TYPE_CFG[type] || { bg: 'bg-slate-100', text: 'text-slate-600' };
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
      {type}
    </span>
  );
};

const fmt = d => new Date(d).toLocaleDateString('en-IN');

const LeaveManagement = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => { fetchLeaves(); }, []);

  const fetchLeaves = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/leaves/all`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setLeaves(data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleStatusUpdate = async (leaveId, newStatus) => {
    const action = newStatus === 'Approved' ? 'approve' : 'reject';
    if (!window.confirm(`Are you sure you want to ${action} this leave?`)) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/leaves/${leaveId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) fetchLeaves();
      else alert('❌ ' + data.message);
    } catch { alert('❌ Failed to update leave status'); }
  };

  const filteredLeaves = leaves.filter(leave => {
    const name = (leave.employee?.name || '').toLowerCase();
    const empId = (leave.employee?.employeeId || '').toLowerCase();
    const term = searchTerm.toLowerCase();
    const matchSearch = name.includes(term) || empId.includes(term);
    const matchStatus = statusFilter === 'all' || leave.status === statusFilter;
    const matchType = typeFilter === 'all' || leave.type === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  // ── Loading skeleton ──
  if (loading) return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-slate-100 rounded-2xl w-52" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-slate-100 rounded-2xl" />)}
        </div>
        <div className="h-64 bg-slate-100 rounded-2xl" />
      </div>
    </div>
  );

  const STAT_CARDS = [
    { label: 'Total Requests', value: leaves.length, grad: 'from-brand-500 to-brand-600', ring: 'ring-brand-100' },
    { label: 'Pending', value: leaves.filter(l => l.status === 'Pending').length, grad: 'from-amber-500 to-orange-400', ring: 'ring-amber-100' },
    { label: 'Approved', value: leaves.filter(l => l.status === 'Approved').length, grad: 'from-emerald-500 to-teal-500', ring: 'ring-emerald-100' },
    { label: 'Rejected', value: leaves.filter(l => l.status === 'Rejected').length, grad: 'from-red-500 to-rose-500', ring: 'ring-red-100' },
  ];

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">

      {/* ── Header ── */}
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
              Review and manage employee leave requests
            </p>
          </div>
        </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map(({ label, value, grad, ring }) => (
          <div
            key={label}
            className="group relative bg-white rounded-2xl border border-slate-100 p-6 overflow-hidden cursor-default shadow-[0_1px_4px_rgba(0,0,0,0.04)] transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-[0_16px_32px_rgba(0,0,0,0.08)] hover:border-slate-200"
          >
            <div className="relative z-10">
              <div className="mb-5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white bg-gradient-to-br ${grad} shadow-lg ring-4 ${ring} transition-transform duration-300 group-hover:scale-110`}>
                  <CalendarDays size={22} strokeWidth={2} />
                </div>
              </div>
              <div className="text-[32px] font-bold text-slate-800 leading-none mb-1.5 tracking-tight">{value}</div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">{label}</p>
            </div>
            <div className={`absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r ${grad} scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left rounded-b-2xl`} />
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="bg-gradient-to-r from-brand-600 to-blue-600 rounded-[24px] p-5 shadow-lg shadow-brand-500/30 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex items-center gap-3 flex-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-[16px] px-4 py-3 h-12 focus-within:ring-4 focus-within:ring-white/30 transition-all duration-300 group">
            <Search size={18} className="text-white/70 group-focus-within:text-white flex-shrink-0" />
            <input
              type="text" placeholder="Search by employee name or ID..."
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent text-sm text-white font-medium placeholder:text-white/60"
              style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="text-white/70 hover:text-white transition-colors">
                <X size={16} />
              </button>
            )}
          </div>
          {/* Status */}
          <div className="relative group min-w-[160px]">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full h-12 px-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-[16px] text-sm font-semibold text-white outline-none focus:ring-4 focus:ring-white/30 transition-all duration-300 cursor-pointer appearance-none [&>option]:text-slate-800">
              <option value="all">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-white/70 group-focus-within:text-white">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
          {/* Type */}
          <div className="relative group min-w-[160px]">
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="w-full h-12 px-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-[16px] text-sm font-semibold text-white outline-none focus:ring-4 focus:ring-white/30 transition-all duration-300 cursor-pointer appearance-none [&>option]:text-slate-800">
              <option value="all">All Types</option>
              <option value="Casual Leave">Casual Leave</option>
              <option value="Sick Leave">Sick Leave</option>
              <option value="Earned Leave">Earned Leave</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-white/70 group-focus-within:text-white">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
        </div>
        <div className="relative z-10 flex items-center gap-2 mt-4 text-[12px] text-white/80">
          <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
          <p>
            Showing <span className="font-semibold text-white">{filteredLeaves.length}</span> of <span className="font-semibold text-white">{leaves.length}</span> requests
          </p>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white border border-slate-200/60 shadow-xl shadow-slate-200/40 rounded-[24px] overflow-hidden">

        {/* Desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-brand-600 to-blue-600 border-b border-white/20 shadow-lg shadow-brand-500/20">
              <tr>
                {['Employee', 'Leave Type', 'Start Date', 'End Date', 'Days', 'Reason', 'Applied On', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-6 py-4 text-[12px] font-extrabold text-white uppercase tracking-widest">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeaves.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-16">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <CalendarDays size={32} strokeWidth={1.5} />
                      <p className="text-sm font-medium">No leave requests found</p>
                    </div>
                  </td>
                </tr>
              ) : filteredLeaves.map(leave => (
                <tr key={leave._id} className="hover:bg-slate-50/70 transition-colors group">
                  {/* Employee */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0 shadow-sm">
                        {(leave.employee?.name || '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 text-[13px]">{leave.employee?.name || 'Unknown'}</p>
                        <p className="text-[11px] text-slate-400">{leave.employee?.employeeId}</p>
                      </div>
                    </div>
                  </td>
                  {/* Type */}
                  <td className="px-5 py-3.5"><TypeBadge type={leave.type} /></td>
                  {/* Dates */}
                  <td className="px-5 py-3.5 text-[13px] text-slate-600 font-medium">{fmt(leave.startDate)}</td>
                  <td className="px-5 py-3.5 text-[13px] text-slate-600 font-medium">{fmt(leave.endDate)}</td>
                  {/* Days */}
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-brand-50 text-brand-700 font-bold text-sm">
                      {leave.days}
                    </span>
                  </td>
                  {/* Reason */}
                  <td className="px-5 py-3.5 max-w-[160px]">
                    <p className="text-[12px] text-slate-500 truncate" title={leave.reason}>{leave.reason}</p>
                  </td>
                  {/* Applied On */}
                  <td className="px-5 py-3.5 text-[12px] text-slate-400">{fmt(leave.appliedOn)}</td>
                  {/* Status */}
                  <td className="px-5 py-3.5"><StatusBadge status={leave.status} /></td>
                  {/* Actions */}
                  <td className="px-5 py-3.5">
                    {leave.status === 'Pending' ? (
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleStatusUpdate(leave._id, 'Approved')}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold hover:bg-emerald-100 transition-colors"
                        >
                          <CheckCircle size={12} /> Approve
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(leave._id, 'Rejected')}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200 text-xs font-semibold hover:bg-red-100 transition-colors"
                        >
                          <X size={12} /> Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-slate-300 text-sm">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="flex flex-col divide-y divide-slate-100 md:hidden">
          {filteredLeaves.length === 0 ? (
            <div className="flex flex-col items-center gap-2 text-slate-400 py-16">
              <CalendarDays size={32} strokeWidth={1.5} />
              <p className="text-sm font-medium">No leave requests found</p>
            </div>
          ) : filteredLeaves.map(leave => (
            <div key={leave._id} className="p-4 space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {(leave.employee?.name || '?').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{leave.employee?.name || 'Unknown'}</p>
                    <p className="text-xs text-slate-400">{leave.employee?.employeeId}</p>
                  </div>
                </div>
                <StatusBadge status={leave.status} />
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                <TypeBadge type={leave.type} />
                <span className="bg-brand-50 text-brand-700 px-2.5 py-1 rounded-full text-xs font-semibold">
                  {leave.days} day{leave.days !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Detail grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { label: 'Start Date', value: fmt(leave.startDate) },
                  { label: 'End Date', value: fmt(leave.endDate) },
                  { label: 'Applied On', value: fmt(leave.appliedOn) },
                  { label: 'Reason', value: leave.reason },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-slate-50 rounded-2xl p-2.5">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide mb-1">{label}</p>
                    <p className="text-slate-700 font-medium truncate">{value}</p>
                  </div>
                ))}
              </div>

              {/* Actions */}
              {leave.status === 'Pending' && (
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => handleStatusUpdate(leave._id, 'Approved')}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 py-2.5 rounded-2xl text-xs font-semibold hover:bg-emerald-100 transition-colors"
                  >
                    <CheckCircle size={13} /> Approve
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(leave._id, 'Rejected')}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-red-50 text-red-600 border border-red-200 py-2.5 rounded-2xl text-xs font-semibold hover:bg-red-100 transition-colors"
                  >
                    <X size={13} /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LeaveManagement;