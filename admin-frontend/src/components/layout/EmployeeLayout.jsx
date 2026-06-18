import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { EmployeeDataProvider, useEmployeeContext } from './EmployeeContext';
import EmployeeHome from './EmployeeHome';
import MyAttendance from './MyAttendance';
import MyProfile from './MyProfile';
import MyLeaves from './MyLeaves';
import MyPayslips from './MyPayslips';
import MyDocuments from './MyDocuments';
import GenerateOfferLetter from './Offerletter';
import MyTasks from './MyTasks';
import Holidays from './Holidays';
import Analysis from './Analysis';
import AttendancePopupNotifier from './AttendancePopupNotifier';
import NotificationPanel from './NotificationPanel';
import notificationService from '../../services/notificationService';
import {
  User, Clock, FileText, LogOut, Home, Menu, X, Calendar,
  DollarSign, Bell, CheckCircle, PartyPopper, BarChart3,
  ChevronLeft, ChevronRight
} from 'lucide-react';

// ── Theme: Dark Navy/Slate + Glassmorphism ──
const T = {
  bg:           'linear-gradient(160deg, #0f172a 0%, #1e293b 60%, #0f172a 100%)',
  accent:       'linear-gradient(135deg, #6366f1, #8b5cf6)',
  accentSolid:  '#6366f1',
  activeBg:     'rgba(99,102,241,0.15)',
  activeBorder: 'rgba(99,102,241,0.45)',
  hoverBg:      'rgba(255,255,255,0.05)',
  border:       'rgba(255,255,255,0.08)',
  textPrimary:  '#f1f5f9',
  textMuted:    'rgba(203,213,225,0.6)',
  iconBg:       'rgba(255,255,255,0.07)',
  cardBg:       'rgba(255,255,255,0.06)',
  cardBorder:   'rgba(255,255,255,0.1)',
  glassBg:      'rgba(255,255,255,0.04)',
  glassBorder:  'rgba(255,255,255,0.08)',
};

