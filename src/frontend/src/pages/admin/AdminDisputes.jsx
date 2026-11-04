import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import adminService from '@/services/admin.service';
import WorkspacePageHeader from '@/components/layout/WorkspacePageHeader';
import { AdminEmpty, AdminKpis, AdminStatus } from '@/components/admin/AdminWorkspacePrimitives';
import { DISPUTE_STATES } from '@/utils/adminDisputes';
import { DISPUTE_REASONS } from '@/utils/disputeList';
import { formatDateTime } from '@/utils/formatters';
import Button from '@/components/ui/Button';
import Money from '@/components/ui/Money';
import { TableSkeleton } from '@/components/common/Skeleton';

function Search({ initial, onSubmit }) {
  const [value, setValue] = useState(initial);
  return <form className="flex flex-wrap gap-3" onSubmit={event => { event.preventDefault(); onSubmit(value.trim()); }}><input aria-label="Tìm vụ việc" value={value} onChange={event => setValue(event.target.value)} placeholder="Tên học viên, gia sư, gói học hoặc mã vụ việc" className="h-11 min-w-0 flex-1 rounded-lg border border-border px-3 text-sm focus-visible:ring-2 focus-visible:ring-brand-primary-600" /><Button type="submit">Tìm kiếm</Button></form>;
}
export default function AdminDisputes() {
  const [params, setParams] = useSearchParams();
  const userId = useAuthStore(state => state.user?.id);
  const search = params.get('search') || '', status = params.get('status') || '';
  const page = Math.max(1, Number(params.get('page')) || 1);
  const summary = useQuery({ queryKey: ['admin-disputes-summary', userId], queryFn: adminService.getDisputeSummary });
  const list = useQuery({ queryKey: ['admin-disputes', userId, status, search, page], queryFn: () => adminService.getDisputes({ status, search, pageNumber: page }), retry: false });
  const update = changes => setParams(previous => { const next = new URLSearchParams(previous); next.delete('page'); Object.entries(changes).forEach(([key, value]) => value ? next.set(key, value) : next.delete(key)); return next; });
  const counts = summary.isError ? null : summary.data;
  const rows = list.data?.items || [], total = list.data?.totalCount || 0;
  const link = row => `/admin/disputes/${row.id}?list=${encodeURIComponent(params.toString())}`;
  return <div className="space-y-6"><WorkspacePageHeader title="Tranh chấp học phí" description="Theo dõi các vụ việc và tiến độ xử lý." actions={<Button variant="outline" loading={list.isFetching || summary.isFetching} onClick={() => { list.refetch(); summary.refetch(); }}>Làm mới</Button>} />
    <AdminKpis items={[{ label: 'Tổng vụ việc', value: counts?.total }, { label: 'Mới mở', value: counts?.open, tone: 'amber' }, { label: 'Đang điều tra', value: counts?.underReview }, { label: 'Cần xử lý ví', value: counts?.intervention, tone: 'purple' }]} />
    {summary.isError && <p role="alert" className="text-sm text-fg-secondary">Chưa tải được thống kê. Vui lòng làm mới.</p>}
    <section className="overflow-hidden rounded-2xl border border-border bg-surface"><div className="space-y-4 border-b border-border p-5"><h2 className="font-semibold">Danh sách vụ việc</h2><Search key={search} initial={search} onSubmit={value => update({ search: value })} /><div className="flex flex-wrap items-center gap-3"><label className="text-xs text-fg-secondary">Trạng thái <select aria-label="Trạng thái" value={status} onChange={event => update({ status: event.target.value })} className="ml-2 h-10 max-w-full rounded-lg border border-border bg-surface px-3 text-sm"><option value="">Tất cả</option>{Object.entries(DISPUTE_STATES).map(([key, [label]]) => <option key={key} value={key}>{label}</option>)}</select></label><p className="text-xs text-fg-secondary">{list.isError ? 'Chưa tải được kết quả' : `${total} vụ việc`}</p>{(search || status) && <Button size="sm" variant="ghost" onClick={() => setParams({})}>Xóa bộ lọc</Button>}</div></div>
      {list.isPending ? <div className="p-5"><TableSkeleton /></div> : list.isError ? <AdminEmpty title="Không thể tải vụ việc" description="Vui lòng thử tải lại danh sách."><Button className="mt-4" variant="outline" onClick={() => list.refetch()}>Thử lại</Button></AdminEmpty> : !rows.length ? <AdminEmpty title={search || status ? 'Không tìm thấy vụ việc phù hợp' : 'Chưa có tranh chấp học phí'} description="Các vụ việc được gửi sẽ hiển thị tại đây để kiểm tra và xử lý." /> : <>
        <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[950px] text-left text-sm"><thead className="bg-neutral-50 text-xs text-fg-secondary"><tr>{['Vụ việc', 'Các bên liên quan', 'Học phí tạm giữ', 'Trạng thái', ''].map(label => <th key={label} scope="col" className="px-5 py-3 font-medium">{label}</th>)}</tr></thead><tbody className="divide-y divide-border">{rows.map(row => <tr key={row.id} className="hover:bg-neutral-50"><td className="max-w-sm px-5 py-5"><Link className="font-semibold text-brand-primary-700" to={link(row)}>Buổi học #{row.sessionNumber} · {row.serviceTitle || 'Gói học'}</Link><p className="mt-2 text-[13px]">{DISPUTE_REASONS[row.reason] || 'Lý do khác'}</p><p className="mt-1 text-xs text-fg-secondary">{formatDateTime(row.createdAt)}</p></td><td className="px-5 py-5"><p>{row.studentName || row.initiatorName}</p><p className="mt-2 text-xs text-fg-secondary">Gia sư: {row.tutorName || row.respondentName}</p></td><td className="px-5 py-5"><Money value={row.heldAmount} className="whitespace-nowrap text-base font-semibold" /></td><td className="px-5 py-5"><AdminStatus label={DISPUTE_STATES[row.status]?.[0] || 'Chưa rõ trạng thái'} tone={DISPUTE_STATES[row.status]?.[1]} /></td><td className="px-5 py-5"><Button as={Link} to={link(row)} size="sm" variant="outline" className="whitespace-nowrap">Xem vụ việc</Button></td></tr>)}</tbody></table></div>
        <ul className="divide-y divide-border md:hidden">{rows.map(row => <li key={row.id} className="space-y-3 p-5"><AdminStatus label={DISPUTE_STATES[row.status]?.[0]} tone={DISPUTE_STATES[row.status]?.[1]} /><h3 className="text-sm font-semibold">Buổi học #{row.sessionNumber} · {row.serviceTitle}</h3><p className="text-sm">{DISPUTE_REASONS[row.reason]}</p><p className="text-xs leading-6 text-fg-secondary">{row.studentName || row.initiatorName}<br />Gia sư: {row.tutorName || row.respondentName}</p><Money value={row.heldAmount} className="block text-lg font-semibold" /><Button as={Link} to={link(row)} variant="outline" size="sm">Xem vụ việc</Button></li>)}</ul>
        <nav aria-label="Phân trang tranh chấp" className="flex flex-wrap justify-between gap-3 border-t border-border p-5 text-xs text-fg-secondary"><span>{(page - 1) * 10 + 1}–{(page - 1) * 10 + rows.length} / {total}</span><div className="flex gap-3"><Button size="sm" variant="outline" disabled={page <= 1} onClick={() => update({ page: page - 1 })}>Trước</Button><Button size="sm" variant="outline" disabled={page * 10 >= total} onClick={() => update({ page: page + 1 })}>Sau</Button></div></nav>
      </>}
    </section></div>;
}
