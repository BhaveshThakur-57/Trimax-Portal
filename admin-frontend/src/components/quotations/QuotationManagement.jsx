import React, { useState, useEffect, useCallback } from 'react';
import { Receipt,
  Plus,
  Search,
  Download,
  Send,
  Eye,
  Edit2,
  Trash2,
  FileText,
  Share2,
  Printer,
  CheckCircle,
  XCircle,
  AlertCircle,
  X
} from 'lucide-react';

import { useAuth } from '../../hooks/useAuth';

import quotationService from '../../services/quotationService';

import QuotationModal from './QuotationModal';
import QuotationViewModal from './QuotationViewModal';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { StatsCard } from '../common/UI';

const STATUS_CFG = {

  Draft: {
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    icon: FileText
  },

  Sent: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    icon: Send
  },

  Accepted: {
    bg: 'bg-emerald-100',
    text: 'text-emerald-700',
    icon: CheckCircle
  },

  Rejected: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    icon: XCircle
  },

  Paid: {
    bg: 'bg-emerald-100',
    text: 'text-emerald-700',
    icon: CheckCircle
  },

  Overdue: {
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    icon: AlertCircle
  },

  Cancelled: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    icon: XCircle
  }
};

const StatusBadge = ({ status }) => {

  const cfg =
    STATUS_CFG[status] ||
    STATUS_CFG.Draft;

  const Icon = cfg.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}
    >
      <Icon
        size={11}
        strokeWidth={2.5}
      />

      {status}
    </span>
  );
};

const formatCurrency = (amt) =>
  new Intl.NumberFormat(
    'en-IN',
    {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }
  ).format(amt || 0);

const formatDate = (d) => {

  if (!d) return 'N/A';

  const date = new Date(d);

  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }

  return date.toLocaleDateString(
    'en-IN',
    {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }
  );
};

