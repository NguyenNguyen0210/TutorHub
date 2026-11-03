import React, { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import reportService from '@/services/report.service';
import bookingService from '@/services/booking.service';
import { useAuthStore } from '@/store/authStore';
import { formatDateTime } from '@/utils/formatters';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Textarea } from '@/components/ui/Input';

const decisions = { Dismissed: 'Không xác định vi phạm', WarningIssued: 'Đã cảnh cáo tài khoản', SuspendUser: 'Đã tạm khóa tài khoản', BanUser: 'Đã khóa tài khoản', RemoveContent: 'Đã gỡ nội dung vi phạm' };
const types = { UserConduct: 'Báo cáo hành vi vi phạm', ReviewViolation: 'Báo cáo nội dung đánh giá', ProfileViolation: 'Báo cáo hồ sơ', ServiceViolation: 'Báo cáo gói học', General: 'Báo cáo vi phạm' };

function ReportForm({ bookingId, onSubmitted, onCancel }) {
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const submitting = useRef(false);
  const booking = useQuery({ queryKey: ['report-booking', bookingId], queryFn: () => bookingService.getBookingById(bookingId), retry: false });
  const eligible = ['Paid', 'Cancelled'].includes(booking.data?.status);
  const submit = async event => {
    event.preventDefault();
    if (submitting.current || !eligible) return;
    if (description.trim().length < 10 || description.length > 2000) { setError('Vui lòng mô tả sự việc từ 10 đến 2.000 ký tự.'); return; }
    submitting.current = true; setSaving(true); setError('');
    try { const result = await reportService.create(bookingId, description); if (!result?.id) throw new Error('Missing report'); onSubmitted(result.id); }
    catch (err) { setError(err?.status === 409 ? 'Bạn đã có báo cáo đang chờ xử lý cho đơn này. Vui lòng xem danh sách báo cáo bên dưới.' : 'Chưa gửi được báo cáo. Vui lòng thử lại.'); }
    finally { submitting.current = false; setSaving(false); }
  };
  return <Card padding="lg" variant="outlined" className="rounded-2xl">
    <h2 className="text-headline-3 font-semibold text-fg">Báo cáo hành vi vi phạm</h2>
    {booking.isPending ? <p role="status" className="mt-4 text-fg-secondary">Đang tải thông tin đơn…</p>
      : booking.isError ? <div className="mt-4"><p>Chưa tải được đơn đặt chỗ hoặc bạn không có quyền xem.</p><Button className="mt-3" variant="outline" onClick={() => booking.refetch()}>Thử lại</Button></div>
        : !eligible ? <p className="mt-4 text-fg-secondary">Bạn có thể gửi báo cáo từ đơn đã thanh toán hoặc đã hủy.</p>
          : <form onSubmit={submit} className="mt-5 space-y-4">
            <p className="text-sm text-fg-secondary">Gia sư: <span className="font-medium text-fg">{booking.data.tutorName}</span></p>
            <p className="text-sm leading-relaxed text-fg-secondary">Mô tả hành vi, thời điểm và diễn biến để TutorHub xem xét. Với vấn đề học phí hoặc chất lượng buổi học, hãy gửi khiếu nại từ chi tiết buổi học.</p>
            <label htmlFor="report-description" className="block text-sm font-medium text-fg">Nội dung báo cáo</label>
            <Textarea id="report-description" rows={6} maxLength={2000} value={description} disabled={saving} onChange={event => { setDescription(event.target.value); setError(''); }} aria-describedby="report-description-help" required />
            <p id="report-description-help" className="text-xs text-fg-secondary">Từ 10 đến 2.000 ký tự · {description.length}/2.000</p>
            {error && <p role="alert" className="text-sm text-danger-strong">{error}</p>}
            <div className="flex flex-wrap gap-3"><Button type="submit" loading={saving} disabled={saving || description.trim().length < 10}>Gửi báo cáo</Button><Button variant="outline" type="button" disabled={saving} onClick={onCancel}>Hủy</Button></div>
          </form>}
    {!eligible && <Button className="mt-4" variant="outline" onClick={onCancel}>Về danh sách báo cáo</Button>}
  </Card>;
}
ReportForm.propTypes = { bookingId: PropTypes.string.isRequired, onSubmitted: PropTypes.func.isRequired, onCancel: PropTypes.func.isRequired };

