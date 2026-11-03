import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/cn';
import Icon from '@/components/ui/Icon';
import Logo from '@/components/ui/Logo';
import Avatar from '@/components/ui/Avatar';
import { useAuthStore } from '@/store/authStore';
import AccountDropdown from './AccountDropdown';
import { getWorkspaceEntry, getDiscoveryNav } from './navConfig';

/** Public navigation is for discovery; role-specific tools live in the workspace. */
export default function PublicTopbar() {
  const { user, role, isAuthenticated } = useAuthStore();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const workspace = getWorkspaceEntry(role);
  const discoveryLinks = getDiscoveryNav();
  const authLinkState = /^\/(tutors|services)\/[^/]+/.test(location.pathname)
    ? { returnUrl: `${location.pathname}${location.search}${location.hash}` }
    : undefined;

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, location.search, isAuthenticated]);

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setMobileOpen(false);
        document.getElementById('discovery-menu-toggle')?.focus();
      }
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [mobileOpen]);

  const displayName = user?.fullName || user?.name || user?.email?.split('@')[0] || 'Tài khoản';
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface">
      <div className="page-shell flex h-[72px] items-center justify-between gap-2 lg:grid lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:gap-4">
        <Link to="/" aria-label="TutorHub — Khám phá gia sư" className="flex shrink-0 items-center justify-self-start">
          <Logo variant="mark" size={36} className="sm:hidden" />
          <Logo variant="horizontal" size={36} className="hidden sm:inline-flex" />
        </Link>

        <nav className="hidden items-center justify-self-center gap-1 lg:flex" aria-label="Điều hướng chính">
          {discoveryLinks.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              aria-current={item.match(location.pathname) ? 'page' : undefined}
              className={cn(
                'inline-flex min-h-11 items-center border-b-2 px-3.5 py-2 text-[14px] font-semibold transition-colors',
                item.match(location.pathname)
                  ? 'border-brand-primary-600 text-brand-primary-700'
                  : 'border-transparent text-fg-secondary hover:border-neutral-300 hover:text-fg'
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex min-w-0 items-center justify-self-end gap-1 sm:gap-2.5">
          {isAuthenticated ? (
            <>
              <Link
                to={workspace.path}
                className="inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-brand-md bg-primary px-3 text-[12px] font-semibold text-white shadow-brand-sm transition-colors hover:bg-primary-hover sm:px-4 sm:text-[13px]"
              >
                <Icon name={workspace.icon} size="sm" className="hidden sm:block" />
                {workspace.label}
              </Link>
              <AccountDropdown
                label={`Tài khoản ${displayName}`}
                trigger={
                  <span className="flex min-h-11 items-center gap-1.5 rounded-brand-md px-1.5 transition-colors hover:bg-neutral-100">
                    <Avatar src={user?.avatarUrl} name={displayName} size="sm" className="h-8 w-8 text-[12px]" />
                    <span className="hidden max-w-[120px] truncate text-caption font-bold text-fg xl:inline">{displayName}</span>
                    <Icon name="expand_more" size="xs" className="hidden text-fg-muted sm:block" />
                  </span>
                }
              />
            </>
          ) : (
            <div className="flex items-center gap-2 sm:gap-2.5">
              <Link to="/auth/register" state={authLinkState} className="hidden h-11 items-center justify-center rounded-brand-md border border-neutral-300 bg-surface px-4 text-[14px] font-medium text-fg-secondary transition-colors hover:bg-neutral-50 sm:inline-flex">
                Đăng ký
              </Link>
              <Link to="/auth/login" state={authLinkState} className="inline-flex h-11 items-center justify-center rounded-brand-md bg-primary px-4 text-[14px] font-semibold text-white shadow-brand-sm transition-colors hover:bg-primary-hover">
                Đăng nhập
              </Link>
            </div>
          )}

          <button
            id="discovery-menu-toggle"
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label={mobileOpen ? 'Đóng menu' : 'Mở menu'}
            aria-expanded={mobileOpen}
            aria-controls="discovery-mobile-menu"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-brand-md text-fg-secondary transition-colors hover:bg-neutral-100 lg:hidden"
          >
            <Icon name={mobileOpen ? 'close' : 'menu'} size="md" />
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav id="discovery-mobile-menu" aria-label="Điều hướng Khám phá" className="space-y-1 border-t border-border bg-surface px-4 pb-4 pt-2 lg:hidden">
          {discoveryLinks.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              aria-current={item.match(location.pathname) ? 'page' : undefined}
              className={cn(
                'flex min-h-11 items-center gap-3 rounded-brand-md px-3 py-2.5 text-body-reg font-semibold transition-colors',
                item.match(location.pathname) ? 'bg-brand-primary-50 text-brand-primary-700' : 'text-fg-secondary hover:bg-neutral-100'
              )}
            >
              <Icon name={item.icon} size="md" />
              {item.label}
            </Link>
          ))}
          {!isAuthenticated && (
            <Link to="/auth/register" state={authLinkState} className="flex min-h-11 items-center rounded-brand-md border border-border px-3 text-body-reg font-semibold text-fg-secondary">
              Đăng ký tài khoản
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}
