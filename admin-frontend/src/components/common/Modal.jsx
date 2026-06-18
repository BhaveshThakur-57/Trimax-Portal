import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SIZES = {
  small:  'max-w-sm',
  medium: 'max-w-lg',
  large:  'max-w-2xl',
  xl:     'max-w-4xl',
  full:   'max-w-6xl',
};

const Modal = ({ isOpen, onClose, title, children, size = 'medium' }) => {
  const maxW = SIZES[size] || SIZES.medium;

  return createPortal((
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`relative bg-white rounded-2xl border border-slate-200 w-full ${maxW} max-h-[92vh] flex flex-col shadow-xl z-10`}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative flex-shrink-0 bg-gradient-to-r from-brand-600 to-blue-600 rounded-t-2xl px-5 py-4 overflow-hidden">
              <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10 blur-xl pointer-events-none" />
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-white/25 border border-white/40 flex items-center justify-center text-white font-extrabold text-lg leading-none">
                    +
                  </span>
                  <div>
                    <h2 className="text-white font-extrabold text-[16px] leading-tight font-display">
                      {title}
                    </h2>
                    <p className="text-white/70 text-[12px] mt-0.5">
                      Fill in the details below
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-2xl bg-white/20 hover:bg-white/35 text-white transition-all duration-200 hover:rotate-90 flex-shrink-0"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 scrollbar-hide">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  ), document.body);
};

export default Modal;