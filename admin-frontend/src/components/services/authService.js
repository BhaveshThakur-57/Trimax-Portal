// frontend/src/services/authService.js
// ⭐⭐⭐ YE FILE BANA - YE TOKEN MANAGEMENT KAREGA ⭐⭐⭐

import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

class AuthService {
  // ============================================
  // LOGIN
  // ============================================
  async login(email, password) {
    try {
      console.log('🔐 Logging in:', email);
      
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password
      });

      console.log('✅ Login Response:', response.data);

      if (response.data.success && response.data.token) {
        // Store token
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // ⭐⭐⭐ CRITICAL: Set default header for ALL future requests
        this.setAuthToken(response.data.token);
        
        console.log('💾 Token saved:', response.data.token.substring(0, 20) + '...');
        console.log('👤 User saved:', response.data.user.name);
      }

      return response.data;
    } catch (error) {
      console.error('❌ Login failed:', error.response?.data || error.message);
      throw error.response?.data || { message: error.message };
    }
  }

  // ============================================
  // REGISTER
  // ============================================
  async register(userData) {
    try {
      console.log('📝 Registering:', userData.email);
      
      const response = await axios.post(`${API_URL}/api/auth/register`, userData);

      if (response.data.success && response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        this.setAuthToken(response.data.token);
      }

      return response.data;
    } catch (error) {
      console.error('❌ Registration failed:', error.response?.data || error.message);
      throw error.response?.data || { message: error.message };
    }
  }

  // ============================================
  // LOGOUT
  // ============================================
  logout() {
    console.log('👋 Logging out...');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    console.log('✅ Logged out');
  }

  // ============================================
  // GET TOKEN
  // ============================================
  getToken() {
    return localStorage.getItem('token');
  }

  // ============================================
  // GET STORED USER
  // ============================================
  getStoredUser() {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Error parsing user:', error);
      return null;
    }
  }

  // ============================================
  // ⭐⭐⭐ SET AUTH TOKEN (MOST IMPORTANT)
  // ============================================
  setAuthToken(token) {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      console.log('✅ Authorization header set globally for all requests');
    } else {
      delete axios.defaults.headers.common['Authorization'];
      console.log('❌ Authorization header removed');
    }
  }

  // ============================================
  // INITIALIZE AUTH (Call on app load)
  // ============================================
  initializeAuth() {
    const token = this.getToken();
    if (token) {
      this.setAuthToken(token);
      console.log('🔄 Auth initialized - Token loaded from localStorage');
      return true;
    }
    console.log('⚠️ No token found in localStorage');
    return false;
  }

  // ============================================
  // CHECK IF AUTHENTICATED
  // ============================================
  isAuthenticated() {
    return !!(this.getToken() && this.getStoredUser());
  }

  // ============================================
  // GET USER ROLE
  // ============================================
  getUserRole() {
    const user = this.getStoredUser();
    return user?.role || null;
  }

  // ============================================
  // IS ADMIN
  // ============================================
  isAdmin() {
    return this.getUserRole() === 'admin';
  }
}

const authServiceInstance = new AuthService();
export default authServiceInstance;