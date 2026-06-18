import React, { useState, useEffect } from 'react';
import { Layers, Download, TrendingUp, AlertCircle, ChevronRight, Loader, Calendar, ArrowLeft } from 'lucide-react';
import jsPDF from 'jspdf';
const trimaxLogo = process.env.PUBLIC_URL + '/trimax-logo.png';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const pad    = n => String(n).padStart(2, '0');
const fmtKey = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;

const HOLIDAY_DATES = {
  '2026-03-14':'Holi',           '2026-04-03':'Good Friday',
  '2026-04-10':'Eid al-Fitr',    '2026-04-18':'Mahavir Jayanti',
  '2026-05-11':'Buddha Purnima', '2026-08-15':'Independence Day',
  '2026-08-22':'Janmashtami',    '2026-10-02':'Gandhi Jayanti',
  '2026-10-12':'Dussehra',       '2026-11-01':'Diwali',
  '2026-11-19':'Guru Nanak Jayanti','2026-12-25':'Christmas',
};

const getAllDays = (year, month) => {
  const days = [], d = new Date(year, month, 1);
  while (d.getMonth() === month) { days.push(new Date(d)); d.setDate(d.getDate()+1); }
  return days;
};

const isWeekendOrHoliday = (d) => {
  if (d.getDay() === 0 || d.getDay() === 6) return true;
  if (HOLIDAY_DATES[fmtKey(d)]) return true;
  return false;
};

const safeDateKey = (rawDate) => {
  if (!rawDate) return '';
  const d = new Date(rawDate);
  if (isNaN(d.getTime())) return String(rawDate).slice(0, 10);
  return fmtKey(d);
};

const getBase64FromUrl = (url) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width  = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext('2d').drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = url;
  });

const generatePayslipHistory = (salary, attendanceRecords, months = 6) => {
  const result = [];
  const now    = new Date();
  const today  = fmtKey(now);

  const recordMap = {};
  attendanceRecords.forEach(r => {
    const key = safeDateKey(r.date);
    if (key) recordMap[key] = r.status;
  });

  for (let i = 0; i < months; i++) {
    const date       = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label      = date.toLocaleString('default', { month: 'long', year: 'numeric' });
    const creditDate = new Date(date.getFullYear(), date.getMonth() + 1, 1)
      .toISOString().split('T')[0];

    const allDays     = getAllDays(date.getFullYear(), date.getMonth());
    const workingDays = allDays.filter(d => !isWeekendOrHoliday(d));
    const passedWorkingDays = workingDays.filter(d => fmtKey(d) <= today);

    let presentDays = 0, halfDays = 0, inProgressDays = 0;
    passedWorkingDays.forEach(d => {
      const status = recordMap[fmtKey(d)];
      if      (status === 'Present')  presentDays++;
      else if (status === 'Half Day') halfDays++;
      else if (status === 'LoggedIn') inProgressDays++;
    });

    const absentDays = Math.max(
      passedWorkingDays.length - presentDays - halfDays - inProgressDays, 0
    );

    const safeWorkingDays = workingDays.length || 1;
    const perDaySalary    = Math.round(salary / safeWorkingDays) || 0;
    const halfDayLop      = Math.round((halfDays * perDaySalary) / 2) || 0;
    const fullLop         = absentDays * perDaySalary || 0;
    const lopDeduction    = fullLop + halfDayLop || 0;
    const payableSalary   = Math.max(salary - lopDeduction, 0) || 0;

    const basic           = Math.floor(payableSalary * 0.50) || 0;
    const hra             = Math.floor(payableSalary * 0.20) || 0;
    const allowances      = (payableSalary - basic - hra)    || 0;
    const pf              = Math.floor(basic * 0.12)         || 0;
    const professionalTax = 200;
    const tds             = Math.floor(payableSalary * 0.05) || 0;
    const totalDeductions = (pf + professionalTax + tds + lopDeduction) || 0;
    const netSalary       = Math.max(payableSalary - pf - professionalTax - tds, 0) || 0;

    result.push({
      id: i + 1, month: label, date: creditDate,
      basic, hra, allowances, pf, professionalTax, tds,
      lopDeduction, absentDays, halfDays, inProgressDays,
      perDaySalary, totalDeductions, netSalary,
      presentDays, workingDays: workingDays.length,
      passedDays: passedWorkingDays.length, payableSalary,
    });
  }
  return result;
};

