export function applicationManagementAction(services) {
  // Failed/unavailable data must not be mistaken for a confirmed empty service list.
  return Array.isArray(services) && services.length === 0
    ? { label: 'Tạo gói học đầu tiên', path: '/tutor/services/new' }
    : { label: 'Quản lý gói học', path: '/tutor/services' };
}

export function accountStatusLabel(status) {
  return { Active: 'Đang hoạt động', Suspended: 'Tạm ngưng', Banned: 'Đã khóa', PendingVerification: 'Chờ xác thực' }[status] || null;
}
