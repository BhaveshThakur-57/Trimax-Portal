import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu } from 'lucide-react';
import { useSidebar } from '../../hooks/useSidebar';
import { APP_NAME } from '../../utils/constants';
import Sidebar from './Sidebar';
import Header from './Header';

// ── Page Components ──
import Dashboard from '../dashboard/Dashboard';
import UserManagement from '../users/UserManagement';
import EmployeeManagement from '../employees/EmployeeManagement';
import InquiriesList from '../inquiries/InquiriesList';
import ServicesList from '../services/ServicesList';
import QuotationManagement from '../quotations/QuotationManagement';
import ContentManagement from '../content/ContentManagement';
import Settings from '../settings/Settings';
import AttendanceManagement from '../users/AttendanceManagement';
import TaskManagement from '../users/TaskManagement';
import LeaveManagement from '../users/LeaveManagement';
import DocumentManagement from '../users/DocumentMangement';
import LeadManagement from '../leads/LeadManagement';

const AdminLayout = () => {
  const { isOpen, toggle } = useSidebar();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Removed old animClass logic since we are using framer-motion now
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // On desktop: offset main content for the fixed sidebar
  // On mobile: sidebar is overlay, no offset needed
  const sidebarWidth = isMobile ? 0 : (isOpen ? 260 : 72);

  return (
    <div className="h-screen bg-[#F8FAFC] overflow-hidden">
      {/* Sidebar */}
      <Sidebar isOpen={isOpen} onToggle={toggle} />

      {/* Main Area — offset for fixed sidebar */}
      <div
        className="flex flex-col h-full overflow-hidden transition-[margin] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{ marginLeft: sidebarWidth }}
      >
        {/* Mobile Topbar */}
        <div className="
          md:hidden flex items-center gap-3 px-4 h-14
          bg-white/90 backdrop-blur-xl border-b border-slate-200/50
          flex-shrink-0 z-50 shadow-sm
        ">
          <button
            onClick={toggle}
            className="
              w-9 h-9 flex items-center justify-center rounded-2xl
              bg-gradient-to-br from-brand-600 to-brand-500
              text-white shadow-md shadow-brand-500/25
              active:scale-95 transition-transform
            "
          >
            <Menu size={18} />
          </button>
          <span className="font-bold text-slate-800 text-base tracking-tight font-display">
            {APP_NAME}
          </span>
        </div>

        {/* Desktop Header */}
        <div className="hidden md:block flex-shrink-0">
          <Header onMenuClick={toggle} />
        </div>

        {/* Page Content — AnimatePresence triggers on route change */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide relative bg-[#F8FAFC]">
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
                <Route index element={<Dashboard />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="employees" element={<EmployeeManagement />} />
                <Route path="attendance" element={<AttendanceManagement />} />
                <Route path="tasks" element={<TaskManagement />} />
                <Route path="leaves" element={<LeaveManagement />} />
                <Route path="documents" element={<DocumentManagement />} />
                <Route path="inquiries" element={<InquiriesList />} />
                <Route path="services" element={<ServicesList />} />
                <Route path="quotations" element={<QuotationManagement />} />
                <Route path="leads" element={<LeadManagement />} />
                <Route path="content" element={<ContentManagement />} />
                <Route path="settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;