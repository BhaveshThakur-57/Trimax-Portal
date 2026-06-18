// admin-frontend/src/services/serviceService.js
import api from './api';

const serviceService = {
  // Get all services - FIXED FUNCTION NAME
  getAllServices: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      
      if (filters.status && filters.status !== 'all') {
        params.append('status', filters.status);
      }
      if (filters.search) {
        params.append('search', filters.search);
      }

      const queryString = params.toString();
      const url = queryString ? `/services?${queryString}` : '/services';
      
      const response = await api.get(url);
      console.log('Services API Response:', response.data); // ⭐ DEBUG LOG
      return response.data;
    } catch (error) {
      console.error('Error fetching services:', error);
      throw error.response?.data || error;
    }
  },

  // Get all services (alias for backward compatibility)
  getAll: async () => {
    try {
      const response = await api.get('/services');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get single service
  getById: async (id) => {
    try {
      const response = await api.get(`/services/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get single service (alias)
  getServiceById: async (id) => {
    try {
      const response = await api.get(`/services/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Create service
  create: async (data) => {
    try {
      const response = await api.post('/services', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Create service (alias)
  createService: async (data) => {
    try {
      const response = await api.post('/services', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update service
  update: async (id, data) => {
    try {
      const response = await api.put(`/services/${id}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update service (alias)
  updateService: async (id, data) => {
    try {
      const response = await api.put(`/services/${id}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Delete service
  delete: async (id) => {
    try {
      const response = await api.delete(`/services/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Delete service (alias)
  deleteService: async (id) => {
    try {
      const response = await api.delete(`/services/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update service status
  updateServiceStatus: async (id, status) => {
    try {
      const response = await api.patch(`/services/${id}/status`, { status });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export default serviceService;