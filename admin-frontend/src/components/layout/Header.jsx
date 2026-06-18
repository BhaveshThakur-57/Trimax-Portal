import React, { useState, useEffect, useRef } from 'react';
// react-router-dom import removed
import {
  Bell, ChevronDown
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getInitials } from '../../utils/helpers';
import ProfileScreen from '../profile/ProfileScreen';
import NotificationPanel from './NotificationPanel';
import notificationService from '../../services/notificationService';

// Route metadata removed


const Header = () => {
  const { user } = useAuth();
  const [showProfile, setShowProfile]             = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications]         = useState([]);
  const [unreadCount, setUnreadCount]             = useState(0);
  const notificationRef = useRef(null);

  // ── Notifications ──
  useEffect(() => {
    fetchNotifications();
    
    // Real-time SSE connection
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    const sse = new EventSource(`${BASE_URL}/api/notifications/stream?token=${token}`);
    
    sse.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'new_notification') {
          // Play a sound or show a toast if needed
          setNotifications(prev => [data.notification, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      } catch (err) {}
    };

    sse.onerror = () => {
      sse.close();
    };

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
      const data = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.data?.data)
            ? res.data.data
            : [];
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.isRead).length);
    } catch (e) { console.error(e); }
  };

  const handleMarkAsRead         = async (id) => { try { await notificationService.markAsRead(id);  fetchNotifications(); } catch(e){} };
  const handleMarkAllAsRead      = async ()   => { try { await notificationService.markAllAsRead(); fetchNotifications(); } catch(e){} };
  const handleDeleteNotification = async (id) => { try { await notificationService.delete(id);      fetchNotifications(); } catch(e){} };

  // ── Current page info ──



  return (
    <>
      <header className="
        h-16 bg-white border-b border-slate-200
        flex items-center justify-end px-6
        sticky top-0 z-40
      ">

        {/* Right — Actions */}
        <div className="flex items-center gap-2">

          {/* Notification Bell */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications(p => !p)}
              className={`
                relative w-9 h-9 flex items-center justify-center rounded-2xl
                transition-all duration-200 active:scale-95
                ${showNotifications
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }
              `}
            >
              <Bell size={17} strokeWidth={1.8} />
              {unreadCount > 0 && (
                <span className="
                  absolute -top-1 -right-1
                  bg-rose-500
                  text-white text-[10px] font-bold
                  min-w-[18px] h-[18px] rounded-full
                  flex items-center justify-center px-1
                  ring-2 ring-white shadow-sm
                  animate-scale-in
                ">
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

          {/* Divider */}
          <div className="w-px h-7 bg-slate-200 mx-1" />

          {/* Profile */}
          <button
            onClick={() => { setShowProfile(true); setShowNotifications(false); }}
            className="
              flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-2xl
              hover:bg-slate-50 border border-transparent hover:border-slate-200
              transition-all duration-200 active:scale-[0.98] group
            "
          >
            {/* Avatar */}
            <div className="
              w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center
              bg-gradient-to-br from-brand-600 to-blue-600
              text-white font-bold text-[11px] tracking-wide
              shadow-md shadow-brand-500/25
              ring-2 ring-brand-100
            ">
              {user ? getInitials(user.name) : 'AU'}
            </div>

            {/* Name + role */}
            <div className="hidden sm:flex flex-col items-start leading-none gap-0.5">
              <span className="text-[13px] font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">
                {user?.name || 'Admin User'}
              </span>
              <span className="text-[10px] text-slate-500 font-semibold capitalize tracking-wide">
                {user?.role || 'Admin'}
              </span>
            </div>

            <ChevronDown size={14} className="text-slate-400 hidden sm:block" />
          </button>

        </div>
      </header>

      {showProfile && <ProfileScreen onClose={() => setShowProfile(false)} />}
    </>
  );
};

export default Header;