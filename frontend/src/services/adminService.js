/*
  Admin servisi — kullanici yonetim islemleri
  Sadece admin rolundeki kullanicilar icin
*/
import api from './api';

const adminService = {
  async getAllUsers() {
    const { data } = await api.get('/users');
    return data;
  },

  async updateUserRole(userId, role) {
    const { data } = await api.put(`/users/${userId}/role`, { role });
    return data;
  },

  async deleteUser(userId) {
    const { data } = await api.delete(`/users/${userId}`);
    return data;
  }
};

export default adminService;
