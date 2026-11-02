import { api } from './api';

export const mediaService = {
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
