import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useEmployeeContext } from './EmployeeContext';
import { 
  Clock, Calendar, DollarSign, User, CheckCircle, FileText, TrendingUp, Award,
  Target, BarChart3
} from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// ── Same helpers as MyAttendance.js & Analysis.js ─────────────────────────────
const HOLIDAY_DATES = {
  '2026-03-14': 'Holi',              '2026-04-03': 'Good Friday',
  '2026-04-10': 'Eid al-Fitr',       '2026-04-18': 'Mahavir Jayanti',
  '2026-05-11': 'Buddha Purnima',    '2026-08-15': 'Independence Day',
  '2026-08-22': 'Janmashtami',       '2026-10-02': 'Gandhi Jayanti',
  '2026-10-12': 'Dussehra',          '2026-11-01': 'Diwali',
  '2026-11-19': 'Guru Nanak Jayanti','2026-12-25': 'Christmas',
};

const pad     = n => String(n).padStart(2, '0');
const fmtKey  = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const isWeekend = d => d.getDay() === 0 || d.getDay() === 6;
const isHoliday = d => !!HOLIDAY_DATES[fmtKey(d)];
const isWorkDay = d => !isWeekend(d) && !isHoliday(d);

const getAllDays = (year, month) => {
  const days = [], d = new Date(year, month, 1);
  while (d.getMonth() === month) { days.push(new Date(d)); d.setDate(d.getDate() + 1); }
  return days;
};

const safeDateKey = raw => {
  if (!raw) return '';
  const d = new Date(raw);
  return isNaN(d.getTime()) ? String(raw).slice(0, 10) : fmtKey(d);
};

// ─────────────────────────────────────────────────────────────────────────────

