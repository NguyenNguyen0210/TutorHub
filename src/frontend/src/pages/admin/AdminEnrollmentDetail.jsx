import React, { useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import enrollmentService from '@/services/enrollment.service';
import bookingService from '@/services/booking.service';
import adminService from '@/services/admin.service';
import { useAuthStore } from '@/store/authStore';
import { useConfirm } from '@/components/ui/Dialog';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import StateBadge from '@/components/common/StateBadge';

export default function AdminEnrollmentDetail() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const client = useQueryClient();
  const confirm = useConfirm();
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);
  const key = ['admin-enrollment', user?.id, id];
  const query = useQuery({ queryKey: key, queryFn: async () => { const enrollment = await enrollmentService.getEnrollmentById(id); return { enrollment, booking: await bookingService.getBookingById(enrollment.bookingId) }; }, retry: false });
  const cancel = async () => {
    if (busy.current) return;
    busy.current = true; setError('');
    try {
      let reason = '';
      const accepted = await confirm({ title: 'Hủy hợp đồng theo quyết định quản trị?', content: 'Các buổi chưa hoàn thành sẽ được xử lý theo trạng thái hợp đồng. Khoản học phí hợp lệ được hoàn về Ví học viên. Hợp đồng đang có tranh chấp hoặc trong thời gian bảo lưu phải được xử lý trước.', danger: true, requireReason: true, minReasonLength: 5, maxReasonLength: 500, reasonLabel: 'Lý do hủy hợp đồng', confirmText: 'Xác nhận hủy hợp đồng', onConfirmReason: value => { reason = value; } });
      if (!accepted) return;
      setSaving(true);
      const updated = await adminService.cancelEnrollment(id, reason);
      client.setQueryData(key, previous => ({ ...previous, enrollment: updated }));
      await client.invalidateQueries({ queryKey: ['admin-transactions'] });
    } catch (err) { setError(err?.status === 409 ? 'Chưa thể hủy hợp đồng trong trạng thái hiện tại. Vui lòng kiểm tra các buổi học, tranh chấp và khoản đang bảo lưu.' : 'Chưa hủy được hợp đồng. Vui lòng thử lại.'); query.refetch(); }
    finally { busy.current = false; setSaving(false); }
  };
  const item = query.data?.enrollment;
  const booking = query.data?.booking;
  return <div className="mx-auto max-w-5xl space-y-6"><header><Button as={Link} to="/admin/transactions" variant="ghost">Về giao dịch toàn sàn</Button><h1 className="mt-3 text-headline-page">Chi tiết hợp đồng học tập</h1></header>
    {query.isPending ? <p role="status">Đang tải hợp đồng…</p> : query.isError ? <Card padding="lg"><p role="alert">Không thể mở hợp đồng hoặc dữ liệu không còn tồn tại.</p><Button className="mt-3" variant="outline" onClick={() => query.refetch()}>Thử lại</Button></Card> : <>
      <Card padding="lg" variant="outlined" className="space-y-5 rounded-2xl"><div className="flex flex-wrap justify-between gap-3"><h2 className="text-lg font-semibold">{item.subjectName}</h2><StateBadge domain="enrollment" status={item.status} /></div><dl className="grid gap-5 sm:grid-cols-2"><div><dt className="text-sm text-fg-secondary">Học viên</dt><dd className="mt-1 font-medium">{booking.studentName}</dd></div><div><dt className="text-sm text-fg-secondary">Gia sư</dt><dd className="mt-1 font-medium">{booking.tutorName}</dd></div><div><dt className="text-sm text-fg-secondary">Tổng học phí</dt><dd className="mt-1 font-semibold">{formatCurrency(item.totalPrice)}</dd></div><div><dt className="text-sm text-fg-secondary">Tiến độ</dt><dd className="mt-1">{item.completedSessions}/{item.totalSessions} buổi hoàn thành</dd></div></dl><Button as={Link} to={`/services/${item.serviceId}`} variant="outline">Xem gói học</Button><details className="text-sm"><summary className="cursor-pointer">Thông tin đối soát</summary><p className="mt-2 break-all">Hợp đồng: {id}</p><p className="mt-2 break-all">Đơn: {item.bookingId}</p><p className="mt-2">Ngày tạo: {formatDateTime(item.createdAt)}</p></details>{item.cancellationReason && <p className="whitespace-pre-wrap break-words text-sm">Lý do hủy: {item.cancellationReason}</p>}</Card>
      <Card padding="lg" variant="outlined" className="rounded-2xl"><h2 className="mb-4 text-lg font-semibold">Lộ trình học tập</h2><ol className="divide-y divide-border">{item.sessions.map(session => <li key={session.id} className="flex flex-wrap items-center justify-between gap-3 py-4"><div><p className="font-medium">Buổi {session.sessionNumber}</p><p className="mt-1 text-sm text-fg-secondary">{session.startAt ? formatDateTime(session.startAt) : 'Chưa xếp lịch'}</p></div><StateBadge domain="session" status={session.status} /><span className="text-sm tabular-nums">{formatCurrency(session.sessionPrice)}</span></li>)}</ol></Card>
      {['Active', 'Pending'].includes(item.status) && <Card padding="lg" variant="outlined" className="space-y-3 rounded-2xl"><h2 className="font-semibold">Can thiệp hợp đồng</h2><p className="text-sm text-fg-secondary">Chỉ sử dụng khi có quyết định quản trị cần ngừng hợp đồng. Hệ thống sẽ kiểm tra ràng buộc học phí trước khi thực hiện.</p><Button variant="danger-outline" loading={saving} disabled={saving} onClick={cancel}>Hủy hợp đồng</Button>{error && <p role="alert" className="text-sm text-danger-strong">{error}</p>}</Card>}
    </>}
  </div>;
}
