import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/cn';
import Icon from '@/components/ui/Icon';
import Logo from '@/components/ui/Logo';
import Avatar, { Menu } from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { getNavForRole, getDashboardPath } from './navConfig';
import MobileFloatingDock from './MobileFloatingDock';

/**
 * WorkspaceShell — khung làm việc chuẩn cho Student / Tutor / Admin.
 * Sidebar tối 240px + canvas sáng; < 1024px sidebar thành drawer.
 */
export default function WorkspaceShell({ userRole: role, children }) {
  const { user, isAuthenticated, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/auth/login');
  };

  const navItems = getNavForRole(role, isAuthenticated);

  const userMenuItems = [
    {
      key: 'dashboard',
      icon: <Icon name="space_dashboard" size="sm" />,
      label: (
        <span className="font-semibold text-body-reg">
          {role === 'Student' ? 'Bàn học của tôi' : role === 'Tutor' ? 'Bảng điều hành' : 'Tổng quan sàn'}
        </span>
      ),
      onClick: () => navigate(getDashboardPath(role)),
    },
    ...(role === 'Student'
      ? [
          {
            key: 'wallet',
            icon: <Icon name="account_balance_wallet" size="sm" />,
            label: <span className="font-semibold text-body-reg">Ví học viên & Nạp/Rút</span>,
            onClick: () => navigate('/student/wallet'),
          },
          {
            key: 'dispute',
            icon: <Icon name="gavel" size="sm" />,
            label: <span className="font-semibold text-body-reg">Khiếu nại buổi học</span>,
            onClick: () => navigate('/student/disputes/new'),
          },
        ]
      : []),
    ...(role === 'Tutor'
      ? [
          {
            key: 'wallet',
            icon: <Icon name="account_balance_wallet" size="sm" />,
            label: <span className="font-semibold text-body-reg">Ví Escrow & Rút tiền</span>,
            onClick: () => navigate('/tutor/wallet'),
          },
        ]
      : []),
    {
      key: 'settings',
      icon: <Icon name="settings" size="sm" />,
      label: <span className="font-semibold text-body-reg">Hồ sơ & Cài đặt</span>,
      onClick: () => navigate(role === 'Tutor' ? '/tutor/settings' : role === 'Student' ? '/student/settings' : '/admin/settings'),
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <Icon name="logout" size="sm" />,
      label: <span className="font-semibold text-body-reg">Đăng xuất</span>,
      danger: true,
      onClick: handleLogout,
    },
  ];

  const sidebarBody = (
    <div className="flex flex-col h-full">
      <Link
        to={getDashboardPath(role)}
        className="flex items-center gap-2.5 px-5 h-16 shrink-0 border-b border-white/10"
        aria-label="TutorHub — về trang tổng quan"
      >
        <Logo variant="mark" size={36} />
        <Logo variant="wordmark" size={30} tone="light" />
      </Link>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1" aria-label={`${role} navigation`}>
        {navItems.map((item) => {
          const isActive = item.match(location.pathname);
          return (
            <Link
              key={item.path}
              to={item.path}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-brand-md text-body-reg font-semibold transition-colors',
                isActive
                  ? 'bg-brand-primary-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              )}
            >
              <Icon name={item.icon} size="md" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-white/10">
        <Link
          to={role === 'Tutor' ? '/tutor/settings' : role === 'Student' ? '/student/settings' : '/admin/settings'}
          className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-brand-md bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group"
          title="Hồ sơ & Cài đặt tài khoản"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-caption font-semibold text-white truncate group-hover:text-brand-primary-300 transition-colors">
                {user?.fullName || user?.name || 'Tài khoản'}
              </p>
              <p className="text-[11px] text-slate-400 uppercase tracking-wide">{role}</p>
            </div>
          </div>
          <Icon name="settings" size="xs" className="text-slate-400 group-hover:text-white transition-colors shrink-0" />
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-canvas text-fg antialiased">
      <aside className="hidden lg:flex w-60 shrink-0 bg-brand-navy-900 text-white sticky top-0 h-screen flex-col">
        {sidebarBody}
      </aside>

      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-[100]">
          <button
            type="button"
            aria-label="Đóng menu điều hướng"
            className="absolute inset-0 bg-brand-navy-950/60 backdrop-blur-sm cursor-default"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-72 max-w-[85vw] bg-brand-navy-900 text-white shadow-brand-xl">
            {sidebarBody}
          </aside>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-40 glass-surface border-b border-border">
          <div className="flex items-center gap-3 px-4 sm:px-6 lg:px-8 h-16">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Mở menu điều hướng"
              className="lg:hidden w-10 h-10 rounded-brand-md flex items-center justify-center text-fg-secondary hover:bg-neutral-100 transition-colors"
            >
              <Icon name="menu" size="md" />
            </button>

            <Link to={getDashboardPath(role)} className="lg:hidden" aria-label="TutorHub">
              <Logo variant="mark" size={32} />
            </Link>

            <div className="flex-1 min-w-0 hidden sm:block">
              <p className="text-caption text-fg-muted truncate">
                {role === 'Student' && 'Không gian học tập của bạn'}
                {role === 'Tutor' && 'Không gian giảng dạy của bạn'}
                {role === 'Admin' && 'Bảng điều hành sàn giao dịch'}
              </p>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <Button
                as={Link}
                to="/app/notifications"
                variant="ghost"
                size="md"
                aria-label="Thông báo"
                icon={<Icon name="notifications" size="md" />}
                className="w-10 h-10 !px-0"
              />
              <Button
                as={Link}
                to="/app/messages"
                variant="ghost"
                size="md"
                aria-label="Tin nhắn"
                icon={<Icon name="chat" size="md" />}
                className="w-10 h-10 !px-0"
              />
              <Menu
                items={userMenuItems}
                trigger={
                  <span className="flex items-center gap-2 cursor-pointer rounded-brand-md px-1.5 py-1 hover:bg-neutral-100 transition-colors">
                    <Avatar
                      src={user?.avatarUrl}
                      name={user?.fullName || user?.name}
                      size="md"
                    />
                    <Icon name="expand_more" size="sm" className="text-fg-muted hidden sm:block" />
                  </span>
                }
              />
            </div>
          </div>
        </header>

        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28 lg:pb-10">
          {children}
        </main>
      </div>

      <MobileFloatingDock />
    </div>
  );
}
