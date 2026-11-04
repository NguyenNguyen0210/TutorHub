import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import WorkspacePageHeader from '@/components/layout/WorkspacePageHeader';
import { useAuthStore } from '@/store/authStore';
import adminService from '@/services/admin.service';
import { formatDateTime } from '@/utils/formatters';
import { TRANSACTION_TYPES, TRANSACTION_STATUSES, TRANSACTION_SORTS, transactionFilters } from '@/utils/adminTransactions';
import { TransactionIcon, TransactionStatus } from '@/components/admin/TransactionPresentation';
import TransactionReviewDrawer from '@/components/admin/TransactionReviewDrawer';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input, { Field, Select } from '@/components/ui/Input';
import Tabs from '@/components/ui/Tabs';
import Icon from '@/components/ui/Icon';
import Money from '@/components/ui/Money';
import { TableSkeleton } from '@/components/common/Skeleton';

const draftFrom = params => Object.fromEntries(['search', 'status', 'fromDate', 'toDate', 'sort'].map(key => [key, params.get(key) || (key === 'sort' ? 'Newest' : '')]));

function TransactionFilters({ initial, onApply, onClear }) {
  const [draft, setDraft] = useState(initial);
  const invalidRange = Boolean(draft.fromDate && draft.toDate && draft.fromDate > draft.toDate);
  return <Card padding="lg" variant="outlined">
    <form className="space-y-4" onSubmit={event => { event.preventDefault(); if (!invalidRange) onApply(draft); }}>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2"><Field label="Tìm kiếm giao dịch" htmlFor="transaction-search"><Input id="transaction-search" placeholder="Mã giao dịch, học viên, gia sư hoặc gói học" value={draft.search} onChange={event => setDraft({ ...draft, search: event.target.value })} /></Field></div>
        <Field label="Trạng thái" htmlFor="transaction-status"><Select id="transaction-status" value={draft.status} onChange={event => setDraft({ ...draft, status: event.target.value })}><option value="">Tất cả trạng thái</option>{Object.entries(TRANSACTION_STATUSES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</Select></Field>
      </div>
      <div className="grid items-end gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Field label="Từ ngày" htmlFor="transaction-from"><Input type="date" id="transaction-from" value={draft.fromDate} onChange={event => setDraft({ ...draft, fromDate: event.target.value })} /></Field>
        <Field label="Đến ngày" htmlFor="transaction-to"><Input type="date" id="transaction-to" value={draft.toDate} min={draft.fromDate || undefined} onChange={event => setDraft({ ...draft, toDate: event.target.value })} /></Field>
        <Field label="Sắp xếp" htmlFor="transaction-sort"><Select id="transaction-sort" value={draft.sort} onChange={event => setDraft({ ...draft, sort: event.target.value })}>{Object.entries(TRANSACTION_SORTS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</Select></Field>
        <div className="flex flex-wrap gap-2"><Button type="submit" disabled={invalidRange} icon={<Icon name="search" size="sm" />}>Tra cứu</Button><Button variant="ghost" onClick={onClear}>Xóa lọc</Button></div>
      </div>
      <p className="flex items-center gap-2 text-xs text-fg-secondary"><Icon name="schedule" size="xs" />Giờ Việt Nam (UTC+7) · Bao gồm cả ngày bắt đầu và ngày kết thúc.</p>
      {invalidRange && <p role="alert" className="text-sm text-danger-strong">Ngày kết thúc phải từ ngày bắt đầu trở đi.</p>}
    </form>
  </Card>;
}

export default function AdminTransactions() {
  const { user } = useAuthStore();
  const [params, navigateParams] = useSearchParams();
  const setParams = (values, options = {}) => navigateParams(values, { flushSync: true, ...options });
  const filters = transactionFilters(params);
  const filterKey = JSON.stringify(filters);
  const requestedPage = Number(params.get('page'));
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const sort = filters.sort || 'Newest';
  const query = useQuery({ queryKey: ['admin-transactions', user?.id, filters, page], queryFn: () => adminService.getTransactions({ ...filters, pageNumber: page, pageSize: 10 }), retry: false });
  const update = patch => setParams(Object.fromEntries(Object.entries({ ...filters, ...patch }).filter(([, value]) => value)));
  const open = id => setParams({ ...Object.fromEntries(params), transactionId: id });
  const close = () => { const next = new URLSearchParams(params); next.delete('transactionId'); setParams(next, { replace: true }); };
  const hasFilters = Object.entries(filters).some(([key, value]) => key !== 'sort' && value);

  return <div className="space-y-6 lg:space-y-8">
    <WorkspacePageHeader title="Giao dịch toàn sàn" description="Theo dõi thanh toán, giải ngân và hoàn tiền." />
    <div className="flex flex-wrap gap-3"><Button variant={filters.settlementRequired ? 'primary' : 'outline'} size="sm" onClick={() => update({ settlementRequired: filters.settlementRequired ? '' : 'true', type: 'StudentRefund', status: '' })}>Hoàn tiền cần đối soát</Button>{filters.settlementRequired && <span className="self-center text-xs text-fg-secondary">Chỉ hiển thị khoản còn nghĩa vụ đối soát</span>}</div>
    <Tabs tabs={[{ key: 'all', label: 'Tất cả giao dịch' }, ...Object.entries(TRANSACTION_TYPES).map(([key, value]) => ({ key, label: value.short, icon: <Icon name={value.icon} size="sm" /> }))]} value={filters.type || 'all'} onChange={type => update({ type: type === 'all' ? '' : type })} />

    <TransactionFilters key={filterKey} initial={draftFrom(params)} onApply={update} onClear={() => setParams({})} />

    <Card padding="none" variant="outlined">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5">
        <div><h2 className="text-base font-semibold">Danh sách giao dịch</h2><p className="mt-1 text-xs text-fg-secondary">{query.isPending ? 'Đang tra cứu…' : query.isError ? 'Chưa tải được kết quả' : `${query.data?.totalCount || 0} bút toán${hasFilters ? ' phù hợp' : ''}`}</p></div>
        <span className="inline-flex items-center gap-2 text-xs text-fg-secondary"><Icon name="receipt_long" size="sm" />Đối soát theo từng bút toán</span>
      </div>
      {query.isPending ? <div className="p-5"><TableSkeleton rows={5} /></div> : query.isError ? <div className="p-8"><p role="alert" className="text-sm text-fg-secondary">Chưa tra cứu được giao dịch. Vui lòng kiểm tra bộ lọc và thử lại.</p><Button className="mt-4" variant="outline" onClick={() => query.refetch()}>Thử lại</Button></div> : !query.data?.items?.length ? <div className="px-5 py-14 text-center"><Icon name="receipt_long" size="xl" className="mx-auto mb-4 text-brand-primary-600" /><h3 className="font-semibold">Không có giao dịch phù hợp</h3><p className="mt-2 text-sm text-fg-secondary">Thử thay đổi loại giao dịch hoặc khoảng thời gian.</p></div> : <>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1020px] text-sm">
            <caption className="sr-only">Giao dịch toàn sàn — mỗi dòng là một bút toán</caption>
            <thead className="sticky top-0 z-10 bg-neutral-100 text-left text-xs text-fg-secondary">
              <tr>
                <th scope="col" className="px-5 py-4 font-medium" aria-sort={sort === 'Newest' ? 'descending' : sort === 'Oldest' ? 'ascending' : 'none'}><button type="button" onClick={() => update({ sort: sort === 'Newest' ? 'Oldest' : 'Newest' })} className="inline-flex items-center gap-2 rounded focus-visible:ring-2 focus-visible:ring-brand-primary-500" aria-label="Sắp xếp theo thời gian">Giao dịch<Icon name={sort === 'Oldest' ? 'keyboard_arrow_up' : 'keyboard_arrow_down'} size="xs" /></button></th>
                <th scope="col" className="px-4 py-4 font-medium">Học viên</th>
                <th scope="col" className="px-4 py-4 font-medium">Gia sư / Gói học</th>
                <th scope="col" className="px-4 py-4 text-right font-medium" aria-sort={sort === 'AmountDesc' ? 'descending' : sort === 'AmountAsc' ? 'ascending' : 'none'}><button type="button" onClick={() => update({ sort: sort === 'AmountDesc' ? 'AmountAsc' : 'AmountDesc' })} className="inline-flex items-center gap-2 rounded focus-visible:ring-2 focus-visible:ring-brand-primary-500" aria-label="Sắp xếp theo số tiền">Số tiền<Icon name={sort === 'AmountAsc' ? 'keyboard_arrow_up' : 'keyboard_arrow_down'} size="xs" /></button></th>
                <th scope="col" className="px-4 py-4 font-medium">Trạng thái</th>
                <th scope="col" className="px-5 py-4 text-right font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {query.data.items.map(item => <tr key={item.id} onClick={event => { if (!event.target.closest('button, a')) open(item.id); }} className="cursor-pointer transition-colors hover:bg-neutral-50">
                <td className="px-5 py-3.5"><div className="flex items-start gap-3"><TransactionIcon type={item.type} /><div className="min-w-0"><p className="font-semibold leading-5">{TRANSACTION_TYPES[item.type]?.label || 'Giao dịch'}</p><p className="mt-1 max-w-[170px] truncate font-mono text-[11px] leading-4 text-fg-secondary" title={item.paymentGatewayRef || item.id}>{item.paymentGatewayRef || item.id}</p><p className="mt-1 text-xs leading-4 text-fg-secondary">{formatDateTime(item.createdAt)}</p></div></div></td>
                <td className="min-w-[120px] max-w-[160px] px-4 py-3.5"><p className="font-medium leading-5">{item.studentName}</p></td>
                <td className="min-w-[190px] max-w-[230px] px-4 py-3.5"><p className="font-medium leading-5">{item.tutorName}</p><p className="mt-1 line-clamp-2 text-xs leading-5 text-fg-secondary" title={item.serviceTitle || item.subjectName}>{item.serviceTitle || item.subjectName}</p></td>
                <td className="px-4 py-3.5 text-right"><Money value={item.grossAmount} className="whitespace-nowrap text-base font-semibold" />{item.type === 'SessionPayoutCredit' && <p className="mt-1 text-xs text-fg-secondary">Trước phí</p>}</td>
                <td className="max-w-[160px] px-4 py-3.5"><TransactionStatus item={item} /></td>
                <td className="px-5 py-3.5 text-right"><Button variant="ghost" size="sm" className="whitespace-nowrap text-brand-primary-700" onClick={() => open(item.id)} iconRight={<Icon name="chevron_right" size="sm" />}>Xem đối soát</Button></td>
              </tr>)}
            </tbody>
          </table>
        </div>
        <nav aria-label="Phân trang giao dịch" className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-5">
          <p className="text-xs text-fg-secondary">{(page - 1) * 10 + 1}–{Math.min(page * 10, query.data.totalCount)} / {query.data.totalCount} bút toán</p>
          <div className="flex items-center gap-3"><Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setParams({ ...filters, page: page - 1 })}>Trước</Button><span className="text-xs text-fg-secondary">Trang {page}/{query.data.totalPages || 1}</span><Button size="sm" variant="outline" disabled={!query.data.hasNextPage} onClick={() => setParams({ ...filters, page: page + 1 })}>Tiếp</Button></div>
        </nav>
      </>}
    </Card>
    <TransactionReviewDrawer id={params.get('transactionId')} onClose={close} onSelect={open} />
  </div>;
}
