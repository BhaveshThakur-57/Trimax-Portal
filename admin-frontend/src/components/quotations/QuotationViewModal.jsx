import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Download,
  Send,
  Printer,
  Share2,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  Building2,
  MapPin,
  FileText,
  Eye,
  History
} from 'lucide-react';
import quotationService from '../../services/quotationService';

const QuotationViewModal = ({
  quotation,
  onClose,
  onStatusChange,
  onDownload,
  onPrint,
  onShare,
  onSend
}) => {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount || 0);

  const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Invalid Date';
    return d.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const statusColor = {
    Draft: '#6c757d',
    Sent: '#0d6efd',
    Accepted: '#198754',
    Rejected: '#dc3545',
    Expired: '#ffc107'
  };

  const isExpired = quotation?.dueDate
    ? new Date(quotation.dueDate) < new Date()
    : false;

  const handlePreview = async () => {
    if (previewUrl) {
      setPreviewUrl(null);
      return;
    }
    setLoadingPreview(true);
    setShowHistory(false);
    try {
      const url = await quotationService.previewPDF(quotation._id);
      setPreviewUrl(url);
    } catch (e) {
      alert("Failed to load PDF preview");
    } finally {
      setLoadingPreview(false);
    }
  };

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-5"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl w-full max-w-[1200px] max-h-[90vh] overflow-hidden
          flex flex-col shadow-[0_10px_40px_rgba(0,0,0,0.2)]"
      >
        {/* Header */}
        <div className="flex justify-between items-start px-6 py-5 border-b border-slate-200 flex-shrink-0">
          <div>
            <h2 className="text-[24px] font-bold font-display text-slate-800 m-0">
              Quotation Details
            </h2>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-sm font-semibold text-[#667eea]">
                #{quotation.invoiceNumber}
              </span>
              <span
                className="px-3 py-1 rounded-2xl text-xs font-bold text-white uppercase tracking-wide"
                style={{
                  backgroundColor:
                    statusColor[quotation.status]
                }}
              >
                {quotation.status}
              </span>
              {quotation.version > 1 && (
                <span className="text-xs font-medium text-slate-500">
                  Version {quotation.version}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 border-none bg-slate-100 rounded-lg cursor-pointer text-slate-500
              hover:bg-slate-200 transition-all flex items-center"
          >
            <X size={24} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 bg-slate-50">
          {/* Action Bar */}
          <div className="flex gap-3 px-4 py-4 bg-white border-b border-slate-200 flex-wrap">
            <button
              onClick={handlePreview}
              className={`flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold cursor-pointer transition-all ${previewUrl ? 'bg-brand-50 text-brand-700 border-indigo-200' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
            >
              <Eye size={18} />
              {loadingPreview ? 'Loading...' : previewUrl ? 'Hide Preview' : 'Preview PDF'}
            </button>
            
            <button
              onClick={() => { setShowHistory(!showHistory); setPreviewUrl(null); }}
              className={`flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold cursor-pointer transition-all ${showHistory ? 'bg-brand-50 text-brand-700 border-indigo-200' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
            >
              <History size={18} />
              Version History
            </button>

            {[
              {
                label: 'Download PDF',
                icon: <Download size={18} />,
                onClick: () => onDownload(quotation)
              },
              {
                label: 'Print',
                icon: <Printer size={18} />,
                onClick: () => onPrint(quotation)
              },
              {
                label: 'Share Link',
                icon: <Share2 size={18} />,
                onClick: () => onShare(quotation)
              },
            ].map(({ label, icon, onClick }) => (
              <button
                key={label}
                onClick={onClick}
                className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-600
                  border border-slate-200 rounded-lg text-sm font-semibold cursor-pointer
                  hover:bg-slate-100 transition-all"
              >
                {icon}
                {label}
              </button>
            ))}

            {(quotation.status === 'Draft' ||
              quotation.status === 'Sent') && (

                <button
                  onClick={() => onSend(quotation)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#667eea] text-white
                  border-none rounded-lg text-sm font-semibold cursor-pointer
                  hover:bg-[#5568d3] transition-all"
                >
                  <Send size={18} />
                  Send Email
                </button>
              )}
          </div>

          {/* Content */}
          {previewUrl ? (
            <div className="bg-white mx-5 my-5 p-2 rounded-lg shadow-sm border border-slate-200" style={{ height: '700px' }}>
              <iframe src={previewUrl} width="100%" height="100%" title="PDF Preview" className="rounded-md border-0" />
            </div>
          ) : showHistory ? (
            <div className="bg-white mx-5 my-5 p-8 rounded-lg shadow-sm border border-slate-200">
              <h3 className="text-lg font-bold text-slate-800 mb-6">Version History</h3>
              {(!quotation.versionHistory || quotation.versionHistory.length === 0) ? (
                <div className="text-center py-10 text-slate-500">No previous versions found.</div>
              ) : (
                <div className="space-y-6">
                  {quotation.versionHistory.slice().reverse().map((vh, i) => (
                    <div key={i} className="border-l-2 border-indigo-200 pl-4 pb-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-slate-700">Version {vh.version}</span>
                        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{formatDate(vh.updatedAt)}</span>
                      </div>
                      <p className="text-sm text-slate-600 m-0 mb-2">{vh.changes}</p>
                      {vh.snapshot && (
                        <div className="bg-slate-50 p-3 rounded-lg text-xs text-slate-600">
                          <div className="grid grid-cols-2 gap-2 mb-2">
                            <div><strong>Items:</strong> {vh.snapshot.items?.length || 0}</div>
                          </div>
                          <div className="flex justify-between border-t border-slate-200 pt-2 font-semibold">
                            <span>Total Value:</span>
                            <span>{formatCurrency(vh.snapshot.total)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white mx-5 my-5 p-10 rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.1)] max-md:p-5">

              {/* Company + Quotation Info */}
              <div className="grid grid-cols-2 gap-10 mb-10 pb-8 border-b-2 border-slate-200 max-md:grid-cols-1">

                <div>

                  <h1 className="text-[28px] font-bold text-[#667eea] m-0 mb-1">
                    Trimax Solutions
                  </h1>

                  <p className="text-sm text-slate-500 m-0 mb-4">
                    Professional IT Services & Solutions
                  </p>

                  <div className="flex flex-col gap-1.5">

                    {[
                      {
                        icon: <Phone size={14} />,
                        text: '+91 1234567890'
                      },

                      {
                        icon: <Mail size={14} />,
                        text: 'info@trimax.com'
                      },

                      {
                        icon: <MapPin size={14} />,
                        text: 'Nagpur, Maharashtra, India'
                      },

                    ].map(({ icon, text }) => (

                      <p
                        key={text}
                        className="flex items-center gap-2 text-[13px] text-slate-600 m-0"
                      >
                        {icon}
                        {text}
                      </p>
                    ))}
                  </div>
                </div>

                <div className="text-right max-md:text-left">

                  <h3 className="text-[32px] font-bold text-slate-800 m-0 mb-5">
                    QUOTATION
                  </h3>

                  <table className="w-full border-collapse">
                    <tbody>

                      {[
                        {
                          label: 'Quotation #:',
                          val: quotation.invoiceNumber
                        },

                        {
                          label: 'Date:',
                          val: formatDate(
                            quotation.createdAt
                          )
                        },

                        {
                          label: 'Valid Until:',
                          val: formatDate(
                            quotation.dueDate
                          ),
                          danger: isExpired
                        },

                      ].map(({ label, val, danger }) => (

                        <tr key={label}>

                          <td className="py-1.5 pr-4 text-right text-slate-500 text-sm">
                            {label}
                          </td>

                          <td
                            className={`py-1.5 text-sm ${danger
                                ? 'text-red-600 font-semibold'
                                : 'text-slate-800'
                              }`}
                          >
                            {val}
                          </td>
                        </tr>
                      ))}

                      <tr>

                        <td className="py-1.5 pr-4 text-right text-slate-500 text-sm">
                          Status:
                        </td>

                        <td className="py-1.5">

                          <span
                            className="inline-block px-3 py-1 rounded-2xl text-xs font-bold text-white uppercase"
                            style={{
                              backgroundColor:
                                statusColor[
                                quotation.status
                                ]
                            }}
                          >
                            {quotation.status}
                          </span>

                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bill To */}
              <div className="mb-10">

                <h3 className="text-base font-semibold text-slate-800 mb-4">
                  Bill To:
                </h3>

                <div className="bg-slate-50 p-5 rounded-lg">

                  <p className="text-lg font-bold text-slate-800 mb-2">
                    {quotation.customer.name}
                  </p>

                  {quotation.customer.company && (

                    <p className="flex items-center gap-2 text-sm font-semibold text-[#667eea] mb-1">
                      <Building2 size={14} />
                      {quotation.customer.company}
                    </p>
                  )}

                  {[
                    {
                      icon: <Mail size={14} />,
                      text: quotation.customer.email
                    },

                    {
                      icon: <Phone size={14} />,
                      text: quotation.customer.phone
                    },

                    quotation.customer.address && {
                      icon: <MapPin size={14} />,
                      text: quotation.customer.address
                    },

                    quotation.customer.gst && {
                      icon: <FileText size={14} />,
                      text: `GST: ${quotation.customer.gst}`
                    },

                  ]
                    .filter(Boolean)
                    .map(({ icon, text }) => (

                      <p
                        key={text}
                        className="flex items-center gap-2 text-sm text-slate-600 mb-1 m-0"
                      >
                        {icon}
                        {text}
                      </p>
                    ))}
                </div>
              </div>

              {/* Items Table */}
              <div className="mb-8">

                <table className="w-full border-collapse border border-slate-200">

                  <thead className="bg-slate-50">

                    <tr>

                      {[
                        '#',
                        'Service / Item',
                        'Qty',
                        'Unit Price',
                        'Discount',
                        'Tax',
                        'Amount'
                      ].map((h, i) => (

                        <th
                          key={h}
                          className={`px-3 py-3 text-xs font-semibold text-slate-500 uppercase border-b-2 border-slate-200
                            ${i > 1
                              ? 'text-center'
                              : 'text-left'
                            }
                            ${i === 6
                              ? 'text-right'
                              : ''
                            }`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>

                    {quotation.items.map((item, i) => (

                      <tr
                        key={i}
                        className="border-b border-slate-100"
                      >

                        <td className="px-3 py-4 text-sm">
                          {i + 1}
                        </td>

                        <td className="px-3 py-4">

                          <strong className="block text-sm text-slate-800">
                            {item.serviceName}
                          </strong>

                          {item.description && (

                            <p className="text-xs text-slate-500 m-0 mt-0.5">
                              {item.description}
                            </p>
                          )}
                        </td>

                        <td className="px-3 py-4 text-sm text-center">
                          {item.quantity}
                        </td>

                        <td className="px-3 py-4 text-sm text-right">
                          {formatCurrency(item.unitPrice)}
                        </td>

                        <td className="px-3 py-4 text-sm text-center">
                          {item.discount}%
                        </td>

                        <td className="px-3 py-4 text-sm text-center">
                          {item.tax}%
                        </td>

                        <td className="px-3 py-4 text-sm text-right font-bold">
                          {formatCurrency(item.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="flex justify-end mb-8">

                <div className="w-[350px] bg-slate-50 p-5 rounded-lg">

                  {[
                    {
                      label: 'Subtotal:',
                      val: formatCurrency(
                        quotation.subtotal
                      ),
                      cls: 'text-slate-700'
                    },

                    {
                      label: 'Total Tax:',
                      val: formatCurrency(
                        quotation.gstAmount
                      ),
                      cls: 'text-slate-700'
                    },

                  ].map(({ label, val, cls }) => (

                    <div
                      key={label}
                      className="flex justify-between py-2.5 text-sm"
                    >

                      <span className="text-slate-500">
                        {label}
                      </span>

                      <span className={cls}>
                        {val}
                      </span>
                    </div>
                  ))}

                  <div className="flex justify-between border-t-2 border-slate-200 mt-2 pt-4 text-xl font-bold text-slate-800">

                    <span>Grand Total:</span>

                    <span>
                      {formatCurrency(quotation.total)}
                    </span>

                  </div>
                </div>
              </div>

              {/* Notes & Terms */}
              {(quotation.notes || quotation.terms) && (

                <div className="pt-8 border-t border-slate-200 mb-8">

                  {quotation.notes && (

                    <div className="mb-5">

                      <h4 className="text-sm font-semibold text-slate-500 mb-2">
                        Notes:
                      </h4>

                      <p className="text-[13px] text-slate-500 leading-relaxed m-0">
                        {quotation.notes}
                      </p>
                    </div>
                  )}

                  {quotation.terms && (

                    <div>

                      <h4 className="text-sm font-semibold text-slate-500 mb-2">
                        Terms & Conditions:
                      </h4>

                      <p className="text-[13px] text-slate-500 leading-relaxed m-0 whitespace-pre-line">
                        {quotation.terms}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Footer */}
              <div className="pt-5 border-t border-slate-200 text-[13px] text-slate-500">

                <p className="m-0 mb-1">
                  Created by:
                  <strong>
                    {' '}
                    {quotation.createdBy?.name ||
                      'Admin'}
                  </strong>
                </p>

                {quotation.sentAt && (
                  <p className="m-0 mb-1">
                    Sent on:
                    {' '}
                    {formatDate(
                      quotation.sentAt
                    )}
                  </p>
                )}

                {quotation.acceptedAt && (
                  <p className="m-0 mb-1 text-green-600">
                    Accepted on:
                    {' '}
                    {formatDate(
                      quotation.acceptedAt
                    )}
                  </p>
                )}

                {quotation.rejectedAt && (
                  <p className="m-0 mb-1 text-red-600">
                    Rejected on:
                    {' '}
                    {formatDate(
                      quotation.rejectedAt
                    )}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Status Change */}
          {quotation.status !== 'Accepted' &&
            quotation.status !== 'Rejected' &&
            !isExpired && (

              <div className="mx-5 mb-5 bg-white p-5 rounded-lg border border-slate-200">

                <h4 className="text-base font-semibold text-slate-800 m-0 mb-4">
                  Update Status:
                </h4>

                <div className="flex gap-3 flex-wrap">

                  {quotation.status === 'Draft' && (

                    <button
                      onClick={() =>
                        onStatusChange(
                          quotation._id,
                          'Sent'
                        )
                      }
                      className="flex items-center gap-2 px-5 py-2.5 bg-blue-100 text-blue-800
                        border-none rounded-lg text-sm font-semibold cursor-pointer hover:bg-blue-200 transition-all"
                    >
                      <Send size={18} />
                      Mark as Sent
                    </button>
                  )}

                  {quotation.status === 'Sent' && (
                    <>
                      <button
                        onClick={() =>
                          onStatusChange(
                            quotation._id,
                            'Accepted'
                          )
                        }
                        className="flex items-center gap-2 px-5 py-2.5 bg-green-100 text-green-800
                          border-none rounded-lg text-sm font-semibold cursor-pointer hover:bg-green-200 transition-all"
                      >
                        <CheckCircle size={18} />
                        Mark as Accepted
                      </button>

                      <button
                        onClick={() =>
                          onStatusChange(
                            quotation._id,
                            'Rejected'
                          )
                        }
                        className="flex items-center gap-2 px-5 py-2.5 bg-red-100 text-red-800
                          border-none rounded-lg text-sm font-semibold cursor-pointer hover:bg-red-200 transition-all"
                      >
                        <XCircle size={18} />
                        Mark as Rejected
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-4 border-t border-slate-200 flex-shrink-0">

          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700
              border-none rounded-lg text-sm font-semibold cursor-pointer transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default QuotationViewModal;