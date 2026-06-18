import React, { useState, useEffect } from 'react';
import { useEmployeeContext } from './EmployeeContext';
import {
  TrendingUp, Calendar, Award, Clock, BarChart3,
  Activity, CheckCircle, XCircle, ListTodo
} from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const HOLIDAY_DATES = {
  '2026-03-14': 'Holi',              '2026-04-03': 'Good Friday',
  '2026-04-10': 'Eid al-Fitr',       '2026-04-18': 'Mahavir Jayanti',
  '2026-05-11': 'Buddha Purnima',    '2026-08-15': 'Independence Day',
  '2026-08-22': 'Janmashtami',       '2026-10-02': 'Gandhi Jayanti',
  '2026-10-12': 'Dussehra',          '2026-11-01': 'Diwali',
  '2026-11-19': 'Guru Nanak Jayanti','2026-12-25': 'Christmas',
};

const pad    = n => String(n).padStart(2, '0');
const fmtKey = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;

const isWeekend  = d => d.getDay() === 0 || d.getDay() === 6;
const isHoliday  = d => !!HOLIDAY_DATES[fmtKey(d)];
const isWorkDay  = d => !isWeekend(d) && !isHoliday(d);

const getAllDays = (year, month) => {
  const days = [];
  const d    = new Date(year, month, 1);
  while (d.getMonth() === month) {
    days.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return days;
};

const safeDateKey = raw => {
  if (!raw) return '';
  const d = new Date(raw);
  return isNaN(d.getTime()) ? String(raw).slice(0, 10) : fmtKey(d);
};

const Analysis = () => {
  const { leaveApplications, leaveBalance } = useEmployeeContext();

  const [tasks,             setTasks]             = useState([]);
  const [loadingTasks,      setLoadingTasks]      = useState(true);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loadingAttendance, setLoadingAttendance] = useState(true);

  useEffect(() => {
    fetchMyTasks();
    fetchMyAttendance();
  }, []);

  const fetchMyAttendance = async () => {
    try {
      const token = localStorage.getItem('token');
      const res   = await fetch(`${API_URL}/api/attendance/my-attendance`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data  = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const normalized = data.data.map(r => ({
          date:     safeDateKey(r.date),
          status:   r.status,
          checkIn:  r.checkIn  || '-',
          checkOut: r.checkOut || '-',
        }));
        setAttendanceRecords(normalized);
      }
    } catch (err) {
      console.error('fetchMyAttendance error:', err);
    } finally {
      setLoadingAttendance(false);
    }
  };

  const fetchMyTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const res   = await fetch(`${API_URL}/api/tasks/my-tasks`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data  = await res.json();
      if (data.success) setTasks(data.data);
    } catch (err) {
      console.error('fetchMyTasks error:', err);
    } finally {
      setLoadingTasks(false);
    }
  };

  const today        = new Date();
  const todayKey     = fmtKey(today);
  const currentMonth = today.getMonth();
  const currentYear  = today.getFullYear();

  const recordMap = {};
  attendanceRecords.forEach(r => { if (r.date) recordMap[r.date] = r; });

  const allDaysThisMonth = getAllDays(currentYear, currentMonth);
  const workingDays      = allDaysThisMonth.filter(isWorkDay);
  const workingDaysPast  = workingDays.filter(d => fmtKey(d) <= todayKey);

  const presentDays  = workingDaysPast.filter(d => recordMap[fmtKey(d)]?.status === 'Present').length;
  const absentDays   = workingDaysPast.filter(d => { const r = recordMap[fmtKey(d)]; return !r || r.status === 'Absent'; }).length;
  const halfDays     = workingDaysPast.filter(d => recordMap[fmtKey(d)]?.status === 'Half Day').length;
  const loggedInDays = workingDaysPast.filter(d => recordMap[fmtKey(d)]?.status === 'LoggedIn').length;
  const leaveDays    = workingDaysPast.filter(d => recordMap[fmtKey(d)]?.status === 'Leave').length;

  const totalDaysPast        = workingDaysPast.length;
  const totalDaysMonth       = workingDays.length;
  const attendancePercentage = totalDaysPast > 0 ? Math.round((presentDays / totalDaysPast) * 100) : 0;

  const totalLeavesUsed      = leaveBalance.casual.used + leaveBalance.sick.used + leaveBalance.earned.used;
  const totalLeavesAvailable = leaveBalance.casual.total + leaveBalance.sick.total + leaveBalance.earned.total;
  const leavesRemaining      = totalLeavesAvailable - totalLeavesUsed;
  const pendingLeaves        = leaveApplications.filter(l => l.status === 'Pending').length;
  const approvedLeaves       = leaveApplications.filter(l => l.status === 'Approved').length;
  const rejectedLeaves       = leaveApplications.filter(l => l.status === 'Rejected').length;

  const totalTasks         = tasks.length;
  const completedTasks     = tasks.filter(t => t.status === 'Completed').length;
  const inProgressTasks    = tasks.filter(t => t.status === 'In Progress').length;
  const pendingTasks       = tasks.filter(t => t.status === 'Pending').length;
  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const performanceScore = Math.min(100, attendancePercentage + (leavesRemaining * 2));

  const monthlyBreakdown = [];
  for (let i = 5; i >= 0; i--) {
    const ref   = new Date(currentYear, currentMonth - i, 1);
    const yr    = ref.getFullYear();
    const mo    = ref.getMonth();
    const label = ref.toLocaleDateString('en-US', { month: 'short' });
    const mWorkPast = getAllDays(yr, mo).filter(d => isWorkDay(d) && fmtKey(d) <= todayKey);
    const mPresent  = mWorkPast.filter(d => recordMap[fmtKey(d)]?.status === 'Present').length;
    const mAbsent   = mWorkPast.filter(d => { const r = recordMap[fmtKey(d)]; return !r || r.status === 'Absent'; }).length;
    const mPct      = mWorkPast.length > 0 ? Math.round((mPresent / mWorkPast.length) * 100) : 0;
    monthlyBreakdown.push({ month: label, present: mPresent, absent: mAbsent, total: mWorkPast.length, percentage: mPct });
  }

  // ── Circular Progress ─────────────────────────────────────────────────────
  const CircularProgress = ({ percentage, color, size = 120, label, sublabel }) => {
    const radius           = (size - 10) / 2;
    const circumference    = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    return (
      <div className="flex flex-col items-center">
        <div className="relative inline-flex items-center justify-center mb-2 sm:mb-3">
          <svg width={size} height={size} className="transform -rotate-90">
            <circle cx={size/2} cy={size/2} r={radius} stroke="#e5e7eb" strokeWidth="10" fill="none" />
            <circle
              cx={size/2} cy={size/2} r={radius} stroke={color} strokeWidth="10" fill="none"
              strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
              strokeLinecap="round" className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl sm:text-3xl font-bold text-gray-800">{percentage}%</span>
          </div>
        </div>
        <p className="text-xs sm:text-sm font-semibold text-gray-700 text-center">{label}</p>
        <p className="text-xs text-gray-500 text-center">{sublabel}</p>
      </div>
    );
  };

  if (loadingTasks || loadingAttendance) {
    return (
      <div className="p-6 flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading analysis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">

      {/* ── Hero Header ── */}
      <div className="bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 rounded-2xl p-5 sm:p-8 text-white shadow-xl border border-slate-600">
        <div className="flex items-center gap-4 sm:gap-5 mb-4 sm:mb-6">
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-[20px] bg-gradient-to-br from-brand-600 to-blue-600 flex items-center justify-center text-white shadow-xl shadow-brand-500/20 overflow-hidden group shrink-0">
            <div className="absolute inset-0 bg-white/20 blur-md rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <BarChart3 size={30} strokeWidth={2.5} className="relative z-10 drop-shadow-md group-hover:scale-110 transition-transform duration-300" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-[36px] font-bold font-display text-white tracking-tight leading-tight truncate">
              Performance Analysis
            </h1>
            <p className="text-slate-300 text-xs sm:text-[15px] mt-1 font-medium">
              Comprehensive visual insights into your work patterns
            </p>
          </div>
        </div>

        {/* Stats: 2×2 on mobile, 4 cols on sm+ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          {[
            { label: 'Attendance',   value: `${attendancePercentage}%`, dot: 'bg-blue-400'   },
            { label: 'Performance',  value: performanceScore,            dot: 'bg-green-400'  },
            { label: 'Task Rate',    value: `${taskCompletionRate}%`,    dot: 'bg-purple-400' },
            { label: 'Working Days', value: totalDaysMonth,              dot: 'bg-orange-400' },
          ].map(({ label, value, dot }) => (
            <div key={label} className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-3 sm:p-4 hover:bg-white/15 transition-all">
              <div className="flex items-center gap-1.5 mb-1 sm:mb-2">
                <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 ${dot} rounded-full flex-shrink-0`} />
                <p className="text-xs text-slate-300 font-medium uppercase tracking-wide leading-tight">{label}</p>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-white">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Circular Charts: 1 col mobile, 3 cols lg ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">

        {/* Attendance */}
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl shadow-sm border border-blue-100 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
            <Clock className="text-blue-600" size={18} /> Attendance Performance
          </h3>
          <div className="flex items-center justify-center mb-3 sm:mb-4">
            <CircularProgress
              percentage={attendancePercentage} color="#3b82f6" size={120}
              label="Attendance Rate" sublabel={`${presentDays}/${totalDaysPast} days present`}
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { v: presentDays, c: 'green',  l: 'Present'  },
              { v: absentDays,  c: 'red',    l: 'Absent'   },
              { v: halfDays,    c: 'yellow', l: 'Half Day' },
            ].map(({ v, c, l }) => (
              <div key={l} className={`text-center p-2 bg-${c}-100 rounded-lg`}>
                <p className={`text-xl sm:text-2xl font-bold text-${c}-700`}>{v}</p>
                <p className="text-xs text-gray-600">{l}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {[
              { v: loggedInDays, c: 'orange', l: 'In Progress' },
              { v: leaveDays,    c: 'blue',   l: 'On Leave'    },
            ].map(({ v, c, l }) => (
              <div key={l} className={`text-center p-2 bg-${c}-100 rounded-lg`}>
                <p className={`text-lg sm:text-xl font-bold text-${c}-700`}>{v}</p>
                <p className="text-xs text-gray-600">{l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tasks */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl shadow-sm border border-purple-100 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
            <ListTodo className="text-purple-600" size={18} /> Task Completion
          </h3>
          <div className="flex items-center justify-center mb-3 sm:mb-4">
            <CircularProgress
              percentage={taskCompletionRate} color="#a855f7" size={120}
              label="Completion Rate" sublabel={`${completedTasks}/${totalTasks} tasks done`}
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { v: completedTasks,  c: 'green',  l: 'Done'     },
              { v: inProgressTasks, c: 'blue',   l: 'Progress' },
              { v: pendingTasks,    c: 'yellow', l: 'Pending'  },
            ].map(({ v, c, l }) => (
              <div key={l} className={`text-center p-2 bg-${c}-100 rounded-lg`}>
                <p className={`text-xl sm:text-2xl font-bold text-${c}-700`}>{v}</p>
                <p className="text-xs text-gray-600">{l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Leaves */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-sm border border-green-100 p-4 sm:p-6 sm:col-span-2 lg:col-span-1">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
            <Calendar className="text-green-600" size={18} /> Leave Utilization
          </h3>
          <div className="flex items-center justify-center mb-3 sm:mb-4">
            <CircularProgress
              percentage={totalLeavesAvailable > 0 ? Math.round((totalLeavesUsed / totalLeavesAvailable) * 100) : 0}
              color="#10b981" size={120} label="Leaves Used" sublabel={`${totalLeavesUsed}/${totalLeavesAvailable} days`}
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { v: leaveBalance.casual.used, c: 'blue',   l: 'Casual' },
              { v: leaveBalance.sick.used,   c: 'red',    l: 'Sick'   },
              { v: leaveBalance.earned.used, c: 'purple', l: 'Earned' },
            ].map(({ v, c, l }) => (
              <div key={l} className={`text-center p-2 bg-${c}-100 rounded-lg`}>
                <p className={`text-xl sm:text-2xl font-bold text-${c}-700`}>{v}</p>
                <p className="text-xs text-gray-600">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 6-Month Trend ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <h2 className="text-lg sm:text-2xl font-bold text-gray-800 flex items-center gap-2 mb-4 sm:mb-6">
          <TrendingUp className="text-blue-600" size={22} /> 6-Month Attendance Trend
        </h2>

        {/* Bar chart — shorter on mobile */}
        <div className="flex items-end justify-between gap-1 sm:gap-4 h-40 sm:h-64">
          {monthlyBreakdown.map((data, i) => {
            const maxH = Math.max(...monthlyBreakdown.map(d => d.total)) || 1;
            const pH   = data.total > 0 ? (data.present / maxH) * 100 : 0;
            const aH   = data.total > 0 ? (data.absent  / maxH) * 100 : 0;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 sm:gap-3">
                <p className="text-xs sm:text-2xl font-bold text-gray-800">{data.percentage}%</p>
                <div className="w-full bg-gray-100 rounded-lg overflow-hidden h-24 sm:h-48 flex flex-col justify-end gap-0.5 sm:gap-1 p-0.5 sm:p-1">
                  {pH > 0 && (
                    <div className="w-full bg-gradient-to-t from-green-500 to-green-400 rounded transition-all duration-700"
                      style={{ height: `${pH}%` }} title={`Present: ${data.present}`} />
                  )}
                  {aH > 0 && (
                    <div className="w-full bg-gradient-to-t from-red-500 to-red-400 rounded transition-all duration-700"
                      style={{ height: `${aH}%` }} title={`Absent: ${data.absent}`} />
                  )}
                </div>
                <span className="text-xs font-semibold text-gray-700">{data.month}</span>
              </div>
            );
          })}
        </div>

        <div className="mt-4 sm:mt-6 flex items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded" /><span className="text-gray-600 font-medium">Present Days</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 sm:w-4 sm:h-4 bg-red-500 rounded" /><span className="text-gray-600 font-medium">Absent Days</span></div>
        </div>
      </div>

      {/* ── Task Progress ── */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl shadow-sm border border-purple-100 p-4 sm:p-6">
        <h2 className="text-lg sm:text-2xl font-bold text-gray-800 flex items-center gap-2 mb-4 sm:mb-6">
          <ListTodo className="text-purple-600" size={22} /> Task Progress Overview
        </h2>
        <div className="space-y-4 sm:space-y-6">
          {[
            { label: 'Completed Tasks',   count: completedTasks,  icon: CheckCircle, color: 'green',  bar: 'from-green-500  via-green-600  to-green-500'  },
            { label: 'In Progress Tasks', count: inProgressTasks, icon: Activity,    color: 'blue',   bar: 'from-blue-500   via-blue-600   to-blue-500'   },
            { label: 'Pending Tasks',     count: pendingTasks,    icon: Clock,       color: 'yellow', bar: 'from-yellow-500 via-yellow-600 to-yellow-500' },
          ].map(({ label, count, icon: Icon, color, bar }) => (
            <div key={label}>
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Icon className={`text-${color}-600`} size={20} />
                  <span className="text-sm sm:text-lg font-semibold text-gray-800">{label}</span>
                </div>
                <span className={`text-lg sm:text-2xl font-bold text-${color}-600`}>{count}/{totalTasks}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 sm:h-5 overflow-hidden">
                <div className={`bg-gradient-to-r ${bar} h-full rounded-full transition-all duration-1000 relative overflow-hidden`}
                  style={{ width: `${totalTasks > 0 ? (count / totalTasks) * 100 : 0}%` }}>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Leave Balance ── */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-sm border border-green-100 p-4 sm:p-6">
        <h2 className="text-lg sm:text-2xl font-bold text-gray-800 flex items-center gap-2 mb-4 sm:mb-6">
          <Award className="text-green-600" size={22} /> Leave Balance Breakdown
        </h2>
        <div className="space-y-4 sm:space-y-6">
          {[
            { abbr: 'CL', label: 'Casual Leave', bal: leaveBalance.casual,  color: 'blue'   },
            { abbr: 'SL', label: 'Sick Leave',   bal: leaveBalance.sick,    color: 'red'    },
            { abbr: 'EL', label: 'Earned Leave', bal: leaveBalance.earned,  color: 'purple' },
          ].map(({ abbr, label, bal, color }) => {
            const remaining = bal.total - bal.used;
            const pct       = bal.total > 0 ? (remaining / bal.total) * 100 : 0;
            return (
              <div key={abbr}>
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className={`w-9 h-9 sm:w-12 sm:h-12 bg-${color}-500 rounded-xl flex items-center justify-center text-white font-bold text-base sm:text-xl flex-shrink-0`}>{abbr}</div>
                    <span className="text-sm sm:text-lg font-semibold text-gray-800">{label}</span>
                  </div>
                  <span className={`text-lg sm:text-2xl font-bold text-${color}-600`}>{remaining}/{bal.total}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 sm:h-5 overflow-hidden">
                  <div className={`bg-gradient-to-r from-${color}-500 via-${color}-600 to-${color}-500 h-full rounded-full transition-all duration-1000 relative overflow-hidden`}
                    style={{ width: `${pct}%` }}>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse" />
                  </div>
                </div>
              </div>
            );
          })}

          <div className="pt-3 sm:pt-4 border-t border-gray-200">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">Leave Application Status</h3>
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <div className="text-center p-3 sm:p-4 bg-yellow-100 rounded-xl">
                <Clock className="mx-auto mb-1 sm:mb-2 text-yellow-600" size={20} />
                <p className="text-2xl sm:text-3xl font-bold text-yellow-700">{pendingLeaves}</p>
                <p className="text-xs sm:text-sm text-gray-600">Pending</p>
              </div>
              <div className="text-center p-3 sm:p-4 bg-green-100 rounded-xl">
                <CheckCircle className="mx-auto mb-1 sm:mb-2 text-green-600" size={20} />
                <p className="text-2xl sm:text-3xl font-bold text-green-700">{approvedLeaves}</p>
                <p className="text-xs sm:text-sm text-gray-600">Approved</p>
              </div>
              <div className="text-center p-3 sm:p-4 bg-red-100 rounded-xl">
                <XCircle className="mx-auto mb-1 sm:mb-2 text-red-600" size={20} />
                <p className="text-2xl sm:text-3xl font-bold text-red-700">{rejectedLeaves}</p>
                <p className="text-xs sm:text-sm text-gray-600">Rejected</p>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Analysis;