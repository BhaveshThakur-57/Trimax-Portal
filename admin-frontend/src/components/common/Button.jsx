import React from 'react';

const VARIANTS = {
  primary:   'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-md shadow-brand-500/25 hover:shadow-lg hover:shadow-brand-500/30 hover:-translate-y-0.5 active:translate-y-0',
  secondary: 'bg-white border border-surface-200 text-surface-700 shadow-sm hover:bg-surface-50 hover:border-surface-300 hover:shadow-md',
  danger:    'bg-gradient-to-r from-red-600 to-rose-500 text-white shadow-md shadow-red-500/25 hover:shadow-lg hover:shadow-red-500/30 hover:-translate-y-0.5',
  ghost:     'bg-transparent text-surface-600 hover:bg-surface-100 hover:text-surface-800',
  success:   'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20 hover:shadow-lg hover:-translate-y-0.5',
};

const SIZES = {
  small:  'px-3 py-1.5 text-xs rounded-lg gap-1.5',
  medium: 'px-4 py-2 text-sm rounded-2xl gap-2',
  large:  'px-5 py-2.5 text-sm rounded-2xl gap-2',
};

const Button = ({
  children,
  onClick,
  variant   = 'primary',
  size      = 'medium',
  fullWidth = false,
  disabled  = false,
  type      = 'button',
  icon      = null,
  className = '',
}) => {
  const base     = 'inline-flex items-center justify-center font-semibold transition-all duration-200 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0';
  const variant_ = VARIANTS[variant] || VARIANTS.primary;
  const size_    = SIZES[size]       || SIZES.medium;
  const width    = fullWidth ? 'w-full' : '';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variant_} ${size_} ${width} ${className}`}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </button>
  );
};

export default Button;