const EmployeeLayoutInner = () => {
  const { user, logout } = useAuth();
  const { profilePicture } = useEmployeeContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationRef = useRef(null);

  // ── Notifications ──
  useEffect(() => {
    fetchNotifications();
    
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    const sse = new EventSource(`${BASE_URL}/api/notifications/stream?token=${token}`);
    
    sse.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'new_notification') {
          setNotifications(prev => [data.notification, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      } catch (err) {}
    };

    sse.onerror = () => sse.close();
    return () => sse.close();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target))
        setShowNotifications(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await notificationService.getAll();
      const data = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : Array.isArray(res?.data?.data) ? res.data.data : [];
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.isRead).length);
    } catch (e) { console.error(e); }
  };

  const handleMarkAsRead = async (id) => { try { await notificationService.markAsRead(id); fetchNotifications(); } catch(e){} };
  const handleMarkAllAsRead = async () => { try { await notificationService.markAllAsRead(); fetchNotifications(); } catch(e){} };
  const handleDeleteNotification = async (id) => { try { await notificationService.delete(id); fetchNotifications(); } catch(e){} };

  const handleLogout = () => { logout(); navigate('/'); };

  const menuItems = [
    { id: 'home',       label: 'Dashboard',        icon: Home,        path: '/employee'            },
    { id: 'profile',    label: 'My Profile',       icon: User,        path: '/employee/profile'    },
    { id: 'attendance', label: 'Attendance',       icon: Clock,       path: '/employee/attendance' },
    { id: 'tasks',      label: 'My Tasks',         icon: CheckCircle, path: '/employee/tasks'      },
    { id: 'leaves',     label: 'Leave Management', icon: Calendar,    path: '/employee/leaves'     },
    { id: 'payslips',   label: 'Payslips',         icon: DollarSign,  path: '/employee/payslips'   },
    { id: 'documents',  label: 'Documents',        icon: FileText,    path: '/employee/documents'  },
    { id: 'holidays',   label: 'Holidays',         icon: PartyPopper, path: '/employee/holidays'   },
    { id: 'analysis',   label: 'Analysis',         icon: BarChart3,   path: '/employee/analysis'   },
  ];

  const SidebarInner = ({ mobile = false }) => {
    const open = mobile || !collapsed;
    return (
      <div style={{
        width: open ? 252 : 68, minWidth: open ? 252 : 68,
        height: '100vh', background: T.bg,
        borderRight: `1px solid ${T.border}`,
        display: 'flex', flexDirection: 'column',
        transition: 'width 0.28s ease, min-width 0.28s ease',
        overflow: 'hidden', flexShrink: 0, position: 'relative',
      }}>
        {/* Glow blobs */}
        <div style={{ position:'absolute', top:-60, left:'30%', width:200, height:200, borderRadius:'50%', background:'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:80, right:-40, width:160, height:160, borderRadius:'50%', background:'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)', pointerEvents:'none' }} />

        {/* Logo */}
        <div style={{ height:64, display:'flex', alignItems:'center', gap:12, padding:'0 14px', borderBottom:`1px solid ${T.border}`, flexShrink:0 }}>
          <div style={{ width:38, height:38, borderRadius:11, flexShrink:0, background:T.accent, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:17, boxShadow:'0 4px 16px rgba(99,102,241,0.45)' }}>E</div>
          {open && <div>
            <div style={{ fontWeight:700, fontSize:15, color:T.textPrimary, lineHeight:1.25, whiteSpace:'nowrap' }}>EMS Portal</div>
            <div style={{ fontSize:10, color:'#818cf8', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase' }}>Employee</div>
          </div>}
          {mobile && <button onClick={() => setMobileSidebarOpen(false)} style={{ marginLeft:'auto', background:'none', border:'none', cursor:'pointer', color:T.textMuted, display:'flex' }}><X size={20} /></button>}
        </div>

        {/* User card — glass */}
        <div style={{ margin:'12px 10px', padding:'10px 12px', background:T.cardBg, border:`1px solid ${T.cardBorder}`, borderRadius:13, backdropFilter:'blur(12px)', display:'flex', alignItems:'center', gap:10, flexShrink:0, overflow:'hidden' }}>
          {profilePicture ? (
            <img src={profilePicture} alt="avatar" style={{ width:36, height:36, borderRadius:'50%', objectFit:'cover', flexShrink:0, border:'2px solid rgba(99,102,241,0.5)', boxShadow:'0 0 0 3px rgba(99,102,241,0.15)' }} />
          ) : (
            <div style={{ width:36, height:36, borderRadius:'50%', flexShrink:0, background:T.accent, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:15, boxShadow:'0 0 0 3px rgba(99,102,241,0.2)' }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          )}
          {open && <>
            <div style={{ flex:1, overflow:'hidden' }}>
              <div style={{ fontWeight:600, fontSize:13.5, color:T.textPrimary, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{user?.name}</div>
              <div style={{ fontSize:11, color:T.textMuted, marginTop:1, whiteSpace:'nowrap' }}>{user?.employeeId}</div>
            </div>
            <div style={{ width:8, height:8, borderRadius:'50%', background:'#a78bfa', boxShadow:'0 0 0 3px rgba(167,139,250,0.25)', flexShrink:0 }} />
          </>}
        </div>

        {/* Nav */}
        <nav style={{ flex:1, overflowY:'auto', overflowX:'hidden', padding:'4px 8px', scrollbarWidth:'none', msOverflowStyle:'none' }}>
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.id} to={item.path} title={!open ? item.label : undefined}
                onClick={() => mobile && setMobileSidebarOpen(false)}
                style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 9px', borderRadius:10, marginBottom:3, textDecoration:'none', position:'relative', background: isActive ? T.activeBg : 'transparent', border:`1.5px solid ${isActive ? T.activeBorder : 'transparent'}`, backdropFilter: isActive ? 'blur(8px)' : 'none', boxShadow: isActive ? '0 2px 12px rgba(99,102,241,0.2)' : 'none', transition:'all 0.15s' }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = T.hoverBg; e.currentTarget.style.backdropFilter = 'blur(8px)'; }}}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.backdropFilter = 'none'; }}}
              >
                {isActive && <div style={{ position:'absolute', left:0, top:'18%', bottom:'18%', width:3, background:T.accent, borderRadius:'0 3px 3px 0', boxShadow:'0 0 8px rgba(99,102,241,0.8)' }} />}
                <div style={{ width:32, height:32, borderRadius:9, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', background: isActive ? T.accent : T.iconBg, color: isActive ? '#fff' : 'rgba(203,213,225,0.7)', boxShadow: isActive ? '0 3px 12px rgba(99,102,241,0.4)' : 'none', transition:'all 0.15s' }}>
                  <Icon size={15} />
                </div>
                {open && <span style={{ fontSize:13.5, whiteSpace:'nowrap', fontWeight: isActive ? 600 : 400, color: isActive ? '#e0e7ff' : T.textMuted }}>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div style={{ padding:'8px 10px 14px', flexShrink:0, borderTop:`1px solid ${T.border}` }}>
          {!mobile && (
            <button onClick={() => setCollapsed(c => !c)} style={{ width:'100%', display:'flex', alignItems:'center', justifyContent: collapsed ? 'center' : 'flex-start', gap:7, padding:'7px 10px', marginBottom:7, background:T.accent, border:'none', borderRadius:9, cursor:'pointer', color:'#fff', fontSize:13, fontWeight:600,  boxShadow:'0 4px 14px rgba(99,102,241,0.4)', transition:'opacity 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.opacity='0.85'}
              onMouseLeave={e => e.currentTarget.style.opacity='1'}
            >
              {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /><span>Collapse</span></>}
            </button>
          )}
          <button onClick={handleLogout} style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:(collapsed && !mobile) ? 'center' : 'flex-start', gap:8, padding:'8px 10px', background:'rgba(239,68,68,0.08)', border:'1.5px solid rgba(239,68,68,0.2)', borderRadius:9, cursor:'pointer', color:'#fca5a5', fontSize:13, fontWeight:600,  transition:'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background='rgba(239,68,68,0.18)'}
            onMouseLeave={e => e.currentTarget.style.background='rgba(239,68,68,0.08)'}
          >
            <LogOut size={16} style={{ flexShrink:0 }} />
            {(!collapsed || mobile) && <span>Logout</span>}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display:'flex', height:'100vh', background:'#f8fafc' }}>
      {mobileSidebarOpen && <div onClick={() => setMobileSidebarOpen(false)} className="lg:hidden" style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:40 }} />}
      <div className="lg:hidden" style={{ position:'fixed', top:0, left:0, bottom:0, zIndex:50, boxShadow:'4px 0 24px rgba(0,0,0,0.3)', transform: mobileSidebarOpen ? 'translateX(0)' : 'translateX(-100%)', transition:'transform 0.28s ease' }}>
        <SidebarInner mobile />
      </div>
      <div className="hidden lg:block" style={{ flexShrink:0 }}><SidebarInner /></div>
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <header style={{ height:64, background:'#fff', borderBottom:'1.5px solid #e2e8f0', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', flexShrink:0 }}>
          <button onClick={() => setMobileSidebarOpen(true)} className="lg:hidden" style={{ background:'none', border:'none', cursor:'pointer', color:'#6b7280' }}><Menu size={22} /></button>
          <div>
            <h2 style={{ fontSize:17, fontWeight:700, color:'#0f172a', margin:0, lineHeight:1.3 }}>{menuItems.find(i => i.path === location.pathname)?.label || 'Dashboard'}</h2>
            <p style={{ fontSize:12, color:'#94a3b8', margin:0 }}>{new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</p>
          </div>
          <div className="relative" ref={notificationRef}>
            <button 
              onClick={() => setShowNotifications(p => !p)}
              style={{ position:'relative', background: showNotifications ? '#e0e7ff' : '#f1f5f9', border:`1.5px solid ${showNotifications ? '#c7d2fe' : '#e2e8f0'}`, borderRadius:9, width:38, height:38, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color: showNotifications ? '#4f46e5' : '#6b7280', transition:'all 0.2s' }}>
              <Bell size={17} />
              {unreadCount > 0 && (
                <span style={{ position:'absolute', top:-4, right:-4, width:18, height:18, background:'#ef4444', color:'#fff', fontSize:10, fontWeight:'bold', borderRadius:'50%', border:'2px solid #fff', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            {showNotifications && (
              <NotificationPanel
                notifications={notifications}
                onMarkAsRead={handleMarkAsRead}
                onMarkAllAsRead={handleMarkAllAsRead}
                onDelete={handleDeleteNotification}
                onClose={() => setShowNotifications(false)}
              />
            )}
          </div>
        </header>
        <main style={{ flex:1, overflowY:'auto' }} className="relative bg-[#F8FAFC]">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="min-h-full"
            >
              <Routes location={location} key={location.pathname}>
                <Route path="/"               element={<EmployeeHome />}        />
                <Route path="/tasks"          element={<MyTasks />}             />
                <Route path="/attendance"     element={<MyAttendance />}        />
                <Route path="/leaves"         element={<MyLeaves />}            />
                <Route path="/analysis"       element={<Analysis />}            />
                <Route path="/holidays"       element={<Holidays />}            />
                <Route path="/payslips"       element={<MyPayslips />}          />
                <Route path="/documents"      element={<MyDocuments />}         />
                <Route path="/profile"        element={<MyProfile />}           />
                <Route path="/generate-offer" element={<GenerateOfferLetter />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </main>
        <AttendancePopupNotifier />
      </div>
    </div>
  );
};

const EmployeeLayout = () => (
  <EmployeeDataProvider><EmployeeLayoutInner /></EmployeeDataProvider>
);
export default EmployeeLayout;