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

  const handleNavClick = (path) => {
    if (location.pathname === path) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const displayName =
    user?.fullName || user?.name || user?.email?.split('@')[0] || (isAuthenticated ? 'Tài khoản' : '');

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
        ...(role === 'Student'
          ? [
              {
                key: 'wishlist',
                icon: <Icon name="favorite" size="sm" />,
                label: <span className="font-semibold text-body-reg">Danh sách đã lưu</span>,
                onClick: () => navigate('/student/wishlist'),
              },
            ]
          : []),
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

  const isHome = location.pathname === '/' || location.pathname.startsWith('/tutors');
  const navLinkClass = (active) =>
    cn(
      'inline-flex min-h-11 items-center border-b-2 px-3.5 py-2 text-[14px] font-semibold transition-colors',
      active
        ? 'border-brand-primary-600 text-brand-primary-700'
        : 'border-transparent text-fg-secondary hover:border-neutral-300 hover:text-fg'
    );

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface">
      <div className="page-shell grid h-[72px] grid-cols-[1fr_auto_1fr] items-center gap-4">
        {/* Brand Logo */}
        <Link
          to={isAuthenticated ? getDashboardPath(role) : '/'}
          aria-label="TutorHub — trang chủ"
          onClick={() => {
            const homePath = isAuthenticated ? getDashboardPath(role) : '/';
            if (location.pathname === homePath) {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          className="flex shrink-0 items-center justify-self-start"
        >
          <Logo variant="mark" size={36} className="sm:hidden" />
          <Logo variant="horizontal" size={36} className="hidden sm:inline-flex" />
        </Link>

        {/* Center nav: four guest links, centered between logo and actions */}
        <nav className="hidden items-center justify-self-center gap-1 lg:flex" aria-label="Điều hướng chính">
          <Link
            to="/"
            aria-current={isHome ? 'page' : undefined}
            onClick={() => handleNavClick('/')}
            className={navLinkClass(isHome)}
          >
            Tìm gia sư
          </Link>

          <Link
            to="/services"
            aria-current={location.pathname.startsWith('/services') ? 'page' : undefined}
            onClick={() => handleNavClick('/services')}
            className={navLinkClass(location.pathname.startsWith('/services'))}
          >
            Dịch vụ
          </Link>

          {!isAuthenticated ? (
            <>
              <Link
                to="/become-tutor"
                aria-current={location.pathname.startsWith('/become-tutor') ? 'page' : undefined}
                onClick={() => handleNavClick('/become-tutor')}
                className={navLinkClass(location.pathname.startsWith('/become-tutor'))}
              >
                Trở thành gia sư
              </Link>

              <Link
                to="/how-it-works"
                aria-current={location.pathname === '/how-it-works' ? 'page' : undefined}
                onClick={() => handleNavClick('/how-it-works')}
                className={navLinkClass(location.pathname === '/how-it-works')}
              >
                Cách hoạt động
              </Link>
            </>
          ) : (
            <>
              <Link
                to={schedulePath}
                aria-current={
                  location.pathname.includes('/schedule') || location.pathname.includes('/sessions')
                    ? 'page'
                    : undefined
                }
                className={navLinkClass(
                  location.pathname.includes('/schedule') || location.pathname.includes('/sessions')
                )}
              >
                Lịch học
              </Link>

              <Link
                to="/app/messages"
                aria-current={location.pathname.startsWith('/app/messages') ? 'page' : undefined}
                className={navLinkClass(location.pathname.startsWith('/app/messages'))}
              >
                Tin nhắn
              </Link>

              <Link
                to={myCoursesPath}
                aria-current={
                  location.pathname.includes('/dashboard') || location.pathname.includes('/services')
                    ? 'page'
                    : undefined
                }
                className={navLinkClass(
                  location.pathname.includes('/dashboard') || location.pathname.includes('/services')
                )}
              >
                Gói học của tôi
              </Link>
            </>
          )}
        </nav>

        {/* Right actions: Notifications & User profile / Auth buttons */}
        <div className="flex shrink-0 items-center justify-self-end gap-2.5">
          {isAuthenticated ? (
            <>
              {role === 'Tutor' && (
                <Link
                  to="/tutor/application"
                  className={cn(
                    'hidden sm:inline-flex items-center gap-1.5 text-[13px] font-semibold px-3 py-1.5 rounded-lg border transition-all',
                    location.pathname.startsWith('/tutor/application')
                      ? 'bg-brand-primary-50 text-brand-primary-600 border-brand-primary-200'
                      : 'text-neutral-700 hover:text-brand-primary-600 border-border hover:bg-neutral-50'
                  )}
                >
                  <Icon name="verified_user" size="xs" />
                  Hồ sơ xét duyệt
                </Link>
              )}

              {role === 'Student' && (
                <Button
                  as={Link}
                  to="/student/wishlist"
                  variant="ghost"
                  aria-label="Danh sách đã lưu"
                  title="Danh sách đã lưu"
                  icon={
                    <Icon
                      name="favorite"
                      size="md"
                      className={cn(
                        'transition-colors',
                        location.pathname.startsWith('/student/wishlist')
                          ? 'text-brand-danger-600 fill-brand-danger-600'
                          : 'text-fg-secondary hover:text-brand-danger-600'
                      )}
                    />
                  }
                  className="w-9 h-9 !px-0 rounded-full hover:bg-neutral-100"
                />
              )}

              <Button
                as={Link}
                to="/app/notifications"
                variant="ghost"
                aria-label="Thông báo"
                icon={<Icon name="notifications" size="md" className="text-fg-secondary" />}
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
                    <span className="hidden sm:inline font-bold text-caption text-fg">
                      {displayName}
                    </span>
                    <Icon name="chevron_right" size="xs" className="rotate-90 text-fg-muted" />
                  </span>
                }
              />
            </>
          ) : (
            <div className="flex items-center gap-2 sm:gap-2.5">
              <Link
                to="/auth/register"
                className="hidden sm:inline-flex items-center justify-center h-11 px-4 rounded-brand-md border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700 text-[14px] font-medium transition-colors"
              >
                Đăng ký
              </Link>
              <Link
                to="/auth/login"
                className="inline-flex items-center justify-center h-11 px-4 rounded-brand-md bg-primary hover:bg-primary-hover active:scale-[0.98] text-white text-[14px] font-semibold transition-all shadow-brand-sm"
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
            className="lg:hidden flex h-11 w-11 items-center justify-center rounded-brand-md text-fg-secondary transition-colors hover:bg-neutral-100"
          >
            <Icon name={mobileOpen ? 'close' : 'menu'} size="md" />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-border bg-surface px-4 pb-4 pt-2 space-y-1 animate-fadeIn">
          {!isAuthenticated ? (
            <>
              <Link
                to="/"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-brand-md px-3 py-2.5 text-body-reg font-semibold text-neutral-700 hover:bg-neutral-100"
              >
                <Icon name="search" size="md" className="text-brand-primary-600" />
                Tìm gia sư
              </Link>
              <Link
                to="/services"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-brand-md px-3 py-2.5 text-body-reg font-semibold text-neutral-700 hover:bg-neutral-100"
              >
                <Icon name="local_library" size="md" className="text-brand-primary-600" />
                Dịch vụ
              </Link>
              <Link
                to="/become-tutor"
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-brand-md px-3 py-2.5 text-body-reg font-semibold transition-colors',
                  location.pathname.startsWith('/become-tutor')
                    ? 'bg-brand-primary-50 text-brand-primary-600'
                    : 'text-neutral-700 hover:bg-neutral-100'
                )}
              >
                <Icon name="school" size="md" className="text-brand-primary-600" />
                Trở thành gia sư
              </Link>
              <Link
                to="/how-it-works"
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-brand-md px-3 py-2.5 text-body-reg font-semibold transition-colors',
                  location.pathname === '/how-it-works'
                    ? 'bg-brand-primary-50 text-brand-primary-600'
                    : 'text-neutral-700 hover:bg-neutral-100'
                )}
              >
                <Icon name="help_outline" size="md" className="text-brand-primary-600" />
                Cách hoạt động
              </Link>
              <div className="grid grid-cols-2 gap-2 border-t border-border pt-3">
                <Link
                  to="/auth/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex h-11 items-center justify-center rounded-brand-md bg-primary text-caption font-semibold text-white shadow-brand-sm transition-all hover:bg-primary-hover active:scale-[0.98]"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/auth/register"
                  onClick={() => setMobileOpen(false)}
                  className="flex h-11 items-center justify-center rounded-brand-md border border-neutral-300 bg-white text-caption font-semibold text-neutral-800 transition-all hover:bg-neutral-50 active:scale-[0.98]"
                >
                  Đăng ký
                </Link>
              </div>
            </>
          ) : (
            <>
              <Link
                to="/"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-brand-md px-3 py-2.5 text-body-reg font-semibold text-neutral-700 hover:bg-neutral-100"
              >
                <Icon name="search" size="md" className="text-brand-primary-600" />
                Tìm gia sư
              </Link>
              <Link
                to="/services"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-brand-md px-3 py-2.5 text-body-reg font-semibold text-neutral-700 hover:bg-neutral-100"
              >
                <Icon name="local_library" size="md" className="text-brand-primary-600" />
                Dịch vụ
              </Link>
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
              {role === 'Student' && (
                <Link
                  to="/student/wishlist"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-brand-md text-body-reg font-semibold text-neutral-700 hover:bg-neutral-100"
                >
                  <Icon name="favorite" size="md" className="text-brand-primary-600" />
                  Danh sách đã lưu
                </Link>
              )}
            </>
          )}
        </div>
      )}
    </header>
  );
}
