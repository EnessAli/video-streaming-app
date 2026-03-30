/*
  Video service — video CRUD operations and upload
  Supports progress callback during upload
*/
import api from './api';

const videoService = {
  // upload video — progress tracking via onUploadProgress
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

  // current user's own videos
  async getMyVideos(params = {}) {
    const { data } = await api.get('/videos', { params });
    return data;
  },

  // all videos for admin
  async getAllVideos(params = {}) {
    const { data } = await api.get('/videos/all', { params });
    return data;
  },

  // single video detail
  async getVideo(id) {
    const { data } = await api.get(`/videos/${id}`);
    return data;
  },

  // update video
  async updateVideo(id, updates) {
    const { data } = await api.put(`/videos/${id}`, updates);
    return data;
  },

  // delete video
  async deleteVideo(id) {
    const { data } = await api.delete(`/videos/${id}`);
    return data;
  },

  // generate streaming URL
  getStreamUrl(id) {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const token = localStorage.getItem('accessToken');
    return `${API_URL}/api/videos/stream/${id}?token=${token}`;
  }
};

export default videoService;
