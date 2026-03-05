import axios from 'axios';

// Fallback to Render URL in production if VITE_API_URL isn't set
const API_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.DEV ? '/api' : 'https://ironlog-backend-jrqs.onrender.com/api');

const api = axios.create({ baseURL: API_URL });
// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ironlog_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ironlog_token');
      localStorage.removeItem('ironlog_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
