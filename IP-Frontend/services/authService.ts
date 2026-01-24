import api from './api';

export const loginAdmin = async (credentials: { email: string; password: string }) => {
  // Matches your Backend: POST /api/auth/login
  const response = await api.post('/auth/login', credentials);
  
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('adminEmail', response.data.email);
  }
  return response.data;
};

export const logoutAdmin = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('adminEmail');
  window.location.href = '/';
};

export const isAuthenticated = () => !!localStorage.getItem('token');