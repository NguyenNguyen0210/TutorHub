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
import Button, { IconButton } from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Tabs from '@/components/ui/Tabs';
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

/**
 * Phân loại thông báo — SUY ĐOÁN, không phải dữ liệu thật.
 *
 * DTO `Notification` từ API KHÔNG có field `category` (đã grep toàn repo: 0 kết quả),
 * nên hàm dưới đoán nhóm bằng cách tìm chuỗi trong `type`. Hệ quả đã ghi ở SPEC §4/§6:
 * một type mới từ backend có thể rơi nhầm nhóm mà không ai báo lỗi. Sửa đúng là thêm
 * `category` vào DTO backend — không tự bịa bản phân loại ở file này.
 *
 * THỨ TỰ KIỂM TRA LÀ HỢP ĐỒNG, không phải tình cờ. Một type có thể khớp nhiều nhóm và
 * nhóm đứng trước thắng — danh sách dưới chính là thứ tự đó, theo đúng thứ tự hàm cũ
 * chạy, nên không có type nào bị đổi nhóm. Cụ thể `SessionPayoutCredit` khớp CẢ "payout"
 * (Financial) LẪN "session" (Attendance); vì Financial đứng trước và có "payout" trong
 * từ khoá nên nó về nhóm Tài chính & Ký quỹ. Đổi thứ tự là đổi nghĩa phân loại của các
 * type đang chạy thật — nếu cần đổi thì phải sửa DTO, không sửa thứ tự ở đây.
 */
const CATEGORY_RULES = [
  ['Financial', ['payment', 'earning', 'refund', 'wallet', 'payout']],
  ['Attendance', ['attendance', 'session']],
  ['Dispute', ['dispute']],
];

function getCategoryFromType(type) {
  if (!type) return 'System';
  const lower = type.toLowerCase();
  for (const [category, keywords] of CATEGORY_RULES) {
    if (keywords.some((keyword) => lower.includes(keyword))) return category;
  }
  return 'System';
}

/**
 * Thanh bên trái + icon của từng nhóm.
 *
 * Mọi tên icon ở đây PHẢI có thật trong `lib/iconMap.js` — tên lạ sẽ fallback
 * `CircleHelp`, tức là nhóm Tài chính (nhóm quan trọng nhất) lại mang icon hỏng
 * (bug B-9: `payment` không tồn tại, đã đổi thành `payments` → Banknote).
 *
 * `System` dùng `text-fg-secondary` thay vì `text-fg-muted`: icon là nội dung
 * phi văn bản có ý nghĩa nên cần ≥ 3:1, còn `text-fg-muted` trên nền trắng chỉ
 * khoảng 2.6:1.
 */
const CATEGORY_STYLE = {
  Financial: { bar: 'border-l-brand-primary-600', icon: 'payments', iconCls: 'text-brand-primary-600' },
  Attendance: { bar: 'border-l-holding', icon: 'schedule', iconCls: 'text-holding' },
  Dispute: { bar: 'border-l-danger', icon: 'gavel', iconCls: 'text-danger' },
  System: { bar: 'border-l-neutral-400', icon: 'info', iconCls: 'text-fg-secondary' },
};

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

  const filtered = activeTab === 'All'
    ? notifications
    : notifications.filter((n) => getCategoryFromType(n.type) === activeTab);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-headline-page text-fg tracking-tight">
              Trung tâm thông báo & Cảnh báo hệ thống
            </h1>
            {/* "Còn N mới" là trạng thái đọc, không phải tín hiệu nguy hiểm —
                đỏ (danger) theo SPEC §1 dành cho xung đột / tranh chấp. */}
            {unreadCount > 0 && (
              <Badge variant="primary" size="sm" dot>
                {unreadCount} mới
              </Badge>
            )}
          </div>
          <p className="text-body-reg text-fg-secondary mt-2">
            Theo dõi tức thời các biến động tài chính, đối soát điểm danh 24h và cập nhật hợp đồng
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            icon={<Icon name="done_all" size="sm" />}
            className="self-start shrink-0"
          >
            Đánh dấu tất cả đã đọc
          </Button>
        )}
      </header>

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
            const isRead = Boolean(item.isRead);

            return (
              <Card
                key={item.id}
                padding="md"
                className={cn(
                  'w-full text-left border-l-4 space-y-2 hover:shadow-brand-md',
                  style.bar,
                  // Trạng thái đọc phân biệt bằng bề mặt + chấm, KHÔNG bằng hạ
                  // opacity: hạ opacity cả thẻ kéo chữ xuống dưới ngưỡng WCAG.
                  isRead ? 'bg-surface' : 'bg-brand-primary-50/20'
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon name={style.icon} size="sm" className={style.iconCls} />
                    <h3 className="font-bold text-body-reg text-fg m-0 truncate">
                      {item.title}
                    </h3>
                    {/* Chấm + nền là tín hiệu thị giác; screen reader cần chữ.
                        `sr-only` nên không dịch được hàng (absolute) — tiêu đề và
                        nội dung vẫn thẳng hàng ở pl-6. */}
                    {!isRead && <span className="sr-only">Chưa đọc</span>}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {!isRead && (
                      <span
                        aria-hidden="true"
                        className="w-2 h-2 rounded-full bg-brand-primary-600 shrink-0"
                      />
                    )}
                    <span className="text-[11px] text-fg-secondary font-mono whitespace-nowrap">
                      {item.createdAt ? formatRelativeTime(item.createdAt) : ''}
                    </span>
                    {!isRead && (
                      <IconButton
                        label={`Đánh dấu đã đọc: ${item.title}`}
                        size="sm"
                        onClick={() => handleMarkAsRead(item.id, item.isRead)}
                        icon={<Icon name="check" size="sm" />}
                      />
                    )}
                  </div>
                </div>

                <p className="text-caption text-fg-secondary leading-relaxed m-0 pl-6">
                  {item.message}
                </p>

                {item.deepLink && (
                  <div className="pl-6 pt-1">
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