const EmployeeHome = () => {
  const { user } = useAuth();
  const { leaveApplications, leaveBalance } = useEmployeeContext(); // ✅ attendance removed from context
  const navigate = useNavigate();

  // ✅ Direct API fetch — same as Analysis.js
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [, setLoadingAttendance] = useState(true);

  useEffect(() => {
    fetchMyAttendance();
  }, []);

  const fetchMyAttendance = async () => {
    try {
      const token = localStorage.getItem('token');
      const res   = await fetch(`${API_URL}/api/attendance/my-attendance`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setAttendanceRecords(data.data.map(r => ({
          date:     safeDateKey(r.date),
          status:   r.status,
          checkIn:  r.checkIn  || '-',
          checkOut: r.checkOut || '-',
          remarks:  r.remarks  || '',
        })));
      }
    } catch (err) {
      console.error('EmployeeHome fetchAttendance error:', err);
    } finally {
      setLoadingAttendance(false);
    }
  };

  // ── Core date refs ────────────────────────────────────────────────────────
  const today        = new Date();
  const todayKey     = fmtKey(today);
  const currentMonth = today.getMonth();
  const currentYear  = today.getFullYear();

  // ── Build recordMap ───────────────────────────────────────────────────────
  const recordMap = {};
  attendanceRecords.forEach(r => { if (r.date) recordMap[r.date] = r; });

  // ── Working days — same logic as Analysis.js ──────────────────────────────
  const allDaysThisMonth = getAllDays(currentYear, currentMonth);
  const workingDays      = allDaysThisMonth.filter(isWorkDay);
  const workingDaysPast  = workingDays.filter(d => fmtKey(d) <= todayKey);

  const presentDays  = workingDaysPast.filter(d => recordMap[fmtKey(d)]?.status === 'Present').length;
  const absentDays   = workingDaysPast.filter(d => { const r = recordMap[fmtKey(d)]; return !r || r.status === 'Absent'; }).length;
  const halfDays     = workingDaysPast.filter(d => recordMap[fmtKey(d)]?.status === 'Half Day').length;

  const totalDaysPast        = workingDaysPast.length;
  const totalDaysMonth       = workingDays.length;
  const attendancePercentage = totalDaysPast > 0 ? Math.round((presentDays / totalDaysPast) * 100) : 0;

  // ── Leave stats ───────────────────────────────────────────────────────────
  const totalLeavesUsed      = leaveBalance.casual.used + leaveBalance.sick.used + leaveBalance.earned.used;
  const totalLeavesAvailable = leaveBalance.casual.total + leaveBalance.sick.total + leaveBalance.earned.total;
  const leavesRemaining      = totalLeavesAvailable - totalLeavesUsed;
  const pendingLeaves        = leaveApplications.filter(l => l.status === 'Pending').length;

  // ── Last 7 days for mini trend chart ─────────────────────────────────────
  const last7Days = [...Array(7)].map((_, i) => {
    const d   = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = fmtKey(d);
    return {
      day:    d.toLocaleDateString('en-US', { weekday: 'short' }),
      status: recordMap[key]?.status || (isWorkDay(d) && key <= todayKey ? 'Absent' : 'N/A'),
      date:   key,
    };
  });

  // ── Upcoming holidays ─────────────────────────────────────────────────────
  const [holidays] = useState([
    { id: 1, name: 'Holi',         date: 'Mar 14, 2026', type: 'Public Holiday' },
    { id: 2, name: 'Good Friday',  date: 'Apr 3, 2026',  type: 'Public Holiday' },
    { id: 3, name: 'Eid al-Fitr',  date: 'Apr 10, 2026', type: 'Public Holiday' },
  ]);

  // ── Recent activities ─────────────────────────────────────────────────────
  const recentActivities = [];
  const todayRec = recordMap[todayKey];
  if (todayRec) {
    recentActivities.push({
      id:      `att-${todayKey}`,
      type:    'attendance',
      message: `Marked attendance: ${todayRec.status}`,
      time:    todayRec.checkIn !== '-' ? todayRec.checkIn : 'Today',
      date:    'Today',
    });
  }
  leaveApplications.slice(0, 2).forEach(leave => {
    const daysAgo = Math.floor((new Date() - new Date(leave.appliedOn)) / (1000 * 60 * 60 * 24));
    recentActivities.push({
      id:      `leave-${leave.id}`,
      type:    'leave',
      message: `Leave ${leave.status.toLowerCase()} for ${new Date(leave.startDate).toLocaleDateString()}`,
      time:    '10:30 AM',
      date:    daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo} days ago`,
    });
  });

  // ── Average work hours ────────────────────────────────────────────────────
  const avgWorkHours = (() => {
    const withBoth = attendanceRecords.filter(r =>
      r.status === 'Present' && r.checkIn !== '-' && r.checkOut !== '-' &&
      new Date(r.date).getMonth() === currentMonth
    );
    if (!withBoth.length) return 0;
    const total = withBoth.reduce((sum, r) => {
      const ci = new Date(`2000-01-01 ${r.checkIn}`);
      const co = new Date(`2000-01-01 ${r.checkOut}`);
      return sum + (co - ci) / (1000 * 60);
    }, 0);
    return (total / withBoth.length / 60).toFixed(1);
  })();

  const performanceScore = Math.min(100, attendancePercentage + (leavesRemaining * 2));

  // ── Circular Progress ─────────────────────────────────────────────────────
  const CircularProgress = ({ percentage, color, size = 120 }) => {
    const radius = (size - 10) / 2;
    const circ   = 2 * Math.PI * radius;
    const offset = circ - (percentage / 100) * circ;
    return (
      <div className="relative inline-flex items-center justify-center">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle cx={size/2} cy={size/2} r={radius} stroke="#e5e7eb" strokeWidth="8" fill="none" />
          <circle cx={size/2} cy={size/2} r={radius} stroke={color} strokeWidth="8" fill="none"
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
            className="transition-all duration-1000 ease-out" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[24px] font-bold font-display text-gray-800">{percentage}%</span>
        </div>
      </div>
    );
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">

      {/* Header */}
      <div className="bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 rounded-2xl p-4 sm:p-8 text-white shadow-xl border border-slate-600">
        <div className="flex items-center gap-4 sm:gap-5 mb-4 sm:mb-6">
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-[20px] bg-gradient-to-br from-brand-600 to-blue-600 flex items-center justify-center text-white shadow-xl shadow-brand-500/20 overflow-hidden group shrink-0">
            <div className="absolute inset-0 bg-white/20 blur-md rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <User size={30} strokeWidth={2.5} className="relative z-10 drop-shadow-md group-hover:scale-110 transition-transform duration-300" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-[36px] font-bold font-display text-white tracking-tight leading-tight truncate">
              Welcome back, {user?.name}! 👋
            </h1>
            <p className="text-slate-300 text-xs sm:text-[15px] mt-1 font-medium">
              Here's what's happening with your work today
            </p>
          </div>
        </div>
        {/* Quick stats bar */}
        <div className="mt-4 sm:mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          {[
            { label: 'Attendance',    value: `${attendancePercentage}%`, dot: 'bg-blue-400'   },
            { label: 'Present Days',  value: presentDays,                dot: 'bg-green-400'  },
            { label: 'Absent Days',   value: absentDays,                 dot: 'bg-red-400'    },
            { label: 'Working Days',  value: totalDaysMonth,             dot: 'bg-orange-400' },
          ].map(({ label, value, dot }) => (
            <div key={label} className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-3 sm:p-4 hover:bg-white/15 transition-all">
              <div className="flex items-center gap-2 mb-1 sm:mb-2">
                <div className={`w-2 h-2 ${dot} rounded-full shrink-0`} />
                <p className="text-xs text-slate-300 font-medium uppercase tracking-wide truncate">{label}</p>
              </div>
              <p className="text-2xl sm:text-[36px] font-bold font-display tracking-tight text-white">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Visual Data Graphics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

        {/* Left — Attendance */}
        <div className="space-y-4 sm:space-y-6">

          {/* Circular attendance */}
          <div className="bg-gradient-to-br from-blue-50 to-brand-50 rounded-2xl shadow-sm border border-blue-100 p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <TrendingUp className="text-blue-600 shrink-0" size={20} />
              Monthly Attendance Overview
            </h3>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center justify-center">
                <CircularProgress percentage={attendancePercentage} color="#3b82f6" />
              </div>
              <div className="w-full sm:flex-1 space-y-2">
                {[
                  { label: 'Present',  count: presentDays, dot: 'bg-green-500 animate-pulse', fc: 'text-green-700'  },
                  { label: 'Absent',   count: absentDays,  dot: 'bg-red-500',                 fc: 'text-red-700'    },
                  { label: 'Half Day', count: halfDays,    dot: 'bg-yellow-500',               fc: 'text-yellow-700' },
                ].map(({ label, count, dot, fc }) => (
                  <div key={label} className="flex items-center justify-between p-3 bg-white/80 backdrop-blur rounded-lg shadow-sm">
                    <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <div className={`w-3 h-3 ${dot} rounded-full shrink-0`} />
                      {label}
                    </span>
                    <span className={`font-bold ${fc}`}>{count}</span>
                  </div>
                ))}
                {/* sublabel */}
                <p className="text-xs text-gray-400 text-center pt-1">
                  {presentDays}/{totalDaysPast} working days past
                </p>
              </div>
            </div>
          </div>

          {/* Last 7 Days Trend */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <BarChart3 className="text-brand-600 shrink-0" size={20} />
              Last 7 Days Attendance
            </h3>

            {/* Fixed-height bar chart — same approach as Analysis.js trend */}
            <div className="flex items-end gap-1 sm:gap-2" style={{ height: '140px' }}>
              {last7Days.map((day, i) => {
                let color  = 'bg-gray-200';
                let hPct   = 15;
                let label  = 'Not Marked';
                if (day.status === 'Present')  { color = 'bg-green-500';  hPct = 100; label = 'Present';  }
                if (day.status === 'Half Day') { color = 'bg-yellow-400'; hPct = 60;  label = 'Half Day'; }
                if (day.status === 'Absent')   { color = 'bg-red-400';    hPct = 30;  label = 'Absent';   }
                if (day.status === 'N/A')      { color = 'bg-gray-100';   hPct = 5;   label = 'Weekend';  }

                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                    {/* Tooltip */}
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      {label}
                    </div>
                    {/* Bar container */}
                    <div className="w-full bg-gray-100 rounded-lg overflow-hidden relative" style={{ height: '120px' }}>
                      <div
                        className={`absolute bottom-0 left-0 right-0 ${color} rounded-t-lg transition-all duration-700`}
                        style={{ height: `${hPct}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-600">{day.day}</span>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs">
              {[
                ['bg-green-500',  'Present'],
                ['bg-yellow-400', 'Half Day'],
                ['bg-red-400',    'Absent'],
                ['bg-gray-200',   'Not Marked'],
              ].map(([c, l]) => (
                <div key={l} className="flex items-center gap-1">
                  <div className={`w-3 h-3 ${c} rounded`} />
                  <span className="text-gray-600">{l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right — Leave & Performance */}
        <div className="space-y-4 sm:space-y-6">

          {/* Leave Balance */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-sm border border-green-100 p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Award className="text-green-600 shrink-0" size={20} />
              Leave Balance Breakdown
            </h3>
            <div className="space-y-4">
              {[
                { label: 'Casual Leave', bal: leaveBalance.casual,  color: 'blue'   },
                { label: 'Sick Leave',   bal: leaveBalance.sick,    color: 'green'  },
                { label: 'Earned Leave', bal: leaveBalance.earned,  color: 'purple' },
              ].map(({ label, bal, color }) => {
                const remaining = bal.total - bal.used;
                const pct       = bal.total > 0 ? (remaining / bal.total) * 100 : 0;
                return (
                  <div key={label}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">{label}</span>
                      <span className={`text-sm font-bold text-${color}-600`}>{remaining}/{bal.total}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
                      <div
                        className={`bg-gradient-to-r from-${color}-500 via-${color}-600 to-${color}-500 h-full rounded-full transition-all duration-700 relative overflow-hidden`}
                        style={{ width: `${pct}%` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse" />
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="mt-4 p-3 sm:p-4 bg-white/80 backdrop-blur rounded-lg shadow-sm border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-gray-600">Total Remaining</span>
                    <p className="text-2xl sm:text-[36px] font-bold font-display tracking-tight text-green-600">{leavesRemaining}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-gray-600">Total Used</span>
                    <p className="text-xl sm:text-[24px] font-bold font-display text-gray-700">{totalLeavesUsed}</p>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-500">Out of {totalLeavesAvailable} total leaves available</p>
                </div>
              </div>
            </div>
          </div>

          {/* Performance */}
          <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl shadow-sm border border-orange-100 p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-3">
              <Target className="text-orange-600 shrink-0" size={18} />
              <h3 className="text-sm font-semibold text-gray-800">Performance Score</h3>
            </div>
            <div className="flex items-baseline gap-1 mb-3">
              <span className="text-4xl font-bold text-orange-600">{performanceScore}</span>
              <span className="text-lg text-gray-600">/100</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden mb-2">
              <div
                className="bg-gradient-to-r from-orange-500 to-red-500 h-full rounded-full transition-all duration-1000"
                style={{ width: `${performanceScore}%` }}
              />
            </div>
            <p className="text-xs text-gray-600">
              {performanceScore >= 90 ? '🌟 Excellent!' : performanceScore >= 70 ? '👍 Good' : '📈 Keep it up'}
            </p>
            {avgWorkHours > 0 && (
              <div className="mt-3 pt-3 border-t border-orange-200 flex justify-between text-sm">
                <span className="text-gray-600">Avg. Work Hours</span>
                <span className="font-bold text-orange-700">{avgWorkHours}h / day</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {[
          {
            icon: CheckCircle, bg: 'bg-blue-100', ic: 'text-blue-600',
            value: `${attendancePercentage}%`, vc: 'text-blue-600',
            title: 'Attendance Rate',
            sub: `${presentDays}/${totalDaysPast} days present this month`,
            to: '/employee/attendance',
          },
          {
            icon: Calendar, bg: 'bg-green-100', ic: 'text-green-600',
            value: leavesRemaining, vc: 'text-green-600',
            title: 'Leaves Remaining',
            sub: `${totalLeavesUsed} used of ${totalLeavesAvailable}`,
            to: '/employee/leaves',
          },
          {
            icon: Clock, bg: 'bg-yellow-100', ic: 'text-yellow-600',
            value: pendingLeaves, vc: 'text-yellow-600',
            title: 'Pending Requests',
            sub: 'Leave applications pending',
            to: '/employee/leaves',
          },
          {
            icon: DollarSign, bg: 'bg-brand-100', ic: 'text-brand-600',
            value: '₹75K', vc: 'text-brand-600',
            title: 'This Month',
            sub: 'Salary credited on 1st',
            to: '/employee/payslips',
          },
        ].map(({ icon: Icon, bg, ic, value, vc, title, sub, to }) => (
          <div key={title}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-6 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate(to)}>
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <div className={`p-2 sm:p-3 ${bg} rounded-lg`}><Icon className={ic} size={20} /></div>
              <span className={`text-xl sm:text-[36px] font-bold font-display tracking-tight ${vc}`}>{value}</span>
            </div>
            <h3 className="font-semibold text-gray-800 mb-1 text-sm sm:text-base">{title}</h3>
            <p className="text-xs sm:text-sm text-gray-600 leading-tight">{sub}</p>
          </div>
        ))}
      </div>

      {/* Recent Activity & Holidays */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Clock size={20} className="text-blue-600 shrink-0" /> Recent Activity
          </h2>
          <div className="space-y-3 sm:space-y-4">
            {recentActivities.length > 0 ? recentActivities.map(a => (
              <div key={a.id} className="flex gap-3 sm:gap-4 p-3 bg-gray-50 rounded-lg">
                <div className="p-2 bg-white rounded-lg h-fit shrink-0">
                  {a.type === 'attendance' && <Clock className="text-blue-600" size={20} />}
                  {a.type === 'leave'      && <Calendar className="text-green-600" size={20} />}
                  {a.type === 'document'   && <FileText className="text-brand-600" size={20} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 text-sm sm:text-base truncate">{a.message}</p>
                  <p className="text-xs sm:text-sm text-gray-600">{a.date} at {a.time}</p>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-gray-500">
                <Clock size={48} className="mx-auto mb-2 text-gray-300" />
                <p>No recent activities</p>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Holidays */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Calendar size={20} className="text-brand-600 shrink-0" /> Upcoming Holidays
          </h2>
          <div className="space-y-3">
            {holidays.map(h => (
              <div key={h.id} className="flex items-center justify-between p-3 bg-brand-50 rounded-lg gap-2">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-brand-100 rounded-lg flex items-center justify-center shrink-0">
                    <Calendar className="text-brand-600" size={18} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-800 text-sm sm:text-base truncate">{h.name}</h3>
                    <p className="text-xs sm:text-sm text-gray-600">{h.date}</p>
                  </div>
                </div>
                <span className="text-xs bg-purple-200 text-purple-800 px-2 sm:px-3 py-1 rounded-full whitespace-nowrap shrink-0">{h.type}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {[
            { label: 'Mark Attendance', icon: Clock,       bg: 'bg-blue-50   hover:bg-blue-100',   ic: 'text-blue-600',   to: '/employee/attendance' },
            { label: 'Apply Leave',     icon: Calendar,    bg: 'bg-green-50  hover:bg-green-100',  ic: 'text-green-600',  to: '/employee/leaves'     },
            { label: 'View Payslips',   icon: DollarSign,  bg: 'bg-brand-50 hover:bg-brand-100', ic: 'text-brand-600', to: '/employee/payslips'   },
            { label: 'Update Profile',  icon: User,        bg: 'bg-orange-50 hover:bg-orange-100', ic: 'text-orange-600', to: '/employee/profile'    },
          ].map(({ label, icon: Icon, bg, ic, to }) => (
            <button key={label} onClick={() => navigate(to)}
              className={`p-3 sm:p-4 ${bg} rounded-2xl transition-colors text-center`}>
              <Icon className={`mx-auto mb-2 ${ic}`} size={22} />
              <p className="text-xs sm:text-sm font-medium text-gray-800">{label}</p>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
};

export default EmployeeHome;