import React from 'react';

// ── Page Header ──
export const PageHeader = ({ title, subtitle, action, rightContent }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
    <div>
      <h1 className="text-[36px] font-bold text-slate-800 tracking-tight font-display leading-tight">{title}</h1>
      {subtitle && <p className="text-[14px] text-slate-500 mt-1">{subtitle}</p>}
    </div>
    <div className="flex flex-wrap items-center gap-3">
      {rightContent}
      {action}
    </div>
  </div>
);

// ── Stats Card ──
export const StatsCard = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  meta,
  grad = "from-brand-500 to-brand-600",
  ring = "ring-brand-500/20"
}) => (
  <div className="
    group relative bg-white border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] rounded-2xl
    p-6 cursor-pointer overflow-hidden
    transition-all duration-300 ease-out
    hover:-translate-y-1.5 hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] hover:border-slate-200
  ">
    <div className="relative z-10">
      <div className="mb-5 flex items-start justify-between">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white bg-gradient-to-br ${grad} shadow-lg ring-4 ${ring} transition-transform duration-300 group-hover:scale-110`}>
          {Icon && <Icon size={22} strokeWidth={2} />}
        </div>
        {trend && (
          <span className={`inline-block text-[11px] font-bold px-2 py-1 rounded-md ${trend > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <div className="text-[32px] font-bold text-slate-800 leading-none mb-1.5 tracking-tight">{value}</div>
      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">{title}</p>
      
      {meta && (
        <p className="text-[11px] text-slate-400 mt-2 font-medium">{meta}</p>
      )}
    </div>
    <div className={`absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r ${grad} scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left rounded-b-2xl`} />
  </div>
);

// ── Status Badge ──
export const StatusBadge = ({ status, variant = 'default' }) => {
  const variants = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-red-50 text-red-700 border-red-200',
    info: 'bg-brand-50 text-brand-700 border-brand-200',
    default: 'bg-slate-50 text-slate-700 border-slate-200',
  };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-semibold border ${variants[variant] || variants.default}`}>
      {status}
    </span>
  );
};

// ── Empty State ──
export const EmptyState = ({ icon: Icon, title, message, action }) => (
  <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-slate-200 border-dashed">
    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 border border-slate-100">
      {Icon && <Icon size={28} className="text-slate-400" />}
    </div>
    <h3 className="text-[18px] font-bold text-slate-800 mb-2">{title}</h3>
    <p className="text-[14px] text-slate-500 max-w-sm mb-6">{message}</p>
    {action}
  </div>
);

// ── Card ──
export const Card = ({ children, className = "" }) => (
  <div className={`glass-panel rounded-2xl overflow-hidden ${className}`}>
    {children}
  </div>
);
