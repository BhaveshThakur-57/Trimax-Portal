import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  FileText, Search, Eye, Download, Trash2, X,
  CheckCircle, AlertCircle, File, FolderOpen
} from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const categories = ['all', 'Onboarding', 'Identity', 'Tax', 'Benefits', 'Other'];

const FILE_ICON = (mime = '') => {
  if (mime.includes('pdf')) return { bg: 'bg-red-100', text: 'text-red-500', label: 'PDF' };
  if (mime.includes('word') || mime.includes('document')) return { bg: 'bg-blue-100', text: 'text-blue-500', label: 'DOC' };
  if (mime.includes('image')) return { bg: 'bg-emerald-100', text: 'text-emerald-500', label: 'IMG' };
  return { bg: 'bg-brand-100', text: 'text-brand-500', label: 'FILE' };
};

const CAT_CFG = {
  Onboarding: { bg: 'bg-amber-100', text: 'text-amber-700' },
  Identity: { bg: 'bg-brand-100', text: 'text-brand-700' },
  Tax: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  Benefits: { bg: 'bg-red-100', text: 'text-red-700' },
  Other: { bg: 'bg-slate-100', text: 'text-slate-600' },
};

const STAT_CARDS = [
  { key: 'all', label: 'Total', grad: 'from-brand-500 to-brand-600', ring: 'ring-brand-100' },
  { key: 'Onboarding', label: 'Onboarding', grad: 'from-amber-400 to-orange-500', ring: 'ring-amber-100' },
  { key: 'Identity', label: 'Identity', grad: 'from-brand-500 to-brand-500', ring: 'ring-brand-100' },
  { key: 'Tax', label: 'Tax', grad: 'from-emerald-500 to-teal-500', ring: 'ring-emerald-100' },
  { key: 'Benefits', label: 'Benefits', grad: 'from-rose-500 to-red-500', ring: 'ring-red-100' },
];

const formatSize = (bytes) => {
  if (!bytes) return 'N/A';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
};

/* ── Avatar ── */
const Avatar = ({ name, size = 'md' }) => {
  const sz = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-9 h-9 text-xs';
  const ini = (name || '?').charAt(0).toUpperCase();
  return (
    <div className={`${sz} rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white font-extrabold flex-shrink-0 shadow-sm`}>
      {ini}
    </div>
  );
};

