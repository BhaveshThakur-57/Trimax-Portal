import React, { useState, useEffect } from 'react';
import UserTable from './UserTable';
import UserModal from './UserModal';
import UserDetailModal from './UserDetailModal';
import userService from '../../services/userService';
import { Plus, Search, Users, Copy, Check, X, ShieldCheck, User } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [createdEmployee, setCreatedEmployee] = useState(null);
  const [copied, setCopied] = useState(false);
  const [employeePasswords, setEmployeePasswords] = useState({});

  useEffect(() => {
    fetchUsers();
    const stored = JSON.parse(localStorage.getItem('employeePasswords') || '{}');
    setEmployeePasswords(stored);
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await userService.getAll();
      setUsers(response.data);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIX: optional chaining + fallback '' so toLowerCase never crashes
  const filteredUsers = users.filter(user => {
    const name = (user?.name || '').toLowerCase();
    const email = (user?.email || '').toLowerCase();
    const role = (user?.role || '').toLowerCase();
    const term = searchTerm.toLowerCase();

    const matchesSearch = name.includes(term) || email.includes(term);
    const matchesRole = roleFilter === 'all' || role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleView = async (userId) => {
    try {
      const response = await userService.getById(userId);
      const userData = response.data;
      if (employeePasswords[userId]) userData.tempPassword = employeePasswords[userId];
      setSelectedUser(userData);
    } catch {
      alert('Failed to fetch user details');
    }
  };

  const handleEdit = async (userId) => {
    try {
      const response = await userService.getById(userId);
      setEditingUser(response.data);
      setShowModal(true);
    } catch {
      alert('Failed to fetch user details');
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await userService.delete(userId);
      const newPasswords = { ...employeePasswords };
      delete newPasswords[userId];
      setEmployeePasswords(newPasswords);
      fetchUsers();
    } catch (err) {
      alert(err.message || 'Failed to delete user');
    }
  };

  const handleToggleAdmin = async (userId, currentRole) => {
    const isAdmin = currentRole === 'admin';
    if (!window.confirm(isAdmin ? 'Remove Admin role?' : 'Make this user an Admin?')) return;
    try {
      const token = localStorage.getItem('token');
      const endpoint = isAdmin ? 'remove-admin' : 'make-admin';
      const response = await fetch(`${API_URL}/api/users/${userId}/${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) { fetchUsers(); alert(data.message); }
      else alert(data.message || 'Failed to update role');
    } catch {
      alert('Failed to update role');
    }
  };

  const handleSaveUser = async (userData) => {
    try {
      if (editingUser) {
        await userService.update(editingUser._id, userData);
        alert('User updated successfully');
        setShowModal(false);
        setEditingUser(null);
        fetchUsers();
      } else {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/api/auth/create-employee`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: userData.name,
            email: userData.email,
            password: userData.password,
            department: userData.department || 'General',
            designation: userData.designation,
            joiningDate: new Date().toISOString().split('T')[0],
            salary: userData.salary || '',
          }),
        });
        const data = await response.json();
        if (data.success) {
          const employeeData = { ...data.data, tempPassword: userData.password };
          setEmployeePasswords(prev => ({ ...prev, [data.data._id]: userData.password }));
          const stored = JSON.parse(localStorage.getItem('employeePasswords') || '{}');
          stored[data.data._id] = userData.password;
          localStorage.setItem('employeePasswords', JSON.stringify(stored));
          setCreatedEmployee(employeeData);
          setShowModal(false);
          fetchUsers();
        } else {
          throw new Error(data.message || 'Failed to create employee');
        }
      }
    } catch (err) {
      throw new Error(err.message || 'Failed to save user');
    }
  };

  const copyCredentials = () => {
    const text = `
🎉 Welcome to the Team!

Login Credentials
-----------------------------------
Name:               ${createdEmployee.name}
Employee ID:        ${createdEmployee.employeeId}
Email:              ${createdEmployee.email}
Temporary Password: ${createdEmployee.tempPassword}
Department:         ${createdEmployee.department}
Designation:        ${createdEmployee.designation}

Login URL: ${window.location.origin}

⚠️ Please change your password after first login.
    `.trim();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded-2xl w-48" />
          <div className="h-4 bg-slate-200 rounded w-64" />
          <div className="grid grid-cols-3 gap-4 mt-6">
            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-slate-200 rounded-2xl" />)}
          </div>
          <div className="h-64 bg-slate-200 rounded-2xl mt-4" />
        </div>
      </div>
    );
  }

  const totalAdmins = users.filter(u => u?.role?.toLowerCase() === 'admin').length;
  const totalEmployees = users.filter(u => u?.role?.toLowerCase() === 'employee').length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-5">
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-[20px] bg-gradient-to-br from-brand-600 to-blue-600 flex items-center justify-center text-white shadow-xl shadow-brand-500/20 overflow-hidden group">
            <div className="absolute inset-0 bg-white/20 blur-md rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <Users size={30} strokeWidth={2.5} className="relative z-10 drop-shadow-md group-hover:scale-110 transition-transform duration-300" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-[34px] font-black font-display text-transparent bg-clip-text bg-gradient-to-r from-slate-700 via-brand-800 to-brand-600 tracking-tight leading-tight pb-1 mb-0.5">
              User Management
            </h1>
            <p className="text-[14px] sm:text-[15px] font-medium text-slate-500">
              Manage user accounts and permissions
            </p>
          </div>
        </div>
        <button
          onClick={() => { setEditingUser(null); setShowModal(true); }}
          className="
            flex items-center gap-2 px-4 py-2.5 rounded-2xl
            bg-gradient-to-r from-brand-600 to-blue-600
            text-white text-sm font-semibold
            shadow-md shadow-brand-200
            hover:opacity-90 active:scale-95
            transition-all duration-200 self-start sm:self-auto
          "
        >
          <Plus size={16} />
          Add New User
        </button>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Users', value: users.length, grad: 'from-brand-600 to-blue-600', ring: 'ring-brand-600/20', icon: Users },
          { label: 'Admins', value: totalAdmins, grad: 'from-brand-600 to-blue-600', ring: 'ring-brand-600/20', icon: ShieldCheck },
          { label: 'Employees', value: totalEmployees, grad: 'from-brand-600 to-blue-600', ring: 'ring-brand-600/20', icon: User },
        ].map((s, i) => (
          <div key={i} className="
    group relative bg-white border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] rounded-2xl
    p-6 cursor-pointer overflow-hidden
    transition-all duration-300 ease-out
    hover:-translate-y-1.5 hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] hover:border-slate-200
  ">
            <div className="relative z-10">
              <div className="mb-5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white bg-gradient-to-br ${s.grad} shadow-lg ring-4 ${s.ring} transition-transform duration-300 group-hover:scale-110`}>
                  <s.icon size={22} strokeWidth={2} />
                </div>
              </div>
              <div className="text-[32px] font-bold text-slate-800 leading-none mb-1.5 tracking-tight">{s.value}</div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">{s.label}</p>
            </div>
            <div className={`absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r ${s.grad} scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left rounded-b-2xl`} />
          </div>
        ))}
      </div>

      {/* ── Employee Created Card ── */}
      {createdEmployee && (
        <div className="mb-6 bg-gradient-to-br from-brand-600 to-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-brand-200">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              ✅ Employee Created Successfully!
            </h3>
            <button
              onClick={() => setCreatedEmployee(null)}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-5 mb-4 grid grid-cols-2 gap-4">
            {[
              { label: 'Name', value: createdEmployee.name, mono: false },
              { label: 'Employee ID', value: createdEmployee.employeeId, mono: true },
              { label: 'Email', value: createdEmployee.email, mono: false },
              { label: 'Temporary Password', value: createdEmployee.tempPassword, mono: true },
              { label: 'Department', value: createdEmployee.department, mono: false },
              { label: 'Designation', value: createdEmployee.designation, mono: false },
            ].map(({ label, value, mono }) => (
              <div key={label}>
                <p className="text-[11px] text-white/70 mb-1">{label}</p>
                <p className={`text-sm font-semibold ${mono ? 'font-mono bg-black/20 px-2 py-0.5 rounded inline-block' : ''}`}>
                  {value}
                </p>
              </div>
            ))}
          </div>

          <button
            onClick={copyCredentials}
            className="flex items-center gap-2 px-4 py-2.5 bg-white text-brand-700 rounded-2xl text-sm font-semibold hover:bg-white/90 transition-colors active:scale-95"
          >
            {copied ? <><Check size={16} /> Copied!</> : <><Copy size={16} /> Copy Credentials</>}
          </button>
          <p className="text-[12px] text-white/70 mt-3">
            📧 Share these credentials with the employee via email or WhatsApp
          </p>
        </div>
      )}

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
              placeholder="Search by name or email..."
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

          {/* Role filter */}
          <div className="relative group min-w-[160px]">
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="w-full h-12 px-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-[16px] text-sm font-semibold text-white !outline-none focus:!border-white/40 focus:!ring-4 focus:!ring-white/20 transition-all duration-300 cursor-pointer appearance-none [&>option]:text-slate-800"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="employee">Employee</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-white/70 group-focus-within:text-white">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
        </div>

        {/* Results count */}
        <div className="relative z-10 flex items-center gap-2 mt-4 text-[12px] text-white/80">
          <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
          <p>
            Showing <span className="font-semibold text-white">{filteredUsers.length}</span> of <span className="font-semibold text-white">{users.length}</span> users
          </p>
        </div>
      </div>

      {/* ── Table ── */}
      <UserTable
        users={filteredUsers}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleAdmin={handleToggleAdmin}
      />

      {/* ── Modals ── */}
      {showModal && (
        <UserModal
          user={editingUser}
          onSave={handleSaveUser}
          onClose={() => { setShowModal(false); setEditingUser(null); }}
        />
      )}

      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  );
};

export default UserManagement;