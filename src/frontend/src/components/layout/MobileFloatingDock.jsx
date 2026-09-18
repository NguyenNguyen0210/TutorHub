import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/cn';
import Icon from '@/components/ui/Icon';
import { useAuthStore } from '@/store/authStore';
import { NAV } from './navConfig';

/**
 * MobileFloatingDock — thanh điều hướng dưới cho mobile (< 1024px).
 * Dữ liệu từ navConfig duy nhất; tối đa 4 mục + mục đăng nhập cho guest.
 */
function DockLink({ to, icon, label, active }) {
  return (
    <Link
      to={to}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-brand-md text-[10px] font-semibold transition-colors min-w-[64px]',
        active ? 'text-brand-primary-700 bg-brand-primary-50' : 'text-fg-secondary'
      )}
    >
      <Icon name={icon} size="md" />
      {label}
    </Link>
  );
}

const SHORT_LABEL = {
  '/student/dashboard': 'Bàn học',
  '/tutors': 'Tìm gia sư',
  '/app/messages': 'Hộp thư',
  '/app/notifications': 'Thông báo',
  '/tutor/dashboard': 'Tổng quan',
  '/tutor/availability': 'Lịch dạy',
  '/tutor/services': 'Gói học',
  '/tutor/wallet': 'Ví Escrow',
  '/admin/dashboard': 'Tổng quan',
  '/admin/tutor-applications': 'Duyệt',
  '/admin/disputes': 'Tranh chấp',
  '/admin/users': 'Người dùng',
  '/admin/audit-logs': 'Kiểm toán',
  '/tutor/application': 'Làm gia sư',
  '/auth/login': 'Đăng nhập',
};

export default function MobileFloatingDock() {
  const { role, isAuthenticated } = useAuthStore();
  const location = useLocation();

  const items = !isAuthenticated
    ? [
        { path: '/tutors', label: 'Khám phá', icon: 'explore', match: (p) => p.startsWith('/tutors') },
        { path: '/tutor/application', label: 'Làm gia sư', icon: 'school', match: () => false },
        { path: '/auth/login', label: 'Đăng nhập', icon: 'login', match: (p) => p.startsWith('/auth/login') },
      ]
    : (NAV[role] || NAV.guest).slice(0, 4);

  return (
    <div className="lg:hidden fixed bottom-4 left-4 right-4 z-50">
      <nav
        className="glass-surface rounded-brand-lg shadow-brand-lg p-1.5 flex items-center justify-around"
        aria-label="Điều hướng nhanh"
      >
        {items.map((item) => (
          <DockLink
            key={item.path}
            to={item.path}
            icon={item.icon}
            label={SHORT_LABEL[item.path] || item.label}
            active={item.match(location.pathname)}
          />
        ))}
      </nav>
    </div>
  );
}
