/**
 * Navigation config — nguồn duy nhất cho sidebar / topbar / dock / drawer.
 * `icon` là tên Material Symbols cũ, được `Icon` tự map sang Lucide.
 * `match(path)` quyết định trạng thái active (prefix match).
 *
 * Khám phá dùng PublicLayout; công cụ của từng role dùng WorkspaceShell.
 * Student và Admin có mục Khám phá → `/`; Tutor tập trung vào giảng dạy.
 * Hồ sơ công khai của gia sư nằm trong menu tài khoản.
 */

const DISCOVERY_LINKS = [
  { path: '/', label: 'Tìm gia sư', icon: 'person_search', match: (p) => p === '/' || p.startsWith('/tutors') },
  { path: '/services', label: 'Gói học', icon: 'local_library', match: (p) => p.startsWith('/services') },
];

const DISCOVERY_INFO_LINKS = [
  { path: '/become-tutor', label: 'Trở thành gia sư', icon: 'school', match: (p) => p.startsWith('/become-tutor') },
  { path: '/how-it-works', label: 'Cách hoạt động', icon: 'help_outline', match: (p) => p.startsWith('/how-it-works') },
];

export function getDiscoveryNav() {
  return [...DISCOVERY_LINKS, ...DISCOVERY_INFO_LINKS];
}

export function getWorkspaceEntry(role) {
  if (role === 'Admin') return { path: '/admin/dashboard', label: 'Quản trị', shortLabel: 'Quản trị', icon: 'verified_user' };
  if (role === 'Tutor') return { path: '/tutor/dashboard', label: 'Không gian gia sư', shortLabel: 'Gia sư', icon: 'space_dashboard' };
  return { path: '/student/dashboard', label: 'Bàn học của tôi', shortLabel: 'Bàn học', icon: 'space_dashboard' };
}

export const NAV = {
  guest: [
    { path: '/tutors', label: 'Khám phá gia sư', icon: 'explore', match: (p) => p.startsWith('/tutors') },
  ],

  Student: [
    { path: '/student/dashboard', label: 'Bàn học của tôi', icon: 'space_dashboard', match: (p) => p.startsWith('/student/dashboard') || p.startsWith('/student/enrollments/') || p.startsWith('/student/sessions/') },
    { path: '/student/schedule', label: 'Lịch học', icon: 'calendar_month', match: (p) => p.startsWith('/student/schedule') },
    { path: '/student/bookings', label: 'Đơn đặt chỗ', icon: 'receipt_long', match: (p) => p === '/student/bookings' },
    { path: '/student/wallet', label: 'Ví học viên', icon: 'account_balance_wallet', match: (p) => p.startsWith('/student/wallet') },
    { path: '/student/wishlist', label: 'Đã lưu', icon: 'favorite', match: (p) => p.startsWith('/student/wishlist') },
    { path: '/student/disputes', label: 'Khiếu nại', icon: 'shield', match: (p) => p.startsWith('/student/disputes') || p.startsWith('/app/disputes/') },
    { path: '/', label: 'Khám phá gia sư', icon: 'explore', match: () => false },
    { path: '/app/messages', label: 'Tin nhắn', icon: 'chat', match: (p) => p.startsWith('/app/messages') },
    { path: '/app/notifications', label: 'Thông báo', icon: 'notifications', match: (p) => p.startsWith('/app/notifications') },
  ],

  Tutor: [
    // Mỗi mục trỏ một route khác nhau. Trước đây có HAI mục cùng `/tutor/settings`
    // ("Hồ sơ cá nhân" và "Cài đặt") vì chưa tách được trang hồ sơ — người dùng bấm
    // "Hồ sơ cá nhân" lại ra Cài đặt. Nay "Cài đặt" giữ trang thông tin + mật khẩu,
    // còn xem hồ sơ công khai nằm ở menu tài khoản.
    { path: '/tutor/dashboard', label: 'Tổng quan', icon: 'space_dashboard', match: (p) => p === '/tutor/dashboard' },
    { path: '/tutor/schedule', label: 'Lịch dạy', icon: 'calendar_month', match: (p) => p.startsWith('/tutor/schedule') },
    // TODO(mockup): mục "Học viên" — chưa có trang danh sách học viên cho gia sư, bổ sung khi có route.
    { path: '/tutor/services', label: 'Gói học của tôi', icon: 'inventory_2', match: (p) => p.startsWith('/tutor/services') },
    { path: '/app/messages', label: 'Tin nhắn', icon: 'chat', match: (p) => p.startsWith('/app/messages') },
    { path: '/tutor/wallet', label: 'Ví gia sư', icon: 'account_balance_wallet', match: (p) => p.startsWith('/tutor/wallet') },
    { path: '/tutor/application', label: 'Hồ sơ giảng dạy', icon: 'verified_user', match: (p) => p === '/tutor/application' },
    // TODO(mockup): mục "Đánh giá" — chưa có trang đánh giá dành cho gia sư, bổ sung khi có route.
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
    { path: '/app/notifications', label: 'Thông báo', icon: 'notifications', match: (p) => p.startsWith('/app/notifications') },
    { path: '/', label: 'Khám phá gia sư', icon: 'explore', match: () => false },
  ],
};

export function getNavForRole(role, isAuthenticated, applicationStatus) {
  if (!isAuthenticated) return NAV.guest;
  if (role === 'Tutor') return NAV.Tutor
    .filter(item => item.path !== '/tutor/application' || applicationStatus !== 'Approved')
    .map(item => item.path === '/tutor/application' && applicationStatus === 'Rejected' ? { ...item, attention: true } : item);
  return NAV[role] || NAV.guest;
}

export function getDashboardPath(role) {
  return getWorkspaceEntry(role).path;
}

/** Shared ordering for the desktop sidebar and mobile overflow menu. */
export function getWorkspaceNavGroups(role, items) {
  const finances = ['/student/bookings', '/student/wallet', '/student/disputes'];
  const groups = role === 'Student' ? [
    { label: 'Học tập', items: items.filter(item => item.path.startsWith('/student/') && !finances.includes(item.path)) },
    { label: 'Học phí & đơn hàng', items: items.filter(item => finances.includes(item.path)) },
  ] : [
    { label: role === 'Tutor' ? 'Giảng dạy' : 'Quản lý', items: items.filter(item => !item.path.startsWith('/app/') && item.path !== '/') },
  ];
  return [...groups,
    { label: 'Trao đổi', items: items.filter(item => item.path.startsWith('/app/')) },
    { label: 'Khám phá', items: items.filter(item => item.path === '/') },
  ].filter(group => group.items.length > 0);
}

export const ROLE_SUBTITLE = {
  Student: 'Student Learning Hub',
  Tutor: 'Verified Master Tutor',
  Admin: 'Governance Console',
};

export default NAV;
