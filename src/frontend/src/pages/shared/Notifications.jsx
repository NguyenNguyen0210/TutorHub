import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/cn';
import notificationService from '@/services/notification.service';
import { formatRelativeTime, formatDateTime } from '@/utils/formatters';
import { presentNotification } from '@/utils/notificationPresentation';
import { WORKSPACE_ACTIVITY_CHANGED, notifyWorkspaceActivityChanged } from '@/utils/workspaceActivity';
import { useToast } from '@/components/ui/Toast';
import Card from '@/components/ui/Card';
import Button, { IconButton } from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Tabs from '@/components/ui/Tabs';
import { useAuthStore } from '@/store/authStore';

function NotificationSkeleton() {
  return <div role="status" aria-label="Đang tải thông báo" className="space-y-3">
    {[0, 1, 2, 3].map(key => <Card key={key} padding="md" variant="outlined" className="flex gap-4 rounded-xl" aria-hidden="true">
      <div className="h-10 w-10 shrink-0 rounded-xl bg-neutral-100 motion-safe:animate-pulse" />
      <div className="flex-1 space-y-3"><div className="h-4 w-2/3 rounded bg-neutral-100 motion-safe:animate-pulse" /><div className="h-3 rounded bg-neutral-100 motion-safe:animate-pulse" /><div className="h-3 w-1/3 rounded bg-neutral-100 motion-safe:animate-pulse" /></div>
    </Card>)}
  </div>;
}

