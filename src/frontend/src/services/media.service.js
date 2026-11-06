import { api } from './api';
import { API_BASE_URL } from '@/config/constants';

// Demo videos are up to 100 MB, so the default 15s request timeout would abort
// a normal upload on a mobile connection.
const DEMO_VIDEO_UPLOAD_TIMEOUT_MS = 10 * 60 * 1000;

export const mediaService = {
  async uploadServiceCover(file) {
    const body = new FormData();
    body.append('file', file);
    body.append('mediaType', 'ServiceCover');
    const media = await api.post('/media/upload', body, { headers: { 'Content-Type': 'multipart/form-data' } });
    if (!media?.id) throw new Error('Chưa thể tải ảnh bìa.');
    return new URL(`${API_BASE_URL.replace(/\/$/, '')}/media/${media.id}/cover`, window.location.origin).href;
  },

  /**
   * Upload the MP4 demo video and return the stable playback URL.
   * `onProgress(percent)` fires while the browser streams the file.
   */
  async uploadServiceDemoVideo(file, onProgress) {
    const body = new FormData();
    body.append('file', file);
    body.append('mediaType', 'ServiceDemoVideo');
    const media = await api.post('/media/upload', body, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: DEMO_VIDEO_UPLOAD_TIMEOUT_MS,
      onUploadProgress: (event) => {
        if (typeof onProgress !== 'function') return;
        const total = event.total || file?.size || 0;
        onProgress(total ? Math.min(100, Math.round((event.loaded * 100) / total)) : 0);
      },
    });
    if (!media?.id) throw new Error('Chưa thể tải video demo.');
    return new URL(`${API_BASE_URL.replace(/\/$/, '')}/media/${media.id}/demo-video`, window.location.origin).href;
  },
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
