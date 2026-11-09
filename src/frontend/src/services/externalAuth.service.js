import { api } from './api';
import { safeReturnUrl } from '../utils/authRedirect';

export const externalAuthService = {
  async startGoogleLogin(returnUrl) {
    const res = await api.get('/auth/oauth/google/start');
    if (!res?.authorizeUrl || !res?.state) {
      throw new Error('Máy chủ chưa cấu hình đăng nhập Google.');
    }
    const destination = safeReturnUrl(returnUrl);
    // Bind the destination to this OAuth attempt, including across the external redirect.
    if (destination) sessionStorage.setItem(`tutorhub_oauth_return:${res.state}`, destination);
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
