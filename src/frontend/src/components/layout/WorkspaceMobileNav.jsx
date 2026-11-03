import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/cn';
import Icon from '@/components/ui/Icon';
import UnreadBadge from './UnreadBadge';

export default function WorkspaceMobileNav({ items, activity, moreActive, moreOpen, onMore }) {
  const { pathname } = useLocation();
  return (
    <nav aria-label="Điều hướng chính trên di động" className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface px-3 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] lg:hidden">
      <div className="mx-auto flex max-w-lg gap-1">
        {items.map(item => {
          const count = item.path === '/app/messages' ? activity.conversations : item.path === '/app/notifications' ? activity.notifications : 0;
          return <Link key={item.path} to={item.path} aria-current={item.match(pathname) ? 'page' : undefined}
            className={cn('flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', item.match(pathname) ? 'bg-brand-primary-50 text-primary' : 'text-fg-secondary hover:bg-neutral-100')}>
            <span className="relative"><Icon name={item.icon} size="md" /><UnreadBadge count={count} floating label={item.path === '/app/messages' ? 'cuộc trò chuyện chưa đọc' : 'thông báo chưa đọc'} /></span>
            <span>{item.shortLabel || item.label}</span>
          </Link>;
        })}
        <button type="button" onClick={onMore} aria-expanded={moreOpen} aria-haspopup="dialog" aria-controls={moreOpen ? 'workspace-more-navigation' : undefined}
          className={cn('flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', moreActive || moreOpen ? 'bg-brand-primary-50 text-primary' : 'text-fg-secondary hover:bg-neutral-100')}>
          <Icon name="menu" size="md" />Thêm
        </button>
      </div>
    </nav>
  );
}
