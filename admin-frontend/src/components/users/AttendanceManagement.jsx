import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Calendar, Search, CheckCircle, XCircle, Clock,
  AlertCircle, X, ChevronLeft, ChevronRight, Trash2, Plus
} from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const pad = n => String(n).padStart(2, '0');
const fmtKey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const timeStrToMinutes = (t) => {
  if (!t || t === '-' || t === '--') return null;
  const ap = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (ap) {
    let [, h, m, p] = ap; h = parseInt(h); m = parseInt(m);
    if (p.toUpperCase() === 'PM' && h !== 12) h += 12;
    if (p.toUpperCase() === 'AM' && h === 12) h = 0;
    return h * 60 + m;
  }
  const pl = t.match(/^(\d{1,2}):(\d{2})$/);
  if (pl) return parseInt(pl[1]) * 60 + parseInt(pl[2]);
  return null;
};
const isLateLogin = (ci) => { const m = timeStrToMinutes(ci); return m !== null && m >= 11 * 60; };

const STATUS_CFG = {
  Present: { bg: 'bg-emerald-100', text: 'text-emerald-700', grad: 'from-emerald-500 to-teal-500', icon: CheckCircle },
  LoggedIn: { bg: 'bg-amber-100', text: 'text-amber-700', grad: 'from-amber-500 to-orange-400', icon: Clock },
  Absent: { bg: 'bg-red-100', text: 'text-red-700', grad: 'from-red-500 to-rose-500', icon: XCircle },
  'Half Day': { bg: 'bg-yellow-100', text: 'text-yellow-700', grad: 'from-yellow-500 to-amber-400', icon: Clock },
  Leave: { bg: 'bg-blue-100', text: 'text-blue-700', grad: 'from-blue-500 to-brand-500', icon: AlertCircle },
};
const getStatusCfg = s => STATUS_CFG[s] || { bg: 'bg-slate-100', text: 'text-slate-600', grad: 'from-slate-400 to-slate-500', icon: Clock };

const inp = "w-full border-2 border-slate-200 rounded-2xl px-3.5 py-2.5 text-sm text-slate-700 bg-white outline-none focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 transition-all placeholder:text-slate-300 font-medium";

