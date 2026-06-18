import { createPortal } from 'react-dom';
import React, { useState, useEffect, useCallback } from 'react';
import { X, Plus, Trash2, Save, AlertCircle } from 'lucide-react';

import quotationService from '../../services/quotationService';
import serviceService from '../../services/serviceService';

const DEFAULT_TERMS =
  'Payment terms: 50% advance, 50% on completion.\nDelivery timeline as per project scope.\nPrices are exclusive of applicable taxes.';

const inp = (err) =>
  `w-full border rounded-2xl px-3.5 py-2.5 text-sm text-slate-700 bg-white outline-none transition-all
  focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 placeholder:text-slate-400
  ${err ? 'border-red-400 bg-red-50' : 'border-slate-200'}`;

const labelCls =
  'block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5';

const formatCurrency = (amt) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(amt || 0);

const SignaturePad = ({ signature, onChange }) => {
  const canvasRef = React.useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    if (signature && canvasRef.current && !isDrawing) {
      const ctx = canvasRef.current.getContext('2d');
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = signature;
    }
  }, [signature, isDrawing]);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    if (e.touches && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    e.preventDefault();
    if (!isDrawing) return;
    const { x, y } = getCoordinates(e);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      onChange(canvasRef.current.toDataURL());
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onChange('');
  };

  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden relative bg-slate-50 w-full h-[120px]">
      <canvas 
        ref={canvasRef} 
        width={400} 
        height={120} 
        className="w-full h-full cursor-crosshair touch-none"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
      <button 
        type="button"
        onClick={clear}
        className="absolute top-2 right-2 text-[10px] uppercase font-bold bg-white border border-slate-200 px-2 py-1 rounded text-slate-500 hover:bg-slate-100"
      >
        Clear
      </button>
    </div>
  );
};

