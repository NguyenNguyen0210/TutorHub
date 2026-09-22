import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';
import notificationService from '@/services/notification.service';
import { formatRelativeTime } from '@/utils/formatters';
import { ListSkeleton } from '@/components/common/Skeleton';
import EmptyState from '@/components/common/EmptyState';
import { useToast } from '@/components/ui/Toast';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/ui/Icon';
import Tabs from '@/components/ui/Tabs';
import { PageHeader } from '@/components/ui/StatCard';
import { useAuthStore } from '@/store/authStore';

function resolveDeepLink(link, role) {
  if (!link) return null;
  if (link.startsWith('/enrollments/')) {
    return `/student${link}`;
  }
  if (link.startsWith('/sessions/')) {
    return role === 'Tutor' ? `/tutor${link}` : `/student${link}`;
  }
  if (link.startsWith('/bookings/')) {
    return `/student${link}/checkout`;
  }
  if (link.startsWith('/chat/') || link.startsWith('/chat')) {
    return '/app/messages';
  }
  return link;
}

export default function Notifications() {
  const toast = useToast();
  const { role } = useAuthStore();
  const [activeTab, setActiveTab] = useState('All');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadNotifications() {
      try {
        setLoading(true);
        const res = await notificationService.getNotifications({ pageSize: 50 });
        if (!cancelled) setNotifications(res?.items || []);
      } catch (err) {
        if (!cancelled) toast.error(err?.message || 'Không thể tải danh sách thông báo.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadNotifications();
    return () => {
      cancelled = true;
    };
  }, [toast]);

  const handleMarkAsRead = async (id, isRead) => {
    if (isRead) return;
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      toast.error(err?.message || 'Không thể đánh dấu đã đọc.');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success('Đã đánh dấu tất cả thông báo là đã đọc');
    } catch (err) {
      toast.error(err?.message || 'Không thể đánh dấu tất cả đã đọc.');
    }
  };

  const getCategoryFromType = (type) => {
    if (!type) return 'System';
    const lower = type.toLowerCase();
    if (lower.includes('payment') || lower.includes('earning') || lower.includes('refund') || lower.includes('wallet') || lower.includes('payout')) return 'Financial';
    if (lower.includes('attendance') || lower.includes('session')) return 'Attendance';
    if (lower.includes('dispute')) return 'Dispute';
    return 'System';
  };

  const filtered = activeTab === 'All'
    ? notifications
    : notifications.filter((n) => getCategoryFromType(n.type) === activeTab);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const CATEGORY_STYLE = {
    Financial: { bar: 'border-l-brand-primary-600', icon: 'payment', iconCls: 'text-brand-primary-600' },
    Attendance: { bar: 'border-l-holding', icon: 'schedule', iconCls: 'text-holding' },
    Dispute: { bar: 'border-l-danger', icon: 'gavel', iconCls: 'text-danger' },
    System: { bar: 'border-l-neutral-400', icon: 'info', iconCls: 'text-fg-muted' },
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <PageHeader
        title={
          <span className="flex items-center gap-2 flex-wrap">
            Trung tâm thông báo & Cảnh báo hệ thống
            {unreadCount > 0 && (
              <Badge variant="danger" size="sm">
                {unreadCount} mới
              </Badge>
            )}
          </span>
        }
        subtitle="Theo dõi tức thời các biến động tài chính, đối soát điểm danh 24h và cập nhật hợp đồng"
        actions={
          unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="text-caption font-semibold text-brand-primary-700 hover:underline"
            >
              Đánh dấu tất cả đã đọc
            </button>
          )
        }
      />

      <Tabs
        value={activeTab}
        onChange={setActiveTab}
        tabs={[
          { key: 'All', label: 'Tất cả' },
          { key: 'Financial', label: 'Tài chính & Ký quỹ' },
          { key: 'Attendance', label: 'Điểm danh 24h' },
          { key: 'Dispute', label: 'Tranh chấp' },
        ]}
      />

      <div className="space-y-3">
        {loading ? (
          <ListSkeleton count={4} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="notifications_off"
            title="Không có thông báo nào"
            description={
              activeTab === 'All'
                ? 'Bạn đã xem hết toàn bộ thông báo.'
                : 'Chưa có thông báo nào thuộc danh mục này.'
            }
          />
        ) : (
          filtered.map((item) => {
            const category = getCategoryFromType(item.type);
            const style = CATEGORY_STYLE[category] || CATEGORY_STYLE.System;

            return (
              <Card
                key={item.id}
                padding="md"
                className={cn(
                  'w-full text-left border-l-4 space-y-2 hover:shadow-brand-md',
                  style.bar,
                  !item.isRead ? 'bg-brand-primary-50/20' : 'opacity-85'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon name={style.icon} size="sm" className={style.iconCls} />
                    <h3 className="font-bold text-body-reg text-fg m-0 truncate">
                      {item.title}
                    </h3>
                    {!item.isRead && (
                      <button
                        type="button"
                        onClick={() => handleMarkAsRead(item.id, item.isRead)}
                        aria-label={`Đánh dấu đã đọc: ${item.title}`}
                        title="Đánh dấu đã đọc"
                        className="w-2.5 h-2.5 rounded-full bg-brand-primary-600 shrink-0 hover:ring-2 hover:ring-brand-primary-300 transition-shadow"
                      />
                    )}
                  </div>
                  <span className="text-[10px] text-fg-muted font-mono shrink-0">
                    {item.createdAt ? formatRelativeTime(item.createdAt) : ''}
                  </span>
                </div>

                <p className="text-caption text-fg-secondary leading-relaxed m-0 pl-7">
                  {item.message}
                </p>

                {item.deepLink && (
                  <div className="pl-7 pt-1">
                    <Link
                      to={resolveDeepLink(item.deepLink, role)}
                      onClick={(e) => e.stopPropagation()}
                      className="text-caption font-semibold text-brand-primary-700 hover:underline inline-flex items-center gap-1"
                    >
                      Xem chi tiết
                      <Icon name="arrow_forward" size="sm" />
                    </Link>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
