import React, { useEffect, useId, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/Icon';
import { cn } from '@/lib/cn';
import notificationService from '@/services/notification.service';
import { presentNotification } from '@/utils/notificationPresentation';
import { formatRelativeTime, formatDateTime } from '@/utils/formatters';
import UnreadBadge from './UnreadBadge';
import '@/styles/popovers.css';

export default function WorkspaceNotifications({ count, role, pathname }) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [busy, setBusy] = useState(false);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const firstTabRef = useRef(null);
  const panelId = useId();
  const navigate = useNavigate();

  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    if (!open) return undefined;
    firstTabRef.current?.focus();
    const outside = event => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const escape = event => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('mousedown', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    setLoading(true);
    setError('');
    notificationService.getNotifications({ pageSize: 8, unreadOnly: filter === 'unread' ? true : null })
      .then(page => { if (!cancelled) setItems(page.items); })
      .catch(() => { if (!cancelled) setError('Không thể tải thông báo. Vui lòng thử lại.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [open, filter, count, retry]);

  const openNotification = async item => {
    if (busy) return;
    setBusy(true);
    try {
      if (!item.isRead && !await notificationService.markAsRead(item.id)) throw new Error('Không thể đánh dấu đã đọc.');
      setItems(previous => previous.map(n => n.id === item.id ? { ...n, isRead: true } : n));
      setOpen(false);
      navigate(`/app/notifications/${item.id}`);
    } catch {
      setError('Không thể cập nhật thông báo. Vui lòng thử lại.');
    } finally { setBusy(false); }
  };

  return (
    <div className="relative" ref={rootRef}>
      <button ref={triggerRef} type="button" onClick={() => setOpen(value => !value)}
        aria-label={count > 0 ? `Thông báo, ${count} chưa đọc` : 'Thông báo'}
        title="Thông báo" aria-haspopup="dialog" aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl text-fg-secondary transition-colors duration-150 hover:bg-neutral-100 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary-500">
        <Icon name="notifications" size="md" />
        <UnreadBadge count={count} label="thông báo chưa đọc" floating />
      </button>

      {open && (
        <section id={panelId} role="dialog" aria-label="Thông báo" aria-busy={loading}
          className="workspace-popover fixed right-4 top-20 z-50 w-[calc(100vw-2rem)] max-w-[380px] overflow-hidden rounded-2xl border border-border bg-surface shadow-brand-lg sm:absolute sm:right-0 sm:top-full sm:mt-3 sm:w-[380px]">
          <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-4">
            <h2 className="font-semibold text-fg">Thông báo</h2>
            {count > 0 && <span className="rounded-full bg-brand-primary-50 px-2 py-1 text-xs font-medium text-brand-primary-700">{count > 99 ? '99+' : count} chưa đọc</span>}
          </div>
          <div role="group" aria-label="Lọc thông báo" className="flex gap-1 border-b border-border px-5 pb-3">
            {[['all', 'Tất cả'], ['unread', 'Chưa đọc']].map(([key, label], index) => (
              <button key={key} ref={index === 0 ? firstTabRef : undefined} type="button"
                aria-pressed={filter === key} onClick={() => setFilter(key)}
                className={cn('rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary-500',
                  filter === key ? 'bg-brand-primary-50 text-brand-primary-700' : 'text-fg-secondary hover:bg-neutral-100')}>
                {label}
              </button>
            ))}
          </div>

          <div className="max-h-[min(380px,55dvh)] overflow-y-auto">
            {loading ? (
              <div className="space-y-4 p-5" role="status" aria-label="Đang tải thông báo">
                {[0, 1, 2].map(key => <div key={key} className="flex gap-3 motion-safe:animate-pulse">
                  <div className="h-9 w-9 shrink-0 rounded-xl bg-neutral-100" />
                  <div className="flex-1 space-y-2"><div className="h-3 w-3/4 rounded bg-neutral-100" /><div className="h-3 rounded bg-neutral-100" /></div>
                </div>)}
              </div>
            ) : error ? (
              <div className="p-5 text-center">
                <p role="alert" className="text-sm text-fg-secondary">{error}</p>
                <button type="button" onClick={() => setRetry(value => value + 1)} className="mt-3 rounded-lg px-3 py-2 text-sm font-semibold text-brand-primary-600 hover:bg-brand-primary-50 focus-visible:ring-2 focus-visible:ring-brand-primary-500">Thử lại</button>
              </div>
            ) : items.length === 0 ? (
              <div className="px-6 py-9 text-center">
                <Icon name="notifications_off" size="lg" className="mx-auto mb-3 text-fg-muted" />
                <p className="text-sm font-medium text-fg">{filter === 'unread' ? 'Bạn đã đọc hết thông báo' : 'Chưa có thông báo'}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-fg-muted">Cập nhật về lớp học và học phí sẽ xuất hiện tại đây.</p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {items.map(item => {
                  const content = presentNotification(item, role);
                  return <li key={item.id}>
                  <button type="button" disabled={busy} onClick={() => openNotification(item)}
                    className={cn('flex w-full items-start gap-3 px-5 py-4 text-left transition-colors duration-150 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-primary-500 disabled:opacity-60', !item.isRead && 'bg-brand-primary-50/40')}>
                    <span className={cn('mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border', item.isCritical ? 'bg-holding-subtle text-holding-strong' : 'bg-surface text-primary')}><Icon name={content.icon} size="sm" /></span>
                    <span className="min-w-0 flex-1">
                      <span className={cn('block text-sm leading-snug text-fg', !item.isRead ? 'font-semibold' : 'font-medium')}>{content.title}</span>
                      <span className="mt-1 block text-xs leading-relaxed text-fg-secondary line-clamp-2">{content.message}</span>
                      <span title={formatDateTime(item.createdAt)} className="mt-2 block text-[11px] text-fg-secondary">{formatRelativeTime(item.createdAt)}</span>
                    </span>
                    {!item.isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-primary-600" aria-label="Chưa đọc" />}
                  </button>
                </li>; })}
              </ul>
            )}
          </div>
          <Link to="/app/notifications" onClick={() => setOpen(false)}
            className="flex min-h-11 items-center justify-center gap-2 border-t border-border px-4 py-3 text-sm font-semibold text-brand-primary-600 transition-colors duration-150 hover:bg-brand-primary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-primary-500">
            Xem tất cả thông báo <Icon name="arrow_forward" size="xs" />
          </Link>
        </section>
      )}
    </div>
  );
}
WorkspaceNotifications.propTypes = { count: PropTypes.number, role: PropTypes.string, pathname: PropTypes.string };
