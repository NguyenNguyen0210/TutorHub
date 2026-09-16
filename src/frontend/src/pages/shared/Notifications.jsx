import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import notificationService from '@/services/notification.service';
import { formatRelativeTime } from '@/utils/formatters';
import { ListSkeleton } from '@/components/common/Skeleton';
import EmptyState from '@/components/common/EmptyState';
import { message } from 'antd';

export default function Notifications() {
  const [activeTab, setActiveTab] = useState('All');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const res = await notificationService.getNotifications({ pageSize: 50 });
      setNotifications(res?.items || []);
    } catch (err) {
      message.error(err?.message || 'Không thể tải danh sách thông báo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAsRead = async (id, isRead) => {
    if (isRead) return;
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      message.error(err?.message || 'Không thể đánh dấu đã đọc.');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      message.success('Đã đánh dấu tất cả thông báo là đã đọc');
    } catch (err) {
      message.error(err?.message || 'Không thể đánh dấu tất cả đã đọc.');
    }
  };

  const getCategoryFromType = (type) => {
    if (!type) return 'System';
    const lower = type.toLowerCase();
    if (lower.includes('payment') || lower.includes('earning') || lower.includes('refund') || lower.includes('wallet')) return 'Financial';
    if (lower.includes('attendance') || lower.includes('session')) return 'Attendance';
    if (lower.includes('dispute')) return 'Dispute';
    return 'System';
  };

  const filtered = activeTab === 'All'
    ? notifications
    : notifications.filter((n) => getCategoryFromType(n.type) === activeTab);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Trung Tâm Thông Báo & Cảnh Báo Hệ Thống
            </h1>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold font-mono">
                {unreadCount} mới
              </span>
            )}
          </div>
          <p className="text-xs text-text-muted mt-1">
            Theo dõi tức thời các biến động tài chính, đối soát điểm danh 24h và cập nhật hợp đồng
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="text-xs font-bold text-brand-indigo-600 hover:underline self-start sm:self-auto"
          >
            Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border-light pb-2 text-xs font-bold overflow-x-auto">
        {[
          { key: 'All', label: 'Tất Cả' },
          { key: 'Financial', label: 'Tài Chính & Ký Quỹ' },
          { key: 'Attendance', label: 'Điểm Danh 24H' },
          { key: 'Dispute', label: 'Tranh Chấp' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? 'bg-brand-indigo-50 text-brand-indigo-700'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
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
            const borderColor =
              category === 'Financial'
                ? 'border-l-brand-indigo-600'
                : category === 'Attendance'
                ? 'border-l-amber-500'
                : category === 'Dispute'
                ? 'border-l-rose-500'
                : 'border-l-slate-400';

            const iconName =
              category === 'Financial'
                ? 'payment'
                : category === 'Attendance'
                ? 'schedule'
                : category === 'Dispute'
                ? 'gavel'
                : 'info';

            return (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleMarkAsRead(item.id, item.isRead);
                  }
                }}
                onClick={() => handleMarkAsRead(item.id, item.isRead)}
                className={`p-5 rounded-2xl border border-border-light border-l-4 ${borderColor} ${
                  !item.isRead ? 'bg-indigo-50/20 shadow-xs' : 'bg-white opacity-85'
                } transition-all space-y-2 cursor-pointer hover:shadow-sm focus:outline-hidden focus:ring-2 focus:ring-brand-indigo-500`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-brand-indigo-600 text-lg">
                      {iconName}
                    </span>
                    <h3 className="font-extrabold text-xs text-slate-900 m-0">{item.title}</h3>
                    {!item.isRead && (
                      <span className="w-2 h-2 rounded-full bg-brand-indigo-600 shrink-0" />
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">
                    {item.createdAt ? formatRelativeTime(item.createdAt) : ''}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed m-0 pl-6.5">{item.message}</p>

                {item.deepLink && (
                  <div className="pl-6.5 pt-1">
                    <Link
                      to={item.deepLink}
                      className="text-xs font-bold text-brand-indigo-600 hover:underline inline-flex items-center gap-1"
                    >
                      <span>Xem chi tiết</span>
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </Link>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
