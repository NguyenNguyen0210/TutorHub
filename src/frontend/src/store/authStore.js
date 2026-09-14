import { create } from 'zustand';
import api from '../services/api';
import { TEST_ACCOUNTS, USER_ROLES } from '../config/constants';

const savedUser = JSON.parse(localStorage.getItem('tutorhub_user') || 'null');
const savedToken = localStorage.getItem('tutorhub_token') || null;

export const useAuthStore = create((set, get) => ({
  user: savedUser || TEST_ACCOUNTS[1],
  accessToken: savedToken || 'mock-jwt-token-an',
  refreshToken: localStorage.getItem('tutorhub_refresh_token') || 'mock-refresh-token',
  role: savedUser?.role || USER_ROLES.TUTOR,
  isAuthenticated: true,
  testAccounts: TEST_ACCOUNTS,

  login: (userData, tokens) => {
    localStorage.setItem('tutorhub_user', JSON.stringify(userData));
    localStorage.setItem('tutorhub_token', tokens.accessToken);
    if (tokens.refreshToken) {
      localStorage.setItem('tutorhub_refresh_token', tokens.refreshToken);
    }
    set({
      user: userData,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken || get().refreshToken,
      role: userData.role,
      isAuthenticated: true,
    });
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.warn('[authStore] Logout api error:', err.message);
    }
    localStorage.removeItem('tutorhub_user');
    localStorage.removeItem('tutorhub_token');
    localStorage.removeItem('tutorhub_refresh_token');
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      role: null,
      isAuthenticated: false,
    });
  },

  // Đăng nhập kết nối API Backend thực tế, fallback sang mock nếu offline
  loginWithCredentials: async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res && res.data && res.data.accessToken) {
        const u = res.data.user;
        const mappedUser = {
          id: u.id,
          name: u.fullName || u.email,
          fullName: u.fullName || u.email,
          email: u.email,
          role: u.role,
          avatarUrl: u.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.email}`,
        };
        get().login(mappedUser, {
          accessToken: res.data.accessToken,
          refreshToken: res.data.refreshToken,
        });
        return { success: true, user: mappedUser };
      }
    } catch (err) {
      console.warn('[authStore] Real API login failed, fallback to mock user.', err.message);
    }

    // Fallback logic
    const found = TEST_ACCOUNTS.find(a => a.email === email);
    const mockUser = found || {
      id: 'usr-custom-001',
      name: email.split('@')[0],
      fullName: email.split('@')[0],
      email: email,
      role: USER_ROLES.STUDENT,
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user',
    };
    get().login(mockUser, {
      accessToken: 'mock-jwt-' + Date.now(),
      refreshToken: 'mock-refresh-' + Date.now(),
    });
    return { success: true, user: mockUser };
  },

  // Chuyển nhanh giữa 4 tài khoản test kết nối API thật
  switchTestAccount: async (accountIdentifier) => {
    let acc;
    if (typeof accountIdentifier === 'number') {
      acc = TEST_ACCOUNTS[accountIdentifier];
    } else {
      acc = TEST_ACCOUNTS.find(a => a.email === accountIdentifier || a.role === accountIdentifier);
    }
    if (!acc) acc = TEST_ACCOUNTS[0];

    // Gọi API login thật với mật khẩu mặc định Test@123
    return await get().loginWithCredentials(acc.email, 'Test@123');
  },
}));
