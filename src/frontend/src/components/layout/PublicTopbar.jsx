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

  const displayName = user?.fullName || user?.name || (isAuthenticated ? 'Nguyễn Văn A' : '');

  const userMenuItems = isAuthenticated
    ? [
        {
          key: 'dashboard',
          icon: <Icon name="space_dashboard" size="sm" />,
          label: <span className="font-semibold text-body-reg">Trang tổng quan</span>,
          onClick: () => navigate(getDashboardPath(role)),
        },
        {
          key: 'settings',
          icon: <Icon name="settings" size="sm" />,
          label: <span className="font-semibold text-body-reg">Hồ sơ & Cài đặt</span>,
          onClick: () =>
            navigate(
              role === 'Tutor'
                ? '/tutor/settings'
                : role === 'Student'
                ? '/student/settings'
                : '/admin/settings'
            ),
        },
        ...(role === 'Tutor'
          ? [
              {
                key: 'application',
                icon: <Icon name="verified_user" size="sm" />,
                label: <span className="font-semibold text-body-reg">Hồ sơ xét duyệt</span>,
                onClick: () => navigate('/tutor/application'),
              },
            ]
          : []),
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

  const schedulePath = isAuthenticated
    ? role === 'Tutor'
      ? '/tutor/schedule'
      : '/student/dashboard'
    : '/auth/login';

  const myCoursesPath = isAuthenticated
    ? role === 'Tutor'
      ? '/tutor/services'
      : '/student/dashboard'
    : '/auth/login';

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-neutral-200/80">
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-[68px] gap-4">
        {/* Brand Logo */}
        <Link
          to={isAuthenticated ? getDashboardPath(role) : '/'}
          aria-label="TutorHub — trang chủ"
          className="shrink-0 flex items-center"
        >
          <Logo variant="horizontal" size={36} />
        </Link>

        {/* Center Nav Items: 14px / 500 font */}
        <nav className="hidden md:flex items-center gap-1.5" aria-label="Điều hướng chính">
          <Link
            to="/"
            aria-current={location.pathname === '/' || location.pathname === '/tutors' ? 'page' : undefined}
            className={cn(
              'px-3.5 py-2 rounded-lg text-[14px] font-medium transition-colors',
              location.pathname === '/' || location.pathname.startsWith('/tutors')
                ? 'bg-blue-50 text-[#2563EB] font-semibold'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
            )}
          >
            Khám phá gia sư
          </Link>

          <Link
            to="/services"
            aria-current={location.pathname.startsWith('/services') ? 'page' : undefined}
            className={cn(
              'px-3.5 py-2 rounded-lg text-[14px] font-medium transition-colors',
              location.pathname.startsWith('/services')
                ? 'bg-blue-50 text-[#2563EB] font-semibold'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
            )}
          >
            Dịch vụ học tập
          </Link>

          {!isAuthenticated ? (
            <Link
              to="/how-it-works"
              aria-current={location.pathname === '/how-it-works' ? 'page' : undefined}
              className={cn(
                'px-3.5 py-2 rounded-lg text-[14px] font-medium transition-colors',
                location.pathname === '/how-it-works'
                  ? 'bg-blue-50 text-[#2563EB] font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
              )}
            >
              Cách hoạt động
            </Link>
          ) : (
            <>
              <Link
                to={schedulePath}
                className={cn(
                  'px-3.5 py-2 rounded-lg text-[14px] font-medium transition-colors',
                  location.pathname.includes('/availability') || location.pathname.includes('/sessions')
                    ? 'bg-blue-50 text-[#2563EB] font-semibold'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                )}
              >
                Lịch học
              </Link>

              <Link
                to="/app/messages"
                className={cn(
                  'px-3.5 py-2 rounded-lg text-[14px] font-medium transition-colors',
                  location.pathname.startsWith('/app/messages')
                    ? 'bg-blue-50 text-[#2563EB] font-semibold'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                )}
              >
                Tin nhắn
              </Link>

              <Link
                to={myCoursesPath}
                className={cn(
                  'px-3.5 py-2 rounded-lg text-[14px] font-medium transition-colors',
                  location.pathname.includes('/dashboard') || location.pathname.includes('/services')
                    ? 'bg-blue-50 text-[#2563EB] font-semibold'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                )}
              >
                Gói học của tôi
              </Link>
            </>
          )}
        </nav>

        {/* Right actions: Notifications & User profile / Auth buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          {isAuthenticated ? (
            <>
              {role === 'Tutor' && (
                <Link
                  to="/tutor/application"
                  className={cn(
                    'hidden sm:inline-flex items-center gap-1.5 text-[13px] font-semibold px-3 py-1.5 rounded-lg border transition-all',
                    location.pathname.startsWith('/tutor/application')
                      ? 'bg-blue-50 text-[#2563EB] border-blue-200'
                      : 'text-slate-700 hover:text-[#2563EB] border-slate-200 hover:bg-slate-50'
                  )}
                >
                  <Icon name="verified_user" size="xs" />
                  Hồ sơ xét duyệt
                </Link>
              )}

              <Button
                as={Link}
                to="/app/notifications"
                variant="ghost"
                aria-label="Thông báo"
                icon={<Icon name="notifications" size="md" className="text-neutral-600" />}
                className="w-9 h-9 !px-0 rounded-full hover:bg-neutral-100"
              />

              <Menu
                items={userMenuItems}
                trigger={
                  <span className="flex items-center gap-2 cursor-pointer rounded-brand-md px-2 py-1 hover:bg-neutral-100 transition-colors">
                    <Avatar
                      src={user?.avatarUrl}
                      name={displayName}
                      size="sm"
                      className="w-8 h-8 text-[12px]"
                    />
                    <span className="hidden sm:inline font-bold text-caption text-neutral-800">
                      {displayName}
                    </span>
                    <Icon name="chevron_right" size="xs" className="rotate-90 text-neutral-400" />
                  </span>
                }
              />
            </>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link
                to="/become-tutor"
                className="hidden lg:inline-flex text-[14px] font-medium text-neutral-600 hover:text-[#2563EB] px-2.5 py-1.5 transition-colors"
              >
                Trở thành gia sư
              </Link>
              <Link
                to="/auth/register"
                className="hidden sm:inline-flex items-center justify-center h-9 px-3.5 rounded-[8px] border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700 text-[13.5px] font-medium transition-colors"
              >
                Đăng ký
              </Link>
              <Link
                to="/auth/login"
                className="inline-flex items-center justify-center h-9 px-4 rounded-[8px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[13.5px] font-medium transition-colors shadow-sm"
              >
                Đăng nhập
              </Link>
            </div>
          )}

          {/* Mobile hamburger toggle */}
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? 'Đóng menu' : 'Mở menu'}
            aria-expanded={mobileOpen}
            className="md:hidden w-9 h-9 rounded-brand-md hover:bg-neutral-100 flex items-center justify-center text-neutral-600 transition-colors"
          >
            <Icon name={mobileOpen ? 'close' : 'menu'} size="md" />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-surface px-4 pt-2 pb-4 space-y-1 animate-fadeIn shadow-brand-sm">
          <Link
            to="/"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-brand-md text-body-reg font-semibold text-neutral-700 hover:bg-neutral-100"
          >
            <Icon name="explore" size="md" className="text-brand-primary-600" />
            Khám phá gia sư
          </Link>
          <Link
            to="/services"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-brand-md text-body-reg font-semibold text-neutral-700 hover:bg-neutral-100"
          >
            <Icon name="local_library" size="md" className="text-brand-primary-600" />
            Dịch vụ học tập
          </Link>
          {!isAuthenticated ? (
            <>
              <Link
                to="/how-it-works"
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-brand-md text-body-reg font-semibold transition-colors',
                  location.pathname === '/how-it-works'
                    ? 'bg-blue-50 text-[#2563EB]'
                    : 'text-neutral-700 hover:bg-neutral-100'
                )}
              >
                <Icon name="help_outline" size="md" className="text-brand-primary-600" />
                Cách hoạt động
              </Link>
              <Link
                to="/become-tutor"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-brand-md text-body-reg font-semibold text-neutral-700 hover:bg-neutral-100 border-t border-border pt-3"
              >
                <Icon name="school" size="md" className="text-brand-primary-600" />
                Trở thành gia sư
              </Link>
            </>
          ) : (
            <>
              <Link
                to={schedulePath}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-brand-md text-body-reg font-semibold text-neutral-700 hover:bg-neutral-100"
              >
                <Icon name="calendar_month" size="md" className="text-brand-primary-600" />
                Lịch học
              </Link>
              <Link
                to="/app/messages"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-brand-md text-body-reg font-semibold text-neutral-700 hover:bg-neutral-100"
              >
                <Icon name="chat" size="md" className="text-brand-primary-600" />
                Tin nhắn
              </Link>
              <Link
                to={myCoursesPath}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-brand-md text-body-reg font-semibold text-neutral-700 hover:bg-neutral-100"
              >
                <Icon name="auto_stories" size="md" className="text-brand-primary-600" />
                Gói học của tôi
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
