import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import disputeService from '@/services/dispute.service';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/cn';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Icon from '@/components/ui/Icon';
import DisputeListCard from '@/components/disputes/DisputeListCard';
import EmptyState from '@/components/common/EmptyState';
import { DetailSkeleton } from '@/components/common/Skeleton';
import { DISPUTE_FILTERS, filterDisputes } from '@/utils/disputeList';

export default function MyDisputes() {
  const { user } = useAuthStore();
  const isTutor = user?.role === 'Tutor';
  const dashboardPath = isTutor ? '/tutor/dashboard' : '/student/dashboard';
  const [params, setParams] = useSearchParams();
  const filter = ['Open', 'review', 'closed', 'active'].includes(params.get('status')) ? params.get('status') : 'all';
  const search = params.get('q') || '';
  const query = useQuery({ queryKey: ['my-disputes', user?.id || user?.userId], queryFn: disputeService.getMyDisputes, staleTime: 0 });
  const allItems = query.data || [];
  const items = filterDisputes(allItems, filter, search);
  const change = (key, value) => setParams(previous => {
    const next = new URLSearchParams(previous);
    if (value && value !== 'all') next.set(key, value); else next.delete(key);
    return next;
  }, { replace: true });
  return <div className="mx-auto max-w-[1200px] space-y-6">
    <header className="flex flex-wrap items-start justify-between gap-4"><div className="max-w-2xl"><h1 className="text-headline-page text-fg">Khiếu nại của tôi</h1><p className="mt-2 text-body-reg leading-relaxed text-fg-secondary">Theo dõi vụ việc theo từng lớp học, trao đổi thông tin và cập nhật kết quả xử lý học phí.</p></div>{!isTutor && <Button as={Link} to="/student/reports" variant="outline">Báo cáo vi phạm</Button>}</header>
    <section aria-label="Tìm kiếm và lọc khiếu nại" className="space-y-4">
      <div className="relative max-w-xl"><Icon name="search" size="sm" className="pointer-events-none absolute left-3 top-3.5 text-fg-secondary" /><Input type="search" value={search} onChange={event => change('q', event.target.value)} aria-label="Tìm khiếu nại theo người học, gia sư hoặc gói học" placeholder={isTutor ? 'Tìm học viên, gói học hoặc lý do…' : 'Tìm gia sư, gói học hoặc lý do…'} className="pl-10" /></div>
      <div role="group" aria-label="Trạng thái khiếu nại" className="flex flex-wrap gap-2">{DISPUTE_FILTERS.map(([key, label]) => <button key={key} type="button" aria-pressed={filter === key} onClick={() => change('status', key)} className={cn('inline-flex min-h-11 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', filter === key ? 'bg-brand-primary-50 text-primary' : 'bg-surface text-fg-secondary hover:bg-neutral-100')}>
        {label}{query.isSuccess && <span className="text-xs tabular-nums opacity-75">{filterDisputes(allItems, key, '').length}</span>}
      </button>)}</div>
      {!query.isPending && !query.isError && allItems.length > 0 && <div className="flex flex-wrap items-center gap-3 text-xs text-fg-secondary"><p>{items.length} / {allItems.length} khiếu nại</p>{(search || filter !== 'all') && <button type="button" onClick={() => setParams({})} className="min-h-11 rounded px-1 font-medium text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring">Xóa bộ lọc</button>}</div>}
    </section>
    {query.isPending ? <DetailSkeleton /> : query.isError && !query.data ? <div className="rounded-2xl border border-border bg-surface p-6"><h2 className="font-semibold text-fg">Chưa tải được danh sách khiếu nại</h2><p className="mt-2 text-sm text-fg-secondary">Vui lòng thử lại để xem các vụ việc của bạn.</p><Button className="mt-4" variant="outline" onClick={() => query.refetch()} loading={query.isFetching}>Thử lại</Button></div>
      : <>{query.isError && <p role="alert" className="text-sm text-holding-strong">Chưa cập nhật được danh sách. <button type="button" onClick={() => query.refetch()} className="min-h-11 rounded px-1 font-medium underline focus-visible:ring-2 focus-visible:ring-ring">Thử lại</button></p>}
        {!allItems.length ? <EmptyState icon="shield" title="Bạn chưa có khiếu nại nào" description={isTutor ? 'Các khiếu nại liên quan đến buổi dạy của bạn sẽ xuất hiện tại đây để theo dõi và bổ sung bằng chứng.' : 'Nếu có vấn đề với buổi học, hãy mở chi tiết buổi học trong lộ trình để gửi khiếu nại khi còn trong thời gian bảo lưu.'} actionLabel={isTutor ? 'Về tổng quan' : 'Xem lớp học'} actionPath={dashboardPath} />
          : !items.length ? <EmptyState icon="search" title="Không tìm thấy khiếu nại phù hợp" description="Thử tìm theo tên khác hoặc thay đổi trạng thái để xem các vụ việc còn lại." actionLabel="Xóa bộ lọc" onAction={() => setParams({})} />
            : <div className="space-y-4">{items.map(item => <DisputeListCard key={item.id} item={item} isTutor={isTutor} />)}</div>}
      </>}
  </div>;
}