export default function Notifications() {
  const toast = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { role: storedRole, user } = useAuthStore();
  const role = user?.role || storedRole;
  const userId = user?.id || user?.userId;
  const [unreadOnly, setUnreadOnly] = useState(false);
  const rootKey = useMemo(() => ['notifications', userId], [userId]);
  const feedKey = useMemo(() => [...rootKey, 'feed', unreadOnly], [rootKey, unreadOnly]);
  const countKey = useMemo(() => [...rootKey, 'unread-count'], [rootKey]);

  const feed = useInfiniteQuery({
    queryKey: feedKey,
    enabled: Boolean(userId),
    initialPageParam: null,
    queryFn: ({ pageParam }) => notificationService.getNotifications({ unreadOnly: unreadOnly ? true : null, cursor: pageParam, pageSize: 20 }),
    getNextPageParam: page => page.hasMore ? page.nextCursor : undefined,
    refetchInterval: 30000,
  });
  const countQuery = useQuery({
    queryKey: countKey,
    enabled: Boolean(userId),
    queryFn: () => notificationService.getUnreadCount(),
    refetchInterval: 30000,
  });
  useEffect(() => {
    const refresh = () => { queryClient.invalidateQueries({ queryKey: rootKey }); };
    window.addEventListener(WORKSPACE_ACTIVITY_CHANGED, refresh);
    return () => window.removeEventListener(WORKSPACE_ACTIVITY_CHANGED, refresh);
  }, [queryClient, rootKey]);

  const applyRead = async id => {
    await queryClient.cancelQueries({ queryKey: rootKey });
    queryClient.setQueriesData({ queryKey: [...rootKey, 'feed'] }, previous => previous ? {
      ...previous, pages: previous.pages.map(page => ({
        ...page, items: page.items.map(item => !id || item.id === id ? { ...item, isRead: true } : item),
      })),
    } : previous);
    queryClient.setQueryData(countKey, previous => typeof previous === 'number' ? id ? Math.max(0, previous - 1) : 0 : previous);
    queryClient.invalidateQueries({ queryKey: rootKey });
    notifyWorkspaceActivityChanged({ userId, unreadNotifications: queryClient.getQueryData(countKey) });
  };
  const markOne = useMutation({
    mutationFn: async ({ item }) => {
      if (!item.isRead) {
        const succeeded = await notificationService.markAsRead(item.id);
        if (!succeeded) throw new Error('Không thể đánh dấu thông báo đã đọc.');
      }
    },
    onSuccess: async (_, { item, destination }) => {
      if (!item.isRead) await applyRead(item.id);
      if (destination) navigate(destination);
    },
    onError: () => toast.error('Chưa thể cập nhật trạng thái đã đọc. Vui lòng thử lại.'),
  });
  const markAll = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: async () => {
      await applyRead();
      toast.success('Đã đọc tất cả thông báo.');
    },
    onError: () => toast.error('Chưa thể đánh dấu tất cả đã đọc. Vui lòng thử lại.'),
  });
  const busy = markOne.isPending || markAll.isPending;
  const unreadCount = countQuery.data;
  const notifications = [...new Map((feed.data?.pages.flatMap(page => page.items) || []).map(item => [item.id, item])).values()]
    .filter(item => !unreadOnly || !item.isRead)
    .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
  const today = formatDateTime(Date.now(), 'DD/MM/YYYY');
  const yesterday = formatDateTime(Date.now() - 86400000, 'DD/MM/YYYY');
  const group = item => {
    if (notifications.length < 5) return 'Thông báo gần đây';
    const date = formatDateTime(item.createdAt, 'DD/MM/YYYY');
    return date === today ? 'Hôm nay' : date === yesterday ? 'Hôm qua' : 'Trước đó';
  };
  const dashboardPath = role === 'Tutor' ? '/tutor/dashboard' : role === 'Admin' ? '/admin/dashboard' : '/student/dashboard';

  return (
    <div className="mx-auto max-w-[880px] space-y-6">
      <nav aria-label="Đường dẫn thông báo" className="text-caption text-fg-secondary"><ol className="flex items-center gap-2"><li><Link to={dashboardPath} className="hover:text-primary focus-visible:underline">{role === 'Student' ? 'Bàn học' : 'Bảng điều hành'}</Link></li><li aria-hidden="true">/</li><li aria-current="page" className="font-medium text-fg">Thông báo</li></ol></nav>
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h1 className="text-[28px] font-semibold leading-tight text-fg">Thông báo</h1>
          <p className="mt-2 text-body-reg leading-relaxed text-fg-secondary">Cập nhật hoạt động học tập, thanh toán và tài khoản.</p>
        </div>
        <Button variant="outline" onClick={() => markAll.mutate()} loading={markAll.isPending} disabled={busy || !unreadCount || countQuery.isError}
          icon={<Icon name="done_all" size="sm" />} className="self-start shrink-0">Đọc tất cả</Button>
      </header>
      <div>
        <Tabs value={unreadOnly ? 'unread' : 'all'} onChange={key => setUnreadOnly(key === 'unread')}
          tabs={[{ key: 'all', label: 'Tất cả' }, { key: 'unread', label: <span className="inline-flex items-center gap-2">Chưa đọc{typeof unreadCount === 'number' && !countQuery.isError && unreadCount > 0 && <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] tabular-nums text-fg-secondary">{unreadCount}</span>}</span> }]} />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-caption text-fg-secondary">
          <p>Thông báo mới nhất được hiển thị trước.</p>
          {!feed.isPending && !feed.isError && <p>Đang hiển thị {notifications.length} thông báo{unreadOnly ? ' chưa đọc' : ''}.</p>}
        </div>
        {countQuery.isError && <button type="button" onClick={() => countQuery.refetch()} className="mt-2 min-h-11 rounded text-caption text-primary focus-visible:ring-2 focus-visible:ring-ring">Chưa tải được số thông báo chưa đọc · Thử lại</button>}
      </div>

      {feed.isPending || (feed.isFetching && notifications.length === 0) ? <NotificationSkeleton /> : feed.isError && !feed.data ? (
        <Card padding="lg" variant="outlined" className="rounded-2xl text-center">
          <h2 className="text-headline-3 font-semibold text-fg">Chưa tải được thông báo</h2>
          <p className="mt-2 text-body-reg text-fg-secondary">Vui lòng thử lại để xem các cập nhật mới nhất.</p>
          <Button variant="outline" className="mt-5" onClick={() => feed.refetch()} loading={feed.isFetching}>Thử lại</Button>
        </Card>
      ) : (
        <>
          {feed.isError && <div role="alert" className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-surface px-4 py-2 text-caption text-fg-secondary"><p>Chưa tải được cập nhật mới. Các thông báo đã tải vẫn được giữ lại.</p><Button variant="ghost" onClick={() => feed.refetch()} loading={feed.isFetching}>Thử lại</Button></div>}
          {notifications.length === 0 ? (
            <Card padding="lg" variant="outlined" className="rounded-2xl py-12 text-center">
              <Icon name={unreadOnly ? 'done_all' : 'notifications_off'} size="xl" className="mx-auto mb-4 text-primary" />
              <h2 className="text-headline-3 font-semibold text-fg">{unreadOnly ? 'Không có thông báo chưa đọc' : 'Chưa có thông báo'}</h2>
              <p className="mx-auto mt-3 max-w-md text-body-reg leading-relaxed text-fg-secondary">{unreadOnly ? 'Bạn đã đọc hết các cập nhật. Bạn có thể xem lại trong mục Tất cả.' : 'Các cập nhật về lớp học, thanh toán và tài khoản sẽ xuất hiện tại đây.'}</p>
              {unreadOnly && <Button variant="outline" className="mt-5" onClick={() => setUnreadOnly(false)}>Xem tất cả thông báo</Button>}
            </Card>
          ) : (
            <ol className="space-y-3">
              {notifications.map((item, index) => {
                const content = presentNotification(item, role);
                const groupTitle = group(item);
                const startGroup = index === 0 || groupTitle !== group(notifications[index - 1]);
                const updating = markOne.isPending && markOne.variables?.item.id === item.id;
                return <li key={item.id}>
                  {startGroup && <h2 className={cn('mb-3 text-caption font-semibold text-fg-secondary', index > 0 && 'pt-4')}>{groupTitle}</h2>}
                  <Card as="article" padding="none" variant="outlined" className={cn('relative rounded-xl transition-colors hover:border-brand-primary-300', item.isRead ? 'bg-surface' : 'bg-brand-primary-50/50')}>
                    <Link to={`/app/notifications/${item.id}`} aria-disabled={busy || undefined}
                      onClick={event => {
                        if (busy) { event.preventDefault(); return; }
                        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) { markOne.mutate({ item }); return; }
                        event.preventDefault(); markOne.mutate({ item, destination: `/app/notifications/${item.id}` });
                      }} className="flex items-start gap-3 rounded-xl p-5 pr-16 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:gap-4">
                    <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', item.isCritical ? 'bg-holding-subtle text-holding-strong' : 'border border-border bg-surface text-primary')}><Icon name={content.icon} size="md" /></span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <h3 className={cn('break-words text-body-reg leading-relaxed text-fg', item.isRead ? 'font-normal' : 'font-semibold')}>{content.title}</h3>
                        {!item.isRead && <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-brand-primary-700"><span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />Chưa đọc</span>}
                        {item.isCritical && <span className="rounded-md bg-holding-subtle px-2 py-0.5 text-[11px] font-medium text-holding-strong">Quan trọng</span>}
                      </div>
                      {content.message && <p className="mt-1 break-words text-body-reg leading-relaxed text-fg-secondary">{content.message}</p>}
                      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                        <span className="inline-flex min-h-11 items-center gap-1.5 text-caption font-semibold text-primary">{content.destination ? content.action : 'Xem thông báo'}<Icon name="arrow_forward" size="sm" /></span>
                        {item.createdAt && <time dateTime={item.createdAt} title={formatDateTime(item.createdAt)} className="text-caption text-fg-secondary">{formatRelativeTime(item.createdAt)}</time>}
                      </div>
                    </div>
                    </Link>
                    {!item.isRead && <IconButton label={updating ? 'Đang cập nhật thông báo' : `Đánh dấu đã đọc: ${content.title}`} title="Đánh dấu đã đọc" disabled={busy} onClick={() => markOne.mutate({ item })} variant="ghost" icon={<Icon name={updating ? 'schedule' : 'check'} size="sm" />} className="absolute right-2 top-3 text-fg-secondary" />}
                  </Card>
                </li>;
              })}
            </ol>
          )}
          {feed.hasNextPage && <div className="text-center"><Button variant="outline" onClick={() => feed.fetchNextPage()} loading={feed.isFetchingNextPage} disabled={feed.isFetching && !feed.isFetchingNextPage}>Xem thông báo trước</Button></div>}
        </>
      )}
    </div>
  );
}
