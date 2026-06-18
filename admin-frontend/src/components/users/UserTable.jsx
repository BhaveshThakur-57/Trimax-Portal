import React from 'react';
import { Eye, Edit, Trash2, ShieldCheck, ShieldOff } from 'lucide-react';
import { formatDate } from '../../utils/helpers';

const UserTable = ({ users, onView, onEdit, onDelete, onToggleAdmin }) => {
  if (users.length === 0) {
    return (
      <div className="bg-white border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] rounded-2xl p-10 text-center text-slate-500 text-sm">
        No users found
      </div>
    );
  }

  const Avatar = ({ name }) => (
    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
      {name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?'}
    </div>
  );

  return (
    <div className="bg-white border border-slate-200/60 shadow-xl shadow-slate-200/40 rounded-[24px] overflow-hidden">

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gradient-to-r from-brand-600 to-blue-600 border-b border-white/20 shadow-lg shadow-brand-500/20">
            <tr>
              {['Name', 'Email', 'Role', 'Status', 'Join Date', 'Actions'].map(h => (
                <th key={h} className="text-left px-6 py-4 text-[12px] font-extrabold text-white uppercase tracking-widest">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map(user => {
              const isAdmin = user.role?.toLowerCase() === 'admin';
              return (
                <tr key={user._id} className="hover:bg-brand-50/30 transition-colors duration-300 group">

                  {/* Name */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={user.name} />
                      <div>
                        <p className="font-medium text-slate-800">{user.name}</p>
                        {user.employeeId && (
                          <p className="text-xs text-slate-500 font-mono">{user.employeeId}</p>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-slate-600">{user.email}</td>

                  {/* Role + Toggle Button */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${isAdmin ? 'bg-brand-50 text-brand-600' : 'bg-blue-50 text-blue-600'
                        }`}>
                        {isAdmin && <ShieldCheck size={12} />}
                        {isAdmin ? 'Admin' : 'Employee'}
                      </span>
                      <button
                        onClick={() => onToggleAdmin(user._id, user.role)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${isAdmin
                            ? 'border-red-200 text-red-600 bg-red-50 hover:bg-red-100'
                            : 'border-emerald-200 text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                          }`}
                      >
                        {isAdmin
                          ? <><ShieldOff size={11} /> Remove Admin</>
                          : <><ShieldCheck size={11} /> Make Admin</>
                        }
                      </button>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${user.isActive !== false ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                      }`}>
                      ● {user.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>

                  {/* Join Date */}
                  <td className="px-6 py-4 text-slate-600">{formatDate(user.joinDate || user.createdAt)}</td>

                  {/* Actions */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => onView(user._id)} title="View"
                        className="p-1.5 rounded-lg text-brand-600 hover:bg-brand-50 transition-colors">
                        <Eye size={16} />
                      </button>
                      <button onClick={() => onEdit(user._id)} title="Edit"
                        className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => onDelete(user._id)} title="Delete"
                        className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>

                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="flex flex-col gap-3 p-3 md:hidden">
        {users.map(user => {
          const isAdmin = user.role?.toLowerCase() === 'admin';
          return (
            <div key={user._id} className="bg-white border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] rounded-2xl overflow-hidden">

              {/* Card Header */}
              <div className="flex items-center justify-between gap-3 px-4 py-3 bg-slate-50 border-b border-slate-100">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={user.name} />
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 text-sm truncate">{user.name}</p>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    {user.employeeId && (
                      <p className="text-xs text-slate-500 font-mono">{user.employeeId}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => onView(user._id)}
                    className="p-1.5 rounded-lg text-brand-600 hover:bg-brand-50 transition-colors">
                    <Eye size={15} />
                  </button>
                  <button onClick={() => onEdit(user._id)}
                    className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors">
                    <Edit size={15} />
                  </button>
                  <button onClick={() => onDelete(user._id)}
                    className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {/* Card Body */}
              <div className="px-4 py-3 flex flex-col gap-2.5">

                {/* Role + Toggle */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Role</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${isAdmin ? 'bg-brand-50 text-brand-600' : 'bg-blue-50 text-blue-600'
                      }`}>
                      {isAdmin && <ShieldCheck size={11} />}
                      {isAdmin ? 'Admin' : 'Employee'}
                    </span>
                    <button
                      onClick={() => onToggleAdmin(user._id, user.role)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${isAdmin
                          ? 'border-red-200 text-red-600 bg-red-50 hover:bg-red-100'
                          : 'border-emerald-200 text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                        }`}
                    >
                      {isAdmin
                        ? <><ShieldOff size={11} /> Remove Admin</>
                        : <><ShieldCheck size={11} /> Make Admin</>
                      }
                    </button>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</span>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${user.isActive !== false ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                    }`}>
                    ● {user.isActive !== false ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Join Date */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Join Date</span>
                  <span className="text-sm text-slate-600">{formatDate(user.joinDate || user.createdAt)}</span>
                </div>

              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};

export default UserTable;