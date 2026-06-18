import React from 'react';

const PageHeader = ({ title, subtitle, icon: Icon, rightContent }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-5">
        <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-[20px] bg-gradient-to-br from-brand-600 to-blue-600 flex items-center justify-center text-white shadow-xl shadow-brand-500/20 overflow-hidden group shrink-0">
          <div className="absolute inset-0 bg-white/20 blur-md rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          {Icon && <Icon size={30} strokeWidth={2.5} className="relative z-10 drop-shadow-md group-hover:scale-110 transition-transform duration-300" />}
        </div>
        <div>
          <h1 className="text-3xl sm:text-[34px] font-black font-display text-transparent bg-clip-text bg-gradient-to-r from-slate-700 via-brand-800 to-brand-600 tracking-tight leading-tight pb-1 mb-0.5">
            {title}
          </h1>
          <p className="text-[14px] sm:text-[15px] font-medium text-slate-500">
            {subtitle}
          </p>
        </div>
      </div>
      {rightContent && (
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {rightContent}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
