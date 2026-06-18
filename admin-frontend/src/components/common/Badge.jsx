import React from 'react';
import { getBadgeColor } from '../../utils/helpers';

// Color → Tailwind class map
const COLOR_MAP = {
  green:   'bg-emerald-100 text-emerald-700',
  red:     'bg-red-100 text-red-700',
  blue:    'bg-blue-100 text-blue-700',
  yellow:  'bg-amber-100 text-amber-700',
  orange:  'bg-orange-100 text-orange-700',
  purple:  'bg-brand-100 text-brand-700',
  gray:    'bg-slate-100 text-slate-600',
  default: 'bg-slate-100 text-slate-600',
};

const Badge = ({ children, color, status }) => {
  const badgeColor = color || getBadgeColor(status || children);
  const cls = COLOR_MAP[badgeColor] || COLOR_MAP.default;

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${cls}`}>
      {children}
    </span>
  );
};

export default Badge;