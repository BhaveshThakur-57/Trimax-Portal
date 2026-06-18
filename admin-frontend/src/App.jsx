import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LoginScreen from './components/auth/LoginScreen';
import ResetPasswordScreen from './components/auth/ResetPasswordScreen';
import AdminLayout from './components/layout/AdminLayout';
import EmployeeLayout from './components/layout/EmployeeLayout';
import { useAuth } from './hooks/useAuth';

import './index.css';

// Spinner
const Spinner = () => (
  <div className="flex justify-center items-center h-screen bg-surface-50">
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-[3px] border-brand-100 border-t-brand-600 animate-spin" />
        <div className="absolute inset-0 w-12 h-12 rounded-full border-[3px] border-transparent border-b-brand-300 animate-spin-slow" />
      </div>
      <span className="text-sm font-semibold text-surface-400 font-display tracking-wide">Loading...</span>
    </div>
  </div>
);

// Normalize role — handles case mismatch & legacy "user" role
function normalizeRole(role) {
  if (!role) return '';
  const r = role.toLowerCase().trim();
  // Legacy "user" role maps to "employee"
  if (r === 'user') return 'employee';
  return r;
}

// Role-based redirect path
function getRedirectPath(role) {
  const normalized = normalizeRole(role);
  switch (normalized) {
    case 'admin':    return '/admin';
    case 'employee': return '/employee';
    default:         return '/employee';
  }
}

// Private Route — role-based access control (case-insensitive)
function PrivateRoute({ children, allowedRoles }) {
  const { user, isLoggedIn, loading } = useAuth();

  if (loading) return <Spinner />;
  if (!isLoggedIn) return <Navigate to="/" replace />;

  const userRole = normalizeRole(user?.role);
  if (!allowedRoles.includes(userRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

// Public Route — redirects logged-in users
function PublicRoute({ children }) {
  const { user, isLoggedIn, loading } = useAuth();

  if (loading) return <Spinner />;

  if (isLoggedIn) {
    const path = getRedirectPath(user?.role);
    return <Navigate to={path} replace />;
  }

  return children;
}

// Unauthorized Page
function UnauthorizedPage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center p-6">
      <div className="premium-card p-10 max-w-md w-full text-center animate-fade-in-up">
        <div className="w-20 h-20 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6 ring-4 ring-red-100">
          <span className="text-4xl">⛔</span>
        </div>
        <h2 className="text-2xl font-bold text-surface-800 mb-2 font-display">Unauthorized Access</h2>
        <p className="text-surface-500 mb-4 text-sm leading-relaxed">
          You don't have permission to access this page.
        </p>
        <span className="inline-block bg-surface-100 text-surface-600 text-sm font-medium px-4 py-2 rounded-xl mb-8">
          Your role: <strong className="text-surface-800">{user?.role || 'Unknown'}</strong>
        </span>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => { window.location.href = getRedirectPath(user?.role); }}
            className="btn-primary w-full py-3"
          >
            Go to Dashboard
          </button>
          <button
            onClick={logout}
            className="btn-secondary w-full py-3"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

// Routes
function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PublicRoute><LoginScreen /></PublicRoute>} />
      <Route path="/reset-password/:token" element={<ResetPasswordScreen />} />

      {/* Admin Panel */}
      <Route path="/admin/*" element={
        <PrivateRoute allowedRoles={['admin']}>
          <AdminLayout />
        </PrivateRoute>
      } />

      {/* Employee Panel */}
      <Route path="/employee/*" element={
        <PrivateRoute allowedRoles={['employee']}>
          <EmployeeLayout />
        </PrivateRoute>
      } />

      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      
      {/* Legacy /user path redirect to /employee */}
      <Route path="/user/*" element={<Navigate to="/employee" replace />} />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// Main App
function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;