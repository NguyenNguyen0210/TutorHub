import { api } from './api';
import { API_BASE_URL } from '@/config/constants';

export const mediaService = {
  async uploadAvatar(file) {
    const body = new FormData();
    body.append('file', file);
    body.append('mediaType', 'Avatar');
    const media = await api.post('/media/upload', body, { headers: { 'Content-Type': 'multipart/form-data' } });
    if (!media?.id) throw new Error('Chưa thể tải ảnh đại diện.');
    return new URL(`${API_BASE_URL.replace(/\/$/, '')}/media/${media.id}/avatar`, window.location.origin).href;
  },
  async uploadCertificate(file) {
    const body = new FormData();
    body.append('file', file);
    body.append('mediaType', 'Certificate');
    return api.post('/media/upload', body, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  async getDownloadUrl(id) {
    return api.get(`/media/${id}/download-url`);
  },
};
