import { createPortal } from 'react-dom';
import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2 } from 'lucide-react';
import Button from '../common/Button';
// ✅ ServiceModal.css REMOVED

const ServiceModal = ({ service, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: '', description: '', price: '', features: [''], status: 'Active'
  });

  useEffect(() => {
    if (service) {
      setFormData({
        ...service,
        features: service.features && service.features.length > 0 ? service.features : ['']
      });
    }
  }, [service]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleFeatureChange = (index, value) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData({ ...formData, features: newFeatures });
  };

  const addFeature = () => setFormData({ ...formData, features: [...formData.features, ''] });

  const removeFeature = (index) => {
    const newFeatures = formData.features.filter((_, i) => i !== index);
    setFormData({ ...formData, features: newFeatures.length > 0 ? newFeatures : [''] });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...formData, features: formData.features.filter(f => f.trim() !== '') });
  };

  const inputClass = "w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 bg-white transition-all focus:outline-none focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 placeholder:text-slate-400 font-[inherit]";

  return createPortal((
    <div onClick={onClose}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] backdrop-blur-[4px] p-5">
      <div onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl w-[90%] max-w-[700px] max-h-[90vh] overflow-hidden
          flex flex-col shadow-[0_20px_25px_rgba(0,0,0,0.1)]
          animate-[modalSlideIn_0.3s_ease-out]">

        {/* Header */}
        <div className="flex justify-between items-center px-8 py-7
          bg-gradient-to-r from-[#667eea] to-[#764ba2] flex-shrink-0">
          <h2 className="text-[26px] font-semibold text-white m-0">
            {service ? 'Edit Service' : 'Add New Service'}
          </h2>
          <button onClick={onClose}
            className="bg-white/20 border-none cursor-pointer p-2 w-9 h-9 rounded-lg text-white
              flex items-center justify-center transition-all hover:rotate-90">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6 overflow-y-auto flex-1">

          <div className="mb-5">
            <label className="block mb-2 text-sm font-medium text-slate-600">
              Service Name <span className="text-red-500">*</span>
            </label>
            <input type="text" name="name" value={formData.name} onChange={handleChange}
              placeholder="Web Development" className={inputClass} required />
          </div>

          <div className="mb-5">
            <label className="block mb-2 text-sm font-medium text-slate-600">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea name="description" value={formData.description} onChange={handleChange}
              placeholder="Describe your service..." rows="3"
              className={`${inputClass} resize-y min-h-[80px]`} required />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-5 max-md:grid-cols-1">
            <div>
              <label className="block mb-2 text-sm font-medium text-slate-600">
                Price <span className="text-red-500">*</span>
              </label>
              <input type="text" name="price" value={formData.price} onChange={handleChange}
                placeholder="$5,000" className={inputClass} required />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-slate-600">
                Status <span className="text-red-500">*</span>
              </label>
              <select name="status" value={formData.status} onChange={handleChange}
                className={inputClass} required>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Draft">Draft</option>
              </select>
            </div>
          </div>

          <div className="mb-5">
            <label className="block mb-2 text-sm font-medium text-slate-600">Features/Technologies</label>
            <div className="flex flex-col gap-2.5 mb-3">
              {formData.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input type="text" value={feature} onChange={(e) => handleFeatureChange(index, e.target.value)}
                    placeholder="e.g., React, Node.js" className={`${inputClass} flex-1`} />
                  {formData.features.length > 1 && (
                    <button type="button" onClick={() => removeFeature(index)}
                      className="bg-none border-none cursor-pointer text-red-500 p-1.5 rounded-md
                        flex items-center justify-center transition-all hover:bg-red-50 hover:text-red-700">
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button type="button" onClick={addFeature}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-white text-slate-600
                border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50
                hover:border-slate-300 transition-all font-medium">
              <Plus size={16} /> Add Feature
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-5 border-t border-slate-200 flex-shrink-0
          max-md:flex-col">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="button" variant="primary" icon={<Save size={18} />} onClick={handleSubmit}>
            {service ? 'Update Service' : 'Add Service'}
          </Button>
        </div>
      </div>
    </div>
  ), document.body);
};

export default ServiceModal;