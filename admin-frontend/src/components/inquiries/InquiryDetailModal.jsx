import { createPortal } from 'react-dom';
import React from 'react';
import { X, Mail, User, Calendar, MessageSquare, Tag } from 'lucide-react';
import { formatDate } from '../../utils/helpers';

const STATUS_COLORS = {
  'New': 'bg-blue-100 text-blue-700',
  'In Progress': 'bg-amber-100 text-amber-700',
  'Completed': 'bg-emerald-100 text-emerald-700',
  'Cancelled': 'bg-red-100 text-red-700'
};

const InquiryDetailModal = ({ inquiry, onClose, onStatusChange }) => {
  if (!inquiry) return null;

  return createPortal((
    <div onClick={onClose}
      className="fixed inset-0 bg-black/60 backdrop-blur-[4px] flex items-center justify-center z-[1000] p-5">
      <div onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl w-full max-w-[680px] max-h-[90vh] overflow-hidden
          flex flex-col shadow-[0_25px_50px_rgba(0,0,0,0.25)]">

        {/* Header */}
        <div className="flex justify-between items-center px-8 py-7
          btn-primary">
          <h2 className="text-[26px] font-semibold m-0">Inquiry Details</h2>
          <button onClick={onClose}
            className="bg-white/20 border-none cursor-pointer p-2 w-9 h-9 rounded-lg text-white
              flex items-center justify-center transition-all hover:rotate-90">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="px-8 py-6 overflow-y-auto flex-1">

          {/* Status & Date */}
          <div className="flex justify-between items-center px-4 py-4 bg-slate-50 rounded-2xl mb-6 border border-slate-100">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-slate-500">Status:</span>
              <select
                value={inquiry.status}
                onChange={(e) => onStatusChange(inquiry._id, e.target.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-bold border-none outline-none focus:ring-0 cursor-pointer appearance-none ${STATUS_COLORS[inquiry.status] || STATUS_COLORS['New']}`}
              >
                <option value="New">New</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <span className="flex items-center gap-2 text-sm text-slate-500 font-medium">
              <Calendar size={16} />
              {formatDate(inquiry.createdAt || inquiry.date)}
            </span>
          </div>

          {/* Contact Info */}
          <div className="mb-6">
            <h3 className="text-base font-semibold text-slate-800 mb-3">Contact Information</h3>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4">
              <div className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                <User size={20} className="text-brand-500 flex-shrink-0" />
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Name</label>
                  <p className="text-[15px] font-semibold text-slate-800 mt-0.5">{inquiry.name}</p>
                </div>
              </div>
              <div className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                <Mail size={20} className="text-brand-500 flex-shrink-0" />
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Email</label>
                  <p className="text-[15px] font-semibold text-slate-800 mt-0.5">{inquiry.email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Subject */}
          <div className="mb-6">
            <h3 className="text-base font-semibold text-slate-800 mb-3">Subject</h3>
            <div className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
              <Tag size={20} className="text-brand-500 flex-shrink-0" />
              <p className="text-[15px] font-semibold text-slate-800">{inquiry.subject}</p>
            </div>
          </div>

          {/* Message */}
          <div className="mb-6">
            <h3 className="text-base font-semibold text-slate-800 mb-3">Message</h3>
            <div className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
              <MessageSquare size={20} className="text-brand-500 flex-shrink-0 mt-1" />
              <p className="leading-relaxed text-[15px] text-slate-600 whitespace-pre-wrap">{inquiry.message}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button onClick={onClose}
            className="px-6 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700
              rounded-2xl cursor-pointer font-semibold text-sm transition-all shadow-sm">
            Close
          </button>
        </div>
      </div>
    </div>
  ), document.body);
};

export default InquiryDetailModal;