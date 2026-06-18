import { createPortal } from 'react-dom';
import React, { useState, useEffect } from 'react';
import { X, User, Mail, Shield, Building, Phone, MapPin, Briefcase, Eye, EyeOff } from 'lucide-react';


const labelCls = "block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1";

const InputWrapper = ({ icon: Icon, children }) => (
  <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-2.5 h-8 bg-slate-50 transition-all duration-200 focus-within:border-brand-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-500/20">
    <Icon size={13} className="text-brand-600 flex-shrink-0" />
    {children}
  </div>
);

const inputCls = "flex-1 bg-transparent focus:bg-transparent border-none outline-none focus:ring-0 text-xs text-slate-800 placeholder:text-slate-400 disabled:text-slate-400 font-medium";
const selectCls = "flex-1 bg-transparent focus:bg-transparent border-none outline-none focus:ring-0 text-xs text-slate-800 cursor-pointer font-medium";

const UserModal = ({ user, onSave, onClose }) => {
  const [visible, setVisible]       = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', role: 'employee', status: 'Active',
    department: '', salary: '', phone: '', address: '', designation: '', workingType: 'Office'
  });

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    if (user) {
      setFormData({
        name: user.name || '', email: user.email || '', role: user.role || 'employee',
        status: user.status || 'Active', password: '', department: user.department || '',
        salary: user.salary || '', phone: user.phone || '', address: user.address || '',
        designation: user.designation || '', workingType: user.workingType || 'Office'
      });
    }
  }, [user]);

  const handleClose = () => { setVisible(false); setTimeout(onClose, 260); };
  const set = field => e => setFormData(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (!formData.name || !formData.email)                 return setError('Name and email are required');
    if (!user && !formData.password)                       return setError('Password is required for new user');
    if (formData.password && formData.password.length < 8) return setError('Password must be at least 8 characters');
    if (!formData.department)                              return setError('Department is required');
    if (!formData.designation)                             return setError('Designation is required');
    if (!formData.phone)                                   return setError('Phone number is required');
    if (!formData.address)                                 return setError('Address is required');
    setLoading(true);
    try   { await onSave(formData); }
    catch (err) { setError(err.message || 'Failed to save user'); }
    finally { setLoading(false); }
  };

  return createPortal((
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-3 transition-all duration-260 ${visible ? 'bg-black/50 backdrop-blur-sm' : 'bg-black/0'}`}
      onClick={handleClose}
    >
      <div
        className={`bg-white border border-slate-100 rounded-2xl w-full max-w-[540px] flex flex-col shadow-2xl transition-all duration-260 ease-out ${visible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'}`}
        style={{ maxHeight: '95vh' }}
        onClick={e => e.stopPropagation()}
      >

        {/* ── Header ── */}
        <div className="relative flex-shrink-0 bg-gradient-to-r from-brand-600 to-blue-600 rounded-t-2xl px-4 py-3 overflow-hidden">
          <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10 blur-xl pointer-events-none" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-white/25 border border-white/40 flex items-center justify-center text-white font-extrabold text-base leading-none">
                {user ? '✏' : '+'}
              </span>
              <div>
                <h2 className="text-white font-extrabold text-[14px] leading-tight">
                  {user ? 'Edit User' : 'Add New User'}
                </h2>
                <p className="text-white/65 text-[10px]">
                  {user ? 'Update user information' : 'Fill in the details to create a new employee'}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-7 h-7 flex items-center justify-center rounded-2xl bg-white/20 hover:bg-white/35 text-white transition-all duration-200 hover:rotate-90 flex-shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* ── Scrollable Body — scrollbar hidden ── */}
        <div
          className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5"
          style={{
            scrollbarWidth: 'none',       /* Firefox */
            msOverflowStyle: 'none',      /* IE/Edge */
          }}
        >
          {/* WebKit scrollbar hide via inline style trick */}
          <style>{`.hide-scroll::-webkit-scrollbar { display: none; }`}</style>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
              {error}
              <button type="button" onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600 transition-all duration-200">
                <X size={12} />
              </button>
            </div>
          )}

          {/* Basic Info */}
          <div className="space-y-1.5">
            <p className="text-[9px] font-extrabold text-brand-500 uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-4 h-px bg-brand-300 inline-block" /> Basic Info
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelCls}>Full Name *</label>
                <InputWrapper icon={User}>
                  <input type="text" value={formData.name} onChange={set('name')} placeholder="John Doe" className={inputCls} />
                </InputWrapper>
              </div>
              <div>
                <label className={labelCls}>Email *</label>
                <InputWrapper icon={Mail}>
                  <input type="email" value={formData.email} onChange={set('email')} placeholder="john@example.com" className={inputCls} />
                </InputWrapper>
              </div>
              <div>
                <label className={labelCls}>Phone *</label>
                <InputWrapper icon={Phone}>
                  <input type="tel" value={formData.phone} onChange={set('phone')} placeholder="9876543210" className={inputCls} />
                </InputWrapper>
              </div>
              <div>
                <label className={labelCls}>Department *</label>
                <InputWrapper icon={Building}>
                  <select value={formData.department} onChange={set('department')} className={selectCls}>
                    <option value="">Select</option>
                    {['IT','HR','Sales','Marketing','Finance','Operations'].map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </InputWrapper>
              </div>
            </div>
          </div>

          {/* Work Details */}
          <div className="space-y-1.5">
            <p className="text-[9px] font-extrabold text-brand-500 uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-4 h-px bg-brand-300 inline-block" /> Work Details
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelCls}>Designation *</label>
                <InputWrapper icon={Briefcase}>
                  <input type="text" value={formData.designation} onChange={set('designation')} placeholder="Software Engineer" className={inputCls} />
                </InputWrapper>
              </div>
              <div>
                <label className={labelCls}>Working Type</label>
                <InputWrapper icon={Shield}>
                  <select value={formData.workingType} onChange={set('workingType')} className={selectCls}>
                    <option value="Office">🏢 Office</option>
                    <option value="Home">🏠 Home</option>
                    <option value="Hybrid">🔀 Hybrid</option>
                  </select>
                </InputWrapper>
              </div>
              <div>
                <label className={labelCls}>Salary (Optional)</label>
                <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-2.5 h-8 bg-slate-50 transition-all duration-200 focus-within:border-brand-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-500/20">
                  <span className="text-brand-600 font-extrabold text-xs flex-shrink-0">₹</span>
                  <input type="number" value={formData.salary} onChange={set('salary')} placeholder="50000" className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Role *</label>
                <InputWrapper icon={Shield}>
                  <select value={formData.role} onChange={set('role')} className={selectCls}>
                    <option value="employee">👤 Employee</option>
                    <option value="admin">🛡️ Admin</option>
                  </select>
                </InputWrapper>
              </div>
            </div>
          </div>

          {/* Address + Password + Status — single row layout */}
          <div className="grid grid-cols-2 gap-2">
            {/* Address — full width */}
            <div className="col-span-2">
              <label className={labelCls}>Address *</label>
              <div className="flex items-start gap-2 border border-slate-200 rounded-lg px-2.5 py-2 bg-slate-50 transition-all duration-200 focus-within:border-brand-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-500/20">
                <MapPin size={13} className="text-brand-600 flex-shrink-0 mt-0.5" />
                <textarea
                  value={formData.address}
                  onChange={set('address')}
                  placeholder="Enter full address"
                  rows="2"
                  className="flex-1 bg-transparent focus:bg-transparent border-none outline-none focus:ring-0 text-xs text-slate-800 placeholder:text-slate-400 resize-none font-medium"
                />
              </div>
            </div>

            {/* Password (new user only) */}
            {!user && (
              <div className="col-span-2">
                <label className={labelCls}>Temporary Password *</label>
                <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-2.5 h-8 bg-slate-50 transition-all duration-200 focus-within:border-brand-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-500/20">
                  <Shield size={13} className="text-brand-600 flex-shrink-0" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={set('password')}
                    placeholder="Min 8 characters"
                    className={inputCls}
                  />
                  <button type="button" onClick={() => setShowPassword(p => !p)} className="text-slate-400 hover:text-brand-500 transition-colors flex-shrink-0">
                    {showPassword ? <EyeOff size={12} /> : <Eye size={12} />}
                  </button>
                </div>
                <p className="text-[9px] text-slate-400 mt-0.5 ml-1">Employee will change this on first login</p>
              </div>
            )}

            {/* Status */}
            <div>
              <label className={labelCls}>Status *</label>
              <InputWrapper icon={Shield}>
                <select value={formData.status} onChange={set('status')} className={selectCls}>
                  <option value="Active">✅ Active</option>
                  <option value="Inactive">❌ Inactive</option>
                </select>
              </InputWrapper>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex-shrink-0 flex justify-end gap-2.5 px-4 py-3 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-1.5 rounded-2xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-200 active:scale-95 transition-all duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="relative px-4 py-1.5 rounded-2xl btn-primary"
          >
            <span className="relative z-10 flex items-center gap-1.5">
              {loading ? '⏳ Saving...' : user
                ? <><span className="text-sm leading-none">✏</span> Update User</>
                : <><span className="text-base font-black leading-none">+</span> Create User</>
              }
            </span>
            <span className="absolute inset-0 bg-black/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          </button>
        </div>
      </div>
    </div>
  ), document.body);
};

export default UserModal;