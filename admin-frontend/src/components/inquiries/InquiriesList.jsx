import React, { useState, useEffect } from 'react';
import { MessageSquare, Eye, Search, Download, Trash2, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import InquiryDetailModal from './InquiryDetailModal';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const STATUS_COLORS = {
  'New': 'bg-blue-100 text-blue-700',
  'In Progress': 'bg-amber-100 text-amber-700',
  'Completed': 'bg-emerald-100 text-emerald-700',
  'Cancelled': 'bg-red-100 text-red-700'
};

const InquiriesList = () => {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [selectedApp, setSelectedApp] = useState(null);

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/inquiries`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setInquiries(data.data);
      } else {
        setError(data.message || 'Failed to fetch inquiries');
      }
    } catch (e) {
      setError('Network error while fetching inquiries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  const updateStatus = async (id, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/inquiries/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        fetchInquiries();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const deleteInquiry = async (id) => {
    if (!window.confirm('Are you sure you want to delete this inquiry?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/inquiries/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        fetchInquiries();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredInquiries = inquiries.filter(inq =>
    inq.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inq.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inq.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const downloadExcel = () => {
    const exportData = filteredInquiries.map((inq, i) => ({
      '#': i + 1,
      'Name': inq.name,
      'Email': inq.email,
      'Subject': inq.subject,
      'Message': inq.message,
      'Status': inq.status,
      'Date': new Date(inq.createdAt || inq.date).toLocaleDateString('en-IN'),
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    ws['!cols'] = [{ wch: 5 }, { wch: 25 }, { wch: 30 }, { wch: 30 }, { wch: 50 }, { wch: 15 }, { wch: 15 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inquiries');
    XLSX.writeFile(wb, `inquiries-${new Date().toLocaleDateString('en-IN').replace(/\//g, '-')}.xlsx`);
  };

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : parts[0].substring(0, 2).toUpperCase();
  };

  const getAvatarColor = (name) => {
    const colors = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#6366f1', '#14b8a6'];
    return colors[name?.charCodeAt(0) % colors.length] || '#8b5cf6';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-brand-600 rounded-full animate-spin" />
          <p className="text-slate-500 font-medium">Loading inquiries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-slate-50 min-h-screen max-md:p-4">

      {/* Header */}
      <div className="flex justify-between items-start mb-8 max-md:flex-col max-md:gap-3">
        <div className="flex items-center gap-5">
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-[20px] bg-gradient-to-br from-brand-600 to-blue-600 flex items-center justify-center text-white shadow-xl shadow-brand-500/20 overflow-hidden group shrink-0">
            <div className="absolute inset-0 bg-white/20 blur-md rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <MessageSquare size={30} strokeWidth={2.5} className="relative z-10 drop-shadow-md group-hover:scale-110 transition-transform duration-300" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-[34px] font-black font-display text-transparent bg-clip-text bg-gradient-to-r from-slate-700 via-brand-800 to-brand-600 tracking-tight leading-tight pb-1 mb-0.5">
              Inquiries
            </h1>
            <p className="text-[14px] sm:text-[15px] font-medium text-slate-500">
              Manage all customer inquiries and questions
            </p>
          </div>
        </div>
        <button onClick={downloadExcel}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white
            border-none px-4 py-2.5 rounded-lg text-sm font-semibold cursor-pointer transition-all">
          <Download size={16} /> Download Excel
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 text-red-600">
          <span className="text-xl">⚠️</span>
          <p className="m-0 text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Search */}
      <div className="bg-gradient-to-r from-brand-600 to-blue-600 rounded-[24px] p-5 shadow-lg shadow-brand-500/30 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-3 flex-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-[16px] px-4 py-3 h-12 focus-within:ring-4 focus-within:ring-white/30 transition-all duration-300 group">
            <Search size={18} className="text-white/70 group-focus-within:text-white flex-shrink-0" />
            <input
              type="text"
              placeholder="Search by name, email, or subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent text-sm text-white font-medium placeholder:text-white/60"
              style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="text-white/70 hover:text-white transition-colors">
                <X size={16} />
              </button>
            )}
          </div>
        </div>
        
        <div className="relative z-10 flex items-center gap-2 mt-4 text-[12px] text-white/80">
          <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
          <p>
            Showing <span className="font-semibold text-white">{filteredInquiries.length}</span> inquiries
          </p>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="bg-white border border-slate-200/60 shadow-xl shadow-slate-200/40 rounded-[24px] overflow-hidden max-md:hidden">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-gradient-to-r from-brand-600 to-blue-600 border-b border-white/20 shadow-lg shadow-brand-500/20">
            <tr>
              {['NAME', 'EMAIL', 'SUBJECT', 'STATUS', 'DATE', 'ACTIONS'].map(h => (
                <th key={h} className="px-6 py-4 text-left text-[12px] font-extrabold text-white uppercase tracking-widest">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredInquiries.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-16 text-slate-400 font-medium">
                  No inquiries found
                </td>
              </tr>
            ) : (
              filteredInquiries.map((inq) => (
                <tr key={inq._id} className="hover:bg-brand-50/30 transition-colors duration-300 group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center
                        text-sm font-semibold text-white flex-shrink-0 shadow-sm"
                        style={{ backgroundColor: getAvatarColor(inq.name) }}>
                        {getInitials(inq.name)}
                      </div>
                      <span className="font-semibold text-slate-800">{inq.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-slate-500 text-sm">{inq.email}</td>
                  <td className="px-6 py-5 font-medium text-slate-800 max-w-[300px] truncate">{inq.subject}</td>
                  <td className="px-6 py-5">
                    <select
                      value={inq.status}
                      onChange={(e) => updateStatus(inq._id, e.target.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border-none outline-none cursor-pointer appearance-none ${STATUS_COLORS[inq.status] || STATUS_COLORS['New']}`}
                    >
                      <option value="New">New</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="px-6 py-5 text-slate-500 text-sm">{new Date(inq.createdAt || inq.date).toLocaleDateString('en-IN')}</td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setSelectedApp(inq)} title="View Details"
                        className="w-[32px] h-[32px] flex items-center justify-center border-none
                          rounded-lg bg-blue-100 text-blue-700 cursor-pointer transition-all
                          hover:bg-blue-200">
                        <Eye size={16} />
                      </button>
                      <button onClick={() => deleteInquiry(inq._id)} title="Delete"
                        className="w-[32px] h-[32px] flex items-center justify-center border-none
                          rounded-lg bg-red-100 text-red-700 cursor-pointer transition-all
                          hover:bg-red-200">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="hidden max-md:flex flex-col gap-3 mt-4">
        {filteredInquiries.map((inq) => (
          <div key={inq._id} className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-100">
            <div className="flex justify-between items-center px-4 py-3.5 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center
                  text-sm font-semibold text-white flex-shrink-0 shadow-sm"
                  style={{ backgroundColor: getAvatarColor(inq.name) }}>
                  {getInitials(inq.name)}
                </div>
                <div>
                  <div className="font-semibold text-slate-800">{inq.name}</div>
                  <div className="text-xs text-slate-500">{new Date(inq.createdAt || inq.date).toLocaleDateString('en-IN')}</div>
                </div>
              </div>
            </div>
            <div className="px-4 py-3 flex flex-col gap-2">
              <div className="flex gap-2 text-sm text-slate-600"><span>📧</span><span>{inq.email}</span></div>
              <div className="flex gap-2 text-sm text-slate-600"><span>📌</span><span className="font-medium truncate">{inq.subject}</span></div>
              <div className="mt-2">
                <span className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold ${STATUS_COLORS[inq.status] || STATUS_COLORS['New']}`}>
                  {inq.status}
                </span>
              </div>
            </div>
            <div className="flex gap-2 px-4 py-3 border-t border-slate-100 items-center justify-end">
              <button onClick={() => setSelectedApp(inq)}
                className="flex items-center gap-1 text-sm px-3 py-1.5 bg-blue-100 text-blue-700
                  border-none rounded-lg cursor-pointer hover:bg-blue-200 transition-all">
                <Eye size={16} /> Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {selectedApp && (
        <InquiryDetailModal 
          inquiry={selectedApp} 
          onClose={() => setSelectedApp(null)} 
          onStatusChange={updateStatus}
        />
      )}
    </div>
  );
};

export default InquiriesList;