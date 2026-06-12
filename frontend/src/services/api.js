import axios from 'axios';

const api = axios.create({
  // baseURL: 'https://communityconnect-backend-biqt.onrender.com' || 'http://127.0.0.1:8000/api',
  // baseURL: 'https://communityconnect-backend-biqt.onrender.com',
  // baseURL: import.meta.env.VITE_API_URL, 
  baseURL: import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000/api',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cc_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
