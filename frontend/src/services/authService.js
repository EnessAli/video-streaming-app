/*
  Auth service — register, login, logout and token operations
  Manages all auth API calls from a single place
*/
import api from './api';

const authService = {
  async register(username, email, password) {
    const { data } = await api.post('/auth/register', { username, email, password });
    if (data.accessToken) {
      localStorage.setItem('accessToken', data.accessToken);
    }
    return data;
  },

  async login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    if (data.accessToken) {
      localStorage.setItem('accessToken', data.accessToken);
    }
    return data;
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      // clean up locally even if logout request fails
    }
    localStorage.removeItem('accessToken');
  },

  async getMe() {
    const { data } = await api.get('/auth/me');
    return data;
  },

  async refreshToken() {
    const { data } = await api.post('/auth/refresh');
    if (data.accessToken) {
      localStorage.setItem('accessToken', data.accessToken);
    }
    return data;
  }
};

export default authService;
