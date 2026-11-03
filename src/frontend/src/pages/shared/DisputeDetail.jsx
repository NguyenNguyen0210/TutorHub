import React from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import disputeService from '@/services/dispute.service';
import { useAuthStore } from '@/store/authStore';
import Button from '@/components/ui/Button';
import ErrorState from '@/components/common/ErrorState';
import DisputeCaseSummary, { CaseStatus } from '@/components/disputes/DisputeCaseSummary';
import DisputeHistory from '@/components/disputes/DisputeHistory';
import DisputeResponseForm from '@/components/disputes/DisputeResponseForm';
import Icon from '@/components/ui/Icon';
import DisputeReport from '@/components/disputes/DisputeReport';

export default function DisputeDetail() {
  const { id } = useParams();
  const location = useLocation();
  const { user } = useAuthStore();
  const client = useQueryClient();
  const backPath = user?.role === 'Tutor' ? '/tutor/disputes' : '/student/disputes';
  const query = useQuery({ queryKey: ['my-dispute', user?.id, id], staleTime: 0, queryFn: async () => {
    const items = await disputeService.getMyDisputes();
    const item = items.find(value => value.id === id);
    if (!item) throw new Error('Không tìm thấy tranh chấp hoặc bạn không có quyền truy cập.');
    return item;
  } });
  if (query.isPending) return <div role="status" aria-label="Đang tải tranh chấp" className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]"><div className="h-96 rounded-2xl bg-neutral-100 motion-safe:animate-pulse" /><div className="h-72 rounded-2xl bg-neutral-100 motion-safe:animate-pulse" /></div>;
  const refresh = () => Promise.all([
    client.invalidateQueries({ queryKey: ['my-dispute', user?.id, id] }),
    client.invalidateQueries({ queryKey: ['my-disputes', user?.id] }),
  ]);
  if (query.isError && !query.data) return <ErrorState title="Không thể mở khiếu nại" error={query.error} onRetry={query.refetch} backPath={backPath} backLabel="Quay lại" />;
  const item = query.data;
  const workspace = user?.role === 'Tutor' ? 'tutor' : 'student';
  const closed = ['Resolved', 'Dismissed'].includes(item.status);
  const reportTitle = user?.id === item.initiatorUserId ? 'Báo cáo của bạn' : user?.role === 'Tutor' ? 'Báo cáo của học viên' : 'Báo cáo của gia sư';
  const hasResponded = (item.responses || []).some(response => response.authorUserId === user?.id);
  const focusResponse = () => {
    document.getElementById('dispute-explanation')?.focus({ preventScroll: true });
    document.getElementById('dispute-response')?.scrollIntoView({ behavior: 'auto', block: 'start' });
  };
  return <div className="mx-auto max-w-[1120px] space-y-6">
    <Link to={backPath} className="inline-flex min-h-11 items-center gap-2 rounded text-sm font-medium text-fg-secondary hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"><Icon name="arrow_back" size="sm" />Về khiếu nại của tôi</Link>
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0"><h1 className="text-headline-page text-fg">Khiếu nại buổi học #{item.sessionNumber != null ? String(item.sessionNumber).padStart(2, '0') : '—'}</h1><div className="mt-3"><CaseStatus status={item.status} /></div></div>
      <Button variant="outline" size="sm" loading={query.isFetching} onClick={() => query.refetch()} icon={<Icon name="refresh" size="sm" />}>Làm mới trạng thái</Button>
    </header>
    {query.isError && <p role="alert" className="text-sm text-holding-strong">Chưa thể làm mới trạng thái. Bạn vẫn có thể xem thông tin đã tải và giữ lại nội dung đang nhập.</p>}
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="order-2 min-w-0 lg:order-1">
        {!closed && <section aria-label="Hành động tiếp theo" className="mb-5 flex flex-wrap items-center justify-between gap-4 border-l-2 border-brand-primary-400 py-1 pl-4">
          <div className="min-w-0 flex-1"><h2 className="text-sm font-semibold text-fg">{hasResponded ? 'Phản hồi của bạn đã được ghi nhận' : user?.id === item.respondentUserId ? 'Bạn có thể gửi giải trình về vụ việc' : 'Bạn có thể bổ sung thông tin cho báo cáo'}</h2><p className="mt-1 text-sm leading-relaxed text-fg-secondary">TutorHub lưu nội dung và bằng chứng của các bên để phục vụ quá trình xem xét.</p></div>
          <Button onClick={focusResponse} size="sm">{hasResponded ? 'Bổ sung phản hồi' : 'Gửi phản hồi'}</Button>
        </section>}
        <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
          <div className="p-5 sm:p-6"><DisputeReport dispute={item} title={reportTitle} /></div>
          <div className="p-5 sm:p-6">{!closed ? <DisputeResponseForm key={id} disputeId={id} onSaved={refresh} uploadFailed={location.state?.evidenceUploadFailed} /> : <section aria-label="Kết thúc tiếp nhận phản hồi" className="space-y-2"><h2 className="text-lg font-semibold text-fg">Vụ việc đã kết thúc</h2><p className="text-sm leading-relaxed text-fg-secondary">Khiếu nại không còn nhận thêm giải trình hoặc bằng chứng. Báo cáo gốc, các phản hồi và kết luận được giữ lại để bạn đối chiếu.</p></section>}</div>
          <div className="p-5 sm:p-6"><DisputeHistory dispute={item} reportHref="#dispute-report" /></div>
        </div>
      </div>
      <div className="order-1 min-w-0 lg:order-2 lg:sticky lg:top-6"><DisputeCaseSummary dispute={item} workspace={workspace} /></div>
    </div>
  </div>;
}
