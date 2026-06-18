import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, AlertCircle, Calendar, ListTodo, X } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const MyTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  useEffect(() => {
    fetchMyTasks();
  }, []);

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast({ show: false, message: '', type: '' });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  const showToast = (message, type) => {
    setToast({ show: true, message, type });
  };

  const fetchMyTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/tasks/my-tasks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setTasks(data.data);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (taskId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/tasks/${taskId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();

      if (data.success) {
        showToast('Task status updated successfully', 'success');
        fetchMyTasks();
      } else {
        showToast(data.message || 'Failed to update task', 'error');
      }
    } catch (error) {
      showToast('Failed to update task', 'error');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Pending': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'In Progress': 'bg-blue-100 text-blue-800 border-blue-300',
      'Completed': 'bg-green-100 text-green-800 border-green-300',
      'Not Completed': 'bg-red-100 text-red-800 border-red-300',
      'Cancelled': 'bg-gray-100 text-gray-800 border-gray-300'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    return task.status === filter;
  });

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-4 right-4 left-4 sm:left-auto z-50 animate-slide-in">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${
            toast.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {toast.type === 'success' ? (
              <CheckCircle size={20} className="text-green-600 shrink-0" />
            ) : (
              <AlertCircle size={20} className="text-red-600 shrink-0" />
            )}
            <span className="font-medium flex-1">{toast.message}</span>
            <button
              onClick={() => setToast({ show: false, message: '', type: '' })}
              className="ml-2 hover:opacity-70 shrink-0"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 rounded-2xl p-4 sm:p-8 text-white shadow-xl border border-slate-600">
        <div className="flex items-center gap-4 sm:gap-5 mb-4 sm:mb-6">
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-[20px] bg-gradient-to-br from-brand-600 to-blue-600 flex items-center justify-center text-white shadow-xl shadow-brand-500/20 overflow-hidden group shrink-0">
            <div className="absolute inset-0 bg-white/20 blur-md rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <ListTodo size={30} strokeWidth={2.5} className="relative z-10 drop-shadow-md group-hover:scale-110 transition-transform duration-300" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-[36px] font-bold font-display text-white tracking-tight leading-tight truncate">
              My Tasks
            </h1>
            <p className="text-slate-300 text-xs sm:text-[15px] mt-1 font-medium">
              View and manage your assigned tasks
            </p>
          </div>
        </div>
        
        <div className="mt-4 sm:mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          {[
            { dot: 'bg-blue-400',   label: 'Total Tasks',  value: tasks.length },
            { dot: 'bg-yellow-400', label: 'Pending',      value: tasks.filter(t => t.status === 'Pending').length },
            { dot: 'bg-purple-400', label: 'In Progress',  value: tasks.filter(t => t.status === 'In Progress').length },
            { dot: 'bg-green-400',  label: 'Completed',    value: tasks.filter(t => t.status === 'Completed').length },
          ].map(({ dot, label, value }) => (
            <div key={label} className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-3 sm:p-4 hover:bg-white/15 transition-all">
              <div className="flex items-center gap-2 mb-1 sm:mb-2">
                <div className={`w-2 h-2 ${dot} rounded-full shrink-0`}></div>
                <p className="text-xs text-slate-300 font-medium uppercase tracking-wide truncate">{label}</p>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-white">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <Clock className="text-blue-600 shrink-0" size={22} />
            <span className="text-2xl sm:text-3xl font-bold text-blue-600">{tasks.length}</span>
          </div>
          <p className="text-gray-600 text-xs sm:text-sm">Total Tasks</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <AlertCircle className="text-yellow-600 shrink-0" size={22} />
            <span className="text-2xl sm:text-3xl font-bold text-yellow-600">
              {tasks.filter(t => t.status === 'Pending').length}
            </span>
          </div>
          <p className="text-gray-600 text-xs sm:text-sm">Pending</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <Clock className="text-blue-600 shrink-0" size={22} />
            <span className="text-2xl sm:text-3xl font-bold text-blue-600">
              {tasks.filter(t => t.status === 'In Progress').length}
            </span>
          </div>
          <p className="text-gray-600 text-xs sm:text-sm">In Progress</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <CheckCircle className="text-green-600 shrink-0" size={22} />
            <span className="text-2xl sm:text-3xl font-bold text-green-600">
              {tasks.filter(t => t.status === 'Completed').length}
            </span>
          </div>
          <p className="text-gray-600 text-xs sm:text-sm">Completed</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['all', 'Pending', 'In Progress', 'Completed', 'Not Completed'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3 sm:px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors text-sm ${
              filter === status
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            {status === 'all' ? 'All Tasks' : status}
          </button>
        ))}
      </div>

      {/* Tasks Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {filteredTasks.length === 0 ? (
          <div className="col-span-2 text-center py-12">
            <Clock size={48} className="mx-auto mb-2 text-gray-300" />
            <p className="text-gray-600">No tasks found</p>
          </div>
        ) : (
          filteredTasks.map(task => (
            <div key={task._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
              {/* Task Header */}
              <div className="flex items-start justify-between mb-4 gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">{task.title}</h3>
                  <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                </div>
                <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium shrink-0 ${task.priority === 'Urgent' ? 'bg-red-100 text-red-800' : task.priority === 'High' ? 'bg-orange-100 text-orange-800' : task.priority === 'Medium' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                  {task.priority}
                </span>
              </div>

              {/* Task Details */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar size={16} className="shrink-0" />
                  <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock size={16} className="shrink-0" />
                  <span className="truncate">
                    Assigned by: {
                      task.assignedBy 
                        ? (typeof task.assignedBy === 'object' && task.assignedBy.name 
                            ? task.assignedBy.name 
                            : task.assignedBy)
                        : 'Admin'
                    }
                  </span>
                </div>
              </div>

              {/* Status Badge */}
              <div className="mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}>
                  {task.status}
                </span>
              </div>

              {/* Action Buttons */}
              {task.status === 'Pending' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleStatusUpdate(task._id, 'In Progress')}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Start Task
                  </button>
                </div>
              )}

              {task.status === 'In Progress' && (
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-gray-700">Update Status:</p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() => handleStatusUpdate(task._id, 'In Progress')}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      In Progress
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(task._id, 'Completed')}
                      className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                      Completed
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(task._id, 'Not Completed')}
                      className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                    >
                      Not Completed
                    </button>
                  </div>
                </div>
              )}

              {task.status === 'Completed' && task.completedDate && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700 font-medium flex items-center gap-2">
                    <CheckCircle size={16} className="shrink-0" />
                    ✅ Completed on {new Date(task.completedDate).toLocaleDateString()}
                  </p>
                </div>
              )}

              {task.status === 'Not Completed' && (
                <div className="space-y-3">
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700 font-medium flex items-center gap-2">
                      <AlertCircle size={16} className="shrink-0" />
                      ❌ Marked as Not Completed
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-gray-700">Update Status:</p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() => handleStatusUpdate(task._id, 'In Progress')}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Back to Progress
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(task._id, 'Completed')}
                      className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                      Mark Completed
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default MyTasks;