/* ── StatusBadge ── */
const StatusBadge = ({ status, checkIn }) => {
  const cfg = getStatusCfg(status);
  const Icon = cfg.icon;
  const late = (status === 'LoggedIn' || status === 'Present') && isLateLogin(checkIn);
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${cfg.bg} ${cfg.text}`}>
      <Icon size={11} strokeWidth={2.5} />
      {status === 'LoggedIn' ? 'Logged In' : status}
      {late && (
        <span className="ml-0.5 bg-orange-200 text-orange-800 text-[9px] px-1.5 py-0.5 rounded-full font-bold">
          Late
        </span>
      )}
    </span>
  );
};

/* ── Avatar ── */
const Avatar = ({ name, size = 'md' }) => {
  const sz = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-9 h-9 text-sm';
  return (
    <div className={`${sz} rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white font-extrabold flex-shrink-0 shadow-sm`}>
      {(name || '?').charAt(0).toUpperCase()}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════ */
const AttendanceManagement = () => {
  const [attendance, setAttendance] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalAnim, setModalAnim] = useState(false);
  const [modalMode, setModalMode] = useState('single');
  const [formData, setFormData] = useState({ employeeId: '', date: '', status: 'Present', checkIn: '10:00', checkOut: '18:00', remarks: '' });

  const today = new Date();
  const todayStr = fmtKey(today);

  const [bulkEmp, setBulkEmp] = useState('');
  const [bulkStatus, setBulkStatus] = useState('Present');
  const [bulkCheckIn, setBulkCheckIn] = useState('10:00');
  const [bulkCheckOut, setBulkCheckOut] = useState('18:00');
  const [bulkRemarks, setBulkRemarks] = useState('');
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  useEffect(() => { fetchAttendance(); fetchEmployees(); }, []);

  /* modal animation */
  useEffect(() => {
    if (showModal) requestAnimationFrame(() => setModalAnim(true));
    else setModalAnim(false);
  }, [showModal]);

  const openModal = (mode) => { setModalMode(mode); setShowModal(true); };
  const closeModal = () => {
    setModalAnim(false);
    setTimeout(() => {
      setShowModal(false); setSelected(new Set());
      setBulkEmp(''); setBulkStatus('Present'); setBulkCheckIn('10:00'); setBulkCheckOut('18:00'); setBulkRemarks('');
      setFormData({ employeeId: '', date: '', status: 'Present', checkIn: '10:00', checkOut: '18:00', remarks: '' });
    }, 260);
  };

  const fetchAttendance = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/attendance/all`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setAttendance(data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/users`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setEmployees(data.data.filter(u => u.role !== 'admin'));
    } catch (e) { console.error(e); }
  };

  const handleSingleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.employeeId || !formData.date || !formData.status) return alert('Please fill all required fields!');
    const sel = new Date(formData.date + 'T00:00:00');
    const tod = new Date(); tod.setHours(0, 0, 0, 0);
    if (sel > tod) return alert('❌ Cannot mark attendance for future dates!');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/attendance/mark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) { alert('✅ Attendance marked!'); closeModal(); fetchAttendance(); }
      else alert('❌ ' + data.message);
    } catch { alert('❌ Failed'); }
  };

  const handleBulkSubmit = async () => {
    if (!bulkEmp) return alert('Please select an employee!');
    if (selected.size === 0) return alert('Please select at least one date!');
    setBulkLoading(true);
    const token = localStorage.getItem('token');
    const dates = [...selected].sort();
    let success = 0, failed = 0, skipped = 0;
    for (const date of dates) {
      try {
        const res = await fetch(`${API_URL}/api/attendance/mark`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ employeeId: bulkEmp, date, status: bulkStatus, checkIn: bulkCheckIn, checkOut: bulkCheckOut, remarks: bulkRemarks }),
        });
        const data = await res.json();
        if (data.success) success++;
        else if (data.alreadyMarked) skipped++;
        else failed++;
      } catch { failed++; }
    }
    setBulkLoading(false);
    alert(`✅ Done!\nMarked: ${success}\nSkipped: ${skipped}\nFailed: ${failed}`);
    closeModal(); fetchAttendance();
  };

  const calDays = () => ({
    firstDay: new Date(calYear, calMonth, 1).getDay(),
    daysInMon: new Date(calYear, calMonth + 1, 0).getDate(),
  });

  const toggleDate = (ds) => {
    const d = new Date(ds + 'T00:00:00');
    const t = new Date(); t.setHours(0, 0, 0, 0);
    if (d > t) return;
    setSelected(prev => { const n = new Set(prev); n.has(ds) ? n.delete(ds) : n.add(ds); return n; });
  };

  const toggleAllWorkingDays = () => {
    const { daysInMon } = calDays();
    const t = new Date(); t.setHours(0, 0, 0, 0);
    const wds = [];
    for (let d = 1; d <= daysInMon; d++) {
      const date = new Date(calYear, calMonth, d);
      if (date.getDay() !== 0 && date.getDay() !== 6 && date <= t) wds.push(fmtKey(date));
    }
    const allSel = wds.every(ds => selected.has(ds));
    setSelected(prev => { const n = new Set(prev); allSel ? wds.forEach(ds => n.delete(ds)) : wds.forEach(ds => n.add(ds)); return n; });
  };

  const prevMonth = () => { if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); } else setCalMonth(m => m - 1); };
  const nextMonth = () => {
    const t = new Date();
    if (calYear > t.getFullYear() || (calYear === t.getFullYear() && calMonth >= t.getMonth())) return;
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); } else setCalMonth(m => m + 1);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this record?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/attendance/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) fetchAttendance();
    } catch { alert('❌ Failed'); }
  };

  const filteredAttendance = attendance.filter(r => {
    const matchName = (r.employee?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.employee?.employeeId || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchDate = !dateFilter || String(r.date).slice(0, 10) === dateFilter;
    return matchName && matchDate;
  });

  /* stats */
  const todayAtt = attendance.filter(a => String(a.date).slice(0, 10) === todayStr);
  const loggedIn = todayAtt.filter(a => a.status === 'LoggedIn').length;
  const halfDay = todayAtt.filter(a => a.status === 'Half Day' || (a.status === 'LoggedIn' && isLateLogin(a.checkIn))).length;
  const onLeave = todayAtt.filter(a => a.status === 'Leave').length;
  const presentIds = new Set(todayAtt.filter(a => a.status !== 'Absent').map(a => a.employee?._id || a.employeeId));
  const explicitAbs = todayAtt.filter(a => a.status === 'Absent').length;
  const isStarted = new Date().getHours() >= 9;
  const noRecordAbs = isStarted ? employees.filter(e => !presentIds.has(e._id) && !todayAtt.find(a => (a.employee?._id || a.employeeId) === e._id)).length : 0;
  const absent = explicitAbs + noRecordAbs;

  const statCards = [
    { label: 'Logged In', value: loggedIn, grad: 'from-amber-400 to-orange-500', ring: 'ring-amber-100' },
    { label: 'Absent', value: absent, grad: 'from-red-500 to-rose-500', ring: 'ring-red-100' },
    { label: 'Half Day', value: halfDay, grad: 'from-yellow-400 to-amber-500', ring: 'ring-yellow-100' },
    { label: 'On Leave', value: onLeave, grad: 'from-blue-500 to-brand-500', ring: 'ring-blue-100' },
  ];

  if (loading) return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-slate-100 rounded-2xl w-64" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-slate-100 rounded-2xl" />)}
        </div>
        <div className="h-96 bg-slate-100 rounded-2xl" />
      </div>
    </div>
  );

  const { firstDay, daysInMon } = calDays();
  const monthName = new Date(calYear, calMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-5">
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-[20px] bg-gradient-to-br from-brand-600 to-blue-600 flex items-center justify-center text-white shadow-xl shadow-brand-500/20 overflow-hidden group shrink-0">
            <div className="absolute inset-0 bg-white/20 blur-md rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <Calendar size={30} strokeWidth={2.5} className="relative z-10 drop-shadow-md group-hover:scale-110 transition-transform duration-300" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-[34px] font-black font-display text-transparent bg-clip-text bg-gradient-to-r from-slate-700 via-brand-800 to-brand-600 tracking-tight leading-tight pb-1 mb-0.5">
              Attendance Management
            </h1>
            <p className="text-[14px] sm:text-[15px] font-medium text-slate-500">
              Mark and track employee attendance
            </p>
          </div>
        </div>
        <div className="flex gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => openModal('single')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border-2 border-slate-200 bg-white text-slate-700 text-sm font-bold hover:bg-slate-50 hover:border-brand-300 active:scale-95 transition-all duration-200 shadow-sm"
          >
            <Calendar size={15} /> Mark Single
          </button>
          <button
            onClick={() => openModal('bulk')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl btn-primary"
          >
            <Plus size={15} strokeWidth={2.5} /> Bulk Mark
          </button>
        </div>
      </div>

      {/* ── Today's Stats ── */}
      <div>
        <p className="text-[12px] text-slate-400 font-semibold mb-3 flex items-center gap-1.5">
          <Calendar size={13} className="text-brand-400" />
          Today — {today.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(({ label, value, grad, ring }) => (
            <div key={label} className="
      group relative bg-white rounded-2xl border border-slate-100
      p-6 cursor-pointer overflow-hidden
      shadow-[0_1px_4px_rgba(0,0,0,0.04)]
      transition-all duration-300 ease-out
      hover:-translate-y-1.5 hover:shadow-[0_16px_32px_rgba(0,0,0,0.08)]
      hover:border-slate-200
    ">
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-5">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white flex-shrink-0 bg-gradient-to-br ${grad} shadow-lg ring-4 ${ring} transition-transform duration-300 group-hover:scale-110`}>
                    <Calendar size={22} strokeWidth={2} />
                  </div>
                </div>
                <div className="text-[32px] font-bold text-slate-800 leading-none mb-1.5 tracking-tight">{value}</div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-1">{label} Today</p>
              </div>
              <div className={`absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r ${grad} scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left rounded-b-2xl`} />
            </div>
          ))}
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="bg-gradient-to-r from-brand-600 to-blue-600 rounded-[24px] p-5 shadow-lg shadow-brand-500/30 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-3 flex-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-[16px] px-4 py-3 h-12 focus-within:ring-4 focus-within:ring-white/30 transition-all duration-300 group">
            <Search size={18} className="text-white/70 group-focus-within:text-white flex-shrink-0" />
            <input
              type="text" placeholder="Search employees..."
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
          <div className="flex gap-2">
            <input
              type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)}
              className="h-12 px-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-[16px] text-sm font-semibold text-white outline-none focus:ring-4 focus:ring-white/30 transition-all duration-300 cursor-pointer min-w-[160px] appearance-none"
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                className="h-12 px-5 rounded-[16px] border border-white/20 bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-all active:scale-95 font-bold text-sm"
              >
                Clear
              </button>
            )}
          </div>
        </div>
        
        <div className="relative z-10 flex items-center gap-2 mt-4 text-[12px] text-white/80">
          <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
          <p>
            Showing <span className="font-semibold text-white">{filteredAttendance.length}</span> records
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
                {['Employee', 'Date', 'Status', 'Check In', 'Check Out', 'Remarks', 'Actions'].map(h => (
                  <th key={h} className="text-left px-6 py-4 text-[12px] font-extrabold text-white uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAttendance.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center">
                        <Calendar size={24} className="text-slate-300" />
                      </div>
                      <p className="text-sm font-semibold">No attendance records found</p>
                    </div>
                  </td>
                </tr>
              ) : filteredAttendance.map(record => (
                <tr key={record._id} className="hover:bg-brand-50/40 transition-colors group">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar name={record.employee?.name} size="sm" />
                      <div>
                        <p className="font-bold text-slate-800 text-[13px]">{record.employee?.name}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{record.employee?.employeeId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-[13px] text-slate-600 font-semibold">{String(record.date).slice(0, 10)}</td>
                  <td className="px-5 py-3.5"><StatusBadge status={record.status} checkIn={record.checkIn} /></td>
                  <td className="px-5 py-3.5 text-[13px] text-slate-600 font-medium">{record.checkIn || '—'}</td>
                  <td className="px-5 py-3.5 text-[13px] text-slate-600 font-medium">{record.checkOut || '—'}</td>
                  <td className="px-5 py-3.5 text-[12px] text-slate-400 max-w-[180px] truncate">{record.remarks || '—'}</td>
                  <td className="px-5 py-3.5">
                    {/* Always visible delete */}
                    <button
                      onClick={() => handleDelete(record._id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-red-50 text-red-500 border border-red-100 text-xs font-bold hover:bg-red-100 hover:text-red-700 active:scale-95 transition-all duration-200"
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="flex flex-col divide-y divide-slate-100 md:hidden">
          {filteredAttendance.length === 0 ? (
            <div className="flex flex-col items-center gap-3 text-slate-400 py-16">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center">
                <Calendar size={24} className="text-slate-300" />
              </div>
              <p className="text-sm font-semibold">No records found</p>
            </div>
          ) : filteredAttendance.map(record => (
            <div key={record._id} className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar name={record.employee?.name} />
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{record.employee?.name}</p>
                    <p className="text-xs text-slate-400 font-mono">{record.employee?.employeeId}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(record._id)}
                  className="w-8 h-8 flex items-center justify-center rounded-2xl bg-red-50 text-red-500 hover:bg-red-100 active:scale-95 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { label: 'Date', value: String(record.date).slice(0, 10) },
                  { label: 'Check In', value: record.checkIn || '—' },
                  { label: 'Check Out', value: record.checkOut || '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-slate-50 rounded-2xl p-2.5">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-1">{label}</p>
                    <p className="text-slate-700 font-semibold">{value}</p>
                  </div>
                ))}
                <div className="bg-slate-50 rounded-2xl p-2.5">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-1">Status</p>
                  <StatusBadge status={record.status} checkIn={record.checkIn} />
                </div>
                {record.remarks && (
                  <div className="bg-slate-50 rounded-2xl p-2.5 col-span-2">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-1">Remarks</p>
                    <p className="text-slate-700 text-xs">{record.remarks}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════ MODAL ══════════════════════════ */}
      {showModal && createPortal(
        <div
          className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto transition-all duration-260 ${modalAnim ? 'bg-black/50 backdrop-blur-sm' : 'bg-black/0'}`}
          onClick={closeModal}
        >
          <div
            className={`bg-white rounded-3xl w-full shadow-2xl my-auto flex flex-col transition-all duration-260 ease-out ${modalMode === 'bulk' ? 'max-w-2xl' : 'max-w-[500px]'} ${modalAnim ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'}`}
            onClick={e => e.stopPropagation()}
          >
            {/* Gradient Header */}
            <div className="relative flex-shrink-0 bg-gradient-to-r from-brand-600 to-blue-600 rounded-t-3xl px-5 py-3 overflow-hidden">
              <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10 blur-xl pointer-events-none" />
              <div className="relative flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Calendar size={15} className="text-brand-600" />
                  </div>
                  <div>
                    <h2 className="text-white font-extrabold text-[15px] leading-tight">
                      {modalMode === 'bulk' ? 'Bulk Mark Attendance' : 'Mark Attendance'}
                    </h2>
                    <p className="text-white/65 text-[11px]">
                      {modalMode === 'bulk' ? 'Select multiple dates for same employee' : 'Mark attendance for single date'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Mode toggle */}
                  <div className="flex bg-white/20 rounded-2xl p-1 gap-1">
                    {['single', 'bulk'].map(mode => (
                      <button
                        key={mode}
                        onClick={() => setModalMode(mode)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${modalMode === mode
                          ? 'bg-white text-brand-700 shadow-sm'
                          : 'text-white/70 hover:text-white'
                          }`}
                      >
                        {mode === 'single' ? 'Single' : 'Bulk'}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={closeModal}
                    className="w-8 h-8 flex items-center justify-center rounded-2xl bg-white/20 hover:bg-white/35 text-white transition-all duration-200 hover:rotate-90"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">

              {/* ── SINGLE MODE ── */}
              {modalMode === 'single' && (
                <form onSubmit={handleSingleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      {
                        label: 'Employee *', content: (
                          <select value={formData.employeeId} required
                            onChange={e => setFormData({ ...formData, employeeId: e.target.value })} className={inp}>
                            <option value="">Choose Employee</option>
                            {employees.map(emp => <option key={emp._id} value={emp._id}>{emp.name} ({emp.employeeId})</option>)}
                          </select>
                        )
                      },
                      {
                        label: 'Date *', content: (
                          <input type="date" value={formData.date} max={todayStr} required
                            onChange={e => setFormData({ ...formData, date: e.target.value })} className={inp} />
                        )
                      },
                      {
                        label: 'Status *', content: (
                          <select value={formData.status} required
                            onChange={e => setFormData({ ...formData, status: e.target.value })} className={inp}>
                            <option>Present</option><option>Absent</option><option>Half Day</option><option>Leave</option>
                          </select>
                        )
                      },
                      {
                        label: 'Check In', content: (
                          <input type="time" value={formData.checkIn}
                            onChange={e => setFormData({ ...formData, checkIn: e.target.value })} className={inp} />
                        )
                      },
                      {
                        label: 'Check Out', content: (
                          <input type="time" value={formData.checkOut}
                            onChange={e => setFormData({ ...formData, checkOut: e.target.value })} className={inp} />
                        )
                      },
                    ].map(({ label, content }) => (
                      <div key={label}>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">{label}</label>
                        {content}
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Remarks</label>
                    <textarea value={formData.remarks} rows={2} placeholder="Optional notes..."
                      onChange={e => setFormData({ ...formData, remarks: e.target.value })}
                      className={`${inp} resize-none`} />
                  </div>
                  {/* Footer */}
                  <div className="flex justify-end gap-3 pt-1">
                    <button type="button" onClick={closeModal}
                      className="px-4 py-2 rounded-2xl border-2 border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 active:scale-95 transition-all">
                      Cancel
                    </button>
                    <button type="submit"
                      className="flex items-center gap-2 px-5 py-2 rounded-2xl btn-primary">
                      <CheckCircle size={14} /> Mark Attendance
                    </button>
                  </div>
                </form>
              )}

              {/* ── BULK MODE ── */}
              {modalMode === 'bulk' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      {
                        label: 'Employee *', content: (
                          <select value={bulkEmp} onChange={e => setBulkEmp(e.target.value)} className={inp}>
                            <option value="">Choose Employee</option>
                            {employees.map(emp => <option key={emp._id} value={emp._id}>{emp.name} ({emp.employeeId})</option>)}
                          </select>
                        )
                      },
                      {
                        label: 'Status *', content: (
                          <select value={bulkStatus} onChange={e => setBulkStatus(e.target.value)} className={inp}>
                            <option>Present</option><option>Absent</option><option>Half Day</option><option>Leave</option>
                          </select>
                        )
                      },
                      {
                        label: 'Check In', content: (
                          <input type="time" value={bulkCheckIn} onChange={e => setBulkCheckIn(e.target.value)} className={inp} />
                        )
                      },
                      {
                        label: 'Check Out', content: (
                          <input type="time" value={bulkCheckOut} onChange={e => setBulkCheckOut(e.target.value)} className={inp} />
                        )
                      },
                    ].map(({ label, content }) => (
                      <div key={label}>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">{label}</label>
                        {content}
                      </div>
                    ))}
                  </div>

                  {/* Calendar */}
                  <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                    {/* Nav */}
                    <div className="flex items-center justify-between px-3 py-1.5 bg-slate-50 border-b border-slate-100">
                      <button onClick={prevMonth}
                        className="w-7 h-7 flex items-center justify-center rounded-xl hover:bg-brand-100 hover:text-brand-600 text-slate-600 transition-all active:scale-95">
                        <ChevronLeft size={16} />
                      </button>
                      <span className="font-bold text-slate-800 text-[13px]">{monthName}</span>
                      <button onClick={nextMonth}
                        className="w-7 h-7 flex items-center justify-center rounded-xl hover:bg-brand-100 hover:text-brand-600 text-slate-600 transition-all active:scale-95">
                        <ChevronRight size={16} />
                      </button>
                    </div>
                    {/* Day labels */}
                    <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-100">
                      {DAYS.map(d => (
                        <div key={d} className={`text-center py-1.5 text-[10px] font-bold ${d === 'Sun' || d === 'Sat' ? 'text-red-400' : 'text-slate-500'}`}>
                          {d}
                        </div>
                      ))}
                    </div>
                    {/* Date cells */}
                    <div className="grid grid-cols-7 gap-0.5 p-1 bg-white">
                      {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
                      {Array.from({ length: daysInMon }).map((_, i) => {
                        const dayNum = i + 1;
                        const date = new Date(calYear, calMonth, dayNum);
                        const dow = date.getDay();
                        const ds = fmtKey(date);
                        const isWeekend = dow === 0 || dow === 6;
                        const isFuture = ds > todayStr;
                        const isSel = selected.has(ds);
                        const isToday = ds === todayStr;
                        return (
                          <button
                            key={ds}
                            onClick={() => toggleDate(ds)}
                            disabled={isWeekend || isFuture}
                            className={`
                              relative rounded-xl py-1.5 text-center text-[11px] font-semibold transition-all duration-150
                              ${isSel ? 'bg-brand-600 text-white shadow-sm scale-95 font-bold' : ''}
                              ${!isSel && isWeekend ? 'bg-red-50 text-red-300 cursor-not-allowed' : ''}
                              ${!isSel && isFuture && !isWeekend ? 'text-slate-300 cursor-not-allowed' : ''}
                              ${!isSel && !isWeekend && !isFuture ? 'hover:bg-brand-50 hover:text-brand-700 text-slate-700 cursor-pointer' : ''}
                              ${isToday && !isSel ? 'ring-1 ring-brand-400 text-brand-600 font-bold' : ''}
                            `}
                          >
                            {dayNum}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Selection controls */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-3 py-2 bg-brand-50 rounded-xl border border-brand-100">
                    <span className="text-[13px] text-slate-700">
                      <span className="font-extrabold text-brand-600">{selected.size}</span> date{selected.size !== 1 ? 's' : ''} selected
                    </span>
                    <div className="flex gap-2">
                      <button onClick={toggleAllWorkingDays}
                        className="text-xs font-bold border border-brand-200 bg-white text-brand-700 hover:bg-brand-100 px-3 py-1.5 rounded-lg transition-colors active:scale-95">
                        All Working Days
                      </button>
                      {selected.size > 0 && (
                        <button onClick={() => setSelected(new Set())}
                          className="text-xs font-bold border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-colors active:scale-95">
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Remarks</label>
                    <textarea value={bulkRemarks} rows={1} placeholder="Optional notes..."
                      onChange={e => setBulkRemarks(e.target.value)} className={`${inp} resize-none text-[13px] py-2`} />
                  </div>

                  <div className="flex justify-end gap-3 pt-1">
                    <button type="button" onClick={closeModal}
                      className="px-4 py-2 rounded-2xl border-2 border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 active:scale-95 transition-all">
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleBulkSubmit}
                      disabled={bulkLoading || selected.size === 0 || !bulkEmp}
                      className="flex items-center gap-2 px-5 py-2 rounded-2xl btn-primary"
                    >
                      <CheckCircle size={14} />
                      {bulkLoading ? `Marking... (${selected.size})` : `Mark ${selected.size} Date${selected.size !== 1 ? 's' : ''}`}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default AttendanceManagement;