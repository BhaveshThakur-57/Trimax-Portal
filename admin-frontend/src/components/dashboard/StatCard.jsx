import React from 'react';
import { motion } from 'framer-motion';

const colorMap = {
  blue:   { grad: 'from-brand-600 to-blue-600', bg: 'bg-brand-500/10', text: 'text-brand-400', ring: 'ring-brand-500/20', shadow: 'shadow-brand-500/20' },
  green:  { grad: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-500/10', text: 'text-emerald-400', ring: 'ring-emerald-500/20', shadow: 'shadow-emerald-500/20' },
  purple: { grad: 'from-brand-500 to-brand-600', bg: 'bg-brand-500/10', text: 'text-brand-400', ring: 'ring-brand-500/20', shadow: 'shadow-brand-500/20' },
  orange: { grad: 'from-amber-500 to-orange-500', bg: 'bg-amber-500/10', text: 'text-amber-400', ring: 'ring-amber-500/20', shadow: 'shadow-amber-500/20' },
};

const StatCard = ({ title, value, change, icon: Icon, color, subtitle, delay = 0 }) => {
  const c = colorMap[color] || colorMap.blue;
  const isPositive = parseFloat(change) > 0;
  const isNegative = parseFloat(change) < 0;
  const isNeutral  = parseFloat(change) === 0;

  const formatValue = (val) => {
    if (typeof val === 'number' && val >= 1000)
      return `₹${val.toLocaleString('en-IN')}`;
    return val ?? 0;
  };

  const changeNum = String(change || '0').replace('%', '').replace('+', '');
  const changeLabel = isNeutral ? '0%' : `${isPositive ? '+' : ''}${changeNum}%`;

  return (
    <motion.div 
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      className="group relative bg-white border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] rounded-2xl p-6 cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] hover:border-slate-200"
    >
      {/* Subtle gradient glow on hover */}
      <div className={`
        absolute -top-10 -right-10 w-32 h-32 rounded-full
        bg-gradient-to-br ${c.grad} opacity-0 blur-3xl
        group-hover:opacity-20 transition-opacity duration-500
      `} />

      <div className="relative z-10">
        {/* Top row */}
        <div className="flex items-start justify-between mb-5">
          {/* Icon */}
          <div className={`
            w-12 h-12 rounded-2xl flex items-center justify-center text-white flex-shrink-0
            bg-gradient-to-br ${c.grad}
            shadow-lg ${c.shadow} ring-4 ${c.ring}
            transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3
          `}>
            <Icon size={22} strokeWidth={2} />
          </div>

          {/* Change badge */}
          <span className={`
            badge
            ${isPositive ? 'badge-success' :
              isNegative ? 'badge-danger' :
                           'bg-slate-50 text-slate-500 border border-slate-200'}
          `}>
            {isPositive && '↑ '}{isNegative && '↓ '}{changeLabel}
          </span>
        </div>

        {/* Value */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: delay + 0.2, type: "spring" }}
          className="text-[32px] font-bold text-slate-800 leading-none mb-1.5 tracking-tight font-display"
        >
          {formatValue(value)}
        </motion.div>

        {/* Title */}
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1">
          {title}
        </p>

        {/* Subtitle */}
        <p className="text-[12px] text-slate-400">{subtitle}</p>
      </div>

      {/* Bottom accent line */}
      <div className={`
        absolute bottom-0 left-0 right-0 h-[3px]
        bg-gradient-to-r ${c.grad}
        scale-x-0 group-hover:scale-x-100
        transition-transform duration-500 origin-left rounded-b-2xl
      `} />
    </motion.div>
  );
};

export default StatCard;