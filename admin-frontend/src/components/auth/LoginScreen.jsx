import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Shield, Zap, BarChart3, Layers } from 'lucide-react';
import Alert from '../common/Alert';
import { APP_NAME } from '../../utils/constants';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const LoginScreen = () => {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [forgotEmail, setForgotEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!loginData.email || !loginData.password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    try {
      const result = await login(loginData.email, loginData.password);
      if (result.success) {
        setSuccess('Login successful! Redirecting...');
      } else {
        setError(result.error || 'Invalid credentials');
        setLoading(false);
      }
    } catch (err) {
      setError('Login failed. Please try again.');
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!forgotEmail) {
      setError('Please enter your email');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      });
      const data = await response.json();
      if (data.success) {
        setSuccess('Password reset link sent to your email!');
        setTimeout(() => { setShowForgotPassword(false); setForgotEmail(''); }, 2000);
      } else {
        setError(data.message || 'Failed to send reset link');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Logo Component ──
  const Logo = ({ size = 'md' }) => {
    const sizeMap = {
      sm: 'w-9 h-9',
      md: 'w-11 h-11',
      lg: 'w-14 h-14',
    };
    return (
      <div className={`${sizeMap[size]} rounded-2xl bg-gradient-to-br from-brand-600 to-blue-600
        flex items-center justify-center shadow-lg shadow-brand-500/30`}>
        <Layers className="text-white" size={size === 'lg' ? 28 : size === 'md' ? 22 : 18} strokeWidth={2.2} />
      </div>
    );
  };

  // ── Feature Card ──
  const FeatureCard = ({ icon: Icon, title, desc, delay }) => (
    <div className="flex items-start gap-4 p-5 rounded-2xl bg-white/10 backdrop-blur-md
      border border-white/20 hover:bg-white/15 hover:border-white/30
      transition-all duration-300 group shadow-xl"
      style={{ animationDelay: delay }}
    >
      <div className="w-12 h-12 rounded-2xl bg-white/20
        flex items-center justify-center flex-shrink-0 border border-white/30
        group-hover:bg-white/30 transition-all duration-300 shadow-inner">
        <Icon size={20} className="text-white drop-shadow-md" strokeWidth={2.5} />
      </div>
      <div>
        <h3 className="text-base font-bold text-white mb-1 tracking-tight drop-shadow-sm">{title}</h3>
        <p className="text-[13px] text-brand-100 leading-relaxed font-medium">{desc}</p>
      </div>
    </div>
  );

  // ── Forgot Password View ──
  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-surface-50 via-brand-50/30 to-surface-100 p-4">
        {/* Decorative blobs */}
        <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-400/10 rounded-full blur-3xl animate-float" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-brand-400/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />
        </div>

        <div className="relative w-full max-w-md animate-fade-in-up">
          <div className="bg-white rounded-3xl shadow-glass-lg border border-surface-100 p-8">
            {/* Logo */}
            <div className="flex flex-col items-center mb-8">
              <Logo size="md" />
              <h2 className="mt-4 text-xl font-bold text-surface-800 font-display">Reset Password</h2>
              <p className="text-sm text-surface-400 mt-1">Enter your email to receive a reset link</p>
            </div>

            <form onSubmit={handleForgotPassword} className="space-y-5">
              <Alert type="error" message={error} onClose={() => setError('')} />
              <Alert type="success" message={success} onClose={() => setSuccess('')} />

              <div>
                <label className="block text-sm font-semibold text-surface-700 mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" size={18} />
                  <input
                    type="email"
                    className="input-field pl-11"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="your@email.com"
                    disabled={loading}
                  />
                </div>
              </div>

              <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
                {loading ? (
                  <><div className="spinner" /> Sending...</>
                ) : (
                  <>Send Reset Link <ArrowRight size={18} /></>
                )}
              </button>

              <button
                type="button"
                className="btn-ghost w-full"
                onClick={() => { setShowForgotPassword(false); setError(''); setSuccess(''); }}
              >
                ← Back to Sign In
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ── Main Login Screen ──
  return (
    <div className="min-h-screen flex bg-surface-50">

      {/* ═══ Left — Brand Panel ═══ */}
      <div className="hidden lg:flex lg:w-[55%] xl:w-[52%] relative overflow-hidden">
        {/* Video Background */}
        <video 
          autoPlay 
          loop 
          muted 
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/loginvideo.mp4" type="video/mp4" />
        </video>
        
        {/* Dark overlay to ensure text readability */}
        <div className="absolute inset-0 bg-brand-900/60 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-900/80 via-transparent to-brand-900/30" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16 w-full animate-slide-in-left">
          {/* Logo & Brand */}
          <div className="flex items-center gap-4 mb-14">
            <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-[20px] bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-2xl overflow-hidden group shrink-0">
              <div className="absolute inset-0 bg-white/20 blur-md rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <Layers size={32} strokeWidth={2.5} className="relative z-10 drop-shadow-md group-hover:scale-110 transition-transform duration-300" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-[38px] font-black font-display text-white tracking-tight leading-tight pb-1 drop-shadow-md">
                {APP_NAME}
              </h1>
              <p className="text-[13px] sm:text-[14px] font-bold text-brand-200 uppercase tracking-widest">
                Enterprise Platform
              </p>
            </div>
          </div>

          {/* Tagline */}
          <h2 className="text-4xl xl:text-5xl font-extrabold text-white font-display leading-tight mb-5 drop-shadow-md">
            Your Complete<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-200 via-blue-200 to-white drop-shadow-none">
              Business Management
            </span><br />
            Solution
          </h2>
          <p className="text-brand-100 text-base leading-relaxed mb-12 max-w-md font-medium">
            Streamline operations, manage your team, and drive growth with our
            all-in-one enterprise platform.
          </p>

          {/* Feature Cards */}
          <div className="space-y-3 max-w-md">
            <FeatureCard icon={Shield} title="Enterprise Security" desc="Bank-grade encryption & role-based access control" delay="0.1s" />
            <FeatureCard icon={Zap} title="Real-time Operations" desc="Live dashboards, instant notifications & analytics" delay="0.2s" />
            <FeatureCard icon={BarChart3} title="Smart Analytics" desc="Smart insights to drive informed decisions" delay="0.3s" />
          </div>
        </div>
      </div>

      {/* ═══ Right — Login Form ═══ */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 sm:px-10 lg:px-16 relative">
        {/* Decorative blobs for mobile */}
        <div className="lg:hidden absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-brand-400/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-brand-400/10 rounded-full blur-3xl" />
        </div>

        <div className="w-full max-w-[420px] relative animate-fade-in-up">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <Logo size="md" />
            <div>
              <h1 className="text-lg font-bold text-surface-800 font-display">{APP_NAME}</h1>
              <p className="text-[10px] font-semibold text-brand-500 uppercase tracking-[0.12em]">Enterprise Platform</p>
            </div>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-[24px] font-bold font-display text-surface-800 font-display">Welcome back!</h2>
            <p className="text-sm text-surface-400 mt-1.5">Sign in to access your dashboard</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <Alert type="error" message={error} onClose={() => setError('')} />
            <Alert type="success" message={success} onClose={() => setSuccess('')} />

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-surface-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" size={18} />
                <input
                  type="email"
                  className="input-field pl-11"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  placeholder="admin@trimax.com"
                  disabled={loading}
                  autoComplete="email"
                  id="login-email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-surface-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input-field pl-11 pr-11"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  placeholder="Enter your password"
                  disabled={loading}
                  autoComplete="current-password"
                  id="login-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400
                    hover:text-surface-600 transition-colors p-0.5"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
              >
                Forgot Password?
              </button>
            </div>

            {/* Submit */}
            <button type="submit" className="btn-primary w-full py-3 text-[15px]" disabled={loading} id="login-submit">
              {loading ? (
                <><div className="spinner" /> Signing in...</>
              ) : (
                <>Sign In <ArrowRight size={18} /></>
              )}
            </button>

            {/* Footer */}
            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-surface-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-surface-50 px-3 text-xs text-surface-400 font-medium">Secure Login</span>
              </div>
            </div>

            <p className="text-center text-xs text-surface-400">
              Protected by enterprise-grade security
            </p>
          </form>
        </div>

        {/* Copyright */}
        <p className="absolute bottom-6 text-xs text-surface-400">
          &copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;