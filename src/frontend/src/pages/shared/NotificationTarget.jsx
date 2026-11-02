import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import notificationService from '@/services/notification.service';
import { presentNotification } from '@/utils/notificationPresentation';
import { formatDateTime } from '@/utils/formatters';
import { useAuthStore } from '@/store/authStore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';

export default function NotificationTarget() {
  const { id } = useParams();
  const { user, role } = useAuthStore();
  const navigate = useNavigate();
  const [state, setState] = useState({ loading: true });
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setState({ loading: true });
    (async () => {
      try {
        const item = await notificationService.getById(id);
        if (cancelled) return;
        if (!item.isRead && !await notificationService.markAsRead(id)) throw new Error('Chưa thể cập nhật thông báo. Vui lòng thử lại.');
        if (cancelled) return;
        const content = presentNotification(item, user?.role || role);
        // An old wallet-only link has no record identity: keep the exact notice visible
        // rather than silently opening an unrelated wallet tab.
        const genericWallet = /^\/(student|tutor)\/wallet(?:\?|$)/.test(content.destination || '')
          && !/[?&](recordId|bookingId)=[^&#]+/.test(content.destination);
        const genericAdminList = ['/admin/tutor-applications', '/admin/withdrawals', '/admin/student-wallets'].includes(content.destination?.split('?')[0])
          && !/[?&](recordId|applicationId|withdrawalId)=[^&#]+/.test(content.destination);
        if (content.destination && !genericWallet && !genericAdminList) navigate(content.destination, { replace: true });
        else setState({ loading: false, item, content });
      } catch (error) { if (!cancelled) setState({ loading: false, error }); }
    })();
    return () => { cancelled = true; };
  }, [id, user?.role, role, navigate, retry]);
  if (state.loading) return <div role="status" aria-label="Đang mở thông báo" className="mx-auto max-w-3xl space-y-4"><div className="h-8 w-1/2 rounded bg-neutral-100 motion-safe:animate-pulse" /><div className="h-44 rounded-2xl bg-neutral-100 motion-safe:animate-pulse" /></div>;
  if (state.error) {
    const unavailable = [403, 404].includes(state.error.status);
    return <Card padding="lg" variant="outlined" className="mx-auto max-w-lg rounded-2xl text-center">
      <Icon name={unavailable ? 'notifications_off' : 'notifications'} size="xl" className="mx-auto mb-4 text-fg-secondary" />
      <h1 className="text-headline-3 font-semibold text-fg">{unavailable ? 'Thông báo không còn khả dụng' : 'Tạm thời chưa mở được thông báo'}</h1>
      <p className="mt-3 text-body-reg leading-relaxed text-fg-secondary">{unavailable ? 'Thông báo có thể đã được xóa hoặc tài khoản hiện tại không có quyền xem. Bạn có thể quay lại danh sách để xem các cập nhật khác.' : 'Vui lòng thử lại sau ít phút hoặc quay lại danh sách thông báo.'}</p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        {!unavailable && <Button variant="outline" onClick={() => setRetry(value => value + 1)}>Thử lại</Button>}
        <Button as={Link} to="/app/notifications">Về thông báo</Button>
      </div>
    </Card>;
  }
  return <div className="mx-auto max-w-3xl space-y-5">
    <Button as={Link} to="/app/notifications" variant="ghost" icon={<Icon name="arrow_back" size="sm" />}>Về thông báo</Button>
    <Card padding="lg" variant="outlined" className="rounded-2xl">
      <h1 className="text-headline-2 font-semibold text-fg">{state.content.title}</h1>
      <p className="mt-4 whitespace-pre-wrap break-words text-body-reg leading-relaxed text-fg-secondary">{state.content.message}</p>
      <p className="mt-5 text-caption text-fg-secondary">{formatDateTime(state.item.createdAt)}</p>
    </Card>
  </div>;
}
