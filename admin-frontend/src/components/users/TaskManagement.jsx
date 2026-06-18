import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Search, Clock, AlertCircle, CheckCircle, X, Trash2, CheckSquare, ListTodo } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const STATUS_CFG = {
  'Pending': { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-400', icon: Clock },
  'In Progress': { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-400', icon: AlertCircle },
  'Completed': { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-400', icon: CheckCircle },
  'Not Completed': { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-400', icon: X },
  'Cancelled': { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400', icon: X },
};

const PRIORITY_CFG = {
  'Low': { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' },
  'Medium': { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-400' },
  'High': { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-400' },
  'Urgent': { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-400' },
};

const STAT_CARDS = [
  { key: 'all', label: 'Total Tasks', grad: 'from-brand-500 to-brand-600', ring: 'ring-brand-100' },
  { key: 'Pending', label: 'Pending', grad: 'from-amber-400 to-orange-500', ring: 'ring-amber-100' },
  { key: 'In Progress', label: 'In Progress', grad: 'from-blue-500 to-brand-500', ring: 'ring-blue-100' },
  { key: 'Completed', label: 'Completed', grad: 'from-emerald-500 to-teal-500', ring: 'ring-emerald-100' },
  { key: 'Not Completed', label: 'Not Completed', grad: 'from-red-500 to-rose-500', ring: 'ring-red-100' },
];

/* ── Badges ── */
const StatusBadge = ({ status }) => {
  const cfg = STATUS_CFG[status] || STATUS_CFG['Cancelled'];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${cfg.bg} ${cfg.text}`}>
      <Icon size={11} strokeWidth={2.5} />
      {status}
    </span>
  );
};

const PriorityBadge = ({ priority }) => {
  const cfg = PRIORITY_CFG[priority] || PRIORITY_CFG['Medium'];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} flex-shrink-0`} />
      {priority}
    </span>
  );
};

/* ── Avatar ── */
const Avatar = ({ name, size = 'md' }) => {
  const sz = size === 'sm' ? 'w-7 h-7 text-[10px]' : 'w-9 h-9 text-xs';
  return (
    <div className={`${sz} rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white font-extrabold flex-shrink-0 shadow-sm`}>
      {(name || '?').charAt(0).toUpperCase()}
    </div>
  );
};

/* ── Shared input ── */
const inp = "w-full border border-slate-200 rounded-2xl px-3.5 py-2.5 text-sm text-slate-800 bg-slate-50 outline-none focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 transition-all placeholder:text-slate-400 font-medium";

/* ══════════════════════════════════════════════════════ */
const TaskManagement = () => {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formData, setFormData] = useState({
    title: '', description: '', assignedTo: '', assignedBy: '', priority: 'Medium', dueDate: ''
  });


  useEffect(() => {
    fetchTasks();
    fetchEmployees();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.name) setFormData(prev => ({ ...prev, assignedBy: user.name }));
  }, []);

  /* animate modal open */
  useEffect(() => {
    if (showModal) requestAnimationFrame(() => setModalVisible(true));
    else setModalVisible(false);
  }, [showModal]);

  const openModal = () => { setShowModal(true); };
  const closeModal = () => { setModalVisible(false); setTimeout(() => setShowModal(false), 260); };

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/tasks/all`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        setTasks(data.data.map(task => ({
          ...task,
          assignedBy: typeof task.assignedBy === 'object' && task.assignedBy?.name
            ? task.assignedBy.name : (task.assignedBy || 'Admin')
        })));
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/users`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setEmployees(data.data.filter(u => u.role !== 'admin'));
    } catch (e) { console.error(e); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.assignedTo || !formData.assignedBy || !formData.dueDate)
      return alert('Please fill all fields!');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        closeModal();
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        setFormData({ title: '', description: '', assignedTo: '', assignedBy: user.name || '', priority: 'Medium', dueDate: '' });
        fetchTasks();
      } else alert('❌ ' + data.message);
    } catch { alert('❌ Failed to assign task'); }
  };


  const handleDelete = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/tasks/${taskId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) fetchTasks();
    } catch { alert('❌ Failed to delete task'); }
  };

  const filteredTasks = tasks.filter(task => {
    const matchSearch = (task.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.assignedTo?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'all' || task.status === statusFilter;
    return matchSearch && matchStatus;
  });

  /* Loading skeleton */
  if (loading) return (
    <div className="page-container relative z-10">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-white/10 rounded-2xl w-56" />
        <div className="grid grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-24 bg-white/10 rounded-2xl" />)}
        </div>
        <div className="h-64 bg-white/10 rounded-2xl" />
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-5">
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-[20px] bg-gradient-to-br from-brand-600 to-blue-600 flex items-center justify-center text-white shadow-xl shadow-brand-500/20 overflow-hidden group shrink-0">
            <div className="absolute inset-0 bg-white/20 blur-md rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CheckSquare size={30} strokeWidth={2.5} className="relative z-10 drop-shadow-md group-hover:scale-110 transition-transform duration-300" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-[34px] font-black font-display text-transparent bg-clip-text bg-gradient-to-r from-slate-700 via-brand-800 to-brand-600 tracking-tight leading-tight pb-1 mb-0.5">
              Task Management
            </h1>
            <p className="text-[14px] sm:text-[15px] font-medium text-slate-500">
              Assign and track employee tasks
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          
          <button
            onClick={openModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl btn-primary"
          >
            <Plus size={16} strokeWidth={2.5} /> Assign New Task
          </button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {STAT_CARDS.map(({ key, label, grad, ring }) => {
          const count = key === 'all' ? tasks.length : tasks.filter(t => t.status === key).length;
          const isActive = statusFilter === key;
          return (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`
          group relative bg-white border shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] rounded-2xl text-left
          p-5 overflow-hidden cursor-pointer
          transition-all duration-300 ease-out
          hover:-translate-y-1.5 hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] hover:border-slate-200
          ${isActive ? 'border-brand-500/50 shadow-md ring-1 ring-brand-500/30 bg-brand-500/5' : 'border-slate-100'}
        `}
            >
              <div className="relative z-10">
                <div className="mb-4">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white bg-gradient-to-br ${grad} shadow-lg ring-4 ${ring} transition-transform duration-300 group-hover:scale-110`}>
                    <CheckSquare size={20} strokeWidth={2} />
                  </div>
                </div>
                <div className="text-[28px] font-bold text-slate-800 leading-none mb-1.5 tracking-tight">{count}</div>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">{label}</p>
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
          <div className="flex items-center gap-3 flex-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-[16px] px-4 py-3 h-12 focus-within:ring-4 focus-within:ring-white/20 focus-within:border-white/40 transition-all duration-300 group">
            <Search size={18} className="text-white/70 group-focus-within:text-white flex-shrink-0 transition-colors" />
            <input
              type="text"
              placeholder="Search tasks or employees..."
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
          
          {/* Status filter */}
          <div className="relative group min-w-[160px]">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full h-12 px-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-[16px] text-sm font-semibold text-white !outline-none focus:!border-white/40 focus:!ring-4 focus:!ring-white/20 transition-all duration-300 cursor-pointer appearance-none [&>option]:text-slate-800"
            >
              <option value="all">All Status</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Not Completed">Not Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-white/70 group-focus-within:text-white">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
        </div>
        
        <div className="relative z-10 flex items-center gap-2 mt-4 text-[12px] text-white/80">
          <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
          <p>
            Showing <span className="font-semibold text-white">{filteredTasks.length}</span> of <span className="font-semibold text-white">{tasks.length}</span> tasks
          </p>
        </div>
      </div>

      {/* ── Table / Cards ── */}
      <div className="bg-white border border-slate-200/60 shadow-xl shadow-slate-200/40 rounded-[24px] overflow-hidden">

        {/* ── Desktop Table ── */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-brand-600 to-blue-600 border-b border-white/20 shadow-lg shadow-brand-500/20">
              <tr>
                {['Task Title', 'Assigned To', 'Assigned By', 'Priority', 'Status', 'Due Date', 'Actions'].map(h => (
                  <th key={h} className="text-left px-6 py-4 text-[12px] font-extrabold text-white uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center">
                        <ListTodo size={24} className="text-slate-300" />
                      </div>
                      <p className="text-sm font-semibold">No tasks found</p>
                      <p className="text-xs text-slate-400">Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              ) : filteredTasks.map(task => {
                const isOverdue = task.status !== 'Completed' && new Date(task.dueDate) < new Date();
                return (
                  <tr key={task._id} className="hover:bg-brand-50/30 transition-colors duration-300 group">

                    {/* Title */}
                    <td className="px-6 py-4 max-w-[200px]">
                      <p className="font-bold text-slate-800 text-[13px] truncate">{task.title}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5 truncate">{task.description?.substring(0, 40)}...</p>
                    </td>

                    {/* Assigned To */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={task.assignedTo?.name} />
                        <div>
                          <p className="font-semibold text-slate-800 text-[13px]">{task.assignedTo?.name}</p>
                          <p className="text-[11px] text-slate-500 font-mono">{task.assignedTo?.employeeId}</p>
                        </div>
                      </div>
                    </td>

                    {/* Assigned By */}
                    <td className="px-5 py-3.5">
                      <p className="text-[13px] text-slate-600 font-semibold">
                        {typeof task.assignedBy === 'string' ? task.assignedBy : (task.assignedBy?.name || 'Admin')}
                      </p>
                    </td>

                    {/* Priority */}
                    <td className="px-5 py-3.5">
                      <PriorityBadge priority={task.priority} />
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5">
                      <StatusBadge status={task.status} />
                    </td>

                    {/* Due Date */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[13px] font-semibold ${isOverdue ? 'text-red-500' : 'text-slate-700'}`}>
                          {new Date(task.dueDate).toLocaleDateString('en-IN')}
                        </span>
                        {isOverdue && (
                          <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold">
                            Overdue
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Actions — always visible */}
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => handleDelete(task._id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-red-50 text-red-600 border border-red-100 text-xs font-bold hover:bg-red-100 hover:border-red-200 active:scale-95 transition-all duration-200"
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── Mobile Cards ── */}
        <div className="flex flex-col divide-y divide-slate-100 md:hidden">
          {filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center gap-3 text-slate-400 py-16">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center">
                <ListTodo size={24} className="text-slate-300" />
              </div>
              <p className="text-sm font-semibold">No tasks found</p>
            </div>
          ) : filteredTasks.map(task => {
            const isOverdue = task.status !== 'Completed' && new Date(task.dueDate) < new Date();
            return (
              <div key={task._id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 text-sm">{task.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{task.description}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(task._id)}
                    className="w-8 h-8 flex items-center justify-center rounded-2xl bg-red-50 text-red-500 hover:bg-red-100 active:scale-95 transition-all flex-shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="flex items-center gap-2.5">
                  <Avatar name={task.assignedTo?.name} size="sm" />
                  <div>
                    <p className="text-xs font-bold text-slate-700">{task.assignedTo?.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{task.assignedTo?.employeeId}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge status={task.status} />
                  <PriorityBadge priority={task.priority} />
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-50 rounded-2xl p-2.5">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-1">Assigned By</p>
                    <p className="text-slate-700 font-semibold">
                      {typeof task.assignedBy === 'string' ? task.assignedBy : (task.assignedBy?.name || 'Admin')}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-2.5">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-1">Due Date</p>
                    <p className={`font-semibold ${isOverdue ? 'text-red-500' : 'text-slate-700'}`}>
                      {new Date(task.dueDate).toLocaleDateString('en-IN')}
                      {isOverdue && <span className="ml-1 text-[9px] bg-red-100 text-red-600 px-1 py-0.5 rounded-full">Overdue</span>}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ══════════ MODAL ══════════ */}
      {showModal && createPortal(
        <div
          className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto transition-all duration-260 ${modalVisible ? 'bg-black/50 backdrop-blur-sm' : 'bg-black/0'}`}
          onClick={closeModal}
        >
          <div
            className={`bg-white border border-slate-100 rounded-3xl w-full max-w-[520px] max-h-[92vh] flex flex-col shadow-2xl my-auto transition-all duration-260 ease-out ${modalVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'}`}
            onClick={e => e.stopPropagation()}
          >
            {/* Gradient Header */}
            <div className="relative flex-shrink-0 bg-gradient-to-r from-brand-600 to-blue-600 rounded-t-3xl px-5 py-4 overflow-hidden">
              <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10 blur-xl pointer-events-none" />
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 shadow-sm border border-white/20">
                    <CheckSquare size={16} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-white font-extrabold text-[15px] leading-tight">Assign New Task</h2>
                    <p className="text-white/65 text-[11px]">Fill in the task details below</p>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="w-8 h-8 flex items-center justify-center rounded-2xl bg-white/20 hover:bg-white/35 text-white transition-all duration-200 hover:rotate-90"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Scrollable Form */}
            <form
              onSubmit={handleSubmit}
              className="flex-1 overflow-y-auto px-5 py-5 space-y-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            >
              {/* Title */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Task Title *</label>
                <input
                  type="text" value={formData.title} required placeholder="Enter task title"
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className={inp}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Description *</label>
                <textarea
                  value={formData.description} rows={3} required placeholder="Describe the task in detail..."
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className={`${inp} resize-none`}
                />
              </div>

              {/* Assigned By */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Assigned By *</label>
                <input
                  type="text" value={formData.assignedBy} required placeholder="Your name"
                  onChange={e => setFormData({ ...formData, assignedBy: e.target.value })}
                  className={inp}
                />
              </div>

              {/* Assign To + Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Assign To *</label>
                  <select
                    value={formData.assignedTo} required
                    onChange={e => setFormData({ ...formData, assignedTo: e.target.value })}
                    className={inp}
                  >
                    <option value="">Select Employee</option>
                    {employees.map(emp => (
                      <option key={emp._id} value={emp._id}>{emp.name} ({emp.employeeId})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Priority *</label>
                  <select
                    value={formData.priority} required
                    onChange={e => setFormData({ ...formData, priority: e.target.value })}
                    className={inp}
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                    <option>Urgent</option>
                  </select>
                </div>
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Due Date *</label>
                <input
                  type="date" value={formData.dueDate} required
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                  className={inp}
                />
              </div>
            </form>

            {/* Sticky Footer */}
            <div className="flex-shrink-0 flex justify-end gap-3 px-5 py-3.5 border-t border-slate-100 bg-slate-50 rounded-b-3xl">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 rounded-2xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-200 active:scale-95 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="relative flex items-center gap-2 px-5 py-2 rounded-2xl btn-primary"
              >
                <CheckSquare size={14} />
                <span>Assign Task</span>
                <span className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default TaskManagement;
