// src/components/layout/Sidebar.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, MessageSquare, Briefcase,
  Settings, LogOut, Menu, X, Receipt, Calendar,
  CheckCircle, CalendarDays, ChevronRight, TrendingUp, Layers,
  FolderOpen
} from 'lucide-react';
import { APP_NAME } from '../../utils/constants';
import { useAuth } from '../../hooks/useAuth';

const Sidebar = ({ isOpen, onToggle }) => {
  const { logout, user } = useAuth();
  const location = useLocation();

  const canSeeLeads = user?.role === 'admin' ||
    (user?.department || '').toLowerCase() === 'sales';

  // ── Grouped Menu ──
  const menuGroups = [
    {
      label: null, // No label for primary group
      items: [
        { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      ]
    },
    {
      label: 'CRM',
      items: [
        ...(canSeeLeads ? [{ path: '/admin/leads', icon: TrendingUp, label: 'Leads' }] : []),
        { path: '/admin/inquiries',  icon: MessageSquare, label: 'Inquiries' },
        { path: '/admin/quotations', icon: Receipt,       label: 'Quotations' },
        { path: '/admin/services',   icon: Briefcase,     label: 'Services' },
      ]
    },
    {
      label: 'WORKFORCE',
      items: [
        { path: '/admin/users',      icon: Users,      label: 'Users' },
        { path: '/admin/attendance',  icon: Calendar,   label: 'Attendance' },
        { path: '/admin/tasks',       icon: CheckCircle, label: 'Tasks' },
        { path: '/admin/leaves',      icon: CalendarDays, label: 'Leaves' },
        { path: '/admin/documents',   icon: FolderOpen,  label: 'Documents' },
      ]
    },
    {
      label: 'SYSTEM',
      items: [
        { path: '/admin/settings', icon: Settings, label: 'Settings' },
      ]
    }
  ];

  // ── Active check ──
  const isActivePath = (path) => {
    if (path === '/admin/dashboard') {
      return location.pathname === '/admin' || location.pathname === '/admin/' || location.pathname === '/admin/dashboard';
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <>
      <div
        className={`
          fixed left-0 top-0 h-screen z-[100] flex flex-col
          transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
        style={{
          width: isOpen ? 260 : 72,
          background: 'linear-gradient(160deg, #1e293b 0%, #334155 60%, #1e293b 100%)',
          borderRight: '1px solid rgba(255,255,255,0.05)',
          boxShadow: '4px 0 24px rgba(0,0,0,0.15)',
        }}
      >
        {/* ── Glow blobs ── */}
        <div className="absolute -top-12 left-[30%] w-56 h-56 rounded-full pointer-events-none opacity-60"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)' }} />
        <div className="absolute bottom-20 -right-10 w-44 h-44 rounded-full pointer-events-none opacity-60"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.05) 0%, transparent 70%)' }} />

        {/* ── Logo / Toggle ── */}
        <div
          className={`flex items-center min-h-[64px] border-b border-white/10 ${isOpen ? 'justify-between px-4' : 'justify-center'}`}
        >
          {isOpen && (
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-blue-600
                flex items-center justify-center flex-shrink-0
                shadow-md shadow-brand-500/20">
                <Layers size={18} className="text-white" strokeWidth={2.2} />
              </div>
              <div className="min-w-0">
                <div className="text-[15px] font-bold text-slate-50 tracking-tight truncate max-w-[150px] font-display">
                  {APP_NAME}
                </div>
                <div className="text-[10px] font-bold text-brand-400 uppercase tracking-[0.1em]">
                  Admin
                </div>
              </div>
            </div>
          )}
          <button
            onClick={onToggle}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-300
              hover:bg-white/10 hover:text-slate-100
              transition-all duration-200 active:scale-95 flex-shrink-0"
          >
            {isOpen ? <X size={17} /> : <Menu size={17} />}
          </button>
        </div>

        {/* ── Nav Groups ── */}
        <nav className="flex-1 px-2 py-3 overflow-y-auto overflow-x-hidden scrollbar-hide">
          {menuGroups.map((group, gi) => (
            <div key={gi} className={gi > 0 ? 'mt-4' : ''}>
              {/* Group Label */}
              {group.label && isOpen && (
                <div className="px-3 mb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] select-none">
                  {group.label}
                </div>
              )}
              {group.label && !isOpen && (
                <div className="flex justify-center my-2">
                  <div className="w-5 h-px bg-slate-400/30 rounded-full" />
                </div>
              )}

              {/* Group Items */}
              <div className="space-y-0.5">
                {group.items.map(item => {
                  const active = isActivePath(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      title={!isOpen ? item.label : ''}
                      className={`
                        group relative flex items-center gap-3 w-full rounded-xl
                        text-sm font-medium text-left no-underline
                        transition-all duration-200 py-2
                        ${isOpen ? 'px-3' : 'px-0 justify-center'}
                        ${active
                          ? 'bg-brand-500/15 border-[1.5px] border-brand-500/30 shadow-[0_2px_12px_rgba(99,102,241,0.2)]'
                          : 'border-[1.5px] border-transparent hover:bg-slate-600/30'
                        }
                      `}
                    >
                      {/* Active bar */}
                      {active && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full
                          bg-gradient-to-b from-brand-400 to-blue-500
                          shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                      )}

                      {/* Icon */}
                      <div className={`
                        flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0
                        transition-all duration-200
                        ${active
                          ? 'bg-gradient-to-br from-brand-500 to-blue-600 text-white shadow-md shadow-brand-500/30'
                          : 'bg-slate-600/30 text-slate-300 group-hover:text-brand-300'
                        }
                      `}>
                        <item.icon size={15} strokeWidth={2} />
                      </div>

                      {/* Label */}
                      {isOpen && (
                        <>
                          <span className={`flex-1 truncate transition-colors duration-200 font-medium
                            ${active ? 'text-white' : 'text-slate-300 group-hover:text-slate-100'}
                          `}>
                            {item.label}
                          </span>
                          {active && <ChevronRight size={13} className="text-brand-400 flex-shrink-0" />}
                        </>
                      )}

                      {/* Tooltip when collapsed */}
                      {!isOpen && (
                        <span className="
                          pointer-events-none absolute left-full ml-3
                          px-2.5 py-1.5 bg-slate-800 text-white text-xs font-medium
                          rounded-lg whitespace-nowrap
                          opacity-0 group-hover:opacity-100
                          -translate-x-1 group-hover:translate-x-0
                          transition-all duration-200 z-50 shadow-lg
                        ">
                          {item.label}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* ── User Card ── */}
        {isOpen && user && (
          <div className="mx-2 mb-2 p-3 rounded-xl bg-slate-600/20 border border-slate-500/20">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-blue-600
                flex items-center justify-center text-white text-[11px] font-bold
                shadow-sm shadow-brand-500/20 flex-shrink-0">
                {user.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-medium text-slate-50 truncate">{user.name}</div>
                <div className="text-[10px] text-slate-400 capitalize font-medium">{user.role}</div>
              </div>
              <div className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-emerald-400/20 flex-shrink-0" />
            </div>
          </div>
        )}

        {/* ── Logout ── */}
        <div className="border-t border-white/10 px-2 pb-4 pt-2">
          <button
            onClick={logout}
            className={`
              group relative flex items-center gap-3 w-full rounded-xl text-sm font-medium
              cursor-pointer transition-all duration-200 py-2.5
              bg-red-500/10 border-[1.5px] border-red-500/20 text-red-400
              hover:bg-red-500/20 hover:border-red-500/30
              ${isOpen ? 'px-3' : 'px-0 justify-center'}
            `}
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white text-red-500 flex-shrink-0 shadow-sm">
              <LogOut size={15} strokeWidth={1.8} />
            </div>
            {isOpen && <span>Logout</span>}
            {!isOpen && (
              <span className="pointer-events-none absolute left-full ml-3 px-2.5 py-1.5 bg-slate-800 text-white text-xs font-medium rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-200 z-50 shadow-lg">
                Logout
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div onClick={onToggle}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[99] md:hidden
            animate-fade-in" />
      )}
    </>
  );
};

export default Sidebar;