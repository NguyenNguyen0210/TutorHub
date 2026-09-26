/**
 * Navigation config — nguồn duy nhất cho sidebar / topbar / dock / drawer.
 * `icon` là tên Material Symbols cũ, được `Icon` tự map sang Lucide.
 * `match(path)` quyết định trạng thái active (prefix match).
 *
 * `external: true` = trang nằm ngoài khung sàn (PublicLayout). Điều hướng trong
 * tab sẽ thay sidebar bằng topbar công khai, nên các mục này mở tab mới và luôn
 * `match: () => false` — sidebar không tồn tại ở trang public nên không thể hiện
 * trạng thái active, để sáng luôn sẽ gây hiểu nhầm.
 *
 * Toàn bộ phần public gộp thành MỘT mục "Khám phá" → `/` (trang chủ sàn, từ đó
 * đi tới danh sách gia sư và sàn dịch vụ). Hồ sơ công khai của gia sư không
 * chiếm chỗ ở sidebar — nó nằm trong menu tài khoản.
 */

export const NAV = {
  guest: [
    { path: '/tutors', label: 'Khám phá gia sư', icon: 'explore', match: (p) => p.startsWith('/tutors') },
  ],

  Student: [
    { path: '/student/dashboard', label: 'Bàn học của tôi', icon: 'space_dashboard', match: (p) => p.startsWith('/student/dashboard') },
    { path: '/student/wallet', label: 'Ví học viên', icon: 'account_balance_wallet', match: (p) => p.startsWith('/student/wallet') },
    { path: '/', label: 'Khám phá', icon: 'explore', match: () => false, external: true },
    { path: '/app/messages', label: 'Hộp thư & Hợp đồng', icon: 'chat', match: (p) => p.startsWith('/app/messages') },
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
    { path: '/tutor/services', label: 'Dịch vụ của tôi', icon: 'inventory_2', match: (p) => p.startsWith('/tutor/services') },
    { path: '/', label: 'Khám phá', icon: 'explore', match: () => false, external: true },
    { path: '/app/messages', label: 'Hộp thư', icon: 'chat', match: (p) => p.startsWith('/app/messages') },
    { path: '/tutor/wallet', label: 'Ví & Thanh toán', icon: 'account_balance_wallet', match: (p) => p.startsWith('/tutor/wallet') },
    // TODO(mockup): mục "Đánh giá" — chưa có trang đánh giá dành cho gia sư, bổ sung khi có route.
    { path: '/tutor/settings', label: 'Cài đặt', icon: 'settings', match: (p) => p.startsWith('/tutor/settings') },
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
