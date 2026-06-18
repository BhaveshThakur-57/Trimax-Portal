// admin-frontend/src/services/quotationService.js
import api from './api';

const quotationService = {

  getAllQuotations: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.status && filters.status !== 'all') params.append('status', filters.status);
      if (filters.search)    params.append('search',    filters.search);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate)   params.append('endDate',   filters.endDate);
      const response = await api.get(`/quotations?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching quotations:', error);
      throw error.response?.data || error;
    }
  },

  getQuotationById: async (id) => {
    try {
      const response = await api.get(`/quotations/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching quotation:', error);
      throw error.response?.data || error;
    }
  },

  createQuotation: async (quotationData) => {
    try {
      const response = await api.post('/quotations', quotationData);
      return response.data;
    } catch (error) {
      console.error('Error creating quotation:', error);
      throw error.response?.data || error;
    }
  },

  updateQuotation: async (id, quotationData) => {
    try {
      const response = await api.put(`/quotations/${id}`, quotationData);
      return response.data;
    } catch (error) {
      console.error('Error updating quotation:', error);
      throw error.response?.data || error;
    }
  },

  deleteQuotation: async (id) => {
    try {
      const response = await api.delete(`/quotations/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting quotation:', error);
      throw error.response?.data || error;
    }
  },

  updateQuotationStatus: async (id, status) => {
    try {
      const response = await api.patch(`/quotations/${id}/status`, { status });
      return response.data;
    } catch (error) {
      console.error('Error updating quotation status:', error);
      throw error.response?.data || error;
    }
  },

  downloadPDF: async (id, quotationNumber) => {
    try {
      const response = await api.get(`/quotations/${id}/pdf`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `quotation-${quotationNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);

      return { success: true, message: 'PDF downloaded successfully' };
    } catch (error) {
      console.error('Error downloading PDF:', error);
      throw error.response?.data || error;
    }
  },

  previewPDF: async (id) => {
    try {
      const response = await api.get(`/quotations/${id}/pdf`, {
        responseType: 'blob'
      });
      return window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
    } catch (error) {
      console.error('Error previewing PDF:', error);
      throw error;
    }
  },

  // ✅ FIXED: Print — API call bilkul nahi, sirf downloaded blob ko print karo
  // Pehle downloadPDF call karo, phir us blob ko print window mein kholo
  printQuotation: async (id) => {
    try {
      const response = await api.get(`/quotations/${id}/pdf`, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url  = window.URL.createObjectURL(blob);

      // ✅ iframe use karo — new window ke bajaye (more reliable)
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = url;
      document.body.appendChild(iframe);

      iframe.onload = () => {
        setTimeout(() => {
          iframe.contentWindow.print();
          // Cleanup after print dialog closes
          setTimeout(() => {
            document.body.removeChild(iframe);
            window.URL.revokeObjectURL(url);
          }, 1000);
        }, 500);
      };

      return { success: true, message: 'Opening print dialog...' };
    } catch (error) {
      console.error('Error printing quotation:', error);
      throw error.response?.data || error;
    }
  },

  sendQuotationEmail: async (id) => {
    try {
      const response = await api.post(`/quotations/${id}/send`);
      return response.data;
    } catch (error) {
      console.error('Error sending quotation:', error);
      throw error.response?.data || error;
    }
  },

  getQuotationStats: async () => {
    try {
      const response = await api.get('/quotations/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching quotation stats:', error);
      throw error.response?.data || error;
    }
  },

  shareQuotation: async (id) => {
    try {
      const shareUrl = `${window.location.origin}/quotations/view/${id}`;
      await navigator.clipboard.writeText(shareUrl);
      return { success: true, message: 'Link copied to clipboard', url: shareUrl };
    } catch (error) {
      console.error('Error sharing quotation:', error);
      throw error;
    }
  },
};

export default quotationService;