const QuotationManagement = () => {

  const { user } = useAuth();

  const [
    quotations,
    setQuotations
  ] = useState([]);

  const [
    loading,
    setLoading
  ] = useState(true);

  const [
    showModal,
    setShowModal
  ] = useState(false);

  const [
    showViewModal,
    setShowViewModal
  ] = useState(false);

  const [
    selectedQuotation,
    setSelectedQuotation
  ] = useState(null);

  const [
    searchTerm,
    setSearchTerm
  ] = useState('');

  const [
    filterStatus,
    setFilterStatus
  ] = useState('all');

  const [
    stats,
    setStats
  ] = useState(null);

  const [
    message,
    setMessage
  ] = useState({
    type: '',
    text: ''
  });

  const userRole =
    user?.role?.toLowerCase() || '';

  const canCreate =
    ['admin', 'manager']
      .includes(userRole);

  const canEdit =
    ['admin', 'manager']
      .includes(userRole);

  const canDelete =
    userRole === 'admin';

  const canSend =
    ['admin', 'manager']
      .includes(userRole);

  const showMsg = (
    type,
    text
  ) => {

    setMessage({ type, text });

    setTimeout(() => {

      setMessage({
        type: '',
        text: ''
      });

    }, 3000);
  };

  const fetchQuotations =
    useCallback(async () => {

      try {

        setLoading(true);

        const response =
          await quotationService
            .getAllQuotations({
              status: filterStatus,
              search: searchTerm
            });

        const quotationData =
          response?.data?.data ||
          response?.data ||
          [];

        setQuotations(
          Array.isArray(quotationData)
            ? quotationData
            : []
        );

      } catch (e) {

        console.error(e);

        showMsg(
          'error',
          'Failed to fetch quotations'
        );

      } finally {

        setLoading(false);
      }

    }, [
      filterStatus,
      searchTerm
    ]);

  const fetchStats =
    useCallback(async () => {

      try {

        const r =
          await quotationService
            .getQuotationStats();

        setStats(
          r?.data?.data ||
          r?.data ||
          null
        );

      } catch (e) {

        console.error(e);
      }

    }, []);

  useEffect(() => {

    fetchQuotations();

    fetchStats();

  }, [
    fetchQuotations,
    fetchStats
  ]);

  const handleCreate = () => {

    if (!canCreate) {

      showMsg(
        'error',
        'No permission'
      );

      return;
    }

    setSelectedQuotation(null);

    setShowModal(true);
  };

  const handleEdit = (q) => {

    if (!canEdit) {

      showMsg(
        'error',
        'No permission'
      );

      return;
    }

    setSelectedQuotation(q);

    setShowModal(true);
  };

  const handleView = (q) => {

    setSelectedQuotation(q);

    setShowViewModal(true);
  };

  const handleDelete = async (id) => {

    if (!canDelete) {

      showMsg(
        'error',
        'No permission'
      );

      return;
    }

    if (
      !window.confirm(
        'Delete this quotation?'
      )
    ) return;

    try {

      await quotationService
        .deleteQuotation(id);

      showMsg(
        'success',
        'Deleted successfully'
      );

      fetchQuotations();

      fetchStats();

    } catch (e) {

      console.error(e);

      showMsg(
        'error',
        e.message || 'Failed'
      );
    }
  };

  const handleStatusChange =
    async (id, status) => {

      try {

        await quotationService
          .updateQuotationStatus(
            id,
            status
          );

        showMsg(
          'success',
          `${status} successfully`
        );

        setShowViewModal(false);
        setSelectedQuotation(null);

        fetchQuotations();

        fetchStats();

      } catch (e) {

        showMsg(
          'error',
          e.message || 'Failed'
        );
      }
    };

  const handleDownloadPDF =
    async (q) => {

      try {

        await quotationService
          .downloadPDF(
            q._id,
            q.invoiceNumber
          );

        showMsg(
          'success',
          'PDF downloaded'
        );

      } catch {

        showMsg(
          'error',
          'Failed to download'
        );
      }
    };

  const handlePrint =
    async (q) => {

      try {

        await quotationService
          .printQuotation(q._id);

      } catch {

        showMsg(
          'error',
          'Failed to print'
        );
      }
    };

  const handleShare =
    async (q) => {

      try {

        await quotationService
          .shareQuotation(q._id);

        showMsg(
          'success',
          'Link copied!'
        );

      } catch {

        showMsg(
          'error',
          'Failed'
        );
      }
    };

  const handleSendEmail =
    async (q) => {

      if (!canSend) {

        showMsg(
          'error',
          'No permission'
        );

        return;
      }

      if (
        !window.confirm(
          `Send quotation to ${q.customer?.email}?`
        )
      ) return;

      try {

        await quotationService
          .sendQuotationEmail(q._id);

        showMsg(
          'success',
          'Sent!'
        );

        fetchQuotations();

      } catch (e) {

        showMsg(
          'error',
          e.message || 'Failed'
        );
      }
    };

  const STAT_CARDS =
    stats ? [

      {
        label: 'Total Quotations',
        value: stats.total || 0,
        grad: 'from-brand-500 to-brand-600',
        ring: 'ring-brand-500/20',
        icon: FileText,
        meta: null
      },

      {
        label: 'Accepted',
        value: stats.accepted || 0,
        grad: 'from-emerald-500 to-teal-500',
        ring: 'ring-emerald-500/20',
        icon: CheckCircle,
        meta:
          `${stats.conversionRate || 0}% conversion`
      },

      {
        label: 'Sent',
        value: stats.sent || 0,
        grad: 'from-blue-500 to-brand-500',
        ring: 'ring-blue-500/20',
        icon: Send,
        meta: null
      },

      {
        label: 'Total Value',
        value: formatCurrency(
          stats.totalValue || 0
        ),
        grad: 'from-amber-500 to-orange-400',
        ring: 'ring-amber-500/20',
        icon: FileText,
        meta:
          `Accepted: ${formatCurrency(stats.acceptedValue || 0)}`
      },

    ] : [];

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

        <div className="flex items-center gap-5">
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-[20px] bg-gradient-to-br from-brand-600 to-blue-600 flex items-center justify-center text-white shadow-xl shadow-brand-500/20 overflow-hidden group shrink-0">
            <div className="absolute inset-0 bg-white/20 blur-md rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <Receipt size={30} strokeWidth={2.5} className="relative z-10 drop-shadow-md group-hover:scale-110 transition-transform duration-300" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-[34px] font-black font-display text-transparent bg-clip-text bg-gradient-to-r from-slate-700 via-brand-800 to-brand-600 tracking-tight leading-tight pb-1 mb-0.5">
              Quotations
            </h1>
            <p className="text-[14px] sm:text-[15px] font-medium text-slate-500">
              Manage quotations and invoices
            </p>
          </div>
        </div>

        {canCreate && (
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-brand-600 text-white font-medium hover:bg-brand-700 transition-colors"
          >
            <Plus size={16} />
            Create Quotation
          </button>
        )}
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

          {STAT_CARDS.map((card) => (
            <StatsCard key={card.label} title={card.label} {...card} />
          ))}
        </div>
      )}

      {/* Trends Chart */}
      {stats?.monthlyTrends?.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Monthly Revenue Trends</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[...stats.monthlyTrends].reverse()} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="_id" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dx={-10} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(val) => formatCurrency(val)} />
                <Bar dataKey="totalValue" name="Total Value" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="acceptedValue" name="Accepted Value" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Message */}
      {message.text && (
        <div
          className={`p-3 rounded-2xl text-sm font-medium ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Filters */}
      <div className="bg-gradient-to-r from-brand-600 to-blue-600 rounded-[24px] p-5 shadow-lg shadow-brand-500/30 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row gap-4">
          <div className="flex items-center gap-3 flex-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-[16px] px-4 py-3 h-12 focus-within:ring-4 focus-within:ring-white/30 transition-all duration-300 group">
            <Search size={18} className="text-white/70 group-focus-within:text-white flex-shrink-0" />
            <input
              type="text"
              placeholder="Search quotation..."
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

          <div className="relative group min-w-[160px]">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full h-12 px-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-[16px] text-sm font-semibold text-white outline-none focus:ring-4 focus:ring-white/30 transition-all duration-300 cursor-pointer appearance-none [&>option]:text-slate-800"
            >
              <option value="all">All Status</option>
              <option value="Draft">Draft</option>
              <option value="Sent">Sent</option>
              <option value="Accepted">Accepted</option>
              <option value="Rejected">Rejected</option>
              <option value="Paid">Paid</option>
              <option value="Overdue">Overdue</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-white/70 group-focus-within:text-white">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200/60 shadow-xl shadow-slate-200/40 rounded-[24px] overflow-hidden">
        
        {loading ? (
          <div className="p-10 text-center text-slate-500">
            Loading quotations...
          </div>
        ) : quotations.length === 0 ? (
          <div className="p-10 text-center text-slate-500">
            No quotations found
          </div>
        ) : (
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-brand-600 to-blue-600 border-b border-white/20 shadow-lg shadow-brand-500/20">
                <tr>
                  {['Invoice No', 'Customer', 'Due Date', 'Amount', 'Status', 'Actions'].map(h => (
                    <th key={h} className={`px-6 py-4 text-[12px] font-extrabold text-white uppercase tracking-widest ${h === 'Actions' ? 'text-right' : 'text-left'}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {quotations.map((q) => (
                  <tr key={q._id} className="hover:bg-brand-50/30 transition-colors duration-300 group">

                    <td className="px-5 py-4 font-semibold text-brand-600">
                      {q.invoiceNumber || 'N/A'}
                    </td>

                    <td className="px-5 py-4">

                      <div className="font-medium text-slate-700">
                        {q.customer?.name || 'N/A'}
                      </div>

                      <div className="text-xs text-slate-500">
                        {q.customer?.email || ''}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {formatDate(q.dueDate)}
                    </td>

                    <td className="px-5 py-4 font-semibold text-slate-800">
                      {formatCurrency(q.total)}
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={q.status} />
                    </td>

                    <td className="px-5 py-4">

                      <div className="flex items-center justify-end gap-2">

                        <button
                          onClick={() => handleView(q)}
                          className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-100"
                        >
                          <Eye size={14} />
                        </button>

                        {canEdit && (
                          <button
                            onClick={() => handleEdit(q)}
                            className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-100"
                          >
                            <Edit2 size={14} />
                          </button>
                        )}

                        <button
                          onClick={() => handleDownloadPDF(q)}
                          className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-100"
                        >
                          <Download size={14} />
                        </button>

                        <button
                          onClick={() => handlePrint(q)}
                          className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-100"
                        >
                          <Printer size={14} />
                        </button>

                        <button
                          onClick={() => handleShare(q)}
                          className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-100"
                        >
                          <Share2 size={14} />
                        </button>

                        {canSend && (
                          <button
                            onClick={() => handleSendEmail(q)}
                            className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-100"
                          >
                            <Send size={14} />
                          </button>
                        )}

                        {canDelete && (
                          <button
                            onClick={() => handleDelete(q._id)}
                            className="w-8 h-8 rounded-lg border border-red-200 text-red-600 flex items-center justify-center hover:bg-red-50"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <QuotationModal
          quotation={selectedQuotation}
          onClose={() => {
            setShowModal(false);
            setSelectedQuotation(null);
          }}
          onSave={() => {
            fetchQuotations();
            fetchStats();

            setShowModal(false);

            setSelectedQuotation(null);
          }}
        />
      )}

      {/* View Modal */}
      {showViewModal && (
        <QuotationViewModal
          quotation={selectedQuotation}
          onClose={() => {
            setShowViewModal(false);
            setSelectedQuotation(null);
          }}
          onStatusChange={handleStatusChange}
          onDownload={handleDownloadPDF}
          onPrint={handlePrint}
          onShare={handleShare}
          onSend={handleSendEmail}
        />
      )}
    </div>
  );
};

export default QuotationManagement;