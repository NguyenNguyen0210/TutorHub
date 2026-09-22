/**
 * Navigation config — nguồn duy nhất cho sidebar / topbar / dock / drawer.
 * `icon` là tên Material Symbols cũ, được `Icon` tự map sang Lucide.
 * `match(path)` quyết định trạng thái active (prefix match).
 */

export const NAV = {
  guest: [
    { path: '/tutors', label: 'Khám phá gia sư', icon: 'explore', match: (p) => p.startsWith('/tutors') },
  ],

  Student: [
    { path: '/student/dashboard', label: 'Bàn học của tôi', icon: 'space_dashboard', match: (p) => p.startsWith('/student/dashboard') },
    { path: '/student/wallet', label: 'Ví học viên', icon: 'account_balance_wallet', match: (p) => p.startsWith('/student/wallet') },
    { path: '/tutors', label: 'Khám phá gia sư', icon: 'explore', match: (p) => p.startsWith('/tutors') },
    { path: '/app/messages', label: 'Hộp thư & Hợp đồng', icon: 'chat', match: (p) => p.startsWith('/app/messages') },
    { path: '/app/notifications', label: 'Thông báo', icon: 'notifications', match: (p) => p.startsWith('/app/notifications') },
  ],

  Tutor: [
    { path: '/tutor/dashboard', label: 'Bảng điều hành', icon: 'space_dashboard', match: (p) => p === '/tutor/dashboard' },
    { path: '/tutor/services', label: 'Gói dịch vụ', icon: 'inventory_2', match: (p) => p.startsWith('/tutor/services') },
    { path: '/tutor/availability', label: 'Thời khóa biểu', icon: 'calendar_month', match: (p) => p.startsWith('/tutor/availability') },
    { path: '/tutor/wallet', label: 'Ví Escrow', icon: 'account_balance_wallet', match: (p) => p.startsWith('/tutor/wallet') },
    { path: '/app/messages', label: 'Tin nhắn', icon: 'chat', match: (p) => p.startsWith('/app/messages') },
    { path: '/app/notifications', label: 'Thông báo', icon: 'notifications', match: (p) => p.startsWith('/app/notifications') },
  ],

  Admin: [
    { path: '/admin/dashboard', label: 'Tổng quan sàn', icon: 'space_dashboard', match: (p) => p === '/admin/dashboard' },
    { path: '/admin/student-wallets', label: 'Ví học viên', icon: 'account_balance_wallet', match: (p) => p.startsWith('/admin/student-wallets') },
    { path: '/admin/withdrawals', label: 'Lệnh rút tiền', icon: 'payments', match: (p) => p.startsWith('/admin/withdrawals') },
    { path: '/admin/tutor-applications', label: 'Duyệt gia sư', icon: 'verified_user', match: (p) => p.startsWith('/admin/tutor-applications') },
    { path: '/admin/disputes', label: 'Tranh chấp', icon: 'gavel', match: (p) => p.startsWith('/admin/disputes') },
    { path: '/admin/users', label: 'Người dùng', icon: 'group', match: (p) => p.startsWith('/admin/users') },
    { path: '/admin/audit-logs', label: 'Sổ kiểm toán', icon: 'history', match: (p) => p.startsWith('/admin/audit-logs') },
  ],
};

export function getNavForRole(role, isAuthenticated) {
  if (!isAuthenticated) return NAV.guest;
  return NAV[role] || NAV.guest;
}

export function getDashboardPath(role) {
  if (role === 'Admin') return '/admin/dashboard';
  if (role === 'Tutor') return '/tutor/dashboard';
  return '/student/dashboard';
}

export const ROLE_SUBTITLE = {
  Student: 'Student Learning Hub',
  Tutor: 'Verified Master Tutor',
  Admin: 'Governance Console',
};

export default NAV;
