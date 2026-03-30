/*
  Video servisi — video CRUD islemleri ve yukleme
  Upload sirasinda progress callback destegi var
*/
import api from './api';

const videoService = {
  // video yukle — onUploadProgress ile ilerleme takibi
  async upload(formData, onProgress) {
    const { data } = await api.post('/videos/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (event) => {
        if (onProgress && event.total) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      }
    });
    return data;
  },

  // kullanicinin kendi videolari
  async getMyVideos(params = {}) {
    const { data } = await api.get('/videos', { params });
    return data;
  },

  // admin icin tum videolar
  async getAllVideos(params = {}) {
    const { data } = await api.get('/videos/all', { params });
    return data;
  },

  // tek video detay
  async getVideo(id) {
    const { data } = await api.get(`/videos/${id}`);
    return data;
  },

  // video guncelle
  async updateVideo(id, updates) {
    const { data } = await api.put(`/videos/${id}`, updates);
    return data;
  },

  // video sil
  async deleteVideo(id) {
    const { data } = await api.delete(`/videos/${id}`);
    return data;
  },

  // streaming URL olustur
  getStreamUrl(id) {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const token = localStorage.getItem('accessToken');
    return `${API_URL}/api/videos/stream/${id}?token=${token}`;
  }
};

export default videoService;
