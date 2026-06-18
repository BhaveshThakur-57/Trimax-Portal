import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Clock, CheckCircle, XCircle, AlertCircle, Download, LogOut } from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const HOLIDAY_DATES = {
  '2026-03-14': 'Holi',              '2026-04-03': 'Good Friday',
  '2026-04-10': 'Eid al-Fitr',       '2026-04-18': 'Mahavir Jayanti',
  '2026-05-11': 'Buddha Purnima',    '2026-08-15': 'Independence Day',
  '2026-08-22': 'Janmashtami',       '2026-10-02': 'Gandhi Jayanti',
  '2026-10-12': 'Dussehra',          '2026-11-01': 'Diwali',
  '2026-11-19': 'Guru Nanak Jayanti','2026-12-25': 'Christmas',
};

const MONTHS = [
  'January 2026','February 2026','March 2026','April 2026',
  'May 2026','June 2026','July 2026','August 2026',
  'September 2026','October 2026','November 2026','December 2026',
];

const pad    = n => String(n).padStart(2, '0');
const fmtKey = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;

const safeDateKey = (rawDate) => {
  if (!rawDate) return '';
  const d = new Date(rawDate);
  if (isNaN(d.getTime())) return String(rawDate).slice(0, 10);
  return fmtKey(d);
};

const parseMonth = label => {
  const [m, y] = label.split(' ');
  return { year: parseInt(y), month: new Date(`${m} 1, ${y}`).getMonth() };
};

const getAllDays = (year, month) => {
  const days = [], d = new Date(year, month, 1);
  while (d.getMonth() === month) { days.push(new Date(d)); d.setDate(d.getDate()+1); }
  return days;
};

const getDayType = d => {
  const ds = fmtKey(d);
  if (d.getDay()===0 || d.getDay()===6) return { type:'weekend', label:'Weekend' };
  if (HOLIDAY_DATES[ds])                return { type:'holiday', label:HOLIDAY_DATES[ds] };
  return { type:'working', label:null };
};

// ── Time Helpers ──────────────────────────────────────────────────────────────

const timeStrToMinutes = (timeStr) => {
  if (!timeStr || timeStr === '-' || timeStr === '--') return null;

  const ampmMatch = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (ampmMatch) {
    let [, h, m, period] = ampmMatch;
    h = parseInt(h); m = parseInt(m);
    if (period.toUpperCase() === 'PM' && h !== 12) h += 12;
    if (period.toUpperCase() === 'AM' && h === 12) h = 0;
    return h * 60 + m;
  }

  const plainMatch = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (plainMatch) {
    const h = parseInt(plainMatch[1]);
    const m = parseInt(plainMatch[2]);
    return h * 60 + m;
  }

  return null;
};

const addMinutesToTimeStr = (timeStr, minutesToAdd) => {
  const base = timeStrToMinutes(timeStr);
  if (base === null) return '-';
  const total = base + minutesToAdd;
  let h = Math.floor(total / 60) % 24;
  const m = total % 60;
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  return `${pad(displayH)}:${pad(m)} ${period}`;
};

const getCurrentTimeStr = () => {
  const now = new Date();
  return now.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', hour12: true });
};

