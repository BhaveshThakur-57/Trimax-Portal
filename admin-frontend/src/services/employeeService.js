import api from './api';

const employeeService = {
  // Get all employees
  getAll: async () => {
    try {
      const response = await api.get('/employees');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get single employee
  getById: async (id) => {
    try {
      const response = await api.get(`/employees/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Create employee
  create: async (data) => {
    try {
      const response = await api.post('/employees', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update employee
  update: async (id, data) => {
    try {
      const response = await api.put(`/employees/${id}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Delete employee
  delete: async (id) => {
    try {
      const response = await api.delete(`/employees/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export default employeeService;