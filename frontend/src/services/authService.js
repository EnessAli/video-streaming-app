/*
  Auth servisi — kayit, giris, cikis ve token islemleri
  Tum auth API cagrilerini tek yerden yonetir
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
      // logout hatasi olsa bile local temizligi yap
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
