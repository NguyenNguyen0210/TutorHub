import { create } from 'zustand';
import api from '../services/api.js';
import { getStoredItem, getSavedRememberMe, persistLogin } from './authPersistence.js';

const savedRememberMe = getSavedRememberMe();

const savedUser = JSON.parse(getStoredItem('tutorhub_user') || 'null');
const savedToken = getStoredItem('tutorhub_token') || null;
const savedRefreshToken = getStoredItem('tutorhub_refresh_token') || null;

export const useAuthStore = create((set, get) => ({
  user: savedUser,
  accessToken: savedToken,
  refreshToken: savedRefreshToken,
  rememberMe: savedRememberMe,
  role: savedUser?.role || null,
  isAuthenticated: !!(savedUser && savedToken),

  login: (userData, tokens, rememberMe = true) => {
    persistLogin(userData, tokens, rememberMe);
    set({
      user: userData,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken || get().refreshToken,
      rememberMe,
      role: userData.role,
      isAuthenticated: true,
    });
  },

  logout: async () => {
    const refreshToken = get().refreshToken;
    localStorage.removeItem('tutorhub_user');
    localStorage.removeItem('tutorhub_token');
    localStorage.removeItem('tutorhub_refresh_token');
    sessionStorage.removeItem('tutorhub_user');
    sessionStorage.removeItem('tutorhub_token');
    sessionStorage.removeItem('tutorhub_refresh_token');
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      rememberMe: false,
      role: null,
      isAuthenticated: false,
    });
    try {
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch {
      // Silent error on logout
    }
  },

  // Login via real backend API
  loginWithCredentials: async (email, password, rememberMe = true) => {
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
        avatarUrl: u.avatarUrl || null,
        idProfile: u.idProfile || null,
        tutorProfileId: u.role === 'Tutor' ? (u.idProfile || null) : null,
      };
      get().login(
        mappedUser,
        {
          accessToken: res.accessToken,
          refreshToken: res.refreshToken,
        },
        rememberMe
      );
      return { success: true, user: mappedUser };
    }

    throw new Error('Phản hồi đăng nhập không hợp lệ từ máy chủ.');
  },

  // Login via Google OAuth callback - AuthResponseDto shape == login response
  loginWithExternal: async (authResponse) => {
    const u = authResponse?.user;
    if (!authResponse?.accessToken || !u) {
      throw new Error('Phản hồi đăng nhập không hợp lệ từ máy chủ.');
    }
    const mappedUser = {
      id: u.id,
      name: u.fullName || u.email,
      fullName: u.fullName || u.email,
      email: u.email,
      role: u.role,
      phone: u.phone || null,
      avatarUrl: u.avatarUrl || null,
      idProfile: u.idProfile || null,
      tutorProfileId: u.role === 'Tutor' ? (u.idProfile || null) : null,
    };
    get().login(mappedUser, {
      accessToken: authResponse.accessToken,
      refreshToken: authResponse.refreshToken,
    });
    return { success: true, user: mappedUser };
  },

  // Revalidate session from server on app boot — detect bans, suspensions, role changes.
  revalidateSession: async () => {
    const token = get().accessToken;
    if (!token) return;
    try {
      const serverUser = await api.get('/auth/me');
      if (!serverUser || (!serverUser.userId && !serverUser.id)) {
        get().logout();
        return;
      }
      if (serverUser.status === 'Suspended' || serverUser.status === 'Banned') {
        get().logout();
        return;
      }
      const current = get().user;
      if (current) {
        const updated = {
          ...current,
          role: serverUser.role,
          fullName: serverUser.fullName,
          name: serverUser.fullName,
          avatarUrl: serverUser.avatarUrl ?? current.avatarUrl,
          idProfile: serverUser.idProfile ?? current.idProfile,
          tutorProfileId: serverUser.role === 'Tutor' ? (serverUser.idProfile ?? current.tutorProfileId) : null,
        };
        if (localStorage.getItem('tutorhub_user')) {
          localStorage.setItem('tutorhub_user', JSON.stringify(updated));
        }
        if (sessionStorage.getItem('tutorhub_user')) {
          sessionStorage.setItem('tutorhub_user', JSON.stringify(updated));
        }
        set({ user: updated, role: serverUser.role });
      }
    } catch {
      // Network error or 401 — silent fail, interceptor handles refresh/logout
    }
  },

  // Register via real backend API
  registerWithCredentials: async (email, password, fullName, phone, role = 'Student') => {
    const res = await api.post('/auth/register', { email, password, fullName, phone, role });

    if (res && res.userId) {
      // Registration does not create a session; the user signs in explicitly.
      return res;
    }

    throw new Error('Phản hồi đăng ký không hợp lệ từ máy chủ.');
  },
}));
