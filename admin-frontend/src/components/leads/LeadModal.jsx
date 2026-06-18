// src/components/leads/LeadModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const inp = "w-full border border-slate-200 rounded-2xl px-3.5 py-2.5 text-sm text-slate-700 bg-white outline-none focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 transition-all placeholder:text-slate-400";
const lbl = "block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5";

const LeadModal = ({ lead, onClose, onSave, token, currentUser }) => {
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState('');
  


  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    company: '',
    source: 'Other',
    status: 'New',
    priority: 'Medium',
    dealValue: '',
    followUpDate: '',
    assignedTo: '',
  });

  // Prefill on edit
  useEffect(() => {
    if (lead) {
      setForm({
        name: lead.name || '',
        phone: lead.phone || '',
        email: lead.email || '',
        company: lead.company || '',
        source: lead.source || 'Other',
        status: lead.status || 'New',
        priority: lead.priority || 'Medium',
        dealValue: lead.dealValue || '',
        followUpDate: lead.followUpDate ? new Date(lead.followUpDate).toISOString().split('T')[0] : '',
        assignedTo: lead.assignedTo?._id || lead.assignedTo || '',
      });
    }
  }, [lead]);

  // Fetch sales employees for "assign to"
  useEffect(() => {
    const fetchSalesEmployees = async () => {
      try {
        const res = await fetch(`${API_URL}/api/users`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (data.success) {
          const salesEmps = data.data.filter(u =>
            (u.department || '').toLowerCase() === 'sales' || u.role === 'admin'
          );
          setEmployees(salesEmps);
        }
      } catch (e) { console.error(e); }
    };
    fetchSalesEmployees();
  }, [token]);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    setError('');
    if (!form.name.trim() || !form.phone.trim()) {
      setError('Name and phone are required');
      return; // ✅ Fixed: removed stray 'a' after return
    }
    setLoading(true);
    try {
      const url = lead ? `${API_URL}/api/leads/${lead._id}` : `${API_URL}/api/leads`;
      const method = lead ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...form,
          dealValue: Number(form.dealValue) || 0,
          followUpDate: form.followUpDate || null,
          assignedTo: form.assignedTo || null,
        }),
      });
      const data = await res.json();
      if (data.success) onSave();
      else setError(data.message || 'Failed to save lead');
    } catch (e) { setError('Network error'); }
    finally { setLoading(false); }
  };



  return (
    // ✅ Fixed: LeadModal no longer renders its own overlay/backdrop
    // The overlay is handled by LeadManagement, so modal is just the white card
    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">

      {/* Header */}
      <div className="relative flex-shrink-0 bg-gradient-to-r from-brand-600 to-blue-600 rounded-t-2xl px-5 py-4 overflow-hidden">
        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10 blur-xl pointer-events-none" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-white/25 border border-white/40 flex items-center justify-center text-white font-extrabold text-lg leading-none">
              {lead ? '✏' : '+'}
            </span>
            <div>
              <h2 className="text-white font-extrabold text-[16px] leading-tight font-display">
                {lead ? 'Edit Lead' : 'Add New Lead'}
              </h2>
              <p className="text-white/70 text-[12px] mt-0.5">
                Fill in the lead details below
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

      {/* Form */}
      <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">

        {error && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Name + Phone */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={lbl}>Name *</label>
            <input
              type="text"
              value={form.name}
              placeholder="Lead name"
              onChange={e => set('name', e.target.value)}
              className={inp}
              autoComplete="new-password"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
            />
          </div>
          <div>
            <label className={lbl}>Phone *</label>
            <input
              type="text"             
              value={form.phone}
              placeholder="+91 9999999999"
              onChange={e => set('phone', e.target.value)}
              className={inp}
              autoComplete="new-password"   
              autoCorrect="off"
              spellCheck="false"
            />
          </div>
        </div>

        {/* Email + Company */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={lbl}>Email</label>
            <input
              type="text"              
              value={form.email}
              placeholder="email@example.com"
              onChange={e => set('email', e.target.value)}
              className={inp}
              autoComplete="new-password"   
              spellCheck="false"
            />
          </div>
          <div>
            <label className={lbl}>Company</label>
            <input
              type="text"
              value={form.company}
              placeholder="Company name"
              onChange={e => set('company', e.target.value)}
              className={inp}
              autoComplete="new-password"  
              autoCorrect="off"
              spellCheck="false"
            />
          </div>
        </div>

        {/* Source + Status */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={lbl}>Source</label>
            <select value={form.source} onChange={e => set('source', e.target.value)} className={inp}>
              {['Website', 'Referral', 'Social Media', 'Cold Call', 'Email', 'Walk-in', 'Other'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={lbl}>Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)} className={inp}>
              {['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Won', 'Lost'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Priority + Follow-up */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={lbl}>Priority</label>
            <select value={form.priority} onChange={e => set('priority', e.target.value)} className={inp}>
              {['Low', 'Medium', 'High'].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className={lbl}>Follow-up Date</label>
            <input
              type="date"
              value={form.followUpDate}
              onChange={e => set('followUpDate', e.target.value)}
              className={inp}
            />
          </div>
        </div>

        {/* Assign To + Deal Value */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={lbl}>Assign To</label>
            <select value={form.assignedTo} onChange={e => set('assignedTo', e.target.value)} className={inp}>
              <option value="">— Unassigned —</option>
              {employees.map(emp => (
                <option key={emp._id} value={emp._id}>
                  {emp.name} {emp.employeeId ? `(${emp.employeeId})` : '(Admin)'}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={lbl}>Deal Value (₹)</label>
            <input
              type="number"
              value={form.dealValue}
              placeholder="e.g. 50000"
              onChange={e => set('dealValue', e.target.value)}
              className={inp}
            />
          </div>
        </div>



        {/* Client Timeline / Interaction History */}
        {lead && lead.activities && lead.activities.length > 0 && (
          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 mb-3">Interaction History</h3>
            <div className="space-y-3 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-slate-200">
              {lead.activities.map((activity, idx) => (
                <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                  {/* Icon */}
                  <div className={`flex items-center justify-center w-5 h-5 rounded-full border-2 border-white bg-slate-200 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 ${
                    activity.type === 'STATUS_CHANGE' ? 'bg-amber-400' :
                    activity.type === 'REMARK' ? 'bg-brand-400' :
                    activity.type === 'CREATION' ? 'bg-emerald-400' : 'bg-blue-400'
                  }`} />
                  {/* Card */}
                  <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-3 rounded border border-slate-100 bg-slate-50 shadow-sm">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-[11px] text-slate-800 uppercase">{activity.type.replace('_', ' ')}</span>
                      <time className="text-[10px] text-slate-400 font-medium">{new Date(activity.createdAt).toLocaleString('en-IN')}</time>
                    </div>
                    <div className="text-xs text-slate-600">{activity.description}</div>
                    {activity.performedByName && (
                      <div className="text-[10px] text-slate-400 mt-1 font-semibold">— {activity.performedByName}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 flex-shrink-0">
        <button onClick={onClose}
          className="px-5 py-2.5 rounded-2xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors">
          Cancel
        </button>
        <button onClick={handleSubmit} disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl btn-primary">
          <Save size={15} />
          {loading ? 'Saving...' : lead ? 'Update Lead' : 'Add Lead'}
        </button>
      </div>
    </div>
  );
};

export default LeadModal;