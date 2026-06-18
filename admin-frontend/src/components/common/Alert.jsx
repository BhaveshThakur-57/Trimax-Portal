import React from 'react';
import { CheckCircle, AlertTriangle, Info, XCircle, X } from 'lucide-react';

const CFG = {
  success: {
    wrap:  'bg-emerald-50 border border-emerald-200 text-emerald-700',
    icon:  <CheckCircle  size={15} className="text-emerald-500 flex-shrink-0" />,
    close: 'text-emerald-400 hover:text-emerald-600',
  },
  error: {
    wrap:  'bg-red-50 border border-red-200 text-red-700',
    icon:  <XCircle      size={15} className="text-red-500 flex-shrink-0" />,
    close: 'text-red-400 hover:text-red-600',
  },
  warning: {
    wrap:  'bg-amber-50 border border-amber-200 text-amber-700',
    icon:  <AlertTriangle size={15} className="text-amber-500 flex-shrink-0" />,
    close: 'text-amber-400 hover:text-amber-600',
  },
  info: {
    wrap:  'bg-blue-50 border border-blue-200 text-blue-700',
    icon:  <Info         size={15} className="text-blue-500 flex-shrink-0" />,
    close: 'text-blue-400 hover:text-blue-600',
  },
};

const Alert = ({ type = 'info', message, onClose }) => {
  if (!message) return null;

  const c = CFG[type] || CFG.info;

  return (
    <div className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl text-sm font-medium ${c.wrap}`}>
      {c.icon}
      <span className="flex-1">{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          className={`flex-shrink-0 transition-all duration-200 hover:rotate-90 ${c.close}`}
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
};

export default Alert;