const getDuration = (checkIn, checkOut) => {
  const a = timeStrToMinutes(checkIn);
  const b = timeStrToMinutes(checkOut);
  if (a === null || b === null || b <= a) return '-';
  const diff = b - a;
  const hrs  = Math.floor(diff / 60);
  const mins = diff % 60;
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${pad(mins)}m`;
};

// ── Helper: kya check-in time 11 AM ke baad hai? → Half Day mode ─────────────
const isLateLogin = (checkInStr) => {
  const mins = timeStrToMinutes(checkInStr);
  if (mins === null) return false;
  return mins >= 11 * 60; // 11:00 AM ke baad = Half Day mode
};

// ─────────────────────────────────────────────────────────────────────────────

const MyAttendance = () => {
  const { user } = useAuth();
  const now = new Date();

  const [records, setRecords]           = useState([]);
  const [filterMonth, setFilterMonth]   = useState(now.toLocaleDateString('en-US',{month:'long',year:'numeric'}));
  const [todayStatus, setTodayStatus]   = useState(null);
  const [todayRec, setTodayRec]         = useState(null);
  const [loading, setLoading]           = useState(true);
  const [checkingOut, setCheckingOut]   = useState(false);
  const [refreshKey, setRefreshKey]     = useState(0);

  useEffect(() => {
    const token    = localStorage.getItem('token');
    const todayStr = fmtKey(new Date());

    setRecords([]);

    const init = async () => {
      // ── STEP 1: Fetch all records ──────────────────────────────────────────
      let normalized = [];
      try {
        const res  = await fetch(`${API_URL}/api/attendance/my-attendance`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await res.json();

        console.log('📊 API Response:', data);

        if (data.success && Array.isArray(data.data)) {
          normalized = data.data.map(r => {
            const dateKey = safeDateKey(r.date);
            console.log(`  Record: raw=${r.date} → key=${dateKey} status=${r.status}`);
            return {
              id:               r._id,
              date:             dateKey,
              status:           r.status,
              checkIn:          r.checkIn         || '-',
              checkOut:         r.checkOut        || '-',
              expectedCheckOut: r.expectedCheckOut|| '-',
              remarks:          r.remarks         || '',
            };
          });
          console.log(`✅ Normalized ${normalized.length} records`);
        } else {
          console.warn('⚠️ Unexpected response shape:', data);
        }
      } catch (err) {
        console.error('❌ fetch error:', err);
      }

      // ── STEP 2: Is today already in DB? ───────────────────────────────────
      const existingTodayRec = normalized.find(r => r.date === todayStr);
      console.log('Today record from DB:', existingTodayRec);

      if (existingTodayRec) {
        // Agar DB mein Absent hai but checkIn missing — update karo
        if (
          existingTodayRec.status === 'Absent' &&
          (!existingTodayRec.checkIn || existingTodayRec.checkIn === '-' || existingTodayRec.checkIn === '--')
        ) {
          const actualTime = getCurrentTimeStr();

          try {
            await fetch(`${API_URL}/api/attendance/update-checkin`, {
              method:  'PATCH',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body:    JSON.stringify({ date: todayStr, checkIn: actualTime }),
            });
          } catch (e) {
            console.warn('checkIn patch failed (non-critical):', e);
          }

          const updatedRec = { ...existingTodayRec, checkIn: actualTime };
          const updatedNormalized = normalized.map(r => r.date === todayStr ? updatedRec : r);
          setRecords(updatedNormalized);
          setTodayRec(updatedRec);
          setTodayStatus('absent');
          setLoading(false);
          return;
        }

        setRecords(normalized);
        setTodayRec(existingTodayRec);
        if      (existingTodayRec.status === 'Present')  setTodayStatus('present');
        else if (existingTodayRec.status === 'Half Day') setTodayStatus('halfDay');
        else if (existingTodayRec.status === 'Absent')   setTodayStatus('absent');
        else if (existingTodayRec.status === 'LoggedIn') setTodayStatus('loggedIn');
        else                                              setTodayStatus('loggedIn');
        setLoading(false);
        return;
      }

      // ── STEP 3: Auto-mark logic ───────────────────────────────────────────
      const currentHour    = now.getHours();
      const currentMinute  = now.getMinutes();
      const totalMinutes   = currentHour * 60 + currentMinute;

      const NINE_AM   = 9  * 60; // 540  — login window start
      const ELEVEN_AM = 11 * 60; // 660  — full day cutoff, ke baad = half day mode

      // Before 9 AM → too early
      if (totalMinutes < NINE_AM) {
        setRecords(normalized);
        setTodayStatus('early');
        setLoading(false);
        return;
      }

      // ✅ Capture actual login time
      const actualCheckInTime = getCurrentTimeStr();

      // ── CASE A: 11 AM ke baad login → Half Day mode (LoggedIn, 4h baad checkout) ──
      if (totalMinutes >= ELEVEN_AM) {
        const expectedCheckOut = addMinutesToTimeStr(actualCheckInTime, 4 * 60); // +4 hours

        try {
          const res = await fetch(`${API_URL}/api/attendance/auto-mark`, {
            method:  'POST',
            headers: { 'Content-Type':'application/json', 'Authorization': `Bearer ${token}` },
            body:    JSON.stringify({
              date:             todayStr,
              status:           'LoggedIn',
              checkIn:          actualCheckInTime,
              checkOut:         '-',
              expectedCheckOut: expectedCheckOut,
              remarks:          'Late login - Half Day (4h required)',
            }),
          });
          const data = await res.json();
          console.log('🤖 Auto-mark HalfDay-LoggedIn response:', data);

          if (data.alreadyMarked) {
            // DB mein already record hai — uska actual status use karo
            const existingRec = {
              id:               data.data?._id || Date.now(),
              date:             todayStr,
              status:           data.data?.status           || 'LoggedIn',
              checkIn:          data.data?.checkIn          || actualCheckInTime,
              checkOut:         data.data?.checkOut         || '-',
              expectedCheckOut: data.data?.expectedCheckOut || expectedCheckOut,
              remarks:          data.data?.remarks          || 'Late login - Half Day (4h required)',
            };
            setRecords([existingRec, ...normalized]);
            setTodayRec(existingRec);
            if      (existingRec.status === 'Present')  setTodayStatus('present');
            else if (existingRec.status === 'Half Day') setTodayStatus('halfDay');
            else if (existingRec.status === 'Absent')   setTodayStatus('absent');
            else                                        setTodayStatus('loggedIn');
          } else if (data.success) {
            const lateLoggedInRec = {
              id:               data.data?._id || Date.now(),
              date:             todayStr,
              status:           'LoggedIn',
              checkIn:          data.data?.checkIn          || actualCheckInTime,
              checkOut:         '-',
              expectedCheckOut: data.data?.expectedCheckOut || expectedCheckOut,
              remarks:          'Late login - Half Day (4h required)',
            };
            setRecords([lateLoggedInRec, ...normalized]);
            setTodayRec(lateLoggedInRec);
            setTodayStatus('loggedIn');
            alert(`⚠️ Late Login Recorded!\n\nCheck-In: ${lateLoggedInRec.checkIn}\nExpected Check-Out: ${lateLoggedInRec.expectedCheckOut}\n\n11 AM ke baad login kiya → Half Day mode.\n4 ghante kaam karo aur checkout karo → Half Day mark hoga.`);
          } else {
            const fallbackRec = {
              id:       Date.now(),
              date:     todayStr,
              status:   'LoggedIn',
              checkIn:  actualCheckInTime,
              checkOut: '-',
              expectedCheckOut: expectedCheckOut,
              remarks:  'Late login - Half Day (4h required)',
            };
            setRecords([fallbackRec, ...normalized]);
            setTodayRec(fallbackRec);
            setTodayStatus('loggedIn');
          }
        } catch (err) {
          console.error('❌ auto-mark half-day error:', err);
          const fallbackRec = {
            id:       Date.now(),
            date:     todayStr,
            status:   'LoggedIn',
            checkIn:  actualCheckInTime,
            checkOut: '-',
            expectedCheckOut: addMinutesToTimeStr(actualCheckInTime, 4 * 60),
            remarks:  'Late login - Half Day (4h required)',
          };
          setRecords([fallbackRec, ...normalized]);
          setTodayRec(fallbackRec);
          setTodayStatus('loggedIn');
        }
        setLoading(false);
        return;
      }

      // ── CASE B: 9 AM – 11 AM → Full Day mode (LoggedIn, 8h baad checkout) ──
      const expectedCheckOut = addMinutesToTimeStr(actualCheckInTime, 8 * 60); // +8 hours

      try {
        const res = await fetch(`${API_URL}/api/attendance/auto-mark`, {
          method:  'POST',
          headers: { 'Content-Type':'application/json', 'Authorization': `Bearer ${token}` },
          body:    JSON.stringify({
            date:             todayStr,
            status:           'LoggedIn',
            checkIn:          actualCheckInTime,
            checkOut:         '-',
            expectedCheckOut: expectedCheckOut,
          }),
        });
        const data = await res.json();
        console.log('🤖 Auto-mark LoggedIn response:', data);

        if (data.success || data.alreadyMarked) {
          const loggedInRec = {
            id:               data.data?._id || Date.now(),
            date:             todayStr,
            status:           data.data?.status           || 'LoggedIn',
            checkIn:          data.data?.checkIn          || actualCheckInTime,
            checkOut:         data.data?.checkOut         || '-',
            expectedCheckOut: data.data?.expectedCheckOut || expectedCheckOut,
            remarks:          data.data?.remarks          || '',
          };
          setRecords([loggedInRec, ...normalized]);
          setTodayRec(loggedInRec);
          setTodayStatus(loggedInRec.status === 'Present' ? 'present' : 'loggedIn');
          alert(`🕘 Login Recorded!\nCheck-In: ${loggedInRec.checkIn}\nExpected Check-Out: ${loggedInRec.expectedCheckOut}\n\nPresent tab mark hogi jab aap 8 ghante baad checkout karein.`);
        } else {
          console.error('❌ LoggedIn mark failed:', data.message);
          alert('Attendance mark nahi hui. Please refresh karo aur dobara try karo.');
          setRecords(normalized);
          setTodayStatus(null);
        }
      } catch (err) {
        console.error('❌ auto-mark loggedIn error:', err);
        setRecords(normalized);
      }

      setLoading(false);
    };

    init();
  }, [refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Checkout Handler ──────────────────────────────────────────────────────
  const handleCheckOut = async () => {
    if (!todayRec) return;

    const checkOutTime  = getCurrentTimeStr();
    const checkInMins   = timeStrToMinutes(todayRec.checkIn);
    const checkOutMins  = timeStrToMinutes(checkOutTime);

    if (checkInMins === null) {
      alert('Check-in time not found. Please refresh.');
      return;
    }

    // ✅ Late login (11 AM ke baad) → Half Day mode (4h min), warna Full Day (8h min)
    const halfDayMode  = isLateLogin(todayRec.checkIn);
    const MIN_WORK     = halfDayMode ? 4  * 60 : 8  * 60;
    const MAX_WORK     = halfDayMode ? 6  * 60 : 10 * 60;
    const finalStatus  = halfDayMode ? 'Half Day' : 'Present';

    const workedMins = checkOutMins - checkInMins;

    if (workedMins < MIN_WORK) {
      const remaining = MIN_WORK - workedMins;
      const remH = Math.floor(remaining / 60);
      const remM = remaining % 60;
      const modeLabel = halfDayMode ? 'Half Day ke liye' : 'Full Day ke liye';
      alert(`⏳ Abhi checkout nahi ho sakta!\n\n${modeLabel} kam se kam ${halfDayMode ? '4' : '8'} ghante chahiye.\nAbhi sirf ${Math.floor(workedMins/60)}h ${workedMins%60}m kaam kiya.\n\nAur ${remH}h ${pad(remM)}m baaki hain.`);
      return;
    }

    if (workedMins > MAX_WORK) {
      alert(`⚠️ ${halfDayMode ? '6' : '10'} ghante se zyada ho gaye!\nCheckout ho sakta hai — proceed kar rahe hain.`);
    }

    setCheckingOut(true);
    const token    = localStorage.getItem('token');
    const todayStr = fmtKey(new Date());

    try {
      const res = await fetch(`${API_URL}/api/attendance/checkout`, {
        method:  'POST',
        headers: { 'Content-Type':'application/json', 'Authorization': `Bearer ${token}` },
        body:    JSON.stringify({
          date:     todayStr,
          checkOut: checkOutTime,
          status:   finalStatus, // ✅ 'Half Day' ya 'Present' — time ke hisaab se
        }),
      });
      const data = await res.json();
      console.log('✅ Checkout response:', data);

      if (data.success) {
        const updatedRec = {
          ...todayRec,
          checkOut: checkOutTime,
          status:   finalStatus,
        };
        setTodayRec(updatedRec);
        setTodayStatus(halfDayMode ? 'halfDay' : 'present');
        setRecords(prev => prev.map(r => r.date === todayStr ? updatedRec : r));
        alert(`✅ Checkout Successful!\n\nCheck-In:  ${todayRec.checkIn}\nCheck-Out: ${checkOutTime}\nDuration:  ${getDuration(todayRec.checkIn, checkOutTime)}\nAttendance: ${halfDayMode ? 'HALF DAY 🌗' : 'PRESENT 🎉'}`);
      } else {
        alert('Checkout failed: ' + (data.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('❌ checkout error:', err);
      alert('Checkout error. Please try again.');
    }

    setCheckingOut(false);
  };

  // ── Derived State ─────────────────────────────────────────────────────────
  const today   = new Date();
  const { year: selYear, month: selMonth } = parseMonth(filterMonth);
  const allDaysInView = getAllDays(selYear, selMonth);

  const recordMap = {};
  records.forEach(r => { recordMap[r.date] = r; });

  const workingDays = allDaysInView.filter(d => getDayType(d).type === 'working');
  const presentCount = workingDays.filter(d => recordMap[fmtKey(d)]?.status === 'Present').length;
  const halfDayCount = workingDays.filter(d => recordMap[fmtKey(d)]?.status === 'Half Day').length;
  const absentCount  = workingDays.filter(d => {
    const r = recordMap[fmtKey(d)];
    return (!r || (r.status !== 'Present' && r.status !== 'LoggedIn' && r.status !== 'Half Day')) && d <= today;
  }).length;
  const attendancePercentage = (presentCount + absentCount) > 0
  ? Math.round(presentCount / (presentCount + absentCount) * 100) : 0;

  // Expected checkout time for today
  const halfDayModeToday = todayRec ? isLateLogin(todayRec.checkIn) : false;
  const expectedCheckOut = todayRec?.expectedCheckOut
    || (todayRec?.checkIn && todayRec.checkIn !== '-'
        ? addMinutesToTimeStr(todayRec.checkIn, halfDayModeToday ? 4 * 60 : 8 * 60)
        : '-');

  // Can checkout now?
  const checkInMins     = timeStrToMinutes(todayRec?.checkIn);
  const nowMins         = now.getHours() * 60 + now.getMinutes();
  const requiredWorkMin = halfDayModeToday ? 4 * 60 : 8 * 60;
  const canCheckout     = todayStatus === 'loggedIn'
    && checkInMins !== null
    && (nowMins - checkInMins) >= requiredWorkMin;

  // ── Excel Helpers ─────────────────────────────────────────────────────────
  const thinBorder = {
    top:   {style:'thin',color:{argb:'FFBFBFBF'}},
    left:  {style:'thin',color:{argb:'FFBFBFBF'}},
    bottom:{style:'thin',color:{argb:'FFBFBFBF'}},
    right: {style:'thin',color:{argb:'FFBFBFBF'}},
  };
  const applyCell = (cell, value, {bold=false,fc='FF333333',bg=null,ha='left',sz=11}={}) => {
    cell.value = value;
    cell.font  = {name:'Calibri', bold, color:{argb:fc}, size:sz};
    cell.alignment = {horizontal:ha, vertical:'middle'};
    cell.border = thinBorder;
    if (bg) cell.fill = {type:'pattern', pattern:'solid', fgColor:{argb:bg}};
  };
  const blankCell = (cell, bg='FFFFFFFF') => {
    cell.fill   = {type:'pattern', pattern:'solid', fgColor:{argb:bg}};
    cell.border = thinBorder;
  };

  const downloadExcel = async () => {
    const empName = user?.name||'Employee';
    const empId   = user?.employeeId||user?.id||'N/A';
    const {year,month} = parseMonth(filterMonth);
    const allDays = getAllDays(year,month);
    const wDays   = allDays.filter(d => getDayType(d).type==='working');
    const wkends  = allDays.filter(d => d.getDay()===0||d.getDay()===6).length;
    const hols    = allDays.filter(d => HOLIDAY_DATES[fmtKey(d)]).length;
    const pDays   = wDays.filter(d => recordMap[fmtKey(d)]?.status==='Present').length;
    const hDays   = wDays.filter(d => recordMap[fmtKey(d)]?.status==='Half Day').length;
    const aDays   = wDays.filter(d => {
      const r = recordMap[fmtKey(d)];
      return (!r || r.status==='Absent') && d<=today;
    }).length;
    const rate = wDays.length>0 ? Math.round((pDays + hDays * 0.5)/wDays.length*100) : 0;

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Attendance Report');
    ws.views = [{showGridLines:false, state:'normal'}];
    [8,20,16,16,18,18,16,16].forEach((w,i) => { ws.getColumn(i+1).width = w; });

    ws.mergeCells('A1:H1'); ws.getRow(1).height = 42;
    applyCell(ws.getCell('A1'),'ATTENDANCE REPORT',{bold:true,fc:'FFFFFFFF',bg:'FF1A3A5C',ha:'center',sz:18});

    [
      ['Employee Name', empName],
      ['Employee ID',   empId],
      ['Report Month',  filterMonth],
      ['Generated On',  today.toLocaleDateString('en-IN')],
    ].forEach(([l,v],i) => {
      const r = i+2; ws.getRow(r).height = 24;
      applyCell(ws.getCell(r,1), l, {bold:true,fc:'FF1A3A5C',bg:'FFD6E4F0'});
      applyCell(ws.getCell(r,2), v, {bg:'FFEAF4FB'});
      for(let c=3;c<=8;c++) blankCell(ws.getCell(r,c));
    });

    ws.getRow(6).height = 6;
    for(let c=1;c<=8;c++) blankCell(ws.getCell(6,c));

    ws.mergeCells('A7:H7'); ws.getRow(7).height = 28;
    applyCell(ws.getCell('A7'),'SUMMARY',{bold:true,fc:'FFFFFFFF',bg:'FF2E75B6',ha:'center',sz:13});

    [
      ['Total Days',       allDays.length, 'FFF2F2F2','FFF2F2F2','FF333333',false],
      ['Weekends',         wkends,         'FFF2F2F2','FFF2F2F2','FF333333',false],
      ['Public Holidays',  hols,           'FFFFF2CC','FFFFF2CC','FF7F6000',false],
      ['Working Days',     wDays.length,   'FFDEEBF7','FFDEEBF7','FF1A3A5C',true],
      ['Present Days',     pDays,          'FFE2EFDA','FFE2EFDA','FF375623',true],
      ['Half Days',        hDays,          'FFFFFDE7','FFFFFDE7','FF7F6000',true],
      ['Absent Days',      aDays,          'FFFCE4D6','FFFCE4D6','FFC00000',true],
      ['Attendance Rate', `${rate}%`,      'FFFFF2CC','FFFFF2CC','FF7F6000',true],
    ].forEach(([l,v,lb,vb,vf,vbd],i) => {
      const r = i+8; ws.getRow(r).height = 24;
      applyCell(ws.getCell(r,1), l, {bold:true,bg:lb,fc:'FF444444'});
      applyCell(ws.getCell(r,2), v, {bold:vbd,bg:vb,fc:vf,ha:'center'});
      for(let c=3;c<=8;c++) blankCell(ws.getCell(r,c),'FFFAFAFA');
    });

    ws.getRow(16).height = 6;
    for(let c=1;c<=8;c++) blankCell(ws.getCell(16,c));

    ws.mergeCells('A17:H17'); ws.getRow(17).height = 30;
    applyCell(ws.getCell('A17'),
      `Daily Attendance – ${filterMonth}  |  ${empName}`,
      {bold:true,fc:'FFFFFFFF',bg:'FF1A3A5C',ha:'center',sz:13});
    ws.getRow(18).height = 26;
    ['S.No','Date','Day','Status','Check In','Check Out','Duration','Remarks']
      .forEach((h,i) => {
        applyCell(ws.getCell(18,i+1), h, {bold:true,fc:'FFFFFFFF',bg:'FF2E75B6',ha:'center',sz:11});
      });

    let sno = 0;
    allDays.forEach((d,idx) => {
      if (d > today) return;
      const row = idx+19, ds = fmtKey(d), rec = recordMap[ds], di = getDayType(d);
      ws.getRow(row).height = 22;
      const dStr  = d.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'});
      const dName = d.toLocaleDateString('en-US',{weekday:'long'});
      let st,ci,co,rm,bg,fc,sb,sf,dur;

      if (di.type==='weekend') {
        st='Weekend'; ci=co=rm=dur='-';
        bg='FFF0F0F0'; fc='FF888888'; sb='FFE8E8E8'; sf='FF666666';
      } else if (di.type==='holiday') {
        st=di.label; ci=co='-'; dur='-'; rm='Public Holiday';
        bg='FFFFF8E1'; fc='FF7F6000'; sb='FFFFE0B2'; sf='FF7F6000';
      } else if (rec?.status==='Present') {
        sno++; st='Present'; ci=rec.checkIn; co=rec.checkOut;
        dur=getDuration(ci,co); rm=rec.remarks||'-';
        bg='FFEBF5EB'; fc='FF2D6A2D'; sb='FFC6EFCE'; sf='FF1F5C1F';
      } else if (rec?.status==='Half Day') {
        sno++; st='Half Day'; ci=rec.checkIn; co=rec.checkOut;
        dur=getDuration(rec.checkIn,rec.checkOut); rm=rec.remarks||'Late login - Half Day';
        bg='FFFFFDE7'; fc='FF7F6000'; sb='FFFFF9C4'; sf='FF7F6000';
      } else if (rec?.status==='LoggedIn') {
        sno++; st='In Progress'; ci=rec.checkIn;
        const expCo = rec.expectedCheckOut && rec.expectedCheckOut !== '-'
          ? rec.expectedCheckOut
          : addMinutesToTimeStr(rec.checkIn, isLateLogin(rec.checkIn) ? 4*60 : 8*60);
        co = expCo !== '-' ? `${expCo} (expected)` : 'Pending';
        dur='Ongoing'; rm=rec.remarks||'Checkout pending';
        bg='FFFFF3E0'; fc='FFE65100'; sb='FFFFE0B2'; sf='FFE65100';
      } else if (rec?.status==='Absent') {
        sno++; st='Absent';
        ci = rec.checkIn && rec.checkIn !== '-' ? rec.checkIn : '-';
        co='-'; dur='-'; rm=rec.remarks||'No login / No checkout';
        bg='FFFFF0F0'; fc='FFC00000'; sb='FFFFCCCC'; sf='FF990000';
      } else if (rec?.status==='Leave') {
        sno++; st='Leave'; ci=co='-'; dur='-'; rm=rec.remarks||'-';
        bg='FFE3F2FD'; fc='FF1565C0'; sb='FFBBDEFB'; sf='FF1565C0';
      } else {
        sno++; st='Absent'; ci=co='-'; dur='-'; rm=rec?.remarks||'No login';
        bg='FFFFF0F0'; fc='FFC00000'; sb='FFFFCCCC'; sf='FF990000';
      }

      const nw = di.type!=='working';
      [nw?'-':sno, dStr, dName, st, ci, co, dur, rm].forEach((v,ci2) => {
        applyCell(ws.getCell(row,ci2+1), v, {
          bold: ci2===3, fc: ci2===3?sf:fc, bg: ci2===3?sb:bg, ha:'center',
        });
      });
    });

    const lr = allDays.length+20;
    ws.mergeCells(`A${lr}:H${lr}`);
    const leg = ws.getCell(`A${lr}`);
    leg.value = 'Legend:   🟢 Present   🌗 Half Day   🔴 Absent   🟡 Holiday   ⬜ Weekend   🔵 Leave   🟠 In Progress';
    leg.font  = {name:'Calibri', italic:true, size:10, color:{argb:'FF666666'}};
    leg.alignment = {horizontal:'left', vertical:'middle'};

    const buf = await wb.xlsx.writeBuffer();
    saveAs(
      new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),
      `Attendance_${empName.replace(/\s+/g,'_')}_${filterMonth.replace(/\s+/g,'_')}.xlsx`
    );
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="p-6 flex items-center justify-center min-h-64">
      <div className="text-center">
        <Clock size={48} className="mx-auto mb-3 text-blue-400 animate-spin" />
        <p className="text-gray-500 text-sm">Loading attendance...</p>
      </div>
    </div>
  );

  // ── UI ────────────────────────────────────────────────────────────────────
  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">

      {/* ── Header ── */}
      <div className="bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 rounded-2xl p-4 sm:p-8 text-white shadow-xl border border-slate-600">
        <div className="flex items-center gap-4 sm:gap-5 mb-4 sm:mb-6">
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-[20px] bg-gradient-to-br from-brand-600 to-blue-600 flex items-center justify-center text-white shadow-xl shadow-brand-500/20 overflow-hidden group shrink-0">
            <div className="absolute inset-0 bg-white/20 blur-md rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <Clock size={30} strokeWidth={2.5} className="relative z-10 drop-shadow-md group-hover:scale-110 transition-transform duration-300" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-[36px] font-bold font-display text-white tracking-tight leading-tight truncate">
              My Attendance
            </h1>
            <p className="text-slate-300 text-xs sm:text-[15px] mt-1 font-medium">
              Track and manage your attendance records
            </p>
          </div>
          <button
            onClick={() => { setLoading(true); setRefreshKey(k => k+1); }}
            title="Refresh attendance"
            style={{background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.2)',borderRadius:'10px',padding:'8px 12px',color:'white',cursor:'pointer',fontSize:'12px',fontWeight:'500',display:'flex',alignItems:'center',gap:'6px',backdropFilter:'blur(4px)',whiteSpace:'nowrap'}}>
            🔄 <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
        <div className="mt-4 sm:mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          {[
            {label:'Present Days',    value:presentCount,               dot:'bg-green-400'},
            {label:'Half Days',       value:halfDayCount,               dot:'bg-yellow-400'},
            {label:'Attendance Rate', value:`${attendancePercentage}%`, dot:'bg-blue-400'},
            {label:'Working Days',    value:workingDays.length,         dot:'bg-brand-400'},
          ].map(({label,value,dot}) => (
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

      {/* ── Today's Attendance Card ── */}
      <div className="bg-gradient-to-r from-blue-50 to-brand-50 rounded-2xl p-4 sm:p-6 border border-blue-200">
        <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-1">📋 Today's Attendance</h2>
        <p className="text-xs sm:text-sm text-gray-500 mb-4">
          Full Day: <strong>9:00 AM – 11:00 AM login → 8h kaam → Present</strong>
          <span className="hidden sm:inline">&nbsp;|&nbsp;</span>
          <br className="sm:hidden" />
          Half Day: <strong>11:00 AM ke baad login → 4h kaam → Half Day</strong>
        </p>

        {/* TOO EARLY */}
        {todayStatus === 'early' && (
          <div className="p-5 bg-blue-50 border-2 border-blue-200 rounded-2xl text-center">
            <Clock size={40} className="mx-auto mb-2 text-blue-400" />
            <p className="text-blue-700 font-semibold text-lg">Office abhi start nahi hua</p>
            <p className="text-blue-500 text-sm mt-1">Login window: 9:00 AM se shuru hoti hai</p>
          </div>
        )}

        {/* ABSENT */}
        {todayStatus === 'absent' && (
          <div className="p-4 sm:p-5 bg-red-50 border-2 border-red-300 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xl sm:text-[24px] font-bold font-display text-red-700">ABSENT ❌</p>
                <p className="text-red-500 text-sm mt-1">Login nahi kiya ya checkout nahi hua</p>
              </div>
              <XCircle size={40} className="text-red-500 shrink-0" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-lg p-3 text-center border border-red-200">
                <p className="text-xs text-gray-400 uppercase font-medium mb-1">Login Time</p>
                <p className="text-base sm:text-lg font-bold text-red-600">
                  {todayRec?.checkIn && todayRec.checkIn !== '-' && todayRec.checkIn !== '--'
                    ? todayRec.checkIn
                    : '—'}
                </p>
              </div>
              <div className="bg-white rounded-lg p-3 text-center border border-red-200">
                <p className="text-xs text-gray-400 uppercase font-medium mb-1">Reason</p>
                <p className="text-xs sm:text-sm font-medium text-red-500">{todayRec?.remarks || 'No login / No checkout'}</p>
              </div>
            </div>
          </div>
        )}

        {/* LOGGED IN — Full Day OR Half Day mode */}
        {todayStatus === 'loggedIn' && todayRec && (
          <div className="space-y-4">
            <div className={`p-4 sm:p-5 border-2 rounded-2xl ${halfDayModeToday ? 'bg-yellow-50 border-yellow-300' : 'bg-orange-50 border-orange-300'}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="min-w-0 pr-2">
                  {halfDayModeToday ? (
                    <>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <p className="text-xl sm:text-[24px] font-bold font-display text-yellow-700">⏳ Logged In</p>
                        <span className="px-2 py-0.5 bg-yellow-200 text-yellow-800 text-xs font-bold rounded-full">HALF DAY MODE</span>
                      </div>
                      <p className="text-yellow-600 text-xs sm:text-sm">11 AM ke baad login → 4 ghante baad checkout → Half Day ✅</p>
                    </>
                  ) : (
                    <>
                      <p className="text-xl sm:text-[24px] font-bold font-display text-orange-700">⏳ Logged In</p>
                      <p className="text-orange-500 text-xs sm:text-sm mt-1">8 ghante baad checkout karo → Present ho jaoge</p>
                    </>
                  )}
                </div>
                <Clock size={40} className={`shrink-0 ${halfDayModeToday ? 'text-yellow-500' : 'text-orange-500'}`} />
              </div>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {[
                  {label:'Check-In',          val:todayRec.checkIn,   color:'text-gray-800'},
                  {label:'Expected Checkout',  val:expectedCheckOut,   color:halfDayModeToday?'text-yellow-600':'text-orange-600'},
                  {label:'Check-Out',          val:'Pending',          color:'text-gray-400'},
                ].map(({label,val,color}) => (
                  <div key={label} className={`bg-white rounded-lg p-2 sm:p-3 text-center border ${halfDayModeToday ? 'border-yellow-200' : 'border-orange-200'}`}>
                    <p className="text-xs text-gray-400 uppercase font-medium mb-1 truncate">{label}</p>
                    <p className={`text-sm sm:text-lg font-bold ${color}`}>{val}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                {canCheckout ? (
                  <button
                    onClick={handleCheckOut}
                    disabled={checkingOut}
                    className={`w-full flex items-center justify-center gap-2 py-3 text-white font-semibold rounded-2xl transition-colors text-sm sm:text-base shadow-md disabled:opacity-50 ${halfDayModeToday ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'}`}>
                    <LogOut size={20} />
                    {checkingOut ? 'Checking Out...' : halfDayModeToday ? '🌗 Check Out & Mark Half Day' : '✅ Check Out & Mark Present'}
                  </button>
                ) : (
                  <div className="w-full py-3 bg-gray-100 border border-gray-200 rounded-2xl text-center">
                    <p className="text-gray-500 text-xs sm:text-sm">
                      Checkout available at <strong className={halfDayModeToday ? 'text-yellow-600' : 'text-orange-600'}>{expectedCheckOut}</strong>
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                      {halfDayModeToday ? '4 ghante complete hone ke baad' : '8 ghante complete hone ke baad'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Rules */}
            <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2 text-sm">
                <AlertCircle size={16} className="text-blue-500 shrink-0" /> Attendance Rules
              </h3>
              <ul className="text-xs sm:text-sm text-gray-600 space-y-1">
                <li>🕘 <span className="font-medium">Full Day login:</span> 9:00 AM – 11:00 AM (8h kaam → Present)</li>
                <li>🌗 <span className="font-medium">Half Day login:</span> 11:00 AM ke baad (4h kaam → Half Day)</li>
                <li>❌ <span className="font-medium">Absent:</span> Login nahi kiya, ya checkout nahi kiya</li>
              </ul>
            </div>
          </div>
        )}

        {/* HALF DAY ✅ */}
        {todayStatus === 'halfDay' && todayRec && (
          <div className="p-4 sm:p-5 bg-yellow-50 border-2 border-yellow-300 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xl sm:text-[24px] font-bold font-display text-yellow-700">HALF DAY 🌗</p>
                <p className="text-yellow-600 text-xs sm:text-sm mt-1">Aaj ki half day attendance mark ho gayi!</p>
              </div>
              <CheckCircle size={40} className="text-yellow-600 shrink-0" />
            </div>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {[
                {label:'Check-In',  val:todayRec.checkIn,              color:'text-gray-800'},
                {label:'Check-Out', val:todayRec.checkOut||'—',        color:'text-yellow-700'},
                {label:'Duration',  val:getDuration(todayRec.checkIn, todayRec.checkOut)||'—', color:'text-blue-700'},
              ].map(({label,val,color}) => (
                <div key={label} className="bg-white rounded-lg p-2 sm:p-3 text-center border border-yellow-200">
                  <p className="text-xs text-gray-400 uppercase font-medium mb-1">{label}</p>
                  <p className={`text-sm sm:text-lg font-bold ${color}`}>{val}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PRESENT */}
        {todayStatus === 'present' && todayRec && (
          <div className="p-4 sm:p-5 bg-green-50 border-2 border-green-300 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xl sm:text-[24px] font-bold font-display text-green-700">PRESENT ✅</p>
                <p className="text-green-500 text-xs sm:text-sm mt-1">
                  {(!todayRec.checkOut || todayRec.checkOut === '-')
                    ? 'Check-in ho gaya! Checkout karo din khatam hone pe.'
                    : 'Aaj ki attendance successfully mark ho gayi!'}
                </p>
              </div>
              <CheckCircle size={40} className="text-green-600 shrink-0" />
            </div>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {[
                {label:'Check-In',  val:todayRec.checkIn,                                                                     color:'text-gray-800'},
                {label:'Check-Out', val:(!todayRec.checkOut||todayRec.checkOut==='-')?'Pending':todayRec.checkOut,           color:'text-green-700'},
                {label:'Duration',  val:getDuration(todayRec.checkIn,todayRec.checkOut)||'Ongoing',                           color:'text-blue-700'},
              ].map(({label,val,color}) => (
                <div key={label} className="bg-white rounded-lg p-2 sm:p-3 text-center border border-green-200">
                  <p className="text-xs text-gray-400 uppercase font-medium mb-1">{label}</p>
                  <p className={`text-sm sm:text-lg font-bold ${color}`}>{val}</p>
                </div>
              ))}
            </div>

            {(!todayRec.checkOut || todayRec.checkOut === '-') && (
              <div className="mt-4">
                {(() => {
                  const ciMins = timeStrToMinutes(todayRec.checkIn);
                  const nowM   = new Date().getHours() * 60 + new Date().getMinutes();
                  const worked = ciMins ? nowM - ciMins : 0;
                  const expCo  = addMinutesToTimeStr(todayRec.checkIn, 8 * 60);
                  const canCo  = worked >= 8 * 60;
                  return canCo ? (
                    <button
                      onClick={handleCheckOut}
                      disabled={checkingOut}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold rounded-2xl transition-colors text-sm sm:text-base shadow-md">
                      <LogOut size={20} />
                      {checkingOut ? 'Checking Out...' : '✅ Check Out & Complete'}
                    </button>
                  ) : (
                    <div className="w-full py-3 bg-gray-100 border border-gray-200 rounded-2xl text-center">
                      <p className="text-gray-500 text-xs sm:text-sm">
                        Checkout available at <strong className="text-green-600">{expCo}</strong>
                      </p>
                      <p className="text-gray-400 text-xs mt-1">8 ghante complete hone ke baad</p>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* NULL */}
        {todayStatus === null && (
          <div className="text-center py-8">
            <Clock size={48} className="mx-auto mb-3 text-gray-400 animate-pulse" />
            <p className="text-gray-500">Attendance check ho rahi hai...</p>
          </div>
        )}
      </div>

      {/* ── Attendance History Table ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
          <h2 className="text-base sm:text-lg font-semibold text-gray-800">Attendance History</h2>
          <div className="flex items-center gap-2 sm:gap-3">
            <select
              value={filterMonth}
              onChange={e => setFilterMonth(e.target.value)}
              className="flex-1 sm:flex-none px-3 sm:px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <button
              onClick={downloadExcel}
              className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm whitespace-nowrap">
              <Download size={16} /> <span className="hidden sm:inline">Download</span> Excel
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="bg-gray-50">
              <tr>
                {['S.No','Date','Day','Status','Check In','Check Out','Duration','Remarks'].map(h => (
                  <th key={h} className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(() => {
                let sno = 0;
                return allDaysInView.map(d => {
                  const ds  = fmtKey(d);
                  const rec = recordMap[ds];
                  const di  = getDayType(d);
                  if (d > today) return null;

                  let st,ci,co,rm,rc,bc,dur;

                  if (di.type==='weekend') {
                    st='Weekend'; ci=co=rm=dur='-';
                    rc='bg-gray-50'; bc='bg-gray-100 text-gray-500';
                  } else if (di.type==='holiday') {
                    st=di.label; ci=co='-'; dur='-'; rm='Public Holiday';
                    rc='bg-yellow-50'; bc='bg-yellow-100 text-yellow-700';
                  } else if (rec?.status==='Present') {
                    sno++; st='Present'; ci=rec.checkIn; co=rec.checkOut;
                    dur=getDuration(ci,co); rm=rec.remarks||'-';
                    rc='bg-green-50 hover:bg-green-100'; bc='bg-green-100 text-green-800';
                  } else if (rec?.status==='Half Day') {
                    sno++; st='Half Day'; ci=rec.checkIn; co=rec.checkOut;
                    dur=getDuration(rec.checkIn,rec.checkOut); rm=rec.remarks||'Late login - Half Day';
                    rc='bg-yellow-50 hover:bg-yellow-100'; bc='bg-yellow-200 text-yellow-800';
                  } else if (rec?.status==='LoggedIn') {
                    sno++; st='In Progress'; ci=rec.checkIn;
                    const expCo = rec.expectedCheckOut && rec.expectedCheckOut !== '-'
                      ? rec.expectedCheckOut
                      : addMinutesToTimeStr(rec.checkIn, isLateLogin(rec.checkIn) ? 4*60 : 8*60);
                    co = expCo !== '-' ? `${expCo} (expected)` : 'Pending';
                    dur='Ongoing'; rm=rec.remarks||'Checkout pending';
                    rc='bg-orange-50 hover:bg-orange-100'; bc='bg-orange-100 text-orange-700';
                  } else if (rec?.status==='Absent') {
                    sno++; st='Absent';
                    ci = rec.checkIn && rec.checkIn !== '-' ? rec.checkIn : '-';
                    co='-'; dur='-'; rm=rec.remarks||'No login / No checkout';
                    rc='bg-red-50 hover:bg-red-100'; bc='bg-red-100 text-red-700';
                  } else if (rec?.status==='Leave') {
                    sno++; st='Leave'; ci=co='-'; dur='-'; rm=rec.remarks||'-';
                    rc='bg-blue-50 hover:bg-blue-100'; bc='bg-blue-100 text-blue-800';
                  } else {
                    sno++; st='Absent'; ci=co='-'; dur='-'; rm=rec?.remarks||'No login';
                    rc='bg-red-50 hover:bg-red-100'; bc='bg-red-100 text-red-700';
                  }

                  const nw = di.type !== 'working';
                  return (
                    <tr key={ds} className={`${rc} transition-colors`}>
                      <td className="px-3 sm:px-4 py-3 text-sm text-gray-500">{nw ? '–' : sno}</td>
                      <td className="px-3 sm:px-4 py-3 text-sm font-medium text-gray-800 whitespace-nowrap">
                        {d.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {d.toLocaleDateString('en-US',{weekday:'long'})}
                      </td>
                      <td className="px-3 sm:px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${bc}`}>{st}</span>
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-sm font-medium text-gray-700 whitespace-nowrap">{ci}</td>
                      <td className="px-3 sm:px-4 py-3 text-sm font-medium text-gray-700 whitespace-nowrap">{co}</td>
                      <td className="px-3 sm:px-4 py-3 text-sm font-medium text-blue-600 whitespace-nowrap">{dur}</td>
                      <td className="px-3 sm:px-4 py-3 text-sm text-gray-400 italic">{rm}</td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="px-4 sm:px-6 py-3 bg-gray-50 border-t border-gray-100 flex flex-wrap gap-2 sm:gap-4 text-xs text-gray-500">
          {[
            ['bg-green-400',  'Present'],
            ['bg-yellow-400', 'Half Day'],
            ['bg-red-400',    'Absent'],
            ['bg-orange-400', 'In Progress'],
            ['bg-gray-300',   'Weekend'],
            ['bg-amber-300',  'Holiday'],
            ['bg-blue-400',   'Leave'],
          ].map(([c,l]) => (
            <span key={l} className="flex items-center gap-1">
              <span className={`w-3 h-3 rounded-full ${c} inline-block`} />{l}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MyAttendance;