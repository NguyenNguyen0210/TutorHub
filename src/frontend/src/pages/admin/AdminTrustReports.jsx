import WorkspacePageHeader from '@/components/layout/WorkspacePageHeader';
import React, { useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import adminService from '@/services/admin.service';
import { useAuthStore } from '@/store/authStore';
import { useConfirm } from '@/components/ui/Dialog';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import TrustReportList from '@/components/admin/TrustReportList';
import { Field, Select, Textarea } from '@/components/ui/Input';
import { formatDateTime } from '@/utils/formatters';
import { reportTypes, reportDecisions } from '@/utils/trustReports';

export default function AdminTrustReports() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Math.floor(Number(params.get('page')) || 1));
  const status = ['Open', 'Resolved'].includes(params.get('status')) ? params.get('status') : '';
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [decision, setDecision] = useState('');
  const [resolution, setResolution] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);
  const query = useQuery({ queryKey: ['admin-trust-reports', user?.id, id || { page, status }],
    enabled: Boolean(id), queryFn: () => id ? adminService.getTrustReport(id) : adminService.getTrustReports({ status, pageNumber: page }), retry: false });
  const item = id ? query.data : null;
  const resolve = async event => {
    event.preventDefault();
    if (!decision || busy.current || resolution.trim().length < 5 || item?.status !== 'Open') return;
    busy.current = true; setError('');
    try {
      const ok = await confirm({ title: 'Xác nhận xử lý báo cáo', content: `${reportDecisions[decision]}. Kết luận sẽ được lưu và gửi cho người báo cáo.`, confirmText: 'Xác nhận xử lý', danger: ['BanUser', 'SuspendUser', 'RemoveContent'].includes(decision) });
      if (!ok) return;
      setSaving(true);
      const updated = await adminService.resolveTrustReport(id, { decision, resolution: resolution.trim() });
      queryClient.setQueryData(['admin-trust-reports', user?.id, id], updated);
      await queryClient.invalidateQueries({ queryKey: ['admin-trust-reports'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      setResolution('');
    } catch (err) {
      setError(err?.status === 409 ? 'Báo cáo hoặc đối tượng đã thay đổi trạng thái. Vui lòng kiểm tra lại thông tin trước khi xử lý.' : 'Chưa thể xử lý báo cáo. Vui lòng thử lại.');
      query.refetch();
    } finally { busy.current = false; setSaving(false); }
  };
  if (!id) return <TrustReportList />;
  return <div className="space-y-6 lg:space-y-8">
    {id && <Button as={Link} to={`/admin/trust-reports?${params.get('list') || ''}`} variant="ghost">Về danh sách báo cáo</Button>}<WorkspacePageHeader title={id ? 'Chi tiết báo cáo vi phạm' : 'Báo cáo vi phạm'} description="Xem xét hành vi và nội dung không phù hợp. Khiếu nại học phí được xử lý riêng tại mục Tranh chấp." />
    {!id && <Field label="Trạng thái" htmlFor="report-status"><Select id="report-status" value={status} onChange={e => setParams(e.target.value ? { status: e.target.value } : {})}><option value="">Tất cả</option><option value="Open">Chờ xử lý</option><option value="Resolved">Đã xử lý</option></Select></Field>}
    {query.isPending ? <p role="status">Đang tải báo cáo…</p> : query.isError ? <Card padding="lg"><p role="alert">{query.error?.status === 404 ? 'Báo cáo không còn tồn tại hoặc bạn không có quyền xem.' : 'Chưa tải được thông tin báo cáo.'}</p><Button className="mt-4" variant="outline" onClick={() => query.refetch()}>Thử lại</Button></Card>
      : id ? <>
        <Card padding="lg" variant="outlined" className="space-y-5 rounded-2xl">
          <div className="flex flex-wrap justify-between gap-3"><h2 className="text-lg font-semibold">{reportTypes[item.reportType] || 'Báo cáo vi phạm'}</h2><span className="text-sm text-fg-secondary">{item.status === 'Open' ? 'Chờ xử lý' : 'Đã xử lý'}</span></div>
          <dl className="grid gap-4 sm:grid-cols-2"><div><dt className="text-sm text-fg-secondary">Người báo cáo</dt><dd className="mt-1 font-medium">{item.reporterName}</dd></div><div><dt className="text-sm text-fg-secondary">Người bị báo cáo</dt><dd className="mt-1 font-medium">{item.reportedUserName || 'Chưa xác định'}</dd></div><div><dt className="text-sm text-fg-secondary">Thời gian gửi</dt><dd className="mt-1">{formatDateTime(item.createdAt)}</dd></div></dl>
          <section><h3 className="font-semibold">Nội dung báo cáo</h3><p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed">{item.description}</p></section>
          {item.evidenceUrl && /^https?:\/\//i.test(item.evidenceUrl) && <a className="inline-block text-sm text-primary underline" href={item.evidenceUrl} target="_blank" rel="noopener noreferrer">Mở bằng chứng (liên kết bên ngoài)</a>}
          <Button as={Link} to={`/admin/conversations?reportId=${id}`} variant="outline">Điều tra hội thoại liên quan</Button>
          {item.bookingId && <details className="text-sm text-fg-secondary"><summary className="cursor-pointer">Đơn đặt chỗ liên quan</summary><p className="mt-2 break-all">{item.bookingId}</p>{item.studentName && <p>Học viên: {item.studentName}</p>}{item.tutorName && <p>Gia sư: {item.tutorName}</p>}</details>}
          {item.status === 'Resolved' && <section className="border-l-2 border-primary pl-4"><h3 className="font-semibold">{reportDecisions[item.adminDecision] || 'Kết quả xử lý'}</h3><p className="mt-2 whitespace-pre-wrap break-words">{item.resolution}</p><p className="mt-2 text-sm text-fg-secondary">{item.resolvedByAdminName} · {formatDateTime(item.resolvedAt)}</p></section>}
        </Card>
        {item.status === 'Open' && <Card padding="lg" variant="outlined" className="rounded-2xl"><form onSubmit={resolve} className="space-y-4"><h2 className="text-lg font-semibold">Xử lý báo cáo</h2><Field label="Quyết định" htmlFor="report-decision"><Select id="report-decision" value={decision} disabled={saving} onChange={e => setDecision(e.target.value)}><option value="">Chọn sau khi xem xét báo cáo</option>{Object.entries(reportDecisions).filter(([key]) => !(['SuspendUser', 'BanUser'].includes(key) && !item.reportedUserId) && !(key === 'RemoveContent' && !['ReviewViolation', 'ServiceViolation'].includes(item.reportType))).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</Select></Field><Field label="Kết luận gửi người báo cáo" htmlFor="report-resolution" hint="Từ 5 đến 1.000 ký tự"><Textarea id="report-resolution" value={resolution} maxLength={1000} disabled={saving} onChange={e => setResolution(e.target.value)} required /></Field>{error && <p role="alert" className="text-sm text-danger-strong">{error}</p>}<Button type="submit" loading={saving} disabled={saving || !decision || resolution.trim().length < 5}>Lưu kết quả xử lý</Button></form></Card>}
      </> : <>
        {!query.data?.items?.length ? <Card padding="lg"><h2 className="font-semibold">Không có báo cáo phù hợp</h2><p className="mt-2 text-fg-secondary">Các báo cáo mới sẽ xuất hiện tại đây.</p></Card> : <div className="divide-y divide-border rounded-2xl border border-border bg-surface">{query.data.items.map(report => <article key={report.id} className="p-5"><div className="flex flex-wrap items-start justify-between gap-3"><h2 className="font-semibold">{reportTypes[report.reportType] || 'Báo cáo vi phạm'}</h2><span className="text-sm text-fg-secondary">{report.status === 'Open' ? 'Chờ xử lý' : 'Đã xử lý'}</span></div><p className="mt-2 text-sm text-fg-secondary">{report.reporterName} · {formatDateTime(report.createdAt)}</p><p className="mt-3 line-clamp-3 break-words text-sm">{report.description}</p><Button as={Link} to={`/admin/trust-reports/${report.id}`} variant="outline" className="mt-4">Xem báo cáo</Button></article>)}</div>}
        {(page > 1 || query.data?.hasNextPage) && <nav aria-label="Phân trang báo cáo" className="flex items-center justify-between gap-3"><Button variant="outline" disabled={page <= 1} onClick={() => setParams({ status, page: page - 1 })}>Trang trước</Button><span>Trang {page}</span><Button variant="outline" disabled={!query.data?.hasNextPage} onClick={() => setParams({ status, page: page + 1 })}>Trang sau</Button></nav>}
      </>}
  </div>;
}
