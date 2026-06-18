import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, LogIn, LogOut, X, Bell, Timer } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const pad = n => String(n).padStart(2, '0');
const fmtKey = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;

const timeStrToMinutes = (timeStr) => {
  if (!timeStr || timeStr === '-') return null;
  const ampm = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (ampm) {
    let [, h, m, period] = ampm;
    h = parseInt(h); m = parseInt(m);
    if (period.toUpperCase() === 'PM' && h !== 12) h += 12;
    if (period.toUpperCase() === 'AM' && h === 12) h = 0;
    return h * 60 + m;
  }
  const plain = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (plain) return parseInt(plain[1]) * 60 + parseInt(plain[2]);
  return null;
};

// ── Popup Types ───────────────────────────────────────────────────────────────
// 'checkin'       → 9-11 AM, not yet checked in
// 'checkout_soon' → 7h after checkin, countdown timer starts (60 min window)
// 'checkout_now'  → 8h after checkin, must checkout in next 2 hours
// ─────────────────────────────────────────────────────────────────────────────

const AttendancePopupNotifier = () => {
  const navigate = useNavigate();

  const [popup, setPopup]             = useState(null); // null | 'checkin' | 'checkout_soon' | 'checkout_now'
  const [dismissed, setDismissed]     = useState(null); // which popup was dismissed this session
  const [checkInTime, setCheckInTime] = useState(null); // "HH:MM AM" string
  const [checkInMins, setCheckInMins] = useState(null); // minutes from midnight
  const [countdown, setCountdown]     = useState(null); // seconds remaining for checkout_soon
  const [status, setStatus]           = useState(null); // 'LoggedIn' | 'Present' | 'Absent' | null

  const intervalRef  = useRef(null);
  const countdownRef = useRef(null);
  const polledRef    = useRef(false);

  // ── Fetch today's attendance once on mount ────────────────────────────────
  useEffect(() => {
    if (polledRef.current) return;
    polledRef.current = true;
    fetchTodayStatus();
  }, []);

  const fetchTodayStatus = async () => {
    try {
      const token   = localStorage.getItem('token');
      const todayKey = fmtKey(new Date());
      const res     = await fetch(`${API_URL}/api/attendance/my-attendance`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const todayRec = data.data.find(r => {
          const d = new Date(r.date);
          return fmtKey(isNaN(d.getTime()) ? new Date(r.date) : d) === todayKey;
        });

        if (todayRec) {
          setStatus(todayRec.status);
          if (todayRec.checkIn && todayRec.checkIn !== '-') {
            setCheckInTime(todayRec.checkIn);
            setCheckInMins(timeStrToMinutes(todayRec.checkIn));
          }
        }
      }
    } catch (err) {
      console.error('Popup: fetch error', err);
    }
  };

  // ── Main tick — runs every 30 seconds ─────────────────────────────────────
  useEffect(() => {
    const tick = () => evaluatePopup();
    tick(); // immediate
    intervalRef.current = setInterval(tick, 30_000);
    return () => clearInterval(intervalRef.current);
  }, [status, checkInMins, dismissed]); // eslint-disable-line react-hooks/exhaustive-deps

  const evaluatePopup = () => {
    const now     = new Date();
    const nowMins = now.getHours() * 60 + now.getMinutes();

    const NINE_AM    = 9  * 60;  // 540
    const ELEVEN_AM  = 11 * 60;  // 660

    // ── CHECKIN POPUP ──────────────────────────────────────────────────────
    // Show if: 9-11 AM AND not yet checked in (status null/Absent with no checkIn)
    if (
      nowMins >= NINE_AM &&
      nowMins <= ELEVEN_AM &&
      (status === null || (status === 'Absent' && !checkInMins)) &&
      dismissed !== 'checkin'
    ) {
      setPopup('checkin');
      return;
    }

    // ── CHECKOUT POPUPS ────────────────────────────────────────────────────
    // Only relevant if LoggedIn status
    if (status === 'LoggedIn' && checkInMins !== null) {
      const workedMins = nowMins - checkInMins;

      const SEVEN_HOURS  = 7  * 60; // 420 min
      const EIGHT_HOURS  = 8  * 60; // 480 min
      const TEN_HOURS    = 10 * 60; // 600 min

      // checkout_soon: 7h-8h window → show countdown
      if (
        workedMins >= SEVEN_HOURS &&
        workedMins < EIGHT_HOURS &&
        dismissed !== 'checkout_soon'
      ) {
        const secondsLeft = (EIGHT_HOURS - workedMins) * 60;
        setCountdown(secondsLeft);
        setPopup('checkout_soon');
        return;
      }

      // checkout_now: 8h-10h window → must checkout now
      if (
        workedMins >= EIGHT_HOURS &&
        workedMins <= TEN_HOURS &&
        dismissed !== 'checkout_now'
      ) {
        setCountdown(null);
        setPopup('checkout_now');
        return;
      }
    }

    // If nothing matches, hide popup
    setPopup(prev => (prev === 'checkin' && dismissed === 'checkin') ? null : prev);
  };

  // ── Countdown timer for checkout_soon ─────────────────────────────────────
  useEffect(() => {
    if (popup === 'checkout_soon' && countdown !== null) {
      countdownRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownRef.current);
            // Auto transition to checkout_now
            setPopup('checkout_now');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(countdownRef.current);
  }, [popup]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDismiss = () => {
    setDismissed(popup);
    setPopup(null);
    clearInterval(countdownRef.current);
  };

  const handleGoToAttendance = () => {
    navigate('/employee/attendance');
    setPopup(null);
    clearInterval(countdownRef.current);
  };

  // ── Format countdown ───────────────────────────────────────────────────────
  const formatCountdown = (secs) => {
    if (!secs) return '00:00';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${pad(m)}:${pad(s)}`;
  };

  // ── Expected checkout time display ─────────────────────────────────────────
  const expectedCheckout = (() => {
    if (!checkInMins) return null;
    const total  = checkInMins + 8 * 60;
    const h      = Math.floor(total / 60) % 24;
    const m      = total % 60;
    const period = h >= 12 ? 'PM' : 'AM';
    const dh     = h % 12 === 0 ? 12 : h % 12;
    return `${pad(dh)}:${pad(m)} ${period}`;
  })();

  if (!popup) return null;

  // ── RENDER POPUP ──────────────────────────────────────────────────────────
  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full">

      {/* ── CHECKIN POPUP ── */}
      {popup === 'checkin' && (
        <div className="bg-white rounded-2xl shadow-2xl border-2 border-blue-400 overflow-hidden animate-slide-up">
          {/* Top bar */}
          <div className="bg-gradient-to-r from-blue-500 to-brand-600 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell size={18} className="text-white animate-bounce" />
              <span className="text-white font-semibold text-sm">Attendance Reminder</span>
            </div>
            <button onClick={handleDismiss} className="text-white/70 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <LogIn size={24} className="text-blue-600" />
              </div>
              <div>
                <p className="font-bold text-gray-800 text-lg">Mark Your Attendance!</p>
                <p className="text-gray-500 text-sm">Login window: 9:00 AM – 11:00 AM</p>
              </div>
            </div>

            {/* Time indicator */}
            <div className="bg-blue-50 rounded-2xl p-3 mb-4 flex items-center gap-2">
              <Clock size={16} className="text-blue-500" />
              <span className="text-blue-700 text-sm font-medium">
                Abhi check-in karo — 11 AM ke baad absent mark ho jayega
              </span>
            </div>

            <button
              onClick={handleGoToAttendance}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-brand-600 hover:from-blue-600 hover:to-blue-600 text-white font-semibold rounded-2xl transition-all shadow-md flex items-center justify-center gap-2"
            >
              <LogIn size={18} />
              Check In Now →
            </button>

            <button
              onClick={handleDismiss}
              className="w-full mt-2 py-2 text-gray-400 hover:text-gray-600 text-sm transition-colors"
            >
              Remind me later
            </button>
          </div>
        </div>
      )}

      {/* ── CHECKOUT SOON (with countdown) ── */}
      {popup === 'checkout_soon' && (
        <div className="bg-white rounded-2xl shadow-2xl border-2 border-orange-400 overflow-hidden animate-slide-up">
          {/* Top bar */}
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Timer size={18} className="text-white" />
              <span className="text-white font-semibold text-sm">Checkout Reminder</span>
            </div>
            <button onClick={handleDismiss} className="text-white/70 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Clock size={24} className="text-orange-600" />
              </div>
              <div>
                <p className="font-bold text-gray-800 text-lg">Almost Time!</p>
                <p className="text-gray-500 text-sm">Checked in at {checkInTime}</p>
              </div>
            </div>

            {/* Countdown */}
            <div className="bg-orange-50 rounded-2xl p-4 mb-4 text-center">
              <p className="text-orange-600 text-xs font-medium uppercase tracking-wide mb-1">
                Checkout available in
              </p>
              <p className="text-5xl font-bold text-orange-600 font-mono tracking-wider">
                {formatCountdown(countdown)}
              </p>
              <p className="text-orange-400 text-xs mt-1">
                Expected checkout: <strong>{expectedCheckout}</strong>
              </p>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4 overflow-hidden">
              <div
                className="bg-gradient-to-r from-orange-500 to-amber-400 h-full rounded-full transition-all duration-1000"
                style={{ width: `${countdown ? (1 - countdown / 3600) * 100 : 0}%` }}
              />
            </div>

            <button
              onClick={handleGoToAttendance}
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold rounded-2xl transition-all shadow-md flex items-center justify-center gap-2"
            >
              <LogOut size={18} />
              Go to Attendance
            </button>

            <button
              onClick={handleDismiss}
              className="w-full mt-2 py-2 text-gray-400 hover:text-gray-600 text-sm transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* ── CHECKOUT NOW ── */}
      {popup === 'checkout_now' && (
        <div className="bg-white rounded-2xl shadow-2xl border-2 border-green-400 overflow-hidden animate-slide-up">
          {/* Top bar — pulsing */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full animate-ping" />
              <span className="text-white font-semibold text-sm">Checkout Time!</span>
            </div>
            <button onClick={handleDismiss} className="text-white/70 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <LogOut size={24} className="text-green-600" />
              </div>
              <div>
                <p className="font-bold text-gray-800 text-lg">Checkout Karo! ✅</p>
                <p className="text-gray-500 text-sm">8 ghante complete ho gaye</p>
              </div>
            </div>

            {/* Info */}
            <div className="bg-green-50 rounded-2xl p-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600 text-sm">Check-in</span>
                <span className="font-bold text-gray-800">{checkInTime}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600 text-sm">Expected checkout</span>
                <span className="font-bold text-green-700">{expectedCheckout}</span>
              </div>
              <div className="border-t border-green-200 pt-2 mt-2">
                <p className="text-xs text-orange-500 font-medium">
                  ⚠️ 10 PM ke baad checkout nahi hoga — ab checkout kar lo
                </p>
              </div>
            </div>

            <button
              onClick={handleGoToAttendance}
              className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 text-base"
            >
              <LogOut size={20} />
              Check Out Now →
            </button>

            <button
              onClick={handleDismiss}
              className="w-full mt-2 py-2 text-gray-400 hover:text-gray-600 text-sm transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Slide-up animation */}
      <style>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(30px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default AttendancePopupNotifier;