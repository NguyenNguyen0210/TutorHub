import { create } from 'zustand';
import api from '../services/api';
import { USER_ROLES } from '../config/constants';

const savedUser = JSON.parse(localStorage.getItem('tutorhub_user') || 'null');
const savedToken = localStorage.getItem('tutorhub_token') || null;
const savedRefreshToken = localStorage.getItem('tutorhub_refresh_token') || null;

export const useAuthStore = create((set, get) => ({
  user: savedUser,
  accessToken: savedToken,
  refreshToken: savedRefreshToken,
  role: savedUser?.role || null,
  isAuthenticated: !!(savedUser && savedToken),

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
      const refreshToken = get().refreshToken;
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch (err) {
      console.warn('[authStore] Logout API error:', err.message);
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

  // Login via real backend API - no mock fallback
  loginWithCredentials: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });

    if (res && res.accessToken) {
      const u = res.user;
      const mappedUser = {
        id: u.id,
        name: u.fullName || u.email,
        fullName: u.fullName || u.email,
        email: u.email,
        role: u.role,
        phone: u.phone || null,
        avatarUrl: u.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.email}`,
      };
      get().login(mappedUser, {
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
      });
      return { success: true, user: mappedUser };
    }

    throw new Error('Phản hồi đăng nhập không hợp lệ từ máy chủ.');
  },

  // Register via real backend API
  registerWithCredentials: async (email, password, fullName, phone, role = 'Student') => {
    const res = await api.post('/auth/register', { email, password, fullName, phone, role });

    if (res && res.userId) {
      // After successful registration, auto-login
      return await get().loginWithCredentials(email, password);
    }

    throw new Error('Phản hồi đăng ký không hợp lệ từ máy chủ.');
  },
}));