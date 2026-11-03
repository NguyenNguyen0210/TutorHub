import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import disputeService from '@/services/dispute.service';
import { useAuthStore } from '@/store/authStore';
import { formatDateTime } from '@/utils/formatters';
import Button from '@/components/ui/Button';
import Money from '@/components/ui/Money';
import StateBadge from '@/components/common/StateBadge';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import { DetailSkeleton } from '@/components/common/Skeleton';

export default function MyDisputes() {
  const { user } = useAuthStore();
  const dashboardPath = user?.role === 'Tutor' ? '/tutor/dashboard' : '/student/dashboard';
  const emptyDescription = user?.role === 'Tutor' ? 'Các khiếu nại liên quan đến buổi dạy của bạn sẽ xuất hiện tại đây để theo dõi và bổ sung bằng chứng.' : 'Nếu có vấn đề với buổi học, hãy mở chi tiết buổi học trong lộ trình để gửi khiếu nại khi còn trong thời gian bảo lưu.';
  const [params, setParams] = useSearchParams();
  const filter = ['active', 'closed'].includes(params.get('status')) ? params.get('status') : 'all';
  const query = useQuery({ queryKey: ['my-disputes', user?.id], queryFn: disputeService.getMyDisputes, staleTime: 0 });
  const items = [...(query.data || [])].filter(item => filter === 'all' || (filter === 'closed') === ['Resolved', 'Dismissed'].includes(item.status)).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return <div className="mx-auto max-w-[1200px] space-y-6">
    <header><h1 className="text-headline-page text-fg">Khiếu nại của tôi</h1><p className="mt-2 text-body-reg text-fg-secondary">Theo dõi kết quả xử lý và bổ sung bằng chứng cho từng buổi học.</p></header>
    <div className="flex flex-wrap items-center gap-3"><label htmlFor="dispute-filter" className="text-sm font-medium text-fg">Trạng thái</label><select id="dispute-filter" value={filter} onChange={e => setParams(previous => { const next = new URLSearchParams(previous); next.set('status', e.target.value); return next; })} className="h-11 rounded-xl border border-border bg-surface px-3 text-sm text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><option value="all">Tất cả khiếu nại</option><option value="active">Đang xử lý</option><option value="closed">Đã kết thúc</option></select></div>
    {query.isPending ? <DetailSkeleton /> : query.isError ? <ErrorState title="Không thể tải khiếu nại" error={query.error} onRetry={query.refetch} /> : items.length === 0 ? <EmptyState icon="shield" title={filter === 'all' ? 'Bạn chưa có khiếu nại nào' : 'Không có khiếu nại ở trạng thái này'} description={emptyDescription} actionLabel={filter === 'all' ? 'Xem lớp học' : 'Xem tất cả khiếu nại'} actionPath={filter === 'all' ? dashboardPath : undefined} onAction={() => setParams({})} /> : <div className="divide-y divide-border rounded-2xl border border-border bg-surface">{items.map(item => <article key={item.id} className="space-y-4 p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-semibold text-fg">Khiếu nại buổi học {item.sessionNumber}</h2><p className="mt-1 text-sm text-fg-secondary">Gửi ngày {formatDateTime(item.createdAt)}</p></div><StateBadge domain="dispute" status={item.status} /></div><p className="line-clamp-3 whitespace-pre-wrap break-words text-body-reg leading-relaxed text-fg-secondary">{item.description}</p><div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-fg-secondary">Học phí tạm giữ: <span className="font-semibold text-holding-strong"><Money value={item.heldAmount} /></span></p><Button as={Link} variant="outline" to={`/app/disputes/${item.id}`}>Xem chi tiết</Button></div></article>)}</div>}
  </div>;
}
