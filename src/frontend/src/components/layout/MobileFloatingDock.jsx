import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/cn';
import Icon from '@/components/ui/Icon';
import { useAuthStore } from '@/store/authStore';
import { getNavForRole } from './navConfig';

/**
 * MobileFloatingDock — thanh điều hướng dưới cho mobile (< 1024px).
 * Dữ liệu từ navConfig duy nhất; tối đa 4 mục + mục đăng nhập cho guest.
 */
function DockLink({ to, icon, label, active, external }) {
  return (
    <Link
      to={to}
      aria-current={active ? 'page' : undefined}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
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
  '/tutor/schedule': 'Lịch dạy',
  '/tutor/services': 'Dịch vụ',
  '/tutor/wallet': 'Ví Escrow',
  '/tutor/settings': 'Cài đặt',
  '/services': 'Sàn DV',
  '/admin/dashboard': 'Tổng quan',
  '/admin/tutor-applications': 'Duyệt',
  '/admin/disputes': 'Tranh chấp',
  '/admin/users': 'Người dùng',
  '/admin/audit-logs': 'Kiểm toán',
  '/tutor/application': 'Làm gia sư',
  '/auth/login': 'Đăng nhập',
};

/**
 * Màn chiếm toàn màn hình: dock nổi sẽ đè lên thanh nhập của Hộp thư
 * (`fixed bottom-4` ~80px trong khi card hội thoại cao `calc(100vh - 140px)`).
 * Trước khi `/app/messages` dùng chung shell với các màn trong sàn thì nó nằm ở
 * PublicLayout nên không có dock, không có xung đột này.
 */
const IMMERSIVE_PATHS = ['/app/messages'];

/** Dock cho khách: giữ 3 mục riêng vì `NAV.guest` chỉ có 1 mục khám phá. */
const GUEST_ITEMS = [
  { path: '/tutors', label: 'Khám phá', icon: 'explore', match: (p) => p.startsWith('/tutors') },
  { path: '/tutor/application', label: 'Làm gia sư', icon: 'school', match: () => false },
  { path: '/auth/login', label: 'Đăng nhập', icon: 'login', match: (p) => p.startsWith('/auth/login') },
];

export default function MobileFloatingDock() {
  const { user, role, isAuthenticated } = useAuthStore();
  const location = useLocation();

  const isImmersive = IMMERSIVE_PATHS.some((p) => location.pathname.startsWith(p));
  if (isImmersive) return null;

  // Đi qua getNavForRole để `path` dạng hàm (hồ sơ công khai) được resolve y hệt
  // sidebar — trước đây đọc NAV trực tiếp nên dock và sidebar lệch nhau.
  const profileId = user?.idProfile || user?.tutorProfileId || null;
  const items = isAuthenticated
    ? getNavForRole(role, isAuthenticated, profileId).slice(0, 4)
    : GUEST_ITEMS;

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
            external={item.external}
          />
        ))}
      </nav>
    </div>
  );
}
