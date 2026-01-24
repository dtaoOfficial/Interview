import axios from 'axios';

// ✅ LOAD URL FROM ENV (Falls back to '/api' if not set)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL, 
  headers: {
    'Content-Type': 'application/json',
  },
});

// ✅ Request Interceptor: Add Token (SILENT MODE)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    // 🔒 Security: No console logs here
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // Return error silently
    return Promise.reject(error);
  }
);

// ✅ Response Interceptor: Handle Data & Errors (SILENT MODE)
api.interceptors.response.use(
  (response) => {
    // 🔒 Security: No console logs here
    return response;
  },
  (error) => {
    // Check if the error is 403 (Forbidden) or 401 (Unauthorized)
    if (error.response && (error.response.status === 403 || error.response.status === 401)) {
      
      // 1. Remove the bad token/data silently
      localStorage.removeItem('token');
      localStorage.removeItem('adminEmail');
      
      // 2. Force redirect to login page (if not already there)
      if (window.location.pathname !== '/login') {
          window.location.href = '/login';
      }
    } 
    
    // Reject promise without logging critical details to console
    return Promise.reject(error);
  }
);

export default api;