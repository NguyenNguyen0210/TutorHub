import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/cn';
import Icon from '@/components/ui/Icon';
import Logo from '@/components/ui/Logo';
import Avatar, { Drawer } from '@/components/ui/Avatar';
import { useAuthStore } from '@/store/authStore';
import { EMPTY_NAV_GROUPS, useWorkspaceNavigationStore } from '@/store/workspaceNavigationStore';
import { useWorkspaceActivity } from '@/hooks/useWorkspaceActivity';
import { useTutorApplication } from '@/hooks/useTutorApplication';
import { getNavForRole, getDashboardPath, getWorkspaceNavGroups } from './navConfig';
import AccountDropdown from './AccountDropdown';
import WorkspaceMobileNav from './WorkspaceMobileNav';
import UnreadBadge from './UnreadBadge';
import '@/styles/workspace-navigation.css';

export default function WorkspaceShell({ userRole: role, children }) {
  const friendly = ['Student', 'Tutor', 'Admin'].includes(role);
  const { user, isAuthenticated } = useAuthStore();
  const tutorApplication = useTutorApplication(user?.id || user?.userId, isAuthenticated && role === 'Tutor');
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigationScope = `${user?.id || user?.userId || 'anonymous'}:${role}`;
  const closedGroups = useWorkspaceNavigationStore(state => state.workspaces[navigationScope]?.closedGroups || EMPTY_NAV_GROUPS);
  const setGroupClosed = useWorkspaceNavigationStore(state => state.setGroupClosed);
  const desktopNavRef = useRef(null);
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('tutorhub_sidebar_collapsed') === '1'; }
    catch { return false; }
  });
  const scrollMode = collapsed ? 'compact' : 'expanded';
  const rememberSidebarScroll = () => {
    const nav = desktopNavRef.current;
    if (nav?.clientHeight > 0) useWorkspaceNavigationStore.getState().rememberScroll(navigationScope, scrollMode, nav.scrollTop);
  };
  useLayoutEffect(() => {
    const nav = desktopNavRef.current;
    if (nav) nav.scrollTop = useWorkspaceNavigationStore.getState().workspaces[navigationScope]?.scroll?.[scrollMode] || 0;
  }, [navigationScope, scrollMode]);
  const activity = useWorkspaceActivity(isAuthenticated ? user?.id || user?.userId : null, location.pathname);
  const roleLabel = role === 'Student' ? 'Học viên' : role === 'Tutor' ? 'Gia sư' : 'Quản trị viên';
  const settingsPath = role === 'Tutor' ? '/tutor/settings' : role === 'Admin' ? '/admin/settings' : '/student/settings';
  const fullName = user?.fullName || user?.name || 'Tài khoản';

  useEffect(() => { setDrawerOpen(false); }, [location.pathname, location.search]);
  useEffect(() => {
    try { localStorage.setItem('tutorhub_sidebar_collapsed', collapsed ? '1' : '0'); }
    catch { /* Navigation still works when browser storage is unavailable. */ }
  }, [collapsed]);

  const navItems = getNavForRole(role, isAuthenticated, tutorApplication.data?.status);
  const primaryPaths = role === 'Admin' ? [getDashboardPath(role), '/admin/disputes'] : [getDashboardPath(role), '/app/messages', '/app/notifications'];
  const mobilePrimary = primaryPaths.map(path => navItems.find(item => item.path === path)).filter(Boolean)
    .map(item => ({ ...item, shortLabel: item.path === getDashboardPath(role) ? role === 'Student' ? 'Bàn học' : 'Tổng quan' : item.label }));
  const navGroups = getWorkspaceNavGroups(role, navItems);
  const mobileGroups = navGroups.map(group => ({ ...group, items: group.items.filter(item => !primaryPaths.includes(item.path) && item.path !== settingsPath) }))
    .filter(group => group.items.length > 0);
  const moreActive = mobileGroups.some(group => group.items.some(item => item.match(location.pathname)));

  const sidebar = (compact = false, mobile = false) => (
    <div className="flex h-full min-h-0 flex-col">
      <div className={cn('flex h-16 shrink-0 items-center workspace-nav-divider border-b border-white/10', compact ? 'justify-center px-2' : 'justify-between px-5')}>
        <Link to={getDashboardPath(role)} onClick={() => setDrawerOpen(false)}
          aria-label="TutorHub — về trang tổng quan" className="workspace-nav-focus flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70">
          <Logo variant="mark" size={34} />
          {!compact && <Logo variant="wordmark" size={28} tone={friendly ? 'color' : 'light'} />}
        </Link>
        {mobile && <button type="button" aria-label="Đóng menu điều hướng" onClick={() => setDrawerOpen(false)}
          className="workspace-nav-control workspace-nav-focus flex h-9 w-9 items-center justify-center rounded-lg text-neutral-300 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white">
          <Icon name="close" size="sm" />
        </button>}
        {!mobile && !compact && <button type="button" onClick={() => { rememberSidebarScroll(); setCollapsed(true); }} aria-label="Thu gọn thanh điều hướng" title="Thu gọn thanh điều hướng" aria-controls="workspace-sidebar" aria-expanded="true"
          className="workspace-nav-control workspace-nav-focus flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-neutral-300 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"><Icon name="chevron_left" size="md" /></button>}
      </div>
      {!mobile && compact && <div className="flex justify-center pt-3"><button type="button" onClick={() => { rememberSidebarScroll(); setCollapsed(false); }} aria-label="Mở rộng thanh điều hướng" title="Mở rộng thanh điều hướng" aria-controls="workspace-sidebar" aria-expanded="false"
        className="workspace-nav-control workspace-nav-focus flex h-10 w-10 items-center justify-center rounded-xl text-neutral-300 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"><Icon name="chevron_right" size="md" /></button></div>}

      <nav ref={mobile ? undefined : desktopNavRef} onScroll={mobile ? undefined : rememberSidebarScroll} onClickCapture={mobile ? undefined : rememberSidebarScroll} id={mobile ? 'workspace-more-navigation' : undefined} className={cn('min-h-0 flex-1 space-y-5 overflow-y-auto py-5', compact ? 'px-2' : 'px-3')} aria-label={mobile ? 'Điều hướng bổ sung' : 'Điều hướng không gian làm việc'}>
        {(mobile ? mobileGroups : navGroups).map((group, groupIndex) => {
          const collapsible = role === 'Admin' && ['Tài chính', 'Kiểm duyệt', 'Quản lý nền tảng'].includes(group.label) && !compact;
          const hasActive = group.items.some(item => item.match(location.pathname));
          const open = !collapsible || hasActive || !closedGroups[group.label];
          const groupId = `workspace-${mobile ? 'mobile' : 'desktop'}-group-${groupIndex}`;
          return <div key={group.label} className="space-y-1">
          {compact ? <div className="mx-2 mb-3 workspace-nav-divider border-t border-white/10" /> :
            collapsible ? <button type="button" aria-expanded={open} aria-controls={groupId} aria-disabled={hasActive}
              onClick={() => { if (!hasActive) setGroupClosed(navigationScope, group.label, !closedGroups[group.label]); }}
              className="workspace-nav-label workspace-nav-focus mb-2 flex min-h-9 w-full items-center justify-between rounded-lg px-3 text-left text-[11px] font-medium text-neutral-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary-500">
              {group.label}<Icon name={open ? 'expand_more' : 'chevron_right'} size="xs" />
            </button> : <p className="workspace-nav-label mb-2 px-3 text-[11px] font-medium text-neutral-300">{group.label}</p>}
          <div id={groupId} hidden={!open} className="space-y-1">
          {group.items.map(item => {
            const active = item.match(location.pathname);
            const unread = item.path === '/app/messages' ? activity.conversations : item.path === '/app/notifications' ? activity.notifications : 0;
            const unreadLabel = item.path === '/app/messages' ? 'cuộc trò chuyện chưa đọc' : 'thông báo chưa đọc';
            return <Link key={item.path} to={item.path} onClick={() => setDrawerOpen(false)}
              title={compact ? `${item.label}${unread > 0 ? `, ${unread} ${unreadLabel}` : ''}` : undefined}
              aria-label={compact ? `${item.label}${unread > 0 ? `, ${unread} ${unreadLabel}` : ''}` : undefined}
              aria-current={active ? 'page' : undefined}
              className={cn('workspace-nav-item workspace-nav-focus relative flex min-h-11 items-center rounded-xl text-sm font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70',
                compact ? 'justify-center px-2' : 'gap-3 px-3 py-2.5',
                role === 'Student' && item.path === '/' && 'font-medium',
                active ? 'bg-brand-primary-600 text-white' : 'text-neutral-300 hover:bg-white/[0.08] hover:text-white')}>
              <Icon name={item.icon} size="md" className="shrink-0" />
              {!compact && <span className={cn('min-w-0 flex-1', item.attention || role === 'Admin' ? 'whitespace-normal leading-5' : 'truncate')}>{item.label}</span>}
              {item.attention && (compact ? <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-holding" aria-label="Hồ sơ cần chỉnh sửa" /> : <span className="rounded-full bg-holding-subtle px-2 py-0.5 text-[10px] font-medium text-holding-strong">Cần sửa</span>)}
              {compact && unread > 0 ? <span className="workspace-nav-count absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand-primary-600 px-1 text-[9px] font-bold text-white ring-2 ring-brand-navy-900" aria-label={`${unread} ${unreadLabel}`}>{unread > 99 ? '99+' : unread}</span> :
                <UnreadBadge count={unread} label={unreadLabel} className={friendly ? 'bg-brand-primary-100 text-brand-primary-700' : undefined} />}
            </Link>;
          })}
          </div>
        </div>; })}
      </nav>

      <div className="space-y-3 workspace-nav-divider border-t border-white/10 p-3">
        <Link to="/how-it-works" onClick={() => setDrawerOpen(false)} title={compact ? 'Trung tâm trợ giúp' : undefined}
          aria-label="Trung tâm trợ giúp"
          className={cn('workspace-nav-control workspace-nav-focus flex min-h-10 items-center rounded-xl text-sm text-neutral-300 transition-colors duration-150 hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70', compact ? 'justify-center' : 'gap-3 px-3')}>
          <Icon name="contact_support" size="sm" />
          {!compact && <><span className="flex-1">Cần hỗ trợ?</span><Icon name="arrow_forward" size="xs" /></>}
        </Link>
        {!mobile && <AccountDropdown label={`${fullName} · ${roleLabel} — Mở menu tài khoản`} align="top" className="w-full" triggerClassName="w-full"
          trigger={<span className={cn('workspace-nav-account flex min-h-14 w-full items-center rounded-xl border border-white/10 bg-white/[0.04] transition-colors duration-150 hover:bg-white/[0.08]', compact ? 'justify-center p-1' : 'gap-3 px-2.5 py-2')}>
            <Avatar src={user?.avatarUrl} name={fullName} size="sm" className="workspace-nav-avatar border-white/10" />
            {!compact && <><span className="min-w-0 flex-1 text-left"><span className="workspace-nav-name block truncate text-xs font-semibold text-white">{fullName}</span><span className="workspace-nav-muted mt-0.5 block text-[11px] text-neutral-400">{roleLabel}</span></span><Icon name="expand_more" size="xs" className="workspace-nav-muted text-neutral-400" /></>}
          </span>}
        />}
      </div>
    </div>
  );

  return (
    <div className={cn('flex min-h-screen bg-canvas text-fg antialiased', friendly && 'workspace-friendly', role === 'Student' && 'student-workspace', role === 'Admin' && 'admin-workspace')}>
      <aside id="workspace-sidebar" className={cn('sticky top-0 z-50 hidden h-screen shrink-0 flex-col border-r border-brand-navy-800 bg-brand-navy-900 text-white transition-[width] duration-200 motion-reduce:transition-none lg:flex', collapsed ? 'w-[68px]' : 'w-[232px]', friendly && 'workspace-navigation-light')}>
        {sidebar(collapsed)}
      </aside>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Menu điều hướng" hideHeader
        widthClass="w-72" panelClassName={cn('bg-brand-navy-900 text-white', friendly && 'workspace-friendly workspace-navigation-light')} contentClassName="p-0">
        {sidebar(false, true)}
      </Drawer>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className={cn('sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur-md', role !== 'Admin' && 'lg:hidden')}>
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <Link to={getDashboardPath(role)} className="rounded-lg focus-visible:ring-2 focus-visible:ring-brand-primary-500 lg:hidden" aria-label="TutorHub">
              <Logo variant="horizontal" size={32} />
            </Link>
            {role === 'Admin' && <span className="hidden text-xs font-medium text-fg-secondary lg:block">Không gian quản trị</span>}
            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              {role === 'Admin' && <Link to="/app/notifications" aria-label={activity.notifications > 0 ? `Thông báo, ${activity.notifications} chưa đọc` : 'Thông báo'} aria-current={location.pathname.startsWith('/app/notifications') ? 'page' : undefined} title="Thông báo" className="relative flex h-11 w-11 items-center justify-center rounded-xl text-fg-secondary hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary-600 aria-[current=page]:bg-brand-primary-50 aria-[current=page]:text-primary">
                <Icon name="notifications" size="md" /><UnreadBadge count={activity.notifications} label="thông báo chưa đọc" floating />
              </Link>}
              <AccountDropdown label="Mở menu tài khoản" className={role === 'Admin' ? 'lg:hidden' : undefined}
                trigger={<span className="flex min-h-11 items-center gap-2 rounded-xl p-1 transition-colors duration-150 hover:bg-neutral-100">
                  <Avatar src={user?.avatarUrl} name={fullName} size="sm" />
                  <Icon name="expand_more" size="xs" className="hidden text-fg-muted sm:block" />
                </span>}
              />
            </div>
          </div>
        </header>
        <main className={cn('mx-auto w-full flex-1 px-4 py-6 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:px-6 lg:p-8', location.pathname.startsWith('/app/messages') ? 'max-w-[1280px]' : 'max-w-[1120px]')}>
          {children}
        </main>
      </div>
      <WorkspaceMobileNav items={mobilePrimary} activity={activity} moreActive={moreActive} moreOpen={drawerOpen} onMore={() => setDrawerOpen(true)} />
    </div>
  );
}
