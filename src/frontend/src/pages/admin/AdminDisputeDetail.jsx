import React, { useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import adminService from '@/services/admin.service';
import WorkspacePageHeader from '@/components/layout/WorkspacePageHeader';
import DisputeReport from '@/components/disputes/DisputeReport';
import DisputeHistory from '@/components/disputes/DisputeHistory';
import DisputeDecisionPanel from '@/components/admin/DisputeDecisionPanel';
import { AdminStatus, AdminEmpty } from '@/components/admin/AdminWorkspacePrimitives';
import { DISPUTE_STATES, VERDICTS } from '@/utils/adminDisputes';
import { DetailSkeleton } from '@/components/common/Skeleton';
import Money from '@/components/ui/Money';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { formatDateTime } from '@/utils/formatters';

export default function AdminDisputeDetail() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const userId = useAuthStore(state => state.user?.id);
  const client = useQueryClient(), toast = useToast();
  const [busy, setBusy] = useState(false), lock = useRef(false);
  const query = useQuery({ queryKey: ['admin-dispute-detail', userId, id], queryFn: () => adminService.getDisputeDetail(id), retry: false });
  const refresh = async () => { await Promise.all([client.invalidateQueries({ queryKey: ['admin-dispute-detail', userId, id] }), client.invalidateQueries({ queryKey: ['admin-disputes'] }), client.invalidateQueries({ queryKey: ['admin-disputes-summary'] })]); };
  if (query.isPending) return <DetailSkeleton />;
  if (query.isError || !query.data?.dispute) return <AdminEmpty title="Không thể mở vụ việc" description="Vui lòng tải lại hoặc quay về danh sách tranh chấp."><Button className="mt-4" onClick={() => query.refetch()}>Thử lại</Button><Link to="/admin/disputes" className="mt-4 text-sm text-brand-primary-700">Về danh sách</Link></AdminEmpty>;
  const { dispute, session, enrollment, financialSummary, conversationSnippet = [] } = query.data;
  const closed = ['Resolved', 'Dismissed'].includes(dispute.status);
  const review = dispute.status === 'UnderReview';
  const start = async () => {
    if (lock.current) return;
    lock.current = true; setBusy(true);
    try { await adminService.moveDisputeUnderReview(id); await refresh(); toast.success('Đã bắt đầu điều tra vụ việc.'); }
    catch { toast.error('Chưa thể bắt đầu điều tra. Vui lòng kiểm tra trạng thái mới nhất.'); await refresh(); }
    finally { lock.current = false; setBusy(false); }
  };
  return <div className="space-y-6"><Link to={`/admin/disputes?${params.get('list') || ''}`} className="inline-flex min-h-10 items-center text-sm font-medium text-brand-primary-700">Quay lại danh sách tranh chấp</Link><WorkspacePageHeader title={`Tranh chấp buổi học #${session?.sessionNumber || dispute.sessionNumber}`} description={[dispute.serviceTitle, dispute.studentName || dispute.initiatorName, dispute.tutorName || dispute.respondentName].filter(Boolean).join(' · ')} />
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,7fr)_minmax(340px,5fr)]">
      <div className="min-w-0 space-y-6"><div className="rounded-2xl border border-border bg-surface p-5 sm:p-6"><DisputeReport dispute={dispute} title="Báo cáo sự cố" /></div><div className="rounded-2xl border border-border bg-surface p-5 sm:p-6"><DisputeHistory dispute={dispute} reportHref="#dispute-report" /></div>
        <section className="space-y-4 rounded-2xl border border-border bg-surface p-5 sm:p-6"><h2 className="text-lg font-semibold">Trao đổi liên quan</h2><p className="text-xs text-fg-secondary">Nội dung hội thoại được kiểm tra riêng theo phạm vi vụ việc.</p>{conversationSnippet.length ? <ol className="max-h-96 space-y-4 overflow-y-auto">{conversationSnippet.map(message => <li key={message.id} className="border-l-2 border-brand-primary-100 pl-3"><p className="text-sm font-medium">{message.senderName}</p><p className="mt-1 text-xs text-fg-secondary">{formatDateTime(message.sentAt)}</p><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">{message.content}</p></li>)}</ol> : <p className="text-sm text-fg-secondary">Ghi lý do truy cập tại màn Điều tra hội thoại để xem nội dung.</p>}</section>
      </div>
      <aside className="min-w-0 space-y-5 rounded-2xl border border-border bg-surface p-5 xl:sticky xl:top-6"><h2 className="text-base font-semibold">Tình trạng xử lý</h2><AdminStatus label={DISPUTE_STATES[dispute.status]?.[0] || 'Chưa rõ trạng thái'} tone={DISPUTE_STATES[dispute.status]?.[1]} /><div className="rounded-xl bg-holding-subtle p-4"><p className="text-xs text-fg-secondary">{closed ? 'Học phí ghi nhận khi mở vụ việc' : 'Học phí tạm giữ'}</p><Money value={dispute.heldAmount} maximumFractionDigits={2} className="mt-2 block text-3xl font-semibold" /></div>
        {!closed && !review && <div className="space-y-4"><h3 className="text-sm font-semibold">Bước tiếp theo</h3><p className="text-sm leading-6 text-fg-secondary">Đọc báo cáo và kiểm tra tài liệu, giải trình của hai bên trước khi đề xuất hướng xử lý.</p>{['Open', 'RequiresAdminFinancialIntervention'].includes(dispute.status) && <Button fullWidth loading={busy} onClick={start}>Bắt đầu điều tra</Button>}</div>}
        {review && <DisputeDecisionPanel key={id} id={id} gross={financialSummary?.disputedGrossAmount ?? session.sessionPrice} onSaved={refresh} />}
        {closed && <div className="space-y-3 border-t border-border pt-4"><h3 className="text-sm font-semibold">Kết luận đã ghi nhận</h3><p className="text-sm leading-6">{VERDICTS[dispute.resolutionDecision] || 'Vụ việc đã kết thúc.'}</p><p className="text-xs text-fg-secondary">{dispute.resolvedAt && formatDateTime(dispute.resolvedAt)}</p></div>}
        {enrollment?.id && <Button as={Link} to={`/admin/enrollments/${enrollment.id}`} variant="outline" fullWidth>Xem hợp đồng liên quan</Button>}
        {dispute.status === 'RequiresAdminRefundSettlement' && enrollment?.bookingId && <Button as={Link} to={`/admin/transactions?type=StudentRefund&settlementRequired=true&bookingId=${enrollment.bookingId}`} fullWidth>Đối soát khoản hoàn tiền</Button>}
        <details className="border-t border-border pt-4 text-xs text-fg-secondary"><summary className="cursor-pointer">Mã đối soát vụ việc</summary><p className="mt-3 select-all break-all">{id}</p></details>
      </aside>
    </div></div>;
}
