import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/cn';
import Icon from '@/components/ui/Icon';
import { useAuthStore } from '@/store/authStore';
import { getNavForRole } from './navConfig';

/**
 * MobileFloatingDock — điều hướng ngữ cảnh dưới cho mobile (< 1024px).
 * Tối đa 4 mục, gắn sát cạnh dưới và chừa safe-area để không che nội dung.
 */
function DockLink({ to, icon, label, active, external }) {
  return (
    <Link
      to={to}
      aria-current={active ? 'page' : undefined}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className={cn(
        'flex min-h-[52px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 rounded-brand-md text-[10px] font-semibold transition-colors',
        active ? 'text-primary bg-primary-subtle' : 'text-fg-secondary hover:text-fg'
      )}
    >
      <Icon name={icon} size="md" />
      {label}
    </Link>
  );
}

const SHORT_LABEL = {
  '/': 'Khám phá',
  '/student/dashboard': 'Bàn học',
  '/tutors': 'Tìm gia sư',
  '/app/messages': 'Hộp thư',
  '/app/notifications': 'Thông báo',
  '/tutor/dashboard': 'Tổng quan',
  '/tutor/schedule': 'Lịch dạy',
  '/tutor/services': 'Dịch vụ',
  '/tutor/wallet': 'Ví Escrow',
  '/tutor/settings': 'Cài đặt',
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
  { path: '/', label: 'Tìm gia sư', icon: 'person_search', match: (p) => p === '/' || p.startsWith('/tutors') },
  { path: '/services', label: 'Gói học', icon: 'local_library', match: (p) => p.startsWith('/services') },
  { path: '/how-it-works', label: 'Quy trình', icon: 'timeline', match: (p) => p.startsWith('/how-it-works') },
  { path: '/auth/login', label: 'Đăng nhập', icon: 'login', match: (p) => p.startsWith('/auth/login') },
];

export default function MobileFloatingDock() {
  const { role, isAuthenticated } = useAuthStore();
  const location = useLocation();

  const isImmersive = IMMERSIVE_PATHS.some((p) => location.pathname.startsWith(p));
  const hasContextualBottomAction = /^\/(tutors|services|service)\/[^/]+/.test(location.pathname);
  if (isImmersive || hasContextualBottomAction) return null;

  // Đọc qua getNavForRole để dock và sidebar cùng nguồn danh sách.
  const items = isAuthenticated ? getNavForRole(role, isAuthenticated).slice(0, 4) : GUEST_ITEMS;

  return (
    <div className="lg:hidden fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface/95 px-3 pt-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))] backdrop-blur-md shadow-[0_-8px_24px_rgb(15_23_42/0.08)]">
      <nav
        className="mx-auto flex max-w-lg items-center justify-around gap-1"
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
