import api from './api';

export const authService = {
  async login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    if (response.data && response.data.data) {
      const { token, user } = response.data.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user_role', user.role);
      localStorage.setItem('user_name', user.name);
      localStorage.setItem('user_id', user.id);
      localStorage.setItem('warehouse_id', user.warehouse_id);
    }
    return response.data;
  },

  async register(name, email, password, role_id, warehouse_id) {
    const response = await api.post('/auth/register', {
      name,
      email,
      password,
      role_id: Number(role_id),
      warehouse_id: warehouse_id ? Number(warehouse_id) : null,
    });
    return response.data;
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user_role');
      localStorage.removeItem('user_name');
      localStorage.removeItem('user_id');
      localStorage.removeItem('warehouse_id');
      window.location.href = '/';
    }
  },

  getCurrentUser() {
    return {
      token: localStorage.getItem('token'),
      role: localStorage.getItem('user_role'),
      name: localStorage.getItem('user_name'),
      id: localStorage.getItem('user_id') ? Number(localStorage.getItem('user_id')) : null,
      warehouse_id: localStorage.getItem('warehouse_id'),
    };
  },

  isAuthenticated() {
    return !!localStorage.getItem('token');
  }
};
export default authService;
