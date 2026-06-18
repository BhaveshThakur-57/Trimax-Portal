import React, { useState } from 'react';
import { Calendar, Gift, Star, Sparkles, CheckCircle, Download } from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const Holidays = () => {
  const [holidays] = useState([
    { id: 1,  name: 'Holi - Festival of Colors', date: '2026-03-14', day: 'Saturday', type: 'Public Holiday',   description: 'Hindu festival of colors and spring',            icon: '🎨', color: 'from-pink-500 to-purple-500'   },
    { id: 2,  name: 'Good Friday',               date: '2026-04-03', day: 'Friday',   type: 'Public Holiday',   description: 'Christian observance of Jesus crucifixion',      icon: '✝️', color: 'from-blue-500 to-indigo-500'   },
    { id: 3,  name: 'Eid al-Fitr',               date: '2026-04-10', day: 'Friday',   type: 'Public Holiday',   description: 'Islamic festival marking end of Ramadan',        icon: '🌙', color: 'from-green-500 to-teal-500'    },
    { id: 4,  name: 'Mahavir Jayanti',            date: '2026-04-18', day: 'Saturday', type: 'Public Holiday',   description: 'Birth anniversary of Lord Mahavira',             icon: '🙏', color: 'from-orange-500 to-red-500'    },
    { id: 5,  name: 'Buddha Purnima',             date: '2026-05-11', day: 'Monday',   type: 'Public Holiday',   description: 'Birth anniversary of Gautama Buddha',            icon: '🧘', color: 'from-yellow-500 to-amber-500'  },
    { id: 6,  name: 'Independence Day',           date: '2026-08-15', day: 'Saturday', type: 'National Holiday', description: "India's Independence Day celebration",           icon: '🇮🇳', color: 'from-orange-500 to-green-500' },
    { id: 7,  name: 'Janmashtami',                date: '2026-08-22', day: 'Saturday', type: 'Public Holiday',   description: 'Birth celebration of Lord Krishna',              icon: '🦚', color: 'from-blue-500 to-purple-500'   },
    { id: 8,  name: 'Gandhi Jayanti',             date: '2026-10-02', day: 'Friday',   type: 'National Holiday', description: 'Birth anniversary of Mahatma Gandhi',            icon: '🕊️', color: 'from-gray-500 to-slate-500'   },
    { id: 9,  name: 'Dussehra',                   date: '2026-10-12', day: 'Monday',   type: 'Public Holiday',   description: 'Victory of good over evil',                      icon: '🏹', color: 'from-red-500 to-pink-500'      },
    { id: 10, name: 'Diwali',                     date: '2026-11-01', day: 'Sunday',   type: 'Public Holiday',   description: 'Festival of Lights',                             icon: '🪔', color: 'from-yellow-500 to-orange-500' },
    { id: 11, name: 'Guru Nanak Jayanti',         date: '2026-11-19', day: 'Thursday', type: 'Public Holiday',   description: 'Birth anniversary of Guru Nanak Dev Ji',         icon: '⭐', color: 'from-amber-500 to-yellow-500'  },
    { id: 12, name: 'Christmas',                  date: '2026-12-25', day: 'Friday',   type: 'Public Holiday',   description: 'Birth of Jesus Christ',                          icon: '🎄', color: 'from-green-500 to-red-500'     },
  ]);

  const getDaysUntil = (dateString) => {
    const today = new Date();
    const holidayDate = new Date(dateString);
    return Math.ceil((holidayDate - today) / (1000 * 60 * 60 * 24));
  };

  const upcomingHolidays = holidays
    .map(h => ({ ...h, daysUntil: getDaysUntil(h.date) }))
    .filter(h => h.daysUntil >= 0)
    .sort((a, b) => a.daysUntil - b.daysUntil);

  const pastHolidays = holidays
    .map(h => ({ ...h, daysUntil: getDaysUntil(h.date) }))
    .filter(h => h.daysUntil < 0)
    .sort((a, b) => b.daysUntil - a.daysUntil);

  const formatDate = (ds) =>
    new Date(ds).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const getDaysLabel = (days) => {
    if (days === 0) return 'Today! 🎉';
    if (days === 1) return 'Tomorrow';
    if (days < 7)   return `In ${days} days`;
    if (days < 30)  return `In ${Math.floor(days / 7)} weeks`;
    if (days < 365) return `In ${Math.floor(days / 30)} months`;
    return `In ${Math.floor(days / 365)} year`;
  };

  // ── Excel Download ──────────────────────────────────────────────────────────
  const downloadExcel = async () => {
    const thinBorder = {
      top:    { style: 'thin', color: { argb: 'FFBFBFBF' } },
      left:   { style: 'thin', color: { argb: 'FFBFBFBF' } },
      bottom: { style: 'thin', color: { argb: 'FFBFBFBF' } },
      right:  { style: 'thin', color: { argb: 'FFBFBFBF' } },
    };

    const applyCell = (cell, value, { bold=false, fc='FF333333', bg=null, ha='left', sz=11, italic=false } = {}) => {
      cell.value     = value;
      cell.font      = { name: 'Calibri', bold, color: { argb: fc }, size: sz, italic };
      cell.alignment = { horizontal: ha, vertical: 'middle' };
      cell.border    = thinBorder;
      if (bg) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
    };

    const blankCell = (cell, bg = 'FFFFFFFF') => {
      cell.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
      cell.border = thinBorder;
    };

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Holidays 2026');
    ws.views = [{ showGridLines: false, state: 'normal' }];

    [36, 16, 12, 18, 42].forEach((w, i) => { ws.getColumn(i + 1).width = w; });

    ws.mergeCells('A1:E1');
    ws.getRow(1).height = 40;
    applyCell(ws.getCell('A1'), 'HOLIDAY CALENDAR 2026',
      { bold: true, fc: 'FFFFFFFF', bg: 'FF1A3A5C', ha: 'center', sz: 18 });

    ws.mergeCells('A2:E2');
    ws.getRow(2).height = 22;
    applyCell(ws.getCell('A2'), `Public & National Holidays  |  Total: ${holidays.length} Days`,
      { italic: true, fc: 'FFFFFFFF', bg: 'FF2E75B6', ha: 'center', sz: 11 });

    ws.getRow(3).height = 6;
    for (let c = 1; c <= 5; c++) blankCell(ws.getCell(3, c));

    ws.getRow(4).height = 26;
    ['Holiday Name', 'Date', 'Day', 'Type', 'Description'].forEach((h, i) => {
      applyCell(ws.getCell(4, i + 1), h,
        { bold: true, fc: 'FFFFFFFF', bg: 'FF2E75B6', ha: 'center', sz: 11 });
    });

    holidays.forEach((h, i) => {
      const row        = i + 5;
      const isNational = h.type === 'National Holiday';
      const rowBg      = isNational ? 'FFFFF3E2' : 'FFE8F4FD';
      const typeBg     = isNational ? 'FFFCE4D6' : 'FFD6E4F0';
      const typeFc     = isNational ? 'FFC00000' : 'FF1A3A5C';
      const dateStr    = new Date(h.date).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
      ws.getRow(row).height = 24;

      applyCell(ws.getCell(row, 1), h.name,        { bold: true, bg: rowBg,  fc: 'FF1A1A1A' });
      applyCell(ws.getCell(row, 2), dateStr,        { bg: rowBg,  fc: 'FF333333', ha: 'center' });
      applyCell(ws.getCell(row, 3), h.day,          { bg: rowBg,  fc: 'FF555555', ha: 'center' });
      applyCell(ws.getCell(row, 4), h.type,         { bold: true, bg: typeBg, fc: typeFc, ha: 'center' });
      applyCell(ws.getCell(row, 5), h.description,  { bg: rowBg,  fc: 'FF555555', italic: true });
    });

    const gapRow = holidays.length + 6;
    ws.getRow(gapRow).height = 8;
    for (let c = 1; c <= 5; c++) blankCell(ws.getCell(gapRow, c));

    const sumHead = gapRow + 1;
    ws.mergeCells(`A${sumHead}:E${sumHead}`);
    ws.getRow(sumHead).height = 26;
    applyCell(ws.getCell(`A${sumHead}`), 'SUMMARY',
      { bold: true, fc: 'FFFFFFFF', bg: 'FF1A3A5C', ha: 'center', sz: 12 });

    const nationalCount = holidays.filter(h => h.type === 'National Holiday').length;
    const publicCount   = holidays.length - nationalCount;

    [
      ['Total Holidays',    holidays.length, 'FFF2F2F2', 'FF333333'],
      ['National Holidays', nationalCount,   'FFFCE4D6', 'FFC00000'],
      ['Public Holidays',   publicCount,     'FFD6E4F0', 'FF1A3A5C'],
    ].forEach(([lbl, val, bg, fc], i) => {
      const row = sumHead + 1 + i;
      ws.getRow(row).height = 22;
      applyCell(ws.getCell(row, 1), lbl, { bold: true, bg, fc: 'FF444444' });
      applyCell(ws.getCell(row, 2), val, { bold: true, bg, fc, ha: 'center' });
      for (let c = 3; c <= 5; c++) blankCell(ws.getCell(row, c), bg);
    });

    const legRow = sumHead + 5;
    ws.mergeCells(`A${legRow}:E${legRow}`);
    const leg = ws.getCell(`A${legRow}`);
    leg.value     = 'Legend:   🟠 National Holiday (Independence Day, Gandhi Jayanti)   🔵 Public Holiday (Festivals & Observances)';
    leg.font      = { name: 'Calibri', italic: true, size: 9, color: { argb: 'FF666666' } };
    leg.alignment = { horizontal: 'left', vertical: 'middle' };

    const buf  = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, 'Holiday_Calendar_2026.xlsx');
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">

      {/* ── Hero Header ── */}
      <div className="bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 rounded-2xl p-5 sm:p-8 text-white shadow-xl border border-slate-600">

        {/* Title row + Download button */}
        <div className="flex items-start justify-between gap-3 mb-4 sm:mb-3">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-[20px] bg-gradient-to-br from-brand-600 to-blue-600 flex items-center justify-center text-white shadow-xl shadow-brand-500/20 overflow-hidden group shrink-0">
              <div className="absolute inset-0 bg-white/20 blur-md rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <Calendar size={30} strokeWidth={2.5} className="relative z-10 drop-shadow-md group-hover:scale-110 transition-transform duration-300" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-[36px] font-bold font-display text-white tracking-tight leading-tight truncate">
                Holidays Calendar 2026
              </h1>
              <p className="text-slate-300 text-xs sm:text-[15px] mt-1 font-medium">
                Plan your time off and celebrate special occasions
              </p>
            </div>
          </div>

          {/* Download — icon only on mobile, full label on sm+ */}
          <button
            onClick={downloadExcel}
            className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-5 sm:py-2.5 bg-green-500 hover:bg-green-400 text-white font-medium rounded-xl transition-colors shadow-md text-xs sm:text-sm flex-shrink-0"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Download Excel</span>
            <span className="sm:hidden">Excel</span>
          </button>
        </div>

        {/* Stats — 3 cols on all sizes, smaller text on mobile */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-4 sm:mt-6">
          {[
            { label: 'Total Holidays', value: holidays.length,          dot: 'bg-blue-400'   },
            { label: 'Upcoming',       value: upcomingHolidays.length,  dot: 'bg-green-400'  },
            { label: 'This Year',      value: holidays.length,          dot: 'bg-orange-400' },
          ].map(({ label, value, dot }) => (
            <div key={label} className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-3 sm:p-4 hover:bg-white/15 transition-all">
              <div className="flex items-center gap-1.5 mb-1 sm:mb-2">
                <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 ${dot} rounded-full flex-shrink-0`}></div>
                <p className="text-xs text-slate-300 font-medium uppercase tracking-wide leading-tight">{label}</p>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-white">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Upcoming Holidays ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Calendar className="text-purple-600" size={22} />
            Upcoming Holidays
          </h2>
          <span className="bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full text-xs sm:text-sm font-semibold">
            {upcomingHolidays.length} Events
          </span>
        </div>

        {upcomingHolidays.length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            {upcomingHolidays.map((holiday, index) => (
              <div
                key={holiday.id}
                className={`relative overflow-hidden rounded-xl border-2 transition-all duration-300 hover:shadow-lg ${
                  index === 0 ? 'border-purple-300 bg-gradient-to-r from-purple-50 to-pink-50' : 'border-gray-200 bg-white'
                }`}
              >
                {index === 0 && (
                  <div className="absolute top-2 right-2 bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                    <Star size={10} /> Next
                  </div>
                )}
                <div className="p-3 sm:p-5">
                  <div className="flex items-start gap-3 sm:gap-4">
                    {/* Icon box — smaller on mobile */}
                    <div className={`flex-shrink-0 w-14 h-14 sm:w-20 sm:h-20 bg-gradient-to-br ${holiday.color} rounded-xl flex flex-col items-center justify-center text-white shadow-lg`}>
                      <span className="text-2xl sm:text-3xl mb-0.5 sm:mb-1">{holiday.icon}</span>
                      <span className="text-xs font-medium opacity-90">{holiday.day.slice(0, 3)}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Name + type badge — stack on mobile */}
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-2 mb-1 sm:mb-2">
                        <h3 className="text-base sm:text-lg font-bold text-gray-800 leading-tight pr-8 sm:pr-0">{holiday.name}</h3>
                        <span className={`self-start text-xs font-semibold px-2.5 py-0.5 rounded-full flex-shrink-0 ${
                          holiday.type === 'National Holiday' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                        }`}>{holiday.type}</span>
                      </div>

                      <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">{holiday.description}</p>

                      {/* Date + countdown — wrap on very small screens */}
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                        <div className="flex items-center gap-1 text-purple-600 font-semibold">
                          <Calendar size={13} /> {formatDate(holiday.date)}
                        </div>
                        <div className="flex items-center gap-1 bg-purple-100 text-purple-700 px-2.5 py-0.5 rounded-full font-medium">
                          <Sparkles size={12} /> {getDaysLabel(holiday.daysUntil)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Calendar size={64} className="mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No upcoming holidays</p>
            <p className="text-sm">Check back later for future celebrations</p>
          </div>
        )}
      </div>

      {/* ── Past Holidays ── */}
      {pastHolidays.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
              <CheckCircle className="text-green-600" size={22} /> Completed Holidays
            </h2>
            <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-xs sm:text-sm font-semibold">
              {pastHolidays.length} Celebrated
            </span>
          </div>

          {/* 1 col mobile, 2 tablet, 3 desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {pastHolidays.map((holiday) => (
              <div key={holiday.id} className="relative overflow-hidden rounded-xl border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-white hover:shadow-md transition-all duration-300">
                <div className="absolute top-2 right-2 bg-green-600 text-white text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <CheckCircle size={10} /> Done
                </div>
                <div className="p-3 sm:p-4">
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br ${holiday.color} rounded-xl flex flex-col items-center justify-center text-white shadow-md opacity-80`}>
                      <span className="text-2xl mb-0.5">{holiday.icon}</span>
                      <span className="text-xs font-medium opacity-90">{holiday.day.slice(0, 3)}</span>
                    </div>
                    <div className="flex-1 min-w-0 pr-8">
                      <h3 className="text-sm sm:text-base font-bold text-gray-700 leading-tight mb-1">{holiday.name}</h3>
                      <p className="text-xs text-gray-500 mb-2 line-clamp-2">{holiday.description}</p>
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <Calendar size={11} /> {formatDate(holiday.date)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Holiday Types Legend ── */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 sm:p-6 border border-blue-100">
        <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
          <Gift size={18} className="text-blue-600" /> Holiday Types
        </h3>
        {/* 1 col mobile, 2 col sm+ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
          <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-lg sm:text-xl">🇮🇳</span>
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm sm:text-base">National Holiday</p>
              <p className="text-xs text-gray-600">Independence Day, Gandhi Jayanti</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-lg sm:text-xl">🎉</span>
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm sm:text-base">Public Holiday</p>
              <p className="text-xs text-gray-600">Festival celebrations & observances</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Holidays;