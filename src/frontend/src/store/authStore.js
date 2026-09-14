import { create } from 'zustand';
import { TEST_ACCOUNTS, USER_ROLES } from '../config/constants';

// Lấy trạng thái lưu trữ cục bộ nếu có
const savedUser = JSON.parse(localStorage.getItem('tutorhub_user') || 'null');
const savedToken = localStorage.getItem('tutorhub_token') || null;

export const useAuthStore = create((set, get) => ({
  user: savedUser || TEST_ACCOUNTS[1], // Mặc định mở đầu với Gia sư ThS. An để tiện test
  accessToken: savedToken || 'mock-jwt-token-an',
  refreshToken: 'mock-refresh-token',
  role: savedUser?.role || USER_ROLES.TUTOR,
  isAuthenticated: true,
  testAccounts: TEST_ACCOUNTS,

  login: (userData, tokens) => {
    localStorage.setItem('tutorhub_user', JSON.stringify(userData));
    localStorage.setItem('tutorhub_token', tokens.accessToken);
    set({
      user: userData,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      role: userData.role,
      isAuthenticated: true,
    });
  },

  logout: () => {
    localStorage.removeItem('tutorhub_user');
    localStorage.removeItem('tutorhub_token');
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      role: null,
      isAuthenticated: false,
    });
  },

  // Chuyển nhanh giữa 4 tài khoản test từ seedData.sql
  switchTestAccount: (accountIdentifier) => {
    let acc;
    if (typeof accountIdentifier === 'number') {
      acc = TEST_ACCOUNTS[accountIdentifier];
    } else {
      acc = TEST_ACCOUNTS.find(a => a.email === accountIdentifier || a.role === accountIdentifier);
    }
    if (!acc) acc = TEST_ACCOUNTS[0];

    const mockUser = {
      id: acc.profileId,
      name: acc.name,
      fullName: acc.name,
      email: acc.email,
      role: acc.role,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${acc.name}`,
    };
    const mockTokens = {
      accessToken: `mock-token-${acc.role.toLowerCase()}`,
      refreshToken: `mock-refresh-${acc.role.toLowerCase()}`,
    };
    get().login(mockUser, mockTokens);
    return acc;
  },
}));