export default function StudentReports() {
  const { user } = useAuthStore();
  const [params, setParams] = useSearchParams();
  const [submitted, setSubmitted] = useState(false);
  const bookingId = params.get('bookingId');
  const reportId = params.get('reportId');
  const page = Math.min(10000, Math.max(1, Math.floor(Number(params.get('page')) || 1)));
  const reports = useQuery({ queryKey: ['student-reports', user?.id, page], queryFn: () => reportService.getMyReports(page), staleTime: 0 });
  const onSubmitted = id => { setSubmitted(true); setParams({ reportId: id }); reports.refetch(); };
  return <div className="mx-auto max-w-[1000px] space-y-6">
    <header><Button as={Link} to="/student/disputes" variant="ghost">Về khiếu nại</Button><h1 className="mt-4 text-headline-page text-fg">Báo cáo vi phạm</h1><p className="mt-2 text-body-reg text-fg-secondary">Theo dõi báo cáo về hành vi hoặc nội dung không phù hợp và kết quả xem xét của TutorHub.</p></header>
    {bookingId && <ReportForm key={bookingId} bookingId={bookingId} onSubmitted={onSubmitted} onCancel={() => setParams({})} />}
    {submitted && <p role="status" className="rounded-xl bg-success-subtle p-4 text-sm text-success-strong">Đã gửi báo cáo. Bạn có thể theo dõi kết quả bên dưới.</p>}
    {reports.isPending ? <p role="status">Đang tải báo cáo…</p> : reports.isError ? <Card padding="lg" variant="outlined"><p>Chưa tải được danh sách báo cáo.</p><Button className="mt-4" variant="outline" onClick={() => reports.refetch()}>Thử lại</Button></Card>
      : !reports.data?.items?.length ? <Card padding="lg" variant="outlined"><h2 className="font-semibold">Bạn chưa có báo cáo nào</h2><p className="mt-2 text-sm text-fg-secondary">Nếu gặp hành vi không phù hợp, bạn có thể gửi báo cáo từ chi tiết hợp đồng học tập.</p><Button className="mt-4" as={Link} to="/student/dashboard" variant="outline">Xem lớp học của tôi</Button></Card>
        : <div className="divide-y divide-border rounded-2xl border border-border bg-surface">{reports.data.items.map(item => <article key={item.id} className={`p-5 sm:p-6 ${item.id === reportId ? 'bg-brand-primary-50/30' : ''}`}>
          <div className="flex flex-wrap justify-between gap-3"><h2 className="font-semibold text-fg">{types[item.reportType] || 'Báo cáo vi phạm'}</h2><span className="text-sm text-fg-secondary">{item.status === 'Resolved' ? 'Đã xử lý' : 'Chờ xem xét'}</span></div>
          <p className="mt-2 text-xs text-fg-secondary">Gửi ngày {formatDateTime(item.createdAt)}</p>
          <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-relaxed text-fg">{item.description}</p>
          {item.status === 'Resolved' && <div className="mt-4 border-l-2 border-primary pl-4"><h3 className="text-sm font-semibold">{decisions[item.adminDecision] || 'Kết quả xem xét'}</h3>{item.resolution && <p className="mt-2 whitespace-pre-wrap break-words text-sm text-fg-secondary">{item.resolution}</p>}{item.resolvedAt && <p className="mt-2 text-xs text-fg-secondary">{formatDateTime(item.resolvedAt)}</p>}</div>}
          {item.bookingId && <details className="mt-4 text-xs text-fg-secondary"><summary className="w-fit cursor-pointer rounded focus-visible:ring-2 focus-visible:ring-ring">Mã đơn liên quan</summary><p className="mt-2 break-all select-all">{item.bookingId}</p></details>}
        </article>)}</div>}
    {!reports.isError && !reports.isPending && (page > 1 || reports.data?.hasNextPage) && <nav aria-label="Phân trang báo cáo" className="flex items-center justify-between gap-3"><Button variant="outline" disabled={page <= 1} onClick={() => setParams({ page: page - 1 })}>Trang trước</Button><span className="text-sm text-fg-secondary">Trang {page}</span><Button variant="outline" disabled={!reports.data?.hasNextPage} onClick={() => setParams({ page: page + 1 })}>Trang sau</Button></nav>}
  </div>;
}