const QuotationModal = ({ quotation, onClose, onSave }) => {

  const [loading, setLoading] = useState(false);


  const [services, setServices] = useState([]);

  const [errors, setErrors] = useState({});

  const [apiError, setApiError] = useState('');

  const [formData, setFormData] = useState({
    customer: {
      name: '',
      email: '',
      phone: '',
      company: '',
      address: '',
      gst: '',
    },

    items: [
      {
        service: '',
        serviceName: '',
        description: '',
        quantity: 1,
        unitPrice: 0,
        discount: 0,
        tax: 18,
        amount: 0,
      },
    ],

    dueDate: '',

    notes: '',

    terms: DEFAULT_TERMS,
    
    template: 'Modern',
    
    signature: ''
  });

  const [totals, setTotals] = useState({
    subtotal: 0,
    totalDiscount: 0,
    totalTax: 0,
    grandTotal: 0,
  });

  const calculateTotals = useCallback((items) => {

    let subtotal = 0;

    let totalDiscount = 0;

    let totalTax = 0;

    items.forEach((item) => {

      const sub = item.quantity * item.unitPrice;

      const disc = (sub * item.discount) / 100;

      const tax = ((sub - disc) * item.tax) / 100;

      subtotal += sub;

      totalDiscount += disc;

      totalTax += tax;
    });

    setTotals({
      subtotal,
      totalDiscount,
      totalTax,
      grandTotal: subtotal - totalDiscount + totalTax,
    });

  }, []);

  useEffect(() => {

    fetchServices();

    if (quotation) {

      const newData = {
        customer: quotation.customer || {},

        items: quotation.items?.map((item) => ({
          service: item.service?._id || item.service || '',

          serviceName: item.serviceName || '',

          description: item.description || '',

          quantity: item.quantity || 1,

          unitPrice: item.unitPrice || 0,

          discount: item.discount || 0,

          tax: item.tax || 18,

          amount: item.amount || 0,
        })) || [],

        dueDate: quotation.dueDate
          ? new Date(quotation.dueDate)
              .toISOString()
              .split('T')[0]
          : '',

        notes: quotation.notes || '',

        terms: quotation.terms || DEFAULT_TERMS,
        
        template: quotation.template || 'Modern',
        
        signature: quotation.signature || '',
      };

      setFormData(newData);

      calculateTotals(newData.items);

    } else {

      const d = new Date();

      d.setDate(d.getDate() + 30);

      setFormData((prev) => ({
        ...prev,
        dueDate: d.toISOString().split('T')[0],
      }));
    }

  }, [quotation, calculateTotals]);

  useEffect(() => {

    calculateTotals(formData.items);

  }, [formData.items, calculateTotals]);

  const fetchServices = async () => {

    try {

      const r = await serviceService.getAllServices();

      setServices(r.data || []);

    } catch {

      setApiError('Failed to load services.');
    }
  };

  const handleCustomerChange = (field, value) => {

    setFormData((prev) => ({
      ...prev,
      customer: {
        ...prev.customer,
        [field]: value,
      },
    }));
  };

  const handleItemChange = (index, field, value) => {

    setFormData((prev) => {

      const newItems = [...prev.items];

      newItems[index] = {
        ...newItems[index],
        [field]: value,
      };

      if (field === 'service') {

        const sel = services.find((s) => s._id === value);

        if (sel) {

          newItems[index].serviceName = sel.name;

          newItems[index].description = sel.description;

          newItems[index].unitPrice = sel.price || 0;
        }
      }

      const item = newItems[index];

      const sub = item.quantity * item.unitPrice;

      const disc = (sub * item.discount) / 100;

      const tax = ((sub - disc) * item.tax) / 100;

      newItems[index].amount = sub - disc + tax;

      return {
        ...prev,
        items: newItems,
      };
    });
  };


  const addItem = () => {

    setFormData((prev) => ({
      ...prev,

      items: [
        ...prev.items,
        {
          service: '',
          serviceName: '',
          description: '',
          quantity: 1,
          unitPrice: 0,
          discount: 0,
          tax: 18,
          amount: 0,
        },
      ],
    }));
  };

  const removeItem = (index) => {

    if (formData.items.length === 1) return;

    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const validateForm = () => {

    const e = {};

    if (!formData.customer.name?.trim()) {
      e['customer.name'] = 'Required';
    }

    if (!formData.customer.email?.trim()) {
      e['customer.email'] = 'Required';
    }

    if (!formData.customer.phone?.trim()) {
      e['customer.phone'] = 'Required';
    }

    if (!formData.dueDate) {
      e.dueDate = 'Required';
    }

    setErrors(e);

    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {

    if (ev?.preventDefault) {
      ev.preventDefault();
    }

    setApiError('');

    if (!validateForm()) return;

    setLoading(true);

    try {

      const payload = {
        ...formData,

        subtotal: totals.subtotal,

        gstAmount: totals.totalTax,

        total: totals.grandTotal,

        totalDue: totals.grandTotal,
      };

      if (quotation) {

        await quotationService.updateQuotation(
          quotation._id,
          payload
        );

      } else {

        await quotationService.createQuotation(payload);
      }

      onSave();

    } catch (error) {

      console.error(error);

      setApiError(
        error.message || 'Failed to save quotation.'
      );

    } finally {

      setLoading(false);
    }
  };

  return createPortal((
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[1000] p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl w-full max-w-[900px] max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
      >

        {/* Header */}
        <div className="relative flex-shrink-0 bg-gradient-to-r from-brand-600 to-blue-600 rounded-t-2xl px-5 py-4 overflow-hidden">
          <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10 blur-xl pointer-events-none" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-white/25 border border-white/40 flex items-center justify-center text-white font-extrabold text-lg leading-none">
                {quotation ? '✏' : '+'}
              </span>
              <div>
                <h2 className="text-white font-extrabold text-[16px] leading-tight font-display">
                  {quotation ? 'Edit Quotation' : 'Create New Quotation'}
                </h2>
                <p className="text-white/70 text-[12px] mt-0.5">
                  Fill in customer and service details
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

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-6"
        >

          {apiError && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-2xl p-3 text-sm">
              <AlertCircle size={16} />
              {apiError}
            </div>
          )}

          {/* Customer Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div>
              <label className={labelCls}>Customer Name *</label>

              <input
                type="text"
                value={formData.customer.name}
                onChange={(e) =>
                  handleCustomerChange('name', e.target.value)
                }
                className={inp(errors['customer.name'])}
              />
            </div>

            <div>
              <label className={labelCls}>Email *</label>

              <input
                type="email"
                value={formData.customer.email}
                onChange={(e) =>
                  handleCustomerChange('email', e.target.value)
                }
                className={inp(errors['customer.email'])}
              />
            </div>

            <div>
              <label className={labelCls}>Phone *</label>

              <input
                type="text"
                value={formData.customer.phone}
                onChange={(e) =>
                  handleCustomerChange('phone', e.target.value)
                }
                className={inp(errors['customer.phone'])}
              />
            </div>

            <div>
              <label className={labelCls}>Due Date *</label>

              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    dueDate: e.target.value,
                  }))
                }
                className={inp(errors.dueDate)}
              />
            </div>
          </div>

          {/* Items */}
          <div className="space-y-4">

            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-700">
                Services
              </h3>

              <div className="flex gap-2">
                
                <button
                  type="button"
                  onClick={addItem}
                  className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-brand-100 text-brand-700 text-sm font-medium"
                >
                  <Plus size={14} />
                  Add Item
                </button>
              </div>
            </div>

            {formData.items.map((item, index) => (

              <div
                key={index}
                className="border border-slate-200 rounded-2xl p-4 space-y-4"
              >

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  <div>
                    <label className={labelCls}>Service</label>

                    <select
                      value={item.service}
                      onChange={(e) =>
                        handleItemChange(
                          index,
                          'service',
                          e.target.value
                        )
                      }
                      className={inp()}
                    >
                      <option value="">{item.serviceName ? `Custom: ${item.serviceName}` : 'Select Service'}</option>

                      {services.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={labelCls}>Quantity</label>

                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        handleItemChange(
                          index,
                          'quantity',
                          Number(e.target.value)
                        )
                      }
                      className={inp()}
                    />
                  </div>

                  <div>
                    <label className={labelCls}>Unit Price</label>

                    <input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) =>
                        handleItemChange(
                          index,
                          'unitPrice',
                          Number(e.target.value)
                        )
                      }
                      className={inp()}
                    />
                  </div>

                  <div>
                    <label className={labelCls}>Amount</label>

                    <input
                      type="text"
                      value={formatCurrency(item.amount)}
                      disabled
                      className={inp()}
                    />
                  </div>
                </div>

                {formData.items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="flex items-center gap-2 text-red-600 text-sm"
                  >
                    <Trash2 size={14} />
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">

            <div className="flex justify-between text-sm mb-2">
              <span>Subtotal</span>
              <span>{formatCurrency(totals.subtotal)}</span>
            </div>

            <div className="flex justify-between text-sm mb-2">
              <span>Tax</span>
              <span>{formatCurrency(totals.totalTax)}</span>
            </div>

            <div className="flex justify-between font-bold text-lg border-t pt-3">
              <span>Total</span>
              <span>{formatCurrency(totals.grandTotal)}</span>
            </div>
          </div>

          {/* Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div>
                <label className={labelCls}>Notes</label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  className={inp()}
                />
              </div>
            </div>
            
            <div>
              <label className={labelCls}>Digital Signature</label>
              <SignaturePad 
                signature={formData.signature}
                onChange={(sig) => setFormData(p => ({ ...p, signature: sig }))}
              />
              <p className="text-[11px] text-slate-400 mt-2">Draw your signature here. It will be embedded in the generated PDF.</p>
            </div>
          </div>

        </form>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl btn-primary"
          >
            <Save size={15} />
            {loading ? 'Saving...' : quotation ? 'Update Quotation' : 'Create Quotation'}
          </button>
        </div>
      </div>
    </div>
  ), document.body);
};

export default QuotationModal;
