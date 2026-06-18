import { createPortal } from 'react-dom';
import React, { useEffect, useState } from 'react';
import { X, Mail, Phone, Building2, Briefcase, Calendar, Shield, MapPin, Lock, User } from 'lucide-react';
import Badge from '../common/Badge';
import { formatDate } from '../../utils/helpers';

const UserDetailModal = ({ user, onClose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (user) requestAnimationFrame(() => setVisible(true));
  }, [user]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 280);
  };

  if (!user) return null;

  const InfoCard = ({ icon: Icon, label, children, fullWidth = false, yellow = false }) => (
    <div
      className={`
        ${fullWidth ? 'col-span-2' : ''}
        ${yellow
          ? 'bg-amber-500/10 border border-amber-500/20'
          : 'bg-white border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:border-brand-200 hover:shadow-lg hover:shadow-brand-100'
        }
        rounded-2xl p-3 transition-all duration-200 group
      `}
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className={`${yellow ? 'text-amber-500' : 'text-brand-600 group-hover:text-brand-700'} transition-colors duration-200`}>
          <Icon size={14} />
        </span>
        <span className={`text-[10px] font-bold uppercase tracking-widest ${yellow ? 'text-amber-600' : 'text-slate-500'}`}>
          {label}
        </span>
      </div>
      {children}
    </div>
  );

  const initials = user.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return createPortal((
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-all duration-300 ${visible ? 'bg-black/50 backdrop-blur-sm' : 'bg-black/0 backdrop-blur-none'}`}
      onClick={handleClose}
    >
      <div
        className={`bg-slate-50 border border-slate-100 rounded-3xl w-full max-w-[520px] max-h-[calc(100vh-32px)] overflow-y-auto shadow-2xl transition-all duration-300 ease-out ${visible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'}`}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Gradient Hero Header ── */}
        <div className="relative bg-gradient-to-r from-brand-600 to-blue-600 rounded-t-3xl overflow-hidden">
          {/* decorative blobs */}
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full bg-white/10 blur-2xl pointer-events-none" />

          {/* Close btn */}
          <div className="flex justify-end p-3 pb-0">
            <button
              onClick={handleClose}
              className="group w-9 h-9 flex items-center justify-center rounded-2xl bg-white/15 hover:bg-white/30 transition-all duration-200 hover:rotate-90"
            >
              <X size={18} className="text-white transition-transform duration-200" />
            </button>
          </div>

          {/* Avatar + Info */}
          <div className="text-center pb-5 px-6 -mt-2">
            <div className="relative inline-block mb-2">
              <div className="w-14 h-14 rounded-2xl bg-white/20 border-2 border-white/30 flex items-center justify-center text-white text-xl font-extrabold shadow-xl backdrop-blur-sm mx-auto">
                {initials}
              </div>
              <span className={`absolute -bottom-1.5 -right-1.5 w-5 h-5 rounded-full border-2 border-white ${user.isActive !== false ? 'bg-emerald-400' : 'bg-red-400'}`} />
            </div>
            <h3 className="text-white font-extrabold text-xl tracking-tight">{user.name}</h3>
            <p className="text-white/75 text-sm mt-1">{user.designation || user.role || 'User'}</p>
            <div className="flex items-center justify-center gap-2 mt-3">
              <span className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-sm border border-white/20">
                {user.status || (user.isActive !== false ? '● Active' : '● Inactive')}
              </span>
              {user.department && (
                <span className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-sm border border-white/20">
                  {user.department}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Detail Cards ── */}
        <div className="p-4">
          <div className="grid grid-cols-2 gap-2">

            <InfoCard icon={Mail} label="Email">
              <p className="text-sm font-semibold text-slate-800 break-all leading-snug">{user.email}</p>
            </InfoCard>

            {user.phone && (
              <InfoCard icon={Phone} label="Phone">
                <p className="text-sm font-semibold text-slate-800">{user.phone}</p>
              </InfoCard>
            )}

            {user.employeeId && (
              <InfoCard icon={Shield} label="Employee ID">
                <p className="text-sm font-bold font-mono text-brand-600 tracking-wider">{user.employeeId}</p>
              </InfoCard>
            )}

            {user.department && (
              <InfoCard icon={Building2} label="Department">
                <p className="text-sm font-semibold text-slate-800">{user.department}</p>
              </InfoCard>
            )}

            {user.designation && (
              <InfoCard icon={Briefcase} label="Designation">
                <p className="text-sm font-semibold text-slate-800">{user.designation}</p>
              </InfoCard>
            )}

            {user.workingType && (
              <InfoCard icon={Shield} label="Working Type">
                <p className="text-sm font-semibold text-slate-800">{user.workingType}</p>
              </InfoCard>
            )}

            {user.salary && (
              <InfoCard icon={User} label="Salary">
                <p className="text-sm font-bold text-emerald-600">₹{user.salary}</p>
              </InfoCard>
            )}

            <InfoCard icon={Shield} label="Role">
              <Badge status={user.role}>{user.role}</Badge>
            </InfoCard>

            <InfoCard icon={Calendar} label="Join Date">
              <p className="text-sm font-semibold text-slate-800">{formatDate(user.joinDate || user.createdAt)}</p>
            </InfoCard>

            {user.address && (
              <InfoCard icon={MapPin} label="Address" fullWidth>
                <p className="text-sm font-semibold text-slate-800 leading-relaxed">{user.address}</p>
              </InfoCard>
            )}

            {(user.tempPassword || user.password) && (
              <InfoCard icon={Lock} label="Temporary Password" fullWidth yellow>
                <p className="text-base font-extrabold font-mono text-red-600 tracking-widest mb-1">
                  {user.tempPassword || user.password}
                </p>
                <p className="text-[11px] text-amber-500 font-medium">
                  ⚠️ Ask user to change this password after first login
                </p>
              </InfoCard>
            )}

          </div>
        </div>

        {/* ── Footer ── */}
        <div className="px-4 pb-4">
          <button
            onClick={handleClose}
            className="w-full py-2.5 rounded-2xl btn-primary text-sm font-bold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  ), document.body);
};

export default UserDetailModal;