// ── Component ────────────────────────────────────────────────────────────────
const MyPayslips = () => {
  const [payslips, setPayslips]               = useState([]);
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [loading, setLoading]                 = useState(true);
  const [error, setError]                     = useState('');
  const [userName, setUserName]               = useState('');
  const [userEmail, setUserEmail]             = useState('');
  const [userMobile, setUserMobile]           = useState('');
  // Mobile: track which view is shown — 'list' or 'detail'
  const [mobileView, setMobileView]           = useState('list');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token   = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        const [profileRes, attendanceRes] = await Promise.all([
          fetch(`${API_URL}/api/auth/me`,                  { headers }),
          fetch(`${API_URL}/api/attendance/my-attendance`, { headers }),
        ]);

        const profileData    = await profileRes.json();
        const attendanceData = await attendanceRes.json();

        if (!profileData.success) throw new Error(profileData.message || 'Failed to fetch profile');

        const user   = profileData.data || profileData.user;
        const salary = Math.round(Number(user.salary)) || 0;

        setUserName(user.name   || '');
        setUserEmail(user.email || '');
        setUserMobile(user.mobile || user.phone || user.contact || '');

        if (salary === 0) {
          setError('Salary not assigned yet. Please contact HR.');
          setLoading(false);
          return;
        }

        const attendanceRecords = (attendanceData.success && Array.isArray(attendanceData.data))
          ? attendanceData.data : [];

        const generated = generatePayslipHistory(salary, attendanceRecords, 6);
        setPayslips(generated);
        setSelectedPayslip(generated[0]);
      } catch (err) {
        setError(err.message || 'Failed to load payslips');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ── PDF Download ──────────────────────────────────────────────────────────
  const downloadPDF = async () => {
    if (!selectedPayslip) return;

    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const W = 210, margin = 15;
    const PAGE_H = 297;
    let y = 0;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    doc.text('Mob.:- +91 8588942008.', margin, 11);
    doc.setTextColor(41, 128, 185);
    doc.text('Email:- info@trimaxconnect.in', margin, 17);

    try {
      const logoBase64 = await getBase64FromUrl(trimaxLogo);
      doc.addImage(logoBase64, 'PNG', W - margin - 42, 2, 42, 21);
    } catch {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(44, 62, 80);
      doc.text('TRIMAX CONNECT', W - margin - 42, 14);
    }

    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.4);
    doc.line(margin, 25, W - margin, 25);

    y = 34;

    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, y, W - margin * 2, 10, 2, 2, 'F');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(37, 99, 235);
    doc.text('SALARY PAYSLIP', margin + 4, y + 7);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, W - margin - 4, y + 7, { align: 'right' });
    y += 14;

    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, y, W - margin * 2, 28, 3, 3, 'F');

    const lx = margin + 4;
    const vx = margin + 34;
    const lx2 = margin + 97;
    const vx2 = margin + 127;

    doc.setFontSize(8.5);

    doc.setFont('helvetica', 'bold');   doc.setTextColor(120, 130, 150);
    doc.text('Employee',   lx,  y + 8);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(15, 23, 42);
    doc.text(userName || 'N/A', vx, y + 8);

    doc.setFont('helvetica', 'bold');   doc.setTextColor(120, 130, 150);
    doc.text('Pay Period', lx2, y + 8);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(15, 23, 42);
    doc.text(selectedPayslip.month, vx2, y + 8);

    doc.setFont('helvetica', 'bold');   doc.setTextColor(120, 130, 150);
    doc.text('Email',      lx,  y + 17);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(41, 128, 185);
    doc.text(userEmail || '—', vx, y + 17);

    doc.setFont('helvetica', 'bold');   doc.setTextColor(120, 130, 150);
    doc.text('Credit Date', lx2, y + 17);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(15, 23, 42);
    doc.text(new Date(selectedPayslip.date).toLocaleDateString('en-IN'), vx2, y + 17);

    doc.setFont('helvetica', 'bold');   doc.setTextColor(120, 130, 150);
    doc.text('Mobile',     lx,  y + 26);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(15, 23, 42);
    doc.text(userMobile || '—', vx, y + 26);

    y += 34;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(37, 99, 235);
    doc.text('ATTENDANCE SUMMARY', margin, y);
    y += 5;

    const attCols   = ['Working Days', 'Present', 'Half Days', 'Absent'];
    const attVals   = [selectedPayslip.workingDays, selectedPayslip.presentDays, selectedPayslip.halfDays, selectedPayslip.absentDays];
    const attColors = [[241,245,249],[220,252,231],[254,249,195],[254,226,226]];
    const boxW      = (W - margin * 2 - 9) / 4;

    attCols.forEach((col, i) => {
      const x = margin + i * (boxW + 3);
      doc.setFillColor(...attColors[i]);
      doc.roundedRect(x, y, boxW, 18, 2, 2, 'F');
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text(String(attVals[i] ?? 0), x + boxW / 2, y + 9, { align: 'center' });
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(col, x + boxW / 2, y + 15, { align: 'center' });
    });
    y += 22;

    if (selectedPayslip.lopDeduction > 0) {
      doc.setFontSize(8);
      doc.setTextColor(185, 28, 28);
      doc.setFont('helvetica', 'bold');
      doc.text(
        `Per Day Rate: Rs.${selectedPayslip.perDaySalary}  |  LOP Deduction: Rs.${selectedPayslip.lopDeduction}`,
        W / 2, y, { align: 'center' }
      );
    } else {
      doc.setFontSize(8);
      doc.setTextColor(21, 128, 61);
      doc.setFont('helvetica', 'bold');
      doc.text('Full attendance - No LOP deduction!', W / 2, y, { align: 'center' });
    }
    y += 10;

    const drawTable = (title, rows, totalLabel, totalAmt, titleRgb, totalBgRgb, totalTextRgb) => {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...titleRgb);
      doc.text(title, margin, y);
      y += 5;

      rows.forEach(([label, amt], idx) => {
        const bg = idx % 2 === 0 ? [248,250,252] : [255,255,255];
        doc.setFillColor(...bg);
        doc.rect(margin, y, W - margin * 2, 8, 'F');
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        doc.text(label, margin + 3, y + 5.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(`Rs.${(amt || 0).toLocaleString()}`, W - margin - 3, y + 5.5, { align: 'right' });
        y += 8;
      });

      doc.setFillColor(...totalBgRgb);
      doc.roundedRect(margin, y, W - margin * 2, 9, 2, 2, 'F');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...totalTextRgb);
      doc.text(totalLabel, margin + 3, y + 6);
      doc.text(`Rs.${(totalAmt || 0).toLocaleString()}`, W - margin - 3, y + 6, { align: 'right' });
      y += 14;
    };

    drawTable(
      'EARNINGS',
      [
        ['Basic Salary (50%)',               selectedPayslip.basic],
        ['House Rent Allowance - HRA (20%)', selectedPayslip.hra],
        ['Other Allowances',                 selectedPayslip.allowances],
      ],
      'Gross Earnings', selectedPayslip.payableSalary,
      [21,128,61], [220,252,231], [20,83,45]
    );

    const deductionRows = [
      ['Provident Fund (PF) @ 12% of Basic', selectedPayslip.pf],
      ['Professional Tax',                   selectedPayslip.professionalTax],
      ['Income Tax - TDS @ 5%',              selectedPayslip.tds],
    ];
    if (selectedPayslip.lopDeduction > 0) {
      const lopParts = [
        selectedPayslip.absentDays > 0 ? `${selectedPayslip.absentDays} absent` : '',
        selectedPayslip.halfDays > 0   ? `${selectedPayslip.halfDays} half day` : '',
      ].filter(Boolean).join(' + ');
      deductionRows.push([
        `Loss of Pay - LOP (${lopParts} x Rs.${selectedPayslip.perDaySalary})`,
        selectedPayslip.lopDeduction,
      ]);
    }

    drawTable(
      'DEDUCTIONS',
      deductionRows,
      'Total Deductions', selectedPayslip.totalDeductions,
      [185,28,28], [254,226,226], [127,29,29]
    );

    doc.setFillColor(37, 99, 235);
    doc.roundedRect(margin, y, W - margin * 2, 26, 4, 4, 'F');
    doc.setFillColor(109, 40, 217);
    doc.roundedRect(W - margin - 55, y, 55, 26, 4, 4, 'F');
    doc.setTextColor(191, 219, 254);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('NET SALARY (TAKE HOME)', margin + 6, y + 9);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(`Rs.${(selectedPayslip.netSalary || 0).toLocaleString()}`, margin + 6, y + 21);
    doc.setTextColor(221, 214, 254);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Credited: ${new Date(selectedPayslip.date).toLocaleDateString('en-IN')}`,
      W - margin - 4, y + 9, { align: 'right' }
    );
    y += 32;

    const footerY = PAGE_H - 18;

    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.4);
    doc.line(margin, footerY - 8, W - margin, footerY - 8);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    doc.text('Sector- 44, Noida UP- 201301', W / 2, footerY - 2, { align: 'center' });

    const parts = [
      { text: 'Mob.:- +91 8588942008.',    color: [50, 50, 50]    },
      { text: '   Email:- ',               color: [50, 50, 50]    },
      { text: 'info@trimaxconnect.in',    color: [41, 128, 185]  },
      { text: '   Website:- ',             color: [50, 50, 50]    },
      { text: 'www.trimaxconnect.in',     color: [41, 128, 185]  },
    ];
    doc.setFontSize(8);
    const totalLineW = parts.reduce((s, p) => s + doc.getTextWidth(p.text), 0);
    let cx = (W - totalLineW) / 2;
    parts.forEach(({ text, color }) => {
      doc.setTextColor(...color);
      doc.text(text, cx, footerY + 5);
      cx += doc.getTextWidth(text);
    });

    doc.setFontSize(7);
    doc.setTextColor(160, 160, 160);
    doc.setFont('helvetica', 'italic');
    doc.text('This is a system-generated payslip. No signature required.', W / 2, footerY + 11, { align: 'center' });

    doc.save(`Payslip_${userName.replace(/\s+/g,'_')}_${selectedPayslip.month.replace(/\s+/g,'_')}.pdf`);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="p-6 flex items-center justify-center h-64">
      <Loader className="animate-spin text-blue-600" size={32} />
    </div>
  );

  if (error) return (
    <div className="p-6">
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
    </div>
  );

  // ── Mobile: handle payslip selection ─────────────────────────────────────
  const handleSelectPayslip = (payslip) => {
    setSelectedPayslip(payslip);
    setMobileView('detail');
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-5">
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-[20px] bg-gradient-to-br from-brand-600 to-blue-600 flex items-center justify-center text-white shadow-xl shadow-brand-500/20 overflow-hidden group shrink-0">
            <div className="absolute inset-0 bg-white/20 blur-md rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <Layers size={30} strokeWidth={2.5} className="relative z-10 drop-shadow-md group-hover:scale-110 transition-transform duration-300" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-[34px] font-black font-display text-transparent bg-clip-text bg-gradient-to-r from-slate-700 via-brand-800 to-brand-600 tracking-tight leading-tight pb-1 mb-0.5">
              Salary & Payslips
            </h1>
            <p className="text-[14px] sm:text-[15px] font-medium text-slate-500">
              {userName ? `${userName} — ` : ''}View and download your monthly payslips
            </p>
          </div>
        </div>

      {/* ── DESKTOP layout: side-by-side (hidden on mobile) ── */}
      <div className="hidden lg:grid lg:grid-cols-3 gap-6">

        {/* Payslip List */}
        <div className="lg:col-span-1 space-y-3">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Payslip History</h2>
          {payslips.map(payslip => (
            <div
              key={payslip.id}
              onClick={() => setSelectedPayslip(payslip)}
              className={`p-4 rounded-2xl cursor-pointer transition-all ${
                selectedPayslip?.id === payslip.id
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-800 hover:shadow-md border border-gray-100'
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">{payslip.month}</h3>
                  <p className={`text-sm mt-1 ${selectedPayslip?.id === payslip.id ? 'text-blue-100' : 'text-gray-600'}`}>
                    ₹{(payslip.netSalary || 0).toLocaleString()}
                  </p>
                  {payslip.lopDeduction > 0 && (
                    <span className={`text-xs mt-1 inline-block px-2 py-0.5 rounded-full font-medium ${
                      selectedPayslip?.id === payslip.id
                        ? 'bg-red-400/30 text-red-100'
                        : 'bg-red-100 text-red-600'
                    }`}>
                      LOP: ₹{payslip.lopDeduction.toLocaleString()}
                    </span>
                  )}
                </div>
                <ChevronRight size={20} />
              </div>
            </div>
          ))}
        </div>

        {/* Payslip Detail (desktop) */}
        {selectedPayslip && <PayslipDetail
          selectedPayslip={selectedPayslip}
          userName={userName}
          userEmail={userEmail}
          userMobile={userMobile}
          downloadPDF={downloadPDF}
          onBack={null}
        />}
      </div>

      {/* ── MOBILE layout: stacked views (visible only on mobile/tablet) ── */}
      <div className="lg:hidden">
        {mobileView === 'list' && (
          <div className="space-y-3">
            <h2 className="text-base font-semibold text-gray-800">Payslip History</h2>
            {payslips.map(payslip => (
              <div
                key={payslip.id}
                onClick={() => handleSelectPayslip(payslip)}
                className="p-4 rounded-2xl cursor-pointer transition-all bg-white text-gray-800 hover:shadow-md border border-gray-100 active:bg-blue-50"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">{payslip.month}</h3>
                    <p className="text-sm mt-1 text-gray-600">
                      ₹{(payslip.netSalary || 0).toLocaleString()}
                    </p>
                    {payslip.lopDeduction > 0 && (
                      <span className="text-xs mt-1 inline-block px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-600">
                        LOP: ₹{payslip.lopDeduction.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <ChevronRight size={20} className="text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        )}

        {mobileView === 'detail' && selectedPayslip && (
          <PayslipDetail
            selectedPayslip={selectedPayslip}
            userName={userName}
            userEmail={userEmail}
            userMobile={userMobile}
            downloadPDF={downloadPDF}
            onBack={() => setMobileView('list')}
          />
        )}
      </div>
    </div>
  );
};

// ── Extracted Detail Panel ────────────────────────────────────────────────────
const PayslipDetail = ({ selectedPayslip, userName, userEmail, userMobile, downloadPDF, onBack }) => (
  <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-8">
    {/* Header row */}
    <div className="flex justify-between items-start mb-5 sm:mb-6 gap-3">
      <div className="flex items-start gap-2">
        {/* Back button — only on mobile */}
        {onBack && (
          <button
            onClick={onBack}
            className="mt-1 p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0"
            aria-label="Back to list"
          >
            <ArrowLeft size={20} />
          </button>
        )}
        <div>
          <h2 className="text-xl sm:text-[24px] font-bold font-display text-gray-800">{selectedPayslip.month}</h2>
          <p className="text-gray-600 text-sm mt-1">Payslip for the month</p>
        </div>
      </div>
      <button
        onClick={downloadPDF}
        className="px-3 py-2 sm:px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5 text-sm sm:text-base flex-shrink-0"
      >
        <Download size={16} />
        <span className="hidden xs:inline">Download </span>PDF
      </button>
    </div>

    {/* Employee Info — 1 col on mobile, 3 on sm+ */}
    <div className="mb-5 sm:mb-6 p-4 bg-gray-50 rounded-2xl border border-gray-200 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
      <div>
        <p className="text-xs text-gray-500 mb-0.5">Employee</p>
        <p className="font-semibold text-gray-800">{userName || '—'}</p>
      </div>
      <div>
        <p className="text-xs text-gray-500 mb-0.5">Email</p>
        <p className="font-semibold text-blue-600 text-sm break-all">{userEmail || '—'}</p>
      </div>
      <div>
        <p className="text-xs text-gray-500 mb-0.5">Mobile</p>
        <p className="font-semibold text-gray-800">{userMobile || '—'}</p>
      </div>
    </div>

    {/* Attendance Summary */}
    <div className="mb-5 sm:mb-6 p-4 bg-blue-50 rounded-2xl border border-blue-200">
      <h3 className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
        <Calendar size={16} /> Attendance Summary
      </h3>
      {/* 2x2 grid on mobile, 4 cols on sm+ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-center">
        {[
          ['Working Days', selectedPayslip.workingDays,  'text-gray-700'],
          ['Present',      selectedPayslip.presentDays,  'text-green-700'],
          ['Half Days',    selectedPayslip.halfDays,      'text-yellow-700'],
          ['Absent',       selectedPayslip.absentDays,   'text-red-700'],
        ].map(([label, value, color]) => (
          <div key={label} className="bg-white rounded-lg p-3 border border-blue-100">
            <p className={`text-xl font-bold ${color}`}>{value ?? 0}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>
      {selectedPayslip.inProgressDays > 0 && (
        <p className="text-xs text-orange-600 mt-2 text-center font-medium">
          🟠 {selectedPayslip.inProgressDays} day(s) In Progress — checkout pending, LOP nahi lagegi
        </p>
      )}
      {selectedPayslip.lopDeduction > 0 ? (
        <p className="text-xs text-red-600 mt-2 font-medium text-center">
          ⚠️ Per Day Rate: ₹{selectedPayslip.perDaySalary.toLocaleString()} | LOP: ₹{selectedPayslip.lopDeduction.toLocaleString()}
          {selectedPayslip.halfDays > 0 && ` (${selectedPayslip.halfDays} half day/s included)`}
        </p>
      ) : (
        <p className="text-xs text-green-600 mt-2 font-medium text-center">
          ✅ Full attendance — No LOP deduction!
        </p>
      )}
    </div>

    {/* Earnings */}
    <div className="mb-5 sm:mb-6">
      <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
        <TrendingUp size={20} className="text-green-600" />
        Earnings
      </h3>
      <div className="space-y-2 sm:space-y-3">
        {[
          ['Basic Salary (50%)',               selectedPayslip.basic],
          ['House Rent Allowance (HRA) (20%)', selectedPayslip.hra],
          ['Other Allowances',                 selectedPayslip.allowances],
        ].map(([label, amount]) => (
          <div key={label} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-700 text-sm sm:text-base">{label}</span>
            <span className="font-semibold text-gray-900 text-sm sm:text-base">₹{(amount || 0).toLocaleString()}</span>
          </div>
        ))}
        <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200">
          <span className="font-semibold text-gray-900 text-sm sm:text-base">Gross Earnings</span>
          <span className="font-bold text-green-700 text-sm sm:text-base">₹{(selectedPayslip.payableSalary || 0).toLocaleString()}</span>
        </div>
      </div>
    </div>

    {/* Deductions */}
    <div className="mb-5 sm:mb-6">
      <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
        <AlertCircle size={20} className="text-red-600" />
        Deductions
      </h3>
      <div className="space-y-2 sm:space-y-3">
        {[
          ['Provident Fund (PF) @ 12% of Basic', selectedPayslip.pf],
          ['Professional Tax',                   selectedPayslip.professionalTax],
          ['Income Tax (TDS) @ 5%',              selectedPayslip.tds],
        ].map(([label, amount]) => (
          <div key={label} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-700 text-sm sm:text-base">{label}</span>
            <span className="font-semibold text-gray-900 text-sm sm:text-base">₹{(amount || 0).toLocaleString()}</span>
          </div>
        ))}
        {selectedPayslip.lopDeduction > 0 && (
          <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg border border-orange-200 gap-2">
            <span className="text-orange-700 font-medium text-sm sm:text-base">
              Loss of Pay (LOP)
              <span className="text-xs font-normal ml-1 text-orange-500 block sm:inline">
                {selectedPayslip.absentDays > 0 && `${selectedPayslip.absentDays} absent`}
                {selectedPayslip.absentDays > 0 && selectedPayslip.halfDays > 0 && ' + '}
                {selectedPayslip.halfDays > 0 && `${selectedPayslip.halfDays} half day`}
                {` × ₹${selectedPayslip.perDaySalary}/day`}
              </span>
            </span>
            <span className="font-bold text-orange-700 text-sm sm:text-base flex-shrink-0">- ₹{selectedPayslip.lopDeduction.toLocaleString()}</span>
          </div>
        )}
        <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-200">
          <span className="font-semibold text-gray-900 text-sm sm:text-base">Total Deductions</span>
          <span className="font-bold text-red-700 text-sm sm:text-base">₹{(selectedPayslip.totalDeductions || 0).toLocaleString()}</span>
        </div>
      </div>
    </div>

    {/* Net Salary */}
    <div className="p-5 sm:p-6 bg-gradient-to-r from-blue-600 to-brand-600 rounded-2xl text-white">
      <p className="text-blue-100 mb-1 text-sm sm:text-base">Net Salary (Take Home)</p>
      <h2 className="text-3xl sm:text-4xl font-bold">₹{(selectedPayslip.netSalary || 0).toLocaleString()}</h2>
      <p className="text-blue-100 text-xs sm:text-sm mt-2 sm:mt-3">
        Credited on {new Date(selectedPayslip.date).toLocaleDateString('en-IN')}
      </p>
    </div>
  </div>
);

export default MyPayslips;