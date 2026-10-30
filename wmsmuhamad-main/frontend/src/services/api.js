import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? `${window.location.protocol}//${window.location.hostname}:49978/api`
      : '/api'
  ),
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isUnauthorized = error.response && error.response.status === 401;
    const isDeactivated = error.response && error.response.status === 403 && 
      error.response.data && typeof error.response.data.message === 'string' &&
      error.response.data.message.toLowerCase().includes('deactivated');

    if (isUnauthorized || isDeactivated) {
      console.log('Session terminated. Current path:', window.location.pathname);
      localStorage.removeItem('token');
      localStorage.removeItem('user_role');
      localStorage.removeItem('user_name');
      localStorage.removeItem('warehouse_id');
      if (window.location.pathname !== '/login') {
        console.log('Redirecting to / from path:', window.location.pathname);
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
