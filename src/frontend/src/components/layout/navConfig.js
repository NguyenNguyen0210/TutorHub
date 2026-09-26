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
    // Trang công khai: mở tab mới để không mất sidebar (xem ghi chú `external` ở Tutor).
    { path: '/tutors', label: 'Khám phá gia sư', icon: 'explore', match: () => false, external: true },
    { path: '/app/messages', label: 'Hộp thư & Hợp đồng', icon: 'chat', match: (p) => p.startsWith('/app/messages') },
    { path: '/app/notifications', label: 'Thông báo', icon: 'notifications', match: (p) => p.startsWith('/app/notifications') },
  ],

  Tutor: [
    // Mỗi mục trỏ một route khác nhau. Trước đây có HAI mục cùng `/tutor/settings`
    // ("Hồ sơ cá nhân" và "Cài đặt") vì chưa tách được trang hồ sơ — người dùng bấm
    // "Hồ sơ cá nhân" lại ra Cài đặt. Nay "Hồ sơ công khai" trỏ tới trang hồ sơ
    // thật của gia sư (`/tutors/{idProfile}`), "Cài đặt" giữ trang thông tin + mật khẩu.
    { path: '/tutor/dashboard', label: 'Tổng quan', icon: 'space_dashboard', match: (p) => p === '/tutor/dashboard' },
    { path: '/tutor/schedule', label: 'Lịch dạy', icon: 'calendar_month', match: (p) => p.startsWith('/tutor/schedule') },
    // TODO(mockup): mục "Học viên" — chưa có trang danh sách học viên cho gia sư, bổ sung khi có route.
    { path: '/tutor/services', label: 'Dịch vụ của tôi', icon: 'inventory_2', match: (p) => p.startsWith('/tutor/services') },
    // Sàn công khai: gia sư cũng cần vào được trang dịch vụ để xem gói học của
    // người khác. Đường dẫn này nằm ngoài `PublicLayout`? — không, nó thuộc
    // PublicLayout nên chạy khung công khai; `external` báo cho shell mở tab mới để
    // không mất sidebar đang mở. Học viên có mục "Khám phá gia sư" tương ứng.
    { path: '/services', label: 'Sàn dịch vụ', icon: 'explore', match: () => false, external: true },
    { path: '/app/messages', label: 'Hộp thư', icon: 'chat', match: (p) => p.startsWith('/app/messages') },
    // Hồ sơ công khai: id lấy từ `authStore.user.idProfile` (UserDto.IdProfile =
    // TutorProfile.Id) nên không cần gọi API thêm. Chưa có hồ sơ (đang chờ duyệt)
    // thì rơi về trang hồ sơ xét duyệt. Đây là trang *công khai* nên mở tab mới —
    // xem hồ sơ của chính mình là hành động xem trước, không phải điều hướng
    // trong sàn, nên không nên làm mất sidebar.
    {
      path: (ctx) => (ctx?.profileId ? `/tutors/${ctx.profileId}` : '/tutor/application'),
      label: 'Hồ sơ công khai',
      icon: 'person',
      match: () => false,
      external: true,
    },
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

/**
 * `path` có thể là chuỗi hoặc hàm nhận `{ profileId }` — dùng cho các mục cần id
 * hồ sơ của chính người dùng (hồ sơ công khai của gia sư). Hàm được resolve ở
 * đây để sidebar, dock và drawer luôn thấy cùng một `path` đã resolve.
 */
function resolveItems(items, ctx) {
  return items.map((item) => ({
    ...item,
    path: typeof item.path === 'function' ? item.path(ctx) : item.path,
  }));
}

export function getNavForRole(role, isAuthenticated, profileId) {
  const list = !isAuthenticated ? NAV.guest : NAV[role] || NAV.guest;
  return resolveItems(list, { profileId });
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
