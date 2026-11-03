import React from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import disputeService from '@/services/dispute.service';
import { useAuthStore } from '@/store/authStore';
import { formatDateTime } from '@/utils/formatters';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import ErrorState from '@/components/common/ErrorState';
import Money from '@/components/ui/Money';
import StateBadge from '@/components/common/StateBadge';
import DisputeHistory from '@/components/disputes/DisputeHistory';
import DisputeResponseForm from '@/components/disputes/DisputeResponseForm';
import Icon from '@/components/ui/Icon';

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
  if (query.isPending) return <div role="status" aria-label="Đang tải tranh chấp" className="h-64 rounded-2xl bg-neutral-100 motion-safe:animate-pulse" />;
  const refresh = () => Promise.all([
    client.invalidateQueries({ queryKey: ['my-dispute', user?.id, id] }),
    client.invalidateQueries({ queryKey: ['my-disputes', user?.id] }),
  ]);
  if (query.isError) return <ErrorState title="Không thể mở khiếu nại" error={query.error} onRetry={query.refetch} backPath={backPath} backLabel="Quay lại" />;
  const item = query.data;
  const workspace = user?.role === 'Tutor' ? 'tutor' : 'student';
  const closed = ['Resolved', 'Dismissed'].includes(item.status);
  return <div className="mx-auto max-w-3xl space-y-5">
    <Button as={Link} to={backPath} variant="ghost">Về khiếu nại của tôi</Button>
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div><h1 className="text-headline-page text-fg">Khiếu nại buổi học #{item.sessionNumber}</h1><p className="mt-2 text-sm leading-relaxed text-fg-secondary">{user?.id === item.respondentUserId ? 'Bạn nhận được khiếu nại liên quan đến buổi học này. Hãy đọc nội dung và gửi giải trình nếu cần.' : 'Theo dõi phản hồi và kết quả xử lý khiếu nại của bạn.'}</p></div>
      <Button variant="outline" size="sm" onClick={() => query.refetch()} icon={<Icon name="refresh" size="sm" />}>Cập nhật</Button>
    </header>
    <Card padding="lg" variant="outlined" className="space-y-4 rounded-2xl">
      <StateBadge domain="dispute" status={item.status} />
      <h2 className="text-lg font-semibold text-fg">Nội dung khiếu nại</h2>
      <p className="whitespace-pre-wrap break-words text-body-reg leading-relaxed text-fg-secondary">{item.description}</p>
      <dl className="space-y-3 text-body-reg text-fg-secondary"><div><dt>Người gửi</dt><dd className="text-fg">{item.initiatorName}</dd></div><div><dt>Thời gian tạo</dt><dd className="text-fg">{formatDateTime(item.createdAt)}</dd></div><div><dt>Học phí được tạm giữ khi mở tranh chấp</dt><dd className="text-fg"><Money value={item.heldAmount} /></dd></div>{item.adminNotes && <div><dt>Ghi chú xử lý</dt><dd className="whitespace-pre-wrap text-fg">{item.adminNotes}</dd></div>}{item.resolvedAt && <div><dt>Thời gian xử lý</dt><dd className="text-fg">{formatDateTime(item.resolvedAt)}</dd></div>}</dl>
      <div className="flex flex-wrap gap-3">{!closed && <Button as="a" href="#dispute-response" variant="outline">Gửi giải trình</Button>}<Button as={Link} to={`/${workspace}/sessions/${item.sessionId}`}>Xem buổi học</Button><Button as={Link} to={`/${workspace}/enrollments/${item.enrollmentId}`} variant="outline">Xem hợp đồng</Button></div>
    </Card>
    <Card padding="lg" variant="outlined" className="rounded-2xl"><DisputeHistory dispute={item} /></Card>
    <Card padding="lg" variant="outlined" className="rounded-2xl">
      {!closed ? <DisputeResponseForm key={id} disputeId={id} onSaved={refresh} uploadFailed={location.state?.evidenceUploadFailed} /> : <div className="space-y-2"><h2 className="text-lg font-semibold text-fg">Vụ việc đã kết thúc</h2><p className="text-sm text-fg-secondary">Khiếu nại không còn nhận thêm giải trình hoặc bằng chứng. Bạn có thể xem lại toàn bộ lịch sử ở trên.</p></div>}
    </Card>
  </div>;
}
