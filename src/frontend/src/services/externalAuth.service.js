import { api } from './api';

export const externalAuthService = {
  async getProviders() {
    const res = await api.get('/auth/oauth/providers');
    const providers = Array.isArray(res?.providers) ? res.providers : [];
    return { providers, enabled: res?.enabled === true && providers.length > 0 };
  },

  async startGoogleLogin() {
    const res = await api.get('/auth/oauth/google/start');
    if (!res?.authorizeUrl || !res?.state) {
      throw new Error('Máy chủ chưa cấu hình đăng nhập Google.');
    }
    return { authorizeUrl: res.authorizeUrl, state: res.state };
  },

  async completeGoogleCallback(code, state) {
    if (!code || !state) {
      throw new Error('Liên kết đăng nhập thiếu code hoặc state.');
    }
    const res = await api.post('/auth/oauth/google/callback', { code, state });
    if (!res?.accessToken || !res?.user) {
      throw new Error('Phản hồi đăng nhập không hợp lệ từ máy chủ.');
    }
    return res;
  },
};

export default externalAuthService;
