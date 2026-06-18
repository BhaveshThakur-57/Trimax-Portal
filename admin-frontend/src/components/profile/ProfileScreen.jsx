import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../hooks/useAuth';
import { User, Mail, Shield, Lock, Save, Edit2, X, Eye, EyeOff, CheckCircle } from 'lucide-react';

const labelCls = "block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2";

const InputWrapper = ({ icon: Icon, children, disabled }) => (
  <div className={`flex items-center gap-3 border-2 rounded-2xl px-4 h-12 transition-all duration-200
    ${disabled
      ? 'bg-slate-50 border-transparent text-slate-500 select-none opacity-80'
      : 'bg-white border-slate-200 hover:border-slate-300 focus-within:!border-brand-500 focus-within:bg-white focus-within:!ring-2 focus-within:!ring-brand-500/20'
    }`}
  >
    <Icon size={16} className={`flex-shrink-0 transition-colors duration-200 ${disabled ? 'text-slate-300' : 'text-brand-400'}`} />
    {children}
  </div>
);

const inputCls = "flex-1 bg-transparent focus:bg-transparent border-none outline-none focus:ring-0 text-sm text-slate-700 placeholder:text-slate-300 disabled:text-slate-400 font-medium";

const ProfileScreen = ({ onClose }) => {
  const { user } = useAuth();
  const [visible, setVisible]       = useState(false);
  const [activeTab, setActiveTab]   = useState('profile');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState('');
  const [isEditing, setIsEditing]   = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [profileData, setProfileData] = useState({ name: '', email: '' });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '', newPassword: '', confirmPassword: ''
  });

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    if (user) setProfileData({ name: user.name, email: user.email });
  }, [user]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 280);
  };

  const handleUpdateProfile = async e => {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/auth/update-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(profileData)
      });
      const data = await response.json();
      if (data.success) {
        setSuccess('Profile updated successfully!');
        setIsEditing(false);
        const storedUser = JSON.parse(localStorage.getItem('user'));
        localStorage.setItem('user', JSON.stringify({ ...storedUser, name: data.data.name, email: data.data.email }));
      } else {
        setError(data.message || 'Failed to update profile');
      }
    } catch {
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async e => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword)
      return setError('Please fill in all password fields');
    if (passwordData.newPassword !== passwordData.confirmPassword)
      return setError('New passwords do not match');
    if (passwordData.newPassword.length < 8)
      return setError('Password must be at least 8 characters');
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/auth/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: passwordData.currentPassword, newPassword: passwordData.newPassword })
      });
      const data = await response.json();
      if (data.success) {
        setSuccess('Password changed successfully!');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setError(data.message || 'Failed to change password');
      }
    } catch {
      setError('Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return createPortal((
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto transition-all duration-300 ${visible ? 'bg-black/50 backdrop-blur-sm' : 'bg-black/0'}`}
      onClick={handleClose}
    >
      <div
        className={`bg-white rounded-3xl w-full max-w-[460px] shadow-2xl my-auto overflow-hidden transition-all duration-300 ease-out ${visible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-6'}`}
        onClick={e => e.stopPropagation()}
      >

        {/* ── Gradient Hero ── */}
        <div className="relative bg-gradient-to-r from-brand-600 to-blue-600 overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full bg-white/10 blur-2xl pointer-events-none" />

          {/* Top bar */}
          <div className="relative flex items-center justify-between px-5 pt-5 pb-1">
            <h2 className="text-white font-extrabold text-base tracking-tight">My Profile</h2>
            <button
              onClick={handleClose}
              className="w-9 h-9 flex items-center justify-center rounded-2xl bg-white/15 hover:bg-white/30 text-white transition-all duration-200 hover:rotate-90"
            >
              <X size={18} />
            </button>
          </div>

          {/* Avatar */}
          <div className="relative text-center py-6">
            <div className="w-20 h-20 rounded-2xl bg-white/20 border-2 border-white/30 flex items-center justify-center text-white text-2xl font-extrabold shadow-xl mx-auto mb-3">
              {initials}
            </div>
            <h3 className="text-white font-extrabold text-lg leading-tight">{user?.name}</h3>
            <span className="inline-block mt-2 px-3 py-1 rounded-full bg-white/20 text-white/90 text-xs font-semibold border border-white/20">
              {user?.role}
            </span>
          </div>

          {/* Tabs inside gradient */}
          <div className="relative flex px-5 gap-1 pb-0">
            {[
              { id: 'profile',  icon: User, label: 'Profile'  },
              { id: 'security', icon: Lock, label: 'Security' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setError(''); setSuccess(''); }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-t-xl text-sm font-bold transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-white text-brand-700 shadow-sm'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Content ── */}
        <div className="bg-[#f8f9fc] p-5 min-h-[300px]">

          {/* Alert Messages */}
          {error && (
            <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm font-medium mb-4">
              <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
              {error}
              <button type="button" onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600 hover:rotate-90 transition-all duration-200">
                <X size={14} />
              </button>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700 text-sm font-medium mb-4">
              <CheckCircle size={16} className="flex-shrink-0" />
              {success}
              <button type="button" onClick={() => setSuccess('')} className="ml-auto text-emerald-400 hover:text-emerald-600 transition-colors">
                <X size={14} />
              </button>
            </div>
          )}

          {/* ── Profile Tab ── */}
          {activeTab === 'profile' && (
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className={labelCls}>Full Name</label>
                <InputWrapper icon={User} disabled={!isEditing || loading}>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={e => setProfileData({ ...profileData, name: e.target.value })}
                    disabled={!isEditing || loading}
                    placeholder="Your full name"
                    className={inputCls}
                  />
                </InputWrapper>
              </div>

              <div>
                <label className={labelCls}>Email Address</label>
                <InputWrapper icon={Mail} disabled={!isEditing || loading}>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={e => setProfileData({ ...profileData, email: e.target.value })}
                    disabled={!isEditing || loading}
                    placeholder="your@email.com"
                    className={inputCls}
                  />
                </InputWrapper>
              </div>

              <div>
                <label className={labelCls}>Role</label>
                <InputWrapper icon={Shield} disabled>
                  <input type="text" value={user?.role || ''} disabled className={inputCls} />
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-100 text-brand-600 flex-shrink-0">
                    Read only
                  </span>
                </InputWrapper>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                {!isEditing ? (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-2xl btn-primary"
                  >
                    <Edit2 size={14} /> Edit Profile
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => { setIsEditing(false); setProfileData({ name: user.name, email: user.email }); setError(''); }}
                      className="px-4 py-2.5 rounded-2xl border-2 border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-100 active:scale-95 transition-all duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-2xl btn-primary"
                    >
                      <Save size={14} /> {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </>
                )}
              </div>
            </form>
          )}

          {/* ── Security Tab ── */}
          {activeTab === 'security' && (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <p className="text-[13px] text-slate-500 font-medium -mt-1 mb-2">
                Keep your account safe by updating your password regularly.
              </p>

              {/* Current Password */}
              <div>
                <label className={labelCls}>Current Password</label>
                <div className="flex items-center gap-3 border-2 border-slate-200 rounded-2xl px-4 h-12 bg-white hover:border-slate-300 focus-within:!border-brand-500 focus-within:bg-white focus-within:!ring-2 focus-within:!ring-brand-500/20 transition-all duration-200">
                  <Lock size={16} className="text-brand-400 flex-shrink-0" />
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    placeholder="Enter current password"
                    disabled={loading}
                    className={inputCls}
                  />
                  <button type="button" onClick={() => setShowCurrent(p => !p)} className="text-slate-400 hover:text-brand-500 transition-colors flex-shrink-0">
                    {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className={labelCls}>New Password</label>
                <div className="flex items-center gap-3 border-2 border-slate-200 rounded-2xl px-4 h-12 bg-white hover:border-slate-300 focus-within:!border-brand-500 focus-within:bg-white focus-within:!ring-2 focus-within:!ring-brand-500/20 transition-all duration-200">
                  <Lock size={16} className="text-brand-400 flex-shrink-0" />
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    placeholder="Min 8 characters"
                    disabled={loading}
                    className={inputCls}
                  />
                  <button type="button" onClick={() => setShowNew(p => !p)} className="text-slate-400 hover:text-brand-500 transition-colors flex-shrink-0">
                    {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {/* Password strength bar */}
                {passwordData.newPassword && (
                  <div className="mt-2 flex gap-1">
                    {[1,2,3,4].map(i => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          passwordData.newPassword.length >= i * 2
                            ? i <= 2 ? 'bg-red-400' : i === 3 ? 'bg-amber-400' : 'bg-emerald-400'
                            : 'bg-slate-200'
                        }`}
                      />
                    ))}
                    <span className="text-[10px] text-slate-400 font-medium ml-1">
                      {passwordData.newPassword.length < 4 ? 'Weak' : passwordData.newPassword.length < 6 ? 'Fair' : passwordData.newPassword.length < 8 ? 'Good' : 'Strong'}
                    </span>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className={labelCls}>Confirm New Password</label>
                <div className={`flex items-center gap-3 border-2 rounded-2xl px-4 h-12 bg-white hover:border-slate-300 focus-within:!border-brand-500 focus-within:bg-white focus-within:!ring-2 focus-within:!ring-brand-500/20 transition-all duration-200 ${
                  passwordData.confirmPassword && passwordData.confirmPassword !== passwordData.newPassword
                    ? 'border-red-300 focus-within:!border-red-500 focus-within:!ring-red-500/20' : 'border-slate-200'
                }`}>
                  <Lock size={16} className="text-brand-400 flex-shrink-0" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    placeholder="Confirm new password"
                    disabled={loading}
                    className={inputCls}
                  />
                  <button type="button" onClick={() => setShowConfirm(p => !p)} className="text-slate-400 hover:text-brand-500 transition-colors flex-shrink-0">
                    {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {passwordData.confirmPassword && passwordData.confirmPassword !== passwordData.newPassword && (
                  <p className="text-[11px] text-red-500 font-medium mt-1.5 ml-1">Passwords do not match</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl btn-primary"
              >
                <Save size={15} /> {loading ? 'Updating...' : 'Change Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  ), document.body);
};

export default ProfileScreen;