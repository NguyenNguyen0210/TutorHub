import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import bookingService from '@/services/booking.service';
import enrollmentService from '@/services/enrollment.service';
import { useAuthStore } from '@/store/authStore';
import { formatDateTime } from '@/utils/formatters';
import Button from '@/components/ui/Button';
import Money from '@/components/ui/Money';
import { useConfirm } from '@/components/ui/Dialog';
import { useToast } from '@/components/ui/Toast';
import StateBadge from '@/components/common/StateBadge';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import { DetailSkeleton } from '@/components/common/Skeleton';

const filters = { all: 'Tất cả đơn', Holding: 'Chờ thanh toán', Paid: 'Đã thanh toán', Expired: 'Đã hết hạn', Cancelled: 'Đã hủy' };
const PAGE_SIZE = 10;

export default function StudentBookings() {
  const { user } = useAuthStore();
  const [params, setParams] = useSearchParams();
  const [cancelling, setCancelling] = useState(null);
  const confirm = useConfirm();
  const toast = useToast();
  const client = useQueryClient();
  const status = Object.hasOwn(filters, params.get('status')) ? params.get('status') : 'all';
  const page = Math.min(10000, Math.max(1, Math.floor(Number(params.get('page')) || 1)));
  const query = useQuery({
    staleTime: 0,
    queryKey: ['student-bookings', user?.id, status, page],
    queryFn: () => bookingService.getMyBookings({ status: status === 'all' ? null : status, pageNumber: page, pageSize: PAGE_SIZE }),
    refetchInterval: query => query.state.data?.items?.some(item => item.status === 'Holding') ? 30000 : false,
  });
  const items = query.data?.items || [];
  const contracts = useQuery({ queryKey: ['booking-enrollments', user?.id], queryFn: enrollmentService.getAllMyEnrollments, enabled: items.some(item => item.status === 'Paid') });
  const change = changes => setParams(previous => {
    const next = new URLSearchParams(previous);
    Object.entries(changes).forEach(([key, value]) => value == null ? next.delete(key) : next.set(key, String(value)));
    return next;
  });
  const cancelHold = async item => {
    if (cancelling) return;
    const accepted = await confirm({ title: 'Hủy đặt chỗ?', content: 'Bạn sẽ kết thúc lượt giữ chỗ này. Bạn có thể chọn lại gói học khi muốn đăng ký.', confirmText: 'Hủy đặt chỗ', cancelText: 'Giữ đặt chỗ', danger: true });
    if (!accepted) return;
    setCancelling(item.id);
    try {
      await bookingService.cancelBooking(item.id);
      await client.invalidateQueries({ queryKey: ['student-bookings', user?.id] });
      toast.success('Đã hủy đặt chỗ.');
    } catch { toast.error('Chưa thể hủy đặt chỗ. Vui lòng làm mới danh sách và thử lại.'); }
    finally { setCancelling(null); }
  };

  return <div className="mx-auto max-w-[1200px] space-y-6">
    <header className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-headline-page text-fg">Đơn đặt chỗ của tôi</h1><p className="mt-2 text-body-reg text-fg-secondary">Theo dõi đăng ký gói học và tiếp tục thanh toán các đơn còn thời gian giữ chỗ.</p></div><Button as={Link} to="/services">Tìm gói học</Button></header>
    <div className="flex flex-wrap items-center gap-3"><label htmlFor="booking-filter" className="text-sm font-medium text-fg">Trạng thái</label><select id="booking-filter" value={status} onChange={e => change({ status: e.target.value, page: null })} className="h-11 rounded-xl border border-border bg-surface px-3 text-sm text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{Object.entries(filters).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
    {query.isPending ? <DetailSkeleton /> : query.isError ? <ErrorState title="Không thể tải đơn đặt chỗ" error={query.error} onRetry={query.refetch} /> : items.length === 0 ? <EmptyState icon="receipt_long" title={status === 'all' && page === 1 ? 'Bạn chưa có đơn đặt chỗ' : 'Không có đơn trong danh sách này'} description="Chọn một gói học để bắt đầu, hoặc thay đổi bộ lọc để xem các đơn khác." actionLabel={status === 'all' && page === 1 ? 'Khám phá gói học' : 'Xem tất cả đơn'} actionPath={status === 'all' && page === 1 ? '/services' : undefined} onAction={() => change({ status: null, page: null })} /> : <div className="space-y-4">{items.map(item => {
      const contract = contracts.data?.items?.find(value => value.bookingId === item.id);
      return <article key={item.id} className="rounded-2xl border border-border bg-surface p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="text-caption text-fg-secondary">Đăng ký {formatDateTime(item.createdAt)}</p><h2 className="mt-2 break-words text-lg font-semibold text-fg">{contract?.serviceTitle || item.subjectName || 'Gói học'}</h2><p className="mt-2 text-sm text-fg-secondary">Gia sư: {item.tutorName} · {item.totalSessions} buổi</p></div><StateBadge domain="booking" status={item.status} /></div><div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4"><div><p className="text-caption text-fg-secondary">Tổng học phí</p><p className="mt-1 text-xl font-semibold text-fg"><Money value={item.totalPrice} /></p></div><div className="flex flex-wrap gap-2">{item.status === 'Holding' ? <><Button as={Link} to={`/student/bookings/${item.id}/checkout`}>Tiếp tục thanh toán</Button><Button variant="ghost" disabled={Boolean(cancelling)} loading={cancelling === item.id} onClick={() => cancelHold(item)}>Hủy đặt chỗ</Button></> : item.status === 'Paid' ? <><Button as={Link} to={contract ? `/student/enrollments/${contract.id}` : '/student/dashboard'}>Xem lớp học</Button><Button as={Link} variant="outline" to={`/student/wallet?tab=payments&bookingId=${item.id}`}>Xem thanh toán</Button></> : <Button as={Link} to={`/services/${item.serviceId}`} variant="outline">Xem lại gói học</Button>}</div></div><details className="mt-4 text-caption text-fg-secondary"><summary className="w-fit cursor-pointer rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Mã đơn đặt chỗ</summary><p className="mt-2 break-all select-all">{item.id}</p></details></article>;
    })}</div>}
    {!query.isPending && !query.isError && (page > 1 || query.data?.hasNextPage) && <nav aria-label="Phân trang đơn đặt chỗ" className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-fg-secondary">Trang {page}{query.data?.totalPages ? ` / ${query.data.totalPages}` : ''}</p><div className="flex gap-2"><Button variant="outline" disabled={page <= 1} onClick={() => change({ page: page - 1 })}>Trang trước</Button><Button variant="outline" disabled={!query.data?.hasNextPage} onClick={() => change({ page: page + 1 })}>Trang sau</Button></div></nav>}
  </div>;
}
