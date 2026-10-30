import axios from 'axios';
import { API_BASE_URL } from '../config/constants.js';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

apiClient.interceptors.request.use((config) => {
  if (typeof config.url === 'string' && config.url.startsWith('/api/v1/')) {
    config.url = config.url.replace(/^\/api\/v1/, '');
  }

  if (typeof window !== 'undefined') {
    const token =
      window.localStorage?.getItem('tutorhub_token') ||
      window.sessionStorage?.getItem('tutorhub_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

export default apiClient;
