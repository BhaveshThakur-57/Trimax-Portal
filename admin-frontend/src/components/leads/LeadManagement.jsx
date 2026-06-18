// src/components/leads/LeadManagement.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import PageHeader from '../common/PageHeader';
import {
  Plus, Search, X, Edit2, Trash2, MessageSquare,
  Phone, Mail, Building2, ChevronDown, ChevronUp, TrendingUp
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import LeadModal from './LeadModal';
import LeadKanbanBoard from './LeadKanbanBoard';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const STATUS_CFG = {
  'New': { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
  'Contacted': { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
  'Qualified': { bg: 'bg-brand-100', text: 'text-brand-700', dot: 'bg-brand-500' },
  'Proposal Sent': { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' },
  'Won': { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  'Lost': { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
};

const PRIORITY_CFG = {
  'Low': { bg: 'bg-slate-100', text: 'text-slate-600' },
  'Medium': { bg: 'bg-blue-100', text: 'text-blue-700' },
  'High': { bg: 'bg-red-100', text: 'text-red-700' },
};

const StatusDropdown = ({ leadId, status, onStatusChange }) => {
  const [loading, setLoading] = useState(false);

  const handleChange = async (e) => {
    setLoading(true);
    await onStatusChange(leadId, e.target.value);
    setLoading(false);
  };

  const c = STATUS_CFG[status] || STATUS_CFG['New'];
  
  return (
    <div className="relative inline-block">
      <select
        value={status}
        onChange={handleChange}
        disabled={loading}
        className={`appearance-none inline-flex items-center gap-1.5 pl-2.5 pr-6 py-1 rounded-full text-[11px] font-bold outline-none cursor-pointer border-none shadow-sm transition-opacity ${c.bg} ${c.text} ${loading ? 'opacity-50' : 'hover:opacity-80'}`}
      >
        {Object.keys(STATUS_CFG).map(s => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
      <ChevronDown size={10} className={`absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none ${c.text}`} />
    </div>
  );
};

const PriorityBadge = ({ priority }) => {
  const c = PRIORITY_CFG[priority] || PRIORITY_CFG['Medium'];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${c.bg} ${c.text}`}>
      {priority}
    </span>
  );
};

const fmt = d => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const fmtTime = d => d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';

/* ── Remark Box ── */
const RemarkBox = ({ leadId, remarks, onAdded, token }) => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const submit = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/leads/${leadId}/remark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (data.success) { setText(''); onAdded(data.data); setOpen(true); }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  return (
    <div className="mt-3 border-t border-slate-100 pt-3 space-y-2">
      <div className="flex gap-2">
        <input
          type="text" value={text} placeholder="Add a remark..."
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          autoComplete="off"
          className="flex-1 text-xs bg-slate-50 border-2 border-slate-200 rounded-2xl px-3 py-2 outline-none focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 transition-all placeholder:text-slate-300"
        />
        <button
          onClick={submit}
          disabled={loading || !text.trim()}
          className="px-3 py-2 rounded-2xl btn-primary"
        >
          {loading ? '...' : 'Add'}
        </button>
      </div>

      {remarks?.length > 0 && (
        <div>
          <button
            onClick={() => setOpen(p => !p)}
            className="flex items-center gap-1 text-[11px] text-brand-600 font-bold hover:underline"
          >
            <MessageSquare size={11} />
            {open ? 'Hide' : 'Show'} {remarks.length} remark{remarks.length !== 1 ? 's' : ''}
            {open ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>
          {open && (
            <div className="mt-2 space-y-1.5 max-h-40 overflow-y-auto [&::-webkit-scrollbar]:hidden">
              {remarks.map((r, i) => (
                <div key={i} className="bg-slate-50 rounded-2xl px-3 py-2 text-xs border border-slate-100">
                  <p className="text-slate-700 font-semibold">{r.text}</p>
                  <p className="text-slate-400 mt-0.5 text-[10px]">{r.addedByName} · {fmtTime(r.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════ */
const LeadManagement = () => {
  const { user } = useAuth();
  const token = localStorage.getItem('token');

  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [assignedToFilter, setAssignedToFilter] = useState('all');
  const [employees, setEmployees] = useState([]);
  
  const [showModal, setShowModal] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'kanban'

  // ✅ Debounce search so it doesn't fire on every keystroke
  const searchDebounce = useRef(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 400);
    return () => clearTimeout(searchDebounce.current);
  }, [searchTerm]);

  const hdrs = { Authorization: `Bearer ${token}` };

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (priorityFilter !== 'all') params.set('priority', priorityFilter);
      if (sourceFilter !== 'all') params.set('source', sourceFilter);
      if (assignedToFilter !== 'all') params.set('assignedTo', assignedToFilter);
      if (debouncedSearch) params.set('search', debouncedSearch);
      const res = await fetch(`${API_URL}/api/leads?${params}`, { headers: hdrs });
      const data = await res.json();
      if (data.success) setLeads(data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, priorityFilter, sourceFilter, assignedToFilter, debouncedSearch]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/leads/stats`, { headers: hdrs });
      const data = await res.json();
      if (data.success) setStats(data.data);
    } catch (e) { console.error(e); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { fetchLeads(); fetchStats(); }, [fetchLeads, fetchStats]);

  // Fetch employees for filter
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await fetch(`${API_URL}/api/users`, { headers: hdrs });
        const data = await res.json();
        if (data.success) {
          setEmployees(data.data.filter(u => (u.department || '').toLowerCase() === 'sales' || u.role === 'admin'));
        }
      } catch (e) {}
    };
    fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ Smooth modal open/close animation
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden'; // prevent background scroll
      requestAnimationFrame(() => setModalVisible(true));
    } else {
      document.body.style.overflow = '';
      setModalVisible(false);
    }
    return () => { document.body.style.overflow = ''; };
  }, [showModal]);

  const openModal = (lead = null) => { setEditingLead(lead); setShowModal(true); };
  const closeModal = () => {
    setModalVisible(false);
    setTimeout(() => { setShowModal(false); setEditingLead(null); }, 260);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this lead?')) return;
    try {
      const res = await fetch(`${API_URL}/api/leads/${id}`, { method: 'DELETE', headers: hdrs });
      const data = await res.json();
      if (data.success) { fetchLeads(); fetchStats(); }
    } catch (e) { console.error(e); }
  };

  const handleRemarkAdded = (updatedLead) => {
    setLeads(prev => prev.map(l => l._id === updatedLead._id ? updatedLead : l));
  };

  const handleSaved = () => { closeModal(); fetchLeads(); fetchStats(); };

  const updateLeadStatus = async (id, newStatus) => {
    try {
      const res = await fetch(`${API_URL}/api/leads/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        fetchLeads();
        fetchStats();
      }
    } catch (e) { console.error(e); }
  };

  /* ── Stat Cards config ── */
  const STAT_CARDS = stats ? [
    { label: 'Total Leads', value: stats.total, grad: 'from-brand-500 to-brand-600', ring: 'ring-brand-100', key: 'all' },
    { label: 'New', value: stats['New'] || 0, grad: 'from-blue-500 to-brand-500', ring: 'ring-blue-100', key: 'New' },
    { label: 'Qualified', value: stats['Qualified'] || 0, grad: 'from-amber-500 to-orange-400', ring: 'ring-amber-100', key: 'Qualified' },
    { label: 'Won', value: stats['Won'] || 0, grad: 'from-emerald-500 to-teal-500', ring: 'ring-emerald-100', key: 'Won' },
    { label: 'Lost', value: stats['Lost'] || 0, grad: 'from-red-500 to-rose-500', ring: 'ring-red-100', key: 'Lost' },
  ] : [];

  if (loading) return (
    <div className="p-6 max-w-[1400px] mx-auto animate-pulse space-y-4">
      <div className="h-8 bg-slate-100 rounded-2xl w-56" />
      <div className="grid grid-cols-5 gap-4">{[1, 2, 3, 4, 5].map(i => <div key={i} className="h-28 bg-slate-100 rounded-2xl" />)}</div>
      <div className="h-96 bg-slate-100 rounded-2xl" />
    </div>
  );

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">

      <PageHeader 
        title="Lead Management"
        subtitle="Track and manage your sales leads"
        icon={TrendingUp}
        rightContent={
          stats?.totalValue > 0 && (
            <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
              Pipeline: ₹{stats.totalValue.toLocaleString()}
            </span>
          )
        }
        action={
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-slate-100 p-1 rounded-xl flex">
              <button 
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-brand-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Grid
              </button>
              <button 
                onClick={() => setViewMode('kanban')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${viewMode === 'kanban' ? 'bg-white shadow-sm text-brand-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Kanban
              </button>
            </div>
            <button
              onClick={() => openModal(null)}
              className="btn-primary"
            >
              <Plus size={16} strokeWidth={2.5} /> Add New Lead
            </button>
          </div>
        }
      />

      {/* ── Stat Cards ── */}
      {STAT_CARDS.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {STAT_CARDS.map(({ label, value, grad, ring, key }) => {
            const isActive = statusFilter === key;
            return (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
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
                      <TrendingUp size={18} strokeWidth={2} />
                    </div>
                  </div>
                  <div className="text-[28px] font-bold text-slate-800 leading-none mb-1.5 tracking-tight">{value}</div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{label}</p>
                </div>
                <div className={`absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r ${grad} scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left rounded-b-2xl`} />
              </button>
            );
          })}
        </div>
      )}

      {/* ── Filters ── */}
      <div className="bg-gradient-to-r from-brand-600 to-blue-600 rounded-[24px] p-5 shadow-lg shadow-brand-500/30 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-3 flex-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-[16px] px-4 py-3 h-12 focus-within:ring-4 focus-within:ring-white/30 transition-all duration-300 group">
            <Search size={18} className="text-white/70 group-focus-within:text-white flex-shrink-0" />
            <input
              type="text"
              placeholder="Search by name, phone, email, company..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              autoComplete="new-password"  
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              className="flex-1 bg-transparent text-sm text-white font-medium placeholder:text-white/60"
              style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
            />
            {searchTerm && (
              <button onClick={() => { setSearchTerm(''); setDebouncedSearch(''); }} className="text-white/70 hover:text-white transition-colors">
                <X size={16} />
              </button>
            )}
          </div>
          
          <div className="flex flex-wrap sm:flex-nowrap gap-3">
            <div className="relative group min-w-[140px] flex-1 sm:flex-none">
              <select
                value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="w-full h-12 px-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-[16px] text-sm font-semibold text-white outline-none focus:ring-4 focus:ring-white/30 transition-all duration-300 cursor-pointer appearance-none [&>option]:text-slate-800"
              >
                <option value="all">All Status</option>
                {['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Won', 'Lost'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-white/70 group-focus-within:text-white">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
            
            <div className="relative group min-w-[140px] flex-1 sm:flex-none hidden md:block">
              <select
                value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}
                className="w-full h-12 px-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-[16px] text-sm font-semibold text-white outline-none focus:ring-4 focus:ring-white/30 transition-all duration-300 cursor-pointer appearance-none [&>option]:text-slate-800"
              >
                <option value="all">All Priorities</option>
                {['High', 'Medium', 'Low'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-white/70 group-focus-within:text-white">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
            
            <div className="relative group min-w-[140px] flex-1 sm:flex-none hidden lg:block">
              <select
                value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}
                className="w-full h-12 px-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-[16px] text-sm font-semibold text-white outline-none focus:ring-4 focus:ring-white/30 transition-all duration-300 cursor-pointer appearance-none [&>option]:text-slate-800"
              >
                <option value="all">All Sources</option>
                {['Website', 'Referral', 'Social Media', 'Cold Call', 'Email', 'Walk-in', 'Other'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-white/70 group-focus-within:text-white">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
            
            <div className="relative group min-w-[140px] flex-1 sm:flex-none hidden xl:block">
              <select
                value={assignedToFilter} onChange={e => setAssignedToFilter(e.target.value)}
                className="w-full h-12 px-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-[16px] text-sm font-semibold text-white outline-none focus:ring-4 focus:ring-white/30 transition-all duration-300 cursor-pointer appearance-none [&>option]:text-slate-800"
              >
                <option value="all">All Users</option>
                {employees.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-white/70 group-focus-within:text-white">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>
        </div>
        
        <div className="relative z-10 flex items-center gap-2 mt-4 text-[12px] text-white/80">
          <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
          <p>
            Showing <span className="font-semibold text-white">{leads.length}</span> leads
            {debouncedSearch && <span className="ml-1">for "<span className="text-white font-semibold">{debouncedSearch}</span>"</span>}
          </p>
        </div>
      </div>
      {/* ── Leads Grid ── */}
      {leads.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center">
            <TrendingUp size={26} className="text-brand-400" />
          </div>
          <div className="text-center">
            <p className="text-slate-600 font-bold text-sm">No leads found</p>
            <p className="text-slate-400 text-xs mt-1">
              {debouncedSearch ? `No results for "${debouncedSearch}"` : 'Add your first lead to get started'}
            </p>
          </div>
          {!debouncedSearch && (
            <button
              onClick={() => openModal(null)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl btn-primary"
            >
              <Plus size={15} /> Add First Lead
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {leads.map(lead => (
            <div
              key={lead._id}
              className="group bg-white rounded-2xl border border-slate-100 shadow-[0_1px_4px_rgba(0,0,0,0.04)] p-5 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white font-extrabold text-sm flex-shrink-0 shadow-sm">
                    {lead.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 text-[14px] truncate">{lead.name}</p>
                    {lead.company && <p className="text-[11px] text-slate-400 truncate">{lead.company}</p>}
                  </div>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => openModal(lead)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-brand-100 hover:text-brand-600 active:scale-95 transition-all"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(lead._id)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-red-100 hover:text-red-600 active:scale-95 transition-all"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                <StatusDropdown leadId={lead._id} status={lead.status} onStatusChange={updateLeadStatus} />
                <PriorityBadge priority={lead.priority} />
                {lead.source && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600">
                    {lead.source}
                  </span>
                )}
              </div>

              {/* Contact Info */}
              <div className="space-y-1.5 mb-3 bg-slate-50 rounded-2xl p-3">
                <div className="flex items-center gap-2 text-[12px] text-slate-600">
                  <Phone size={12} className="text-brand-400 flex-shrink-0" />
                  <span className="font-medium">{lead.phone}</span>
                </div>
                {lead.email && (
                  <div className="flex items-center gap-2 text-[12px] text-slate-600">
                    <Mail size={12} className="text-brand-400 flex-shrink-0" />
                    <span className="truncate font-medium">{lead.email}</span>
                  </div>
                )}
                {/* ✅ Fixed: safe access to assignedTo.name with fallback */}
                {lead.assignedTo && (
                  <div className="flex items-center gap-2 text-[12px] text-slate-600">
                    <Building2 size={12} className="text-brand-400 flex-shrink-0" />
                    <span className="font-medium">
                      Assigned: {lead.assignedTo?.name || lead.assignedTo}
                    </span>
                  </div>
                )}
              </div>

              {/* Follow-up & Score */}
              <div className="flex justify-between items-center mb-3">
                {lead.followUpDate && (
                  <div className={`text-[11px] px-3 py-2 rounded-2xl font-semibold border ${new Date(lead.followUpDate) < new Date() ? 'text-red-700 bg-red-50 border-red-100' : 'text-amber-700 bg-amber-50 border-amber-100'}`}>
                    📅 Follow-up: {fmt(lead.followUpDate)}
                  </div>
                )}
                {lead.score > 0 && (
                  <div className="text-[11px] px-2 py-1 rounded-lg font-bold bg-brand-50 text-brand-600 border border-brand-100">
                    Score: {lead.score}
                  </div>
                )}
              </div>

              {/* Deal Value */}
              {lead.dealValue > 0 && (
                <div className="mb-3 px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-2xl">
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">Expected Value</p>
                  <p className="text-sm font-extrabold text-emerald-700">₹{lead.dealValue.toLocaleString()}</p>
                </div>
              )}

              {/* Remarks */}
              <RemarkBox
                leadId={lead._id}
                remarks={lead.remarks}
                onAdded={handleRemarkAdded}
                token={token}
              />
            </div>
          ))}
        </div>
      ) : (
        <LeadKanbanBoard 
          leads={leads} 
          updateLeadStatus={updateLeadStatus} 
          openModal={openModal} 
          handleDelete={handleDelete} 
        />
      )}

      {/* ── Modal Overlay ── */}
      {showModal && createPortal(
        <div
          className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto transition-all duration-260 ${modalVisible ? 'bg-black/50 backdrop-blur-sm' : 'bg-black/0'}`}
          onClick={closeModal}
        >
          <div
            className={`my-auto w-full max-w-lg transition-all duration-260 ease-out ${modalVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'}`}
            onClick={e => e.stopPropagation()}
          >
            <LeadModal
              lead={editingLead}
              onClose={closeModal}
              onSave={handleSaved}
              token={token}
              currentUser={user}
            />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default LeadManagement;