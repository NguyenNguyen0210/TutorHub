import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import adminService from '@/services/admin.service';
import WorkspacePageHeader from '@/components/layout/WorkspacePageHeader';
import WithdrawalReviewDrawer from '@/components/admin/WithdrawalReviewDrawer';
import { WithdrawalStatus } from '@/components/admin/WithdrawalStatus';
import { cn } from '@/lib/cn';
import { formatDateTime } from '@/utils/formatters';
import { maskBankAccount } from '@/utils/tutorWallet';
import Avatar from '@/components/ui/Avatar';
import Card from '@/components/ui/Card';
import Icon from '@/components/ui/Icon';
import Button from '@/components/ui/Button';
import Input, { Field } from '@/components/ui/Input';
import Money from '@/components/ui/Money';
import Tabs from '@/components/ui/Tabs';
import { TableSkeleton, StatsSkeleton } from '@/components/common/Skeleton';

const STATUSES = { All: 'Tất cả', Pending: 'Chờ tiếp nhận', Processing: 'Đang xử lý', Completed: 'Đã hoàn tất', Failed: 'Thất bại' };

function WithdrawalTools({ initialSearch, status, onSearch, onStatus, onClear }) {
  const [search, setSearch] = useState(initialSearch);
  return <div className="border-b border-border p-5">
    <form className="mb-4 flex flex-col items-stretch gap-3 sm:flex-row sm:items-end" onSubmit={event => { event.preventDefault(); onSearch(search.trim()); }}>
      <div className="min-w-0 flex-1"><Field label="Tìm yêu cầu" htmlFor="withdrawal-search"><Input id="withdrawal-search" placeholder="Tên gia sư, email, ngân hàng hoặc mã yêu cầu" value={search} onChange={event => setSearch(event.target.value)} /></Field></div>
      <div className="flex gap-2"><Button type="submit" icon={<Icon name="search" size="sm" />}>Tìm kiếm</Button><Button variant="ghost" onClick={onClear}>Xóa lọc</Button></div>
    </form>
    <Tabs tabs={Object.entries(STATUSES).map(([key, label]) => ({ key, label }))} value={status} onChange={onStatus} />
  </div>;
}

