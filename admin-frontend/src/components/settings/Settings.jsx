import { useState, useEffect, useCallback } from "react";
import {
  Save, Eye, EyeOff, CheckCircle, XCircle, AlertTriangle,
  X, Lock, Globe, Building2, Mail, Phone, MapPin, Settings as SettingsIcon
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import PageHeader from "../common/PageHeader";

const THEME_KEY = "app_theme";
function getTheme() { return localStorage.getItem(THEME_KEY) || "light"; }
function applyTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
  document.documentElement.setAttribute("data-theme", theme);
}

/* ── Toast ── */
function Toast({ message, type, onClose }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [message, onClose]);
  if (!message) return null;
  return (
    <div className={`fixed top-6 right-6 z-[9999] flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-semibold shadow-xl border animate-toast min-w-[260px] max-w-[340px] ${
      type === "success"
        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
        : "bg-red-50 border-red-200 text-red-700"
    }`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${type === "success" ? "bg-emerald-100" : "bg-red-100"}`}>
        {type === "success"
          ? <CheckCircle size={14} className="text-emerald-600" />
          : <AlertTriangle size={14} className="text-red-600" />}
      </div>
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="opacity-50 hover:opacity-100 transition-opacity flex-shrink-0">
        <X size={14} />
      </button>
    </div>
  );
}

/* ── Password Strength ── */
function PasswordStrength({ password }) {
  const checks = [
    { label: "8+ chars",  pass: password.length >= 8 },
    { label: "Uppercase", pass: /[A-Z]/.test(password) },
    { label: "Number",    pass: /[0-9]/.test(password) },
    { label: "Special",   pass: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter(c => c.pass).length;
  const meta  = [
    { label: "Weak",   bar: "bg-red-400",    badge: "bg-red-50 text-red-500"     },
    { label: "Fair",   bar: "bg-orange-400", badge: "bg-orange-50 text-orange-500"},
    { label: "Good",   bar: "bg-yellow-400", badge: "bg-yellow-50 text-yellow-600"},
    { label: "Strong", bar: "bg-emerald-400",badge: "bg-emerald-50 text-emerald-600"},
  ];
  if (!password) return null;
  const m = meta[score - 1] || meta[0];
  return (
    <div className="mt-2.5 mb-1">
      <div className="flex gap-1 mb-2">
        {[1,2,3,4].map(i => (
          <div key={i} className={`flex-1 h-1 rounded-full transition-all duration-400 ${i <= score ? m.bar : "bg-slate-200"}`} />
        ))}
      </div>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-2 flex-wrap">
          {checks.map(c => (
            <span key={c.label} className={`text-[11px] flex items-center gap-1 font-medium transition-colors ${c.pass ? "text-emerald-600" : "text-slate-400"}`}>
              {c.pass ? <CheckCircle size={10} /> : <XCircle size={10} />}{c.label}
            </span>
          ))}
        </div>
        {score > 0 && (
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${m.badge}`}>{m.label}</span>
        )}
      </div>
    </div>
  );
}

/* ── Input Field ── */
function Field({ label, icon: Icon, type = "text", value, onChange, placeholder, disabled, rightEl }) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="mb-4">
      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">{label}</label>
      <div className={`flex items-center gap-2.5 border-2 rounded-2xl px-3.5 h-11 bg-white transition-all duration-200 ${
        focused
          ? "border-brand-500 shadow-sm shadow-brand-100"
          : "border-slate-200"
      } ${disabled ? "bg-slate-50" : ""}`}>
        {Icon && (
          <Icon size={15} className={`flex-shrink-0 transition-colors duration-200 ${focused ? "text-brand-500" : "text-slate-400"}`} />
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="flex-1 border-none outline-none focus:ring-0 focus:bg-transparent text-sm text-slate-700 bg-transparent placeholder:text-slate-300 font-medium disabled:text-slate-400"
        />
        {rightEl}
      </div>
    </div>
  );
}

