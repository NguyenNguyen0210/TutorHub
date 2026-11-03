export function accountMenuItems(role, profileId) {
  const settingsPath = role === 'Tutor' ? '/tutor/settings' : role === 'Admin' ? '/admin/settings' : '/student/settings';
  return [
    { key: 'settings', label: 'Cài đặt tài khoản', icon: 'settings', to: settingsPath },
    ...(role === 'Tutor' ? [{ key: 'teaching-profile', label: 'Hồ sơ giảng dạy', icon: 'verified_user', to: '/tutor/application' }] : []),
    ...(role === 'Tutor' && profileId ? [{ key: 'public-profile', label: 'Xem hồ sơ công khai', icon: 'school', to: `/tutors/${encodeURIComponent(profileId)}`, external: true }] : []),
    { type: 'divider' },
    { key: 'logout', label: 'Đăng xuất', icon: 'logout', danger: true },
  ];
}
