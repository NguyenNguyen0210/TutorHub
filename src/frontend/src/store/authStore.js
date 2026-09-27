import { create } from 'zustand';
import api from '../services/api';

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
    const refreshToken = get().refreshToken;
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
    try {
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch (err) {
      console.warn('[authStore] Logout API error:', err.message);
    }
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
        // KHÔNG sinh ảnh đại diện từ dịch vụ bên thứ ba. Bản cũ gọi
        // `api.dicebear.com/...?seed=${u.email}` — tức gửi email của người dùng ra
        // máy chủ bên thứ ba ngay mỗi lần đăng nhập, không cần họ bấm đồng ý.
        // `null` thì <Avatar> tự hiện chữ cái đầu.
        avatarUrl: u.avatarUrl || null,
        idProfile: u.idProfile || null,
        tutorProfileId: u.role === 'Tutor' ? (u.idProfile || null) : null,
        absentStrikes: u.absentStrikes ?? 0,
      };
      get().login(mappedUser, {
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
      });
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
      absentStrikes: u.absentStrikes ?? 0,
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
      if (!serverUser || !serverUser.userId) {
        get().logout();
        return;
      }
      if (serverUser.status === 'Suspended' || serverUser.status === 'Banned') {
        get().logout();
        return;
      }
      const current = get().user;
      if (current && (current.role !== serverUser.role || current.fullName !== serverUser.fullName)) {
        const updated = { ...current, role: serverUser.role, fullName: serverUser.fullName, name: serverUser.fullName };
        localStorage.setItem('tutorhub_user', JSON.stringify(updated));
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
      // After successful registration, auto-login
      return await get().loginWithCredentials(email, password);
    }

    throw new Error('Phản hồi đăng ký không hợp lệ từ máy chủ.');
  },
}));