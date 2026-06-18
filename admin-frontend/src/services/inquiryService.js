import api from './api';

const inquiryService = {
  // Get all inquiries
  getAll: async () => {
    try {
      const response = await api.get('/inquiries');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get single inquiry
  getById: async (id) => {
    try {
      const response = await api.get(`/inquiries/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Create inquiry
  create: async (data) => {
    try {
      const response = await api.post('/inquiries', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update inquiry
  update: async (id, data) => {
    try {
      const response = await api.put(`/inquiries/${id}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update inquiry status
  updateStatus: async (id, status) => {
    try {
      const response = await api.patch(`/inquiries/${id}/status`, { status });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Delete inquiry
  delete: async (id) => {
    try {
      const response = await api.delete(`/inquiries/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export default inquiryService;