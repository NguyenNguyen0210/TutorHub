import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/cn';
import Icon from '@/components/ui/Icon';
import Logo from '@/components/ui/Logo';
import Avatar, { Menu } from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { getDashboardPath } from './navConfig';

/**
 * PublicTopbar — thanh điều hướng công cộng: sáng, tối giản, dính.
 * Dùng cho trang discovery, checkout (guest), messages/notifications.
 */
export default function PublicTopbar() {
  const { user, role, isAuthenticated, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/auth/login');
  };

  const userMenuItems = isAuthenticated
    ? [
        {
          key: 'dashboard',
          icon: <Icon name="space_dashboard" size="sm" />,
          label: <span className="font-semibold text-body-reg">Trang tổng quan</span>,
          onClick: () => navigate(getDashboardPath(role)),
        },
        { type: 'divider' },
        {
          key: 'logout',
          icon: <Icon name="logout" size="sm" />,
          label: <span className="font-semibold text-body-reg">Đăng xuất</span>,
          danger: true,
          onClick: handleLogout,
        },
      ]
    : [];

  return (
    <header className="sticky top-0 z-50 glass-surface border-b border-border">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 gap-4">
        <Link
          to={isAuthenticated ? getDashboardPath(role) : '/tutors'}
          aria-label="TutorHub — trang chủ"
        >
          <Logo variant="horizontal" size={36} showSubtitle subtitle="Better Learning. Brighter Future." />
        </Link>

        <nav className="hidden md:flex items-center gap-1" aria-label="Điều hướng chính">
          <Link
            to="/tutors"
            aria-current={location.pathname.startsWith('/tutors') ? 'page' : undefined}
            className={cn(
              'flex items-center gap-2 px-3.5 py-2 rounded-brand-md text-body-reg font-semibold transition-colors',
              location.pathname.startsWith('/tutors')
                ? 'bg-brand-primary-50 text-brand-primary-700'
                : 'text-fg-secondary hover:text-brand-primary-700 hover:bg-neutral-100'
            )}
          >
            <Icon name="explore" size="md" />
            Khám phá gia sư
          </Link>
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          {isAuthenticated ? (
            <>
              <Button
                as={Link}
                to="/app/notifications"
                variant="ghost"
                aria-label="Thông báo"
                icon={<Icon name="notifications" size="md" />}
                className="w-10 h-10 !px-0"
              />
              <Menu
                items={userMenuItems}
                trigger={
                  <span className="flex items-center gap-2 cursor-pointer rounded-brand-md px-1.5 py-1 hover:bg-neutral-100 transition-colors">
                    <Avatar src={user?.avatarUrl} name={user?.fullName || user?.name} size="md" />
                  </span>
                }
              />
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/tutor/application"
                className="hidden lg:inline-flex text-body-reg font-semibold text-fg-secondary hover:text-brand-primary-700 px-3 py-2 transition-colors"
              >
                Trở thành gia sư
              </Link>
              <Button as={Link} to="/auth/register" variant="outline" size="md" className="hidden sm:inline-flex">
                Đăng ký
              </Button>
              <Button as={Link} to="/auth/login" variant="primary" size="md">
                Đăng nhập
              </Button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? 'Đóng menu' : 'Mở menu'}
            aria-expanded={mobileOpen}
            className="md:hidden w-10 h-10 rounded-brand-md hover:bg-neutral-100 flex items-center justify-center text-fg-secondary transition-colors"
          >
            <Icon name={mobileOpen ? 'close' : 'menu'} size="md" />
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-surface px-4 pt-2 pb-4 animate-fadeIn">
          <Link
            to="/tutors"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-brand-md text-body-reg font-semibold text-fg-secondary hover:bg-neutral-100"
          >
            <Icon name="explore" size="md" />
            Khám phá gia sư
          </Link>
          {!isAuthenticated && (
            <Link
              to="/tutor/application"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-brand-md text-body-reg font-semibold text-fg-secondary hover:bg-neutral-100"
            >
              <Icon name="school" size="md" />
              Trở thành gia sư
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