export default function AdminWithdrawals({ embedded = false }) {
  const userId = useAuthStore(state => state.user?.id);
  const [params, setParams] = useSearchParams();
  const status = params.get('status') || 'All';
  const search = params.get('search') || '';
  const pageValue = Number(params.get('page'));
  const page = Number.isSafeInteger(pageValue) && pageValue > 0 ? pageValue : 1;
  const requestedId = params.get('withdrawalId');
  const hasFilters = status !== 'All' || Boolean(search);
  const summary = useQuery({ queryKey: ['admin-tutor-withdrawals', userId, 'summary'], queryFn: adminService.getWithdrawalSummary, retry: false });
  const list = useQuery({ queryKey: ['admin-tutor-withdrawals', userId, 'list', status, search, page], queryFn: () => adminService.getWithdrawals({ status: status === 'All' ? undefined : status, search, pageNumber: page, pageSize: 10 }), retry: false });
  const globallyEmpty = summary.isSuccess && summary.data?.totalCount === 0;
  const showTools = !globallyEmpty || hasFilters;
  const rows = list.data?.items || [];
  const update = patch => setParams(Object.fromEntries(Object.entries({ status: status === 'All' ? '' : status, search, ...patch }).filter(([, value]) => value)), { flushSync: true });
  const open = id => setParams({ ...Object.fromEntries(params), withdrawalId: id });
  const close = () => { const next = new URLSearchParams(params); next.delete('withdrawalId'); setParams(next, { replace: true }); };
  const refresh = () => { summary.refetch(); list.refetch(); };
  const stats = [
    { label: 'Chờ tiếp nhận', key: 'pendingCount', icon: 'schedule', tone: 'border-holding/20 bg-holding-subtle', iconTone: 'bg-holding/10 text-holding-strong' },
    { label: 'Đang xử lý', key: 'processingCount', icon: 'sync', tone: 'border-brand-primary-100 bg-brand-primary-50', iconTone: 'bg-brand-primary-100 text-brand-primary-600' },
    { label: 'Tổng yêu cầu', key: 'totalCount', icon: 'receipt_long', tone: 'border-insight-border bg-insight-subtle', iconTone: 'bg-insight-strong/10 text-insight-strong' },
  ];
  return <div className="space-y-6 lg:space-y-8">
    {embedded ? <div className="flex justify-end"><Button variant="outline" size="sm" loading={list.isFetching || summary.isFetching} onClick={refresh} icon={<Icon name="refresh" size="sm" />}>Làm mới</Button></div> : <WorkspacePageHeader title="Yêu cầu rút tiền" description="Quản lý và theo dõi yêu cầu rút tiền của gia sư." actions={<Button variant="outline" size="sm" loading={list.isFetching || summary.isFetching} onClick={refresh} icon={<Icon name="refresh" size="sm" />}>Làm mới</Button>} />}
    <section aria-label="Thống kê yêu cầu gia sư" className="space-y-3">
      {summary.isPending ? <StatsSkeleton count={3} /> : <div className="grid gap-4 sm:grid-cols-3">{stats.map(stat => <div key={stat.key} className={cn('flex min-h-[108px] items-center justify-between gap-3 rounded-2xl border p-4', stat.tone)}><div><h2 className="text-xs font-medium text-fg-secondary">{stat.label}</h2><p className="mt-2 text-3xl font-semibold tabular-nums">{summary.isError || summary.data?.[stat.key] == null ? '—' : summary.data[stat.key]}<span className="ml-2 text-xs font-normal text-fg-secondary">lệnh</span></p></div><span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', stat.iconTone)}><Icon name={stat.icon} size="md" /></span></div>)}</div>}
      {summary.isError ? <div className="flex flex-wrap items-center gap-2 text-xs text-fg-secondary"><span role="alert">Chưa tải được thống kê yêu cầu.</span><Button variant="ghost" size="sm" onClick={() => summary.refetch()}>Thử lại thống kê</Button></div> : <p className="text-xs text-fg-secondary">Toàn bộ yêu cầu gia sư · Không phụ thuộc bộ lọc danh sách</p>}
    </section>

    <Card padding="none" variant="outlined">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5"><div><h2 className="text-base font-semibold">Danh sách yêu cầu</h2><p className="mt-1 text-xs text-fg-secondary">{list.isPending ? 'Đang tải…' : list.isError ? 'Chưa tải được kết quả' : `${list.data?.totalCount ?? 0} kết quả`}</p></div><Icon name="payments" size="md" className="text-brand-primary-600" /></div>
      {showTools && <WithdrawalTools key={`${status}:${search}`} status={status} initialSearch={search} onSearch={value => update({ search: value })} onStatus={value => update({ status: value === 'All' ? '' : value })} onClear={() => setParams({})} />}
      {list.isPending ? <div className="p-5"><TableSkeleton rows={4} /></div> : list.isError ? <div className="space-y-4 px-5 py-14 text-center"><Icon name="refresh" size="xl" className="mx-auto text-brand-primary-600" /><h3 role="alert" className="font-semibold">Không thể tải yêu cầu rút tiền</h3><p className="text-sm text-fg-secondary">Vui lòng thử tải lại danh sách.</p><Button variant="outline" onClick={() => list.refetch()}>Thử lại</Button></div> : rows.length === 0 ? <div className="flex flex-col items-center px-5 py-14 text-center">
        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-primary-50 text-brand-primary-600"><Icon name="payments" size="xl" /></span>
        <h3 className="text-base font-semibold">{hasFilters ? 'Không tìm thấy yêu cầu phù hợp' : globallyEmpty ? 'Chưa có yêu cầu rút tiền nào' : 'Chưa có yêu cầu trong trang này'}</h3>
        <p className="mt-2 max-w-md text-sm leading-6 text-fg-secondary">{hasFilters ? 'Thử đổi từ khóa hoặc trạng thái để tìm yêu cầu.' : 'Khi gia sư gửi yêu cầu rút thu nhập, các lệnh và trạng thái xử lý sẽ xuất hiện tại đây.'}</p>
        {hasFilters ? <Button variant="outline" className="mt-5" onClick={() => setParams({})}>Xóa bộ lọc</Button> : page > 1 ? <Button variant="outline" className="mt-5" onClick={() => update({})}>Về trang đầu</Button> : globallyEmpty && <p className="mt-5 inline-flex items-center gap-2 text-xs text-success-strong"><Icon name="check_circle" size="sm" />Hiện chưa có lệnh cần xử lý.</p>}
      </div> : <>
        <div className="overflow-x-auto"><table className="w-full min-w-[960px] text-sm"><caption className="sr-only">Yêu cầu rút tiền gia sư</caption><thead className="bg-neutral-100 text-xs text-fg-secondary"><tr>{['Gia sư', 'Số tiền', 'Tài khoản nhận', 'Ngày yêu cầu', 'Trạng thái', 'Thao tác'].map((label, index) => <th key={label} scope="col" className={cn('px-4 py-3 font-medium', index === 1 || index === 5 ? 'text-right' : 'text-left')}>{label}</th>)}</tr></thead><tbody className="divide-y divide-border">{rows.map(item => <tr key={item.id} onClick={event => { if (!event.target.closest('button,a')) open(item.id); }} className="cursor-pointer hover:bg-neutral-50">
          <td className="min-w-[220px] px-4 py-4"><div className="flex items-center gap-3"><Avatar src={item.tutorAvatarUrl} name={item.tutorName} size="sm" /><div className="min-w-0"><p className="font-semibold">{item.tutorName}</p><p className="mt-1 max-w-[190px] truncate text-xs text-fg-secondary" title={item.tutorEmail}>{item.tutorEmail}</p></div></div></td>
          <td className="px-4 py-4 text-right"><Money value={item.amount} className="whitespace-nowrap text-base font-semibold" /></td>
          <td className="min-w-[180px] px-4 py-4"><p className="font-medium">{item.bankName}</p><p className="mt-1 text-xs text-fg-secondary">{maskBankAccount(item.accountNumber)}</p></td>
          <td className="px-4 py-4"><p className="whitespace-nowrap text-xs text-fg-secondary">{formatDateTime(item.requestedAt)}</p></td>
          <td className="min-w-[150px] px-4 py-4"><WithdrawalStatus status={item.status} /></td>
          <td className="px-4 py-4 text-right"><Button variant="ghost" size="sm" className="whitespace-nowrap text-brand-primary-700" onClick={() => open(item.id)} iconRight={<Icon name="chevron_right" size="sm" />}>Xem chi tiết</Button></td>
        </tr>)}</tbody></table></div>
        <nav aria-label="Phân trang yêu cầu rút tiền" className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-5 text-xs text-fg-secondary"><span>{(page - 1) * 10 + 1}–{(page - 1) * 10 + rows.length} / {list.data.totalCount} lệnh</span><div className="flex items-center gap-3"><Button variant="outline" size="sm" disabled={!list.data.hasPreviousPage} onClick={() => update({ page: page - 1 })}>Trước</Button><span>Trang {page}/{list.data.totalPages || 1}</span><Button variant="outline" size="sm" disabled={!list.data.hasNextPage} onClick={() => update({ page: page + 1 })}>Tiếp</Button></div></nav>
      </>}
    </Card>
    <WithdrawalReviewDrawer key={requestedId || 'closed'} id={requestedId} onClose={close} />
  </div>;
}