/* ── Toast ── */
function Toast({ show, message, type, onClose }) {
  useEffect(() => {
    if (!show) return;
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [show, onClose]);
  if (!show) return null;
  return (
    <div className={`fixed top-5 right-5 z-[9999] flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border text-sm font-semibold min-w-[240px] max-w-[340px] ${type === 'success'
      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
      : 'bg-red-50 border-red-200 text-red-700'
      }`}>
      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${type === 'success' ? 'bg-emerald-100' : 'bg-red-100'}`}>
        {type === 'success'
          ? <CheckCircle size={13} className="text-emerald-600" />
          : <AlertCircle size={13} className="text-red-600" />}
      </div>
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="opacity-50 hover:opacity-100 transition-opacity hover:rotate-90 duration-200">
        <X size={13} />
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════ */
const DocumentManagement = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [viewDoc, setViewDoc] = useState(null);
  const [docxHtml, setDocxHtml] = useState('');
  const [docxLoading, setDocxLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  const token = useCallback(() => localStorage.getItem('token'), []);
  const hdrs = useCallback(() => ({ Authorization: `Bearer ${token()}` }), [token]);
  const previewUrl = (doc) => `${API_URL}/api/documents/view/${doc._id}?token=${token()}`;

  const closeToast = useCallback(() => setToast({ show: false, message: '', type: '' }), []);
  const showToast = (message, type = 'success') => setToast({ show: true, message, type });

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/documents/all`, { headers: hdrs() });
      const data = await res.json();
      if (data.success) setDocuments(data.data || []);
      else showToast(data.message || 'Failed to fetch documents', 'error');
    } catch { showToast('Failed to load documents', 'error'); }
    finally { setLoading(false); }
  }, [hdrs]);

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

  useEffect(() => {
    if (!viewDoc) { setDocxHtml(''); return; }
    const isDocx = viewDoc.mimeType?.includes('word') || viewDoc.mimeType?.includes('document') ||
      ['.docx', '.doc'].includes(viewDoc.fileExtension);
    if (!isDocx) { setDocxHtml(''); return; }
    const convert = async () => {
      try {
        setDocxLoading(true);
        const res = await fetch(`${API_URL}/api/documents/view/${viewDoc._id}`, { headers: hdrs() });
        const buf = await res.arrayBuffer();
        const mammoth = await import('mammoth');
        const result = await mammoth.convertToHtml({ arrayBuffer: buf });
        setDocxHtml(result.value);
      } catch { setDocxHtml('<p style="color:red">Preview failed. Please download.</p>'); }
      finally { setDocxLoading(false); }
    };
    convert();
  }, [viewDoc, hdrs]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this document?')) return;
    try {
      const res = await fetch(`${API_URL}/api/documents/${id}`, { method: 'DELETE', headers: hdrs() });
      const data = await res.json();
      if (data.success) {
        setDocuments(prev => prev.filter(d => d._id !== id));
        if (viewDoc?._id === id) setViewDoc(null);
        showToast('Document deleted successfully');
      } else showToast(data.message || 'Delete failed', 'error');
    } catch { showToast('Delete failed', 'error'); }
  };

  const handleDownload = async (doc) => {
    try {
      const res = await fetch(`${API_URL}/api/documents/download/${doc._id}`, { headers: hdrs() });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = doc.name + (doc.fileExtension || ''); a.click();
      URL.revokeObjectURL(url);
    } catch { showToast('Download failed', 'error'); }
  };

  const filteredDocs = documents.filter(doc => {
    const matchSearch = (doc.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.uploadedBy?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchSearch && (categoryFilter === 'all' || doc.category === categoryFilter);
  });

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">

      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={closeToast}
      />

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-5">
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-[20px] bg-gradient-to-br from-brand-600 to-blue-600 flex items-center justify-center text-white shadow-xl shadow-brand-500/20 overflow-hidden group shrink-0">
            <div className="absolute inset-0 bg-white/20 blur-md rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <FolderOpen size={30} strokeWidth={2.5} className="relative z-10 drop-shadow-md group-hover:scale-110 transition-transform duration-300" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-[34px] font-black font-display text-transparent bg-clip-text bg-gradient-to-r from-slate-700 via-brand-800 to-brand-600 tracking-tight leading-tight pb-1 mb-0.5">
              Document Management
            </h1>
            <p className="text-[14px] sm:text-[15px] font-medium text-slate-500">
              View and manage all employee uploaded documents
            </p>
          </div>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-600 to-blue-600 flex items-center justify-center shadow-md shadow-brand-200 self-start sm:self-auto">
          <FolderOpen size={18} className="text-white" />
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {STAT_CARDS.map(({ key, label, grad, ring }) => {
          const count = key === 'all'
            ? documents.length
            : documents.filter(d => d.category === key).length;
          const isActive = categoryFilter === key;
          return (
            <button
              key={key}
              onClick={() => setCategoryFilter(key)}
              className={`
          group relative bg-white rounded-2xl border text-left
          p-5 overflow-hidden cursor-pointer
          shadow-[0_1px_4px_rgba(0,0,0,0.04)]
          transition-all duration-300 ease-out
          hover:-translate-y-1.5 hover:shadow-[0_16px_32px_rgba(0,0,0,0.08)]
          hover:border-slate-200
          ${isActive ? 'border-brand-200 shadow-md ring-2 ring-brand-300 ring-offset-1' : 'border-slate-100'}
        `}
            >
              <div className="relative z-10">
                <div className="mb-4">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white bg-gradient-to-br ${grad} shadow-lg ring-4 ${ring} transition-transform duration-300 group-hover:scale-110`}>
                    <File size={20} strokeWidth={2} />
                  </div>
                </div>
                <div className="text-[28px] font-bold text-slate-800 leading-none mb-1.5 tracking-tight">{count}</div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{label}</p>
              </div>
              <div className={`absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r ${grad} scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left rounded-b-2xl`} />
            </button>
          );
        })}
      </div>

      {/* ── Search & Filter ── */}
      <div className="bg-gradient-to-r from-brand-600 to-blue-600 rounded-[24px] p-5 shadow-lg shadow-brand-500/30 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex items-center gap-3 flex-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-[16px] px-4 py-3 h-12 focus-within:ring-4 focus-within:ring-white/30 transition-all duration-300 group">
            <Search size={18} className="text-white/70 group-focus-within:text-white flex-shrink-0" />
            <input
              type="text"
              placeholder="Search by document name or employee..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent text-sm text-white font-medium placeholder:text-white/60"
              style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="text-white/70 hover:text-white transition-colors">
                <X size={16} />
              </button>
            )}
          </div>
          {/* Category Filter */}
          <div className="relative group min-w-[160px]">
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="w-full h-12 px-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-[16px] text-sm font-semibold text-white outline-none focus:ring-4 focus:ring-white/30 transition-all duration-300 cursor-pointer appearance-none [&>option]:text-slate-800"
            >
              {categories.map(c => (
                <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-white/70 group-focus-within:text-white">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
        </div>
        <div className="relative z-10 flex items-center gap-2 mt-4 text-[12px] text-white/80">
          <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
          <p>
            Showing <span className="font-semibold text-white">{filteredDocs.length}</span> of <span className="font-semibold text-white">{documents.length}</span> documents
          </p>
        </div>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-16 bg-slate-100 rounded-2xl" />)}
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText size={26} className="text-slate-300" />
          </div>
          <p className="text-slate-500 font-semibold text-sm">No documents found</p>
          <p className="text-slate-400 text-xs mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/60 shadow-xl shadow-slate-200/40 rounded-[24px] overflow-hidden">

          {/* ── Desktop Table ── */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-brand-600 to-blue-600 border-b border-white/20 shadow-lg shadow-brand-500/20">
                <tr>
                  {['Document', 'Employee', 'Category', 'Size', 'Uploaded', 'Actions'].map(h => (
                    <th key={h} className="text-left px-6 py-4 text-[12px] font-extrabold text-white uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDocs.map(doc => {
                  const icon = FILE_ICON(doc.mimeType);
                  const isImg = doc.mimeType?.includes('image');
                  const cat = CAT_CFG[doc.category] || CAT_CFG.Other;
                  return (
                    <tr key={doc._id} className="hover:bg-brand-50/40 transition-colors group">

                      {/* Document */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          {isImg ? (
                            <div className="w-10 h-10 rounded-2xl overflow-hidden border border-slate-200 flex-shrink-0">
                              <img src={previewUrl(doc)} alt={doc.name} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className={`w-10 h-10 ${icon.bg} rounded-2xl flex items-center justify-center flex-shrink-0`}>
                              <FileText size={17} className={icon.text} />
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-slate-800 text-[13px] leading-tight">{doc.name}</p>
                            <p className={`text-[10px] font-bold uppercase mt-0.5 ${icon.text}`}>{icon.label}</p>
                          </div>
                        </div>
                      </td>

                      {/* Employee */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={doc.uploadedBy?.name} size="sm" />
                          <div>
                            <p className="font-semibold text-slate-800 text-[13px]">{doc.uploadedBy?.name || 'Unknown'}</p>
                            <p className="text-[11px] text-slate-400 font-mono">{doc.uploadedBy?.employeeId || ''}</p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-5 py-3.5">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${cat.bg} ${cat.text}`}>
                          {doc.category}
                        </span>
                      </td>

                      {/* Size */}
                      <td className="px-5 py-3.5 text-[13px] text-slate-500 font-medium">{formatSize(doc.fileSize)}</td>

                      {/* Date */}
                      <td className="px-5 py-3.5 text-[13px] text-slate-500">{new Date(doc.createdAt).toLocaleDateString('en-IN')}</td>

                      {/* Actions */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setViewDoc(doc)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl text-xs font-bold transition-all duration-200 hover:shadow-md hover:shadow-brand-200 active:scale-95"
                          >
                            <Eye size={12} /> View
                          </button>
                          <button
                            onClick={() => handleDownload(doc)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold transition-all duration-200 hover:shadow-md hover:shadow-emerald-200 active:scale-95"
                          >
                            <Download size={12} /> Download
                          </button>
                          <button
                            onClick={() => handleDelete(doc._id)}
                            className="w-7 h-7 flex items-center justify-center bg-red-50 text-red-500 rounded-2xl hover:bg-red-100 hover:text-red-700 transition-all duration-200 active:scale-95"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── Mobile Cards ── */}
          <div className="flex flex-col divide-y divide-slate-100 md:hidden">
            {filteredDocs.map(doc => {
              const icon = FILE_ICON(doc.mimeType);
              const isImg = doc.mimeType?.includes('image');
              const cat = CAT_CFG[doc.category] || CAT_CFG.Other;
              return (
                <div key={doc._id} className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    {isImg ? (
                      <div className="w-11 h-11 rounded-2xl overflow-hidden border border-slate-200 flex-shrink-0">
                        <img src={previewUrl(doc)} alt={doc.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className={`w-11 h-11 ${icon.bg} rounded-2xl flex items-center justify-center flex-shrink-0`}>
                        <FileText size={19} className={icon.text} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 text-sm truncate">{doc.name}</p>
                      <p className={`text-[10px] font-bold uppercase ${icon.text}`}>{icon.label} · {formatSize(doc.fileSize)}</p>
                    </div>
                    <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold flex-shrink-0 ${cat.bg} ${cat.text}`}>
                      {doc.category}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-50 rounded-2xl p-2.5">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-1">Uploaded By</p>
                      <p className="text-slate-700 font-semibold text-xs truncate">{doc.uploadedBy?.name || 'Unknown'}</p>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-2.5">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-1">Date</p>
                      <p className="text-slate-700 font-semibold text-xs">{new Date(doc.createdAt).toLocaleDateString('en-IN')}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setViewDoc(doc)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl text-xs font-bold transition-all active:scale-95">
                      <Eye size={13} /> View
                    </button>
                    <button onClick={() => handleDownload(doc)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold transition-all active:scale-95">
                      <Download size={13} /> Download
                    </button>
                    <button onClick={() => handleDelete(doc._id)}
                      className="w-11 flex items-center justify-center bg-red-50 text-red-500 hover:bg-red-100 rounded-2xl transition-all active:scale-95">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Preview Modal ── */}
      {viewDoc && (() => {
        const icon = FILE_ICON(viewDoc.mimeType);
        return createPortal((
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
            onClick={() => setViewDoc(null)}
          >
            <div
              className="bg-white rounded-3xl w-full max-w-4xl h-[90vh] flex flex-col shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="relative flex-shrink-0 bg-gradient-to-r from-brand-600 to-blue-600 px-5 py-4 overflow-hidden">
                <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10 blur-xl pointer-events-none" />
                <div className="relative flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 ${icon.bg} rounded-2xl flex items-center justify-center flex-shrink-0`}>
                      <FileText size={17} className={icon.text} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-white text-sm truncate">{viewDoc.name}</h3>
                      <p className="text-white/65 text-[11px] mt-0.5">
                        {viewDoc.uploadedBy?.name} · {viewDoc.category} · {formatSize(viewDoc.fileSize)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleDownload(viewDoc)}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-white text-brand-700 rounded-2xl text-xs font-bold hover:bg-white/90 transition-all active:scale-95 shadow-sm"
                    >
                      <Download size={13} /> Download
                    </button>
                    <button
                      onClick={() => setViewDoc(null)}
                      className="w-9 h-9 flex items-center justify-center rounded-2xl bg-white/20 hover:bg-white/35 text-white transition-all duration-200 hover:rotate-90"
                    >
                      <X size={17} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Preview body */}
              <div className="flex-1 overflow-hidden bg-slate-100">
                {viewDoc.mimeType?.includes('image') ? (
                  <div className="w-full h-full flex items-center justify-center p-6">
                    <img
                      src={previewUrl(viewDoc)}
                      alt={viewDoc.name}
                      className="max-w-full max-h-full object-contain rounded-2xl shadow-xl"
                    />
                  </div>
                ) : viewDoc.mimeType?.includes('pdf') ? (
                  <iframe src={previewUrl(viewDoc)} className="w-full h-full" title={viewDoc.name} />
                ) : (viewDoc.mimeType?.includes('word') || viewDoc.mimeType?.includes('document')) ? (
                  <div className="w-full h-full overflow-auto bg-white">
                    {docxLoading ? (
                      <div className="flex flex-col items-center justify-center h-full gap-3">
                        <div className="w-10 h-10 rounded-full border-4 border-brand-200 border-t-brand-600 animate-spin" />
                        <p className="text-slate-500 text-sm font-medium">Loading document...</p>
                      </div>
                    ) : (
                      <div className="max-w-3xl mx-auto p-8">
                        <div
                          dangerouslySetInnerHTML={{ __html: docxHtml || '<p class="text-gray-400">Content not loaded...</p>' }}
                          style={{  fontSize: '14px', lineHeight: '1.8', color: '#1a1a1a' }}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-4">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                      <FileText size={28} className="text-slate-300" />
                    </div>
                    <p className="font-semibold text-sm">Preview not available for this file type</p>
                    <button
                      onClick={() => handleDownload(viewDoc)}
                      className="flex items-center gap-2 px-5 py-2.5 btn-primary"
                    >
                      <Download size={15} /> Download File
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ), document.body);
      })()}
    </div>
  );
};

export default DocumentManagement;