import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/cn';
import Icon from '@/components/ui/Icon';
import Logo from '@/components/ui/Logo';
import Avatar, { Menu } from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { chatService } from '@/services/chat.service';
import { getNavForRole, getDashboardPath } from './navConfig';
import MobileFloatingDock from './MobileFloatingDock';

/**
 * WorkspaceShell — khung làm việc chuẩn cho Student / Tutor / Admin.
 * Sidebar sáng 240px (nền trắng, active pill xanh nhạt) + canvas xám nhạt;
 * < 1024px sidebar thành drawer.
 */
export default function WorkspaceShell({ userRole: role, children }) {
  const { user, isAuthenticated, logout } = useAuthStore();
  // UserDto.IdProfile = TutorProfile.Id / StudentProfile.Id, đã có sẵn trong
  // authStore nên "Hồ sơ công khai" không cần gọi API thêm.
  const profileId = user?.idProfile || user?.tutorProfileId || null;
  const location = useLocation();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  // Tổng tin nhắn chưa đọc thật từ /conversations (0 / lỗi → ẩn badge, không số giả).
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    let cancelled = false;
    async function loadUnread() {
      if (!isAuthenticated) {
        setUnreadMessages(0);
        return;
      }
      try {
        const page = await chatService.getConversations({ pageSize: 50 });
        const total = (page?.items || []).reduce((sum, c) => sum + (Number(c.unreadCount) || 0), 0);
        if (!cancelled) setUnreadMessages(total);
      } catch {
        if (!cancelled) setUnreadMessages(0);
      }
    }
    loadUnread();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/auth/login');
  };

  const navItems = getNavForRole(role, isAuthenticated, profileId);

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
            key: 'application',
            icon: <Icon name="verified_user" size="sm" />,
            label: <span className="font-semibold text-body-reg">Hồ sơ xét duyệt</span>,
            onClick: () => navigate('/tutor/application'),
          },
          // Chỉ hiện khi đã có hồ sơ công khai; gia sư đang chờ duyệt thì chưa có
          // TutorProfile nên không có trang nào để mở.
          ...(profileId
            ? [
                {
                  key: 'public-profile',
                  icon: <Icon name="person" size="sm" />,
                  label: <span className="font-semibold text-body-reg">Xem hồ sơ công khai</span>,
                  onClick: () => navigate(`/tutors/${profileId}`),
                },
              ]
            : []),
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
      label: <span className="font-semibold text-body-reg">Cài đặt tài khoản</span>,
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
        className="flex items-center gap-2.5 px-5 h-16 shrink-0 border-b border-slate-100"
        aria-label="TutorHub — về trang tổng quan"
      >
        <Logo variant="mark" size={36} />
        <Logo variant="wordmark" size={30} tone="color" />
      </Link>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1" aria-label={`${role} navigation`}>
        {navItems.map((item) => {
          const isActive = item.match(location.pathname);
          const showMsgBadge = item.path === '/app/messages' && unreadMessages > 0;
          // `external` = trang nằm ngoài khung sàn (PublicLayout). Mở tab mới để
          // người dùng không mất sidebar đang mở — điều hướng trong tab sẽ làm
          // khung công khai hiện lên, đúng lỗi đã gặp ở Hộp thư.
          const externalProps = item.external
            ? { target: '_blank', rel: 'noopener noreferrer' }
            : {};
          return (
            <Link
              key={`${item.path}__${item.label}`}
              to={item.path}
              aria-current={isActive ? 'page' : undefined}
              title={item.external ? `${item.label} (mở tab mới)` : undefined}
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-[10px] text-body-reg font-semibold transition-colors',
                isActive
                  ? 'bg-brand-primary-50 text-brand-primary-600'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              )}
              {...externalProps}
            >
              <Icon name={item.icon} size="md" />
              <span className="flex-1 min-w-0 truncate">{item.label}</span>
              {item.external && (
                <Icon
                  name="open_in_new"
                  size="xs"
                  className="text-fg-muted shrink-0"
                  aria-hidden="true"
                />
              )}
              {showMsgBadge && (
                <span
                  aria-label={`${unreadMessages} tin nhắn chưa đọc`}
                  className="shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center"
                >
                  {unreadMessages > 99 ? '99+' : unreadMessages}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-100 space-y-3">
        <div className="rounded-brand-md bg-brand-primary-50/70 border border-brand-primary-100 p-3.5">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0">
              <Icon name="contact_support" size="sm" className="text-brand-primary-600" />
            </span>
            <p className="text-body-reg font-bold text-slate-900">Cần hỗ trợ?</p>
          </div>
          <p className="mt-2 text-caption text-slate-500 leading-relaxed">
            Xem hướng dẫn sử dụng và câu hỏi thường gặp.
          </p>
          <Link
            to="/how-it-works"
            className="mt-2.5 flex items-center justify-center gap-1.5 w-full px-3 py-2 rounded-brand-md bg-white border border-brand-primary-200 text-brand-primary-700 text-body-reg font-bold hover:bg-brand-primary-50 transition-colors"
          >
            Trung tâm trợ giúp
            <Icon name="arrow_forward" size="sm" />
          </Link>
        </div>
        {/* Khối này trước đây là <Link> trỏ thẳng /tutor/settings nhưng hiển thị tên
            người dùng → người dùng tưởng là "Hồ sơ cá nhân" và bấm nhầm, ra Cài đặt.
            Nay nó là trigger của menu tài khoản (giống avatar ở header), nên
            không còn đường nào mang tên mà điều hướng sai chỗ. */}
        <Menu
          items={userMenuItems}
          align="top"
          trigger={
            <div className="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-brand-md bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors group cursor-pointer">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-2 h-2 rounded-full bg-success shrink-0" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-caption font-semibold text-slate-900 truncate group-hover:text-brand-primary-700 transition-colors">
                    {user?.fullName || user?.name || 'Tài khoản'}
                  </p>
                  <p className="text-[11px] text-slate-500 uppercase tracking-wide">{role}</p>
                </div>
              </div>
              <Icon
                name="expand_more"
                size="xs"
                className="text-slate-400 group-hover:text-slate-700 transition-colors shrink-0"
              />
            </div>
          }
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-canvas text-fg antialiased">
      <aside className="hidden lg:flex w-60 shrink-0 bg-white text-slate-900 border-r border-slate-200 sticky top-0 h-screen flex-col">
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
          <aside className="absolute left-0 top-0 bottom-0 w-72 max-w-[85vw] bg-white text-slate-900 border-r border-slate-200 shadow-brand-xl">
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

        <main
          className={cn(
            'flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28 lg:pb-10',
            role === 'Admin' ? 'max-w-[1600px]' : 'max-w-7xl'
          )}
        >
          {children}
        </main>
      </div>

      <MobileFloatingDock />
    </div>
  );
}