/* ── Save Button ── */
function SaveBtn({ onClick, loading, gradient, label = "Save Changes", icon: BtnIcon = Save }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-white text-sm font-bold transition-all duration-200 hover:opacity-90 hover:shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${gradient}`}
    >
      {loading
        ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
        : <BtnIcon size={15} />}
      {loading ? "Saving..." : label}
    </button>
  );
}

/* ── Eye Toggle Button ── */
function EyeBtn({ show, toggle }) {
  return (
    <button
      type="button"
      onClick={toggle}
      className="text-slate-400 hover:text-brand-500 transition-colors flex-shrink-0 p-0.5"
    >
      {show ? <EyeOff size={15} /> : <Eye size={15} />}
    </button>
  );
}

/* ══════════════════════════════════════════════════ */
export default function Settings() {
  const { user } = useAuth();

  // General / Business
  const [siteTitle,    setSiteTitle]    = useState(() => localStorage.getItem("siteTitle")    || "Trimax Connect");
  const [contactEmail, setContactEmail] = useState(() => localStorage.getItem("contactEmail") || "contact@trimax.com");
  const [phone,        setPhone]        = useState(() => localStorage.getItem("biz_phone")    || "");
  const [address,      setAddress]      = useState(() => localStorage.getItem("biz_address")  || "");
  const [website,      setWebsite]      = useState(() => localStorage.getItem("biz_website")  || "");
  const [genLoading,   setGenLoading]   = useState(false);

  // Password
  const [currentPw,   setCurrentPw]   = useState("");
  const [newPw,       setNewPw]       = useState("");
  const [confirmPw,   setConfirmPw]   = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew,     setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwLoading,   setPwLoading]   = useState(false);

  const [toast, setToast] = useState({ message: "", type: "success" });

  const closeToast = useCallback(() => setToast({ message: "", type: "success" }), []);
  const showToast  = (msg, type = "success") => setToast({ message: msg, type });

  useEffect(() => { applyTheme(getTheme()); }, []);

  /* ── Save General ── */
  const handleSaveGeneral = async () => {
    if (!siteTitle.trim())           { showToast("Company name cannot be empty", "error"); return; }
    if (!contactEmail.includes("@")) { showToast("Enter a valid email address", "error"); return; }
    setGenLoading(true);
    await new Promise(r => setTimeout(r, 600));
    localStorage.setItem("siteTitle",    siteTitle);
    localStorage.setItem("contactEmail", contactEmail);
    localStorage.setItem("biz_phone",   phone);
    localStorage.setItem("biz_address", address);
    localStorage.setItem("biz_website", website);
    setGenLoading(false);
    showToast("Business settings saved successfully!");
  };

  /* ── Change Password ── */
  const handleChangePassword = async () => {
    if (!currentPw)          { showToast("Enter your current password", "error"); return; }
    if (newPw.length < 8)    { showToast("Password must be 8+ characters", "error"); return; }
    if (newPw !== confirmPw) { showToast("Passwords do not match", "error"); return; }
    if (!/[A-Z]/.test(newPw) || !/[0-9]/.test(newPw)) {
      showToast("Password needs uppercase & number", "error"); return;
    }
    setPwLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) { showToast("Session expired. Please login again.", "error"); return; }
      const res  = await fetch("http://localhost:5000/api/auth/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      const data = await res.json();
      if      (res.status === 401)      showToast(data.message || "Current password is incorrect", "error");
      else if (res.status === 404)      showToast("User not found", "error");
      else if (res.ok && data.success)  { setCurrentPw(""); setNewPw(""); setConfirmPw(""); showToast("Password changed successfully! 🎉"); }
      else                              showToast(data.message || "Something went wrong", "error");
    } catch {
      showToast("Cannot connect to server. Is it running?", "error");
    } finally {
      setPwLoading(false);
    }
  };

  const initials = user?.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "U";

  return (
    <div className="min-h-screen bg-[#f8f9fc] p-6 lg:p-10">
      <style>{`
        @keyframes toastIn { from { opacity:0; transform: translateX(20px) scale(0.95); } to { opacity:1; transform: translateX(0) scale(1); } }
        .animate-toast { animation: toastIn 0.35s cubic-bezier(0.34,1.56,0.64,1); }
        @keyframes fadeUp { from { opacity:0; transform: translateY(16px); } to { opacity:1; transform: translateY(0); } }
        .card-1 { animation: fadeUp 0.4s ease both; }
        .card-2 { animation: fadeUp 0.4s 0.08s ease both; }
      `}</style>

      <Toast message={toast.message} type={toast.type} onClose={closeToast} />

      {/* ── Page Header ── */}
      <div className="mb-8">
        <PageHeader 
          title="Settings" 
          subtitle="Manage your business information and account security" 
          icon={SettingsIcon} 
        />
      </div>

      {/* ── Two Column Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-[1100px]">

        {/* ── Card 1: Business Info ── */}
        <div className="card-1 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">

          {/* Card Header */}
          <div className="flex items-center gap-3.5 mb-6 pb-5 border-b border-slate-100">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Building2 size={18} className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-slate-800">Business Information</h3>
              <p className="text-xs text-slate-400 mt-0.5">Your company details and contact info</p>
            </div>
          </div>

          <Field label="Company Name"  icon={Building2} value={siteTitle}    onChange={e => setSiteTitle(e.target.value)}    placeholder="e.g. Trimax Connect" />
          <Field label="Contact Email" icon={Mail}      type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="contact@company.com" />

          <div className="grid grid-cols-2 gap-3">
            <Field label="Phone Number" icon={Phone}  value={phone}   onChange={e => setPhone(e.target.value)}   placeholder="+91 XXXXX XXXXX" />
            <Field label="Website"      icon={Globe}  value={website} onChange={e => setWebsite(e.target.value)} placeholder="www.company.com" />
          </div>

          <Field label="Address" icon={MapPin} value={address} onChange={e => setAddress(e.target.value)} placeholder="City, State, Country" />

          <div className="mt-2">
            <SaveBtn
              onClick={handleSaveGeneral}
              loading={genLoading}
              gradient="bg-gradient-to-r from-blue-600 to-blue-700 shadow-md shadow-blue-100"
              label="Save Changes"
            />
          </div>
        </div>

        {/* ── Card 2: Change Password ── */}
        <div className="card-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">

          {/* Card Header */}
          <div className="flex items-center gap-3.5 mb-6 pb-5 border-b border-slate-100">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <Lock size={18} className="text-emerald-600" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-slate-800">Change Password</h3>
              <p className="text-xs text-slate-400 mt-0.5">Keep your account secure with a strong password</p>
            </div>
          </div>

          {/* Logged-in user pill */}
          {user && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-brand-50 to-brand-50 border border-brand-100 mb-5">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-brand-600 to-blue-600 flex items-center justify-center text-white text-xs font-extrabold flex-shrink-0 shadow-sm">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-800 leading-tight truncate">{user.name}</p>
                <p className="text-[11px] text-brand-500 font-medium truncate">{user.email}</p>
              </div>
              <span className="ml-auto px-2.5 py-1 rounded-full bg-brand-100 text-brand-600 text-[10px] font-bold flex-shrink-0">
                {user.role}
              </span>
            </div>
          )}

          <Field
            label="Current Password" icon={Lock}
            type={showCurrent ? "text" : "password"}
            value={currentPw} onChange={e => setCurrentPw(e.target.value)}
            placeholder="Enter current password" disabled={pwLoading}
            rightEl={<EyeBtn show={showCurrent} toggle={() => setShowCurrent(p => !p)} />}
          />

          <Field
            label="New Password" icon={Lock}
            type={showNew ? "text" : "password"}
            value={newPw} onChange={e => setNewPw(e.target.value)}
            placeholder="Min 8 characters" disabled={pwLoading}
            rightEl={<EyeBtn show={showNew} toggle={() => setShowNew(p => !p)} />}
          />

          <PasswordStrength password={newPw} />

          <div className="mt-3">
            <Field
              label="Confirm New Password" icon={Lock}
              type={showConfirm ? "text" : "password"}
              value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
              placeholder="Re-enter new password" disabled={pwLoading}
              rightEl={<EyeBtn show={showConfirm} toggle={() => setShowConfirm(p => !p)} />}
            />
          </div>

          {/* Match indicator */}
          {confirmPw && (
            <div className={`flex items-center gap-1.5 text-xs font-semibold mb-4 -mt-2 ${newPw === confirmPw ? "text-emerald-600" : "text-red-500"}`}>
              {newPw === confirmPw
                ? <><CheckCircle size={13} /> Passwords match</>
                : <><XCircle size={13} /> Passwords don't match</>}
            </div>
          )}

          <SaveBtn
            onClick={handleChangePassword}
            loading={pwLoading}
            gradient="bg-gradient-to-r from-brand-600 to-blue-600 shadow-md shadow-brand-100"
            label="Update Password"
            icon={Lock}
          />
        </div>

      </div>
    </div>
  );
}