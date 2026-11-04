import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import adminService from '@/services/admin.service';
import WorkspacePageHeader from '@/components/layout/WorkspacePageHeader';
import Button from '@/components/ui/Button';
import Money from '@/components/ui/Money';
import StateBadge from '@/components/common/StateBadge';
import { AdminEmpty } from '@/components/admin/AdminWorkspacePrimitives';
import { TableSkeleton } from '@/components/common/Skeleton';
import { formatDateTime } from '@/utils/formatters';

const STATES = { Pending: 'Chờ kích hoạt', Active: 'Đang học', Completed: 'Đã hoàn thành', Cancelled: 'Đã hủy' };
const CONTROL = 'h-11 w-full min-w-0 rounded-lg border border-border bg-surface px-3 text-sm';
function Filters({ search, status, onSubmit }) {
  const [term, setTerm] = useState(search), [state, setState] = useState(status);
  return <form className="grid gap-3 border-b border-border p-5 lg:grid-cols-[minmax(0,1fr)_220px_auto]" onSubmit={e => { e.preventDefault(); onSubmit(term.trim(), state); }}>
    <label className="space-y-2 text-xs font-medium"><span>Tìm hợp đồng</span><input className={CONTROL} aria-label="Tìm hợp đồng" placeholder="Tên học viên, gia sư, gói học hoặc mã hợp đồng" value={term} onChange={e => setTerm(e.target.value)} /></label>
    <label className="space-y-2 text-xs font-medium"><span>Trạng thái</span><select className={CONTROL} aria-label="Trạng thái hợp đồng" value={state} onChange={e => setState(e.target.value)}><option value="">Tất cả trạng thái</option>{Object.entries(STATES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    <Button type="submit" className="self-end">Tra cứu</Button>
  </form>;
}
export default function AdminEnrollments() {
  const userId = useAuthStore(s => s.user?.id), [params, setParams] = useSearchParams();
  const search = params.get('search') || '', status = params.get('status') || '';
  const page = Math.max(1, Math.floor(Number(params.get('page')) || 1));
  const filters = { search, status: status || undefined, participantUserId: params.get('participantUserId') || undefined, serviceId: params.get('serviceId') || undefined, pageNumber: page, pageSize: 10 };
  const query = useQuery({ queryKey: ['admin-enrollments', userId, filters], queryFn: () => adminService.getEnrollments(filters), retry: false });
  const update = values => setParams(previous => { const next = new URLSearchParams(previous); Object.entries(values).forEach(([key, value]) => value ? next.set(key, value) : next.delete(key)); return next; });
  const rows = query.data?.items || [];
  return <div className="space-y-6"><WorkspacePageHeader title="Hợp đồng học tập" description="Tra cứu lớp học, tiến độ và hợp đồng của học viên trên toàn sàn." />
    <section className="overflow-hidden rounded-2xl border border-border bg-surface">
      <Filters key={`${search}-${status}`} search={search} status={status} onSubmit={(term, state) => update({ search: term, status: state, page: '' })} />
      {(search || status || filters.participantUserId || filters.serviceId) && <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3 text-sm"><span className="text-fg-secondary">{filters.participantUserId ? 'Đang lọc theo tài khoản liên quan' : filters.serviceId ? 'Đang lọc theo gói học' : 'Đang áp dụng bộ lọc'}</span><Button size="sm" variant="ghost" onClick={() => setParams({})}>Xóa bộ lọc</Button></div>}
      {query.isPending ? <div className="p-5"><TableSkeleton rows={5} cols={5} /></div> : query.isError ? <AdminEmpty title="Chưa tải được hợp đồng" description="Vui lòng thử lại để tiếp tục tra cứu."><Button className="mt-4" variant="outline" onClick={() => query.refetch()}>Thử lại</Button></AdminEmpty> : !rows.length ? <AdminEmpty title="Không có hợp đồng phù hợp" description="Các hợp đồng đã được tạo sẽ xuất hiện tại đây." /> : <>
        <div className="hidden overflow-auto md:block"><table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-neutral-50 text-xs text-fg-secondary"><tr>{['Gói học / Ngày tạo', 'Học viên & Gia sư', 'Tiến độ', 'Học phí', ''].map(label => <th key={label} className="p-4 font-medium">{label}</th>)}</tr></thead><tbody className="divide-y divide-border">{rows.map(item => <tr key={item.id}><td className="max-w-xs p-4"><p className="font-semibold leading-6">{item.serviceTitle || item.subjectName}</p><p className="mt-1 text-xs text-fg-secondary">{formatDateTime(item.createdAt)}</p></td><td className="p-4"><Link className="text-primary hover:underline" to={`/admin/users?userId=${item.studentUserId}`}>{item.studentName}</Link><p className="mt-2 text-xs text-fg-secondary">Gia sư: {item.tutorName}</p></td><td className="p-4"><StateBadge domain="enrollment" status={item.status} /><p className="mt-2 text-xs">{item.completedSessions}/{item.totalSessions} buổi</p></td><td className="whitespace-nowrap p-4 font-semibold"><Money value={item.totalPrice} /></td><td className="p-4"><Button as={Link} to={`/admin/enrollments/${item.id}`} variant="outline" size="sm">Chi tiết</Button></td></tr>)}</tbody></table></div>
        <ul className="divide-y divide-border md:hidden">{rows.map(item => <li key={item.id} className="space-y-3 p-5"><h2 className="text-sm font-semibold leading-6">{item.serviceTitle || item.subjectName}</h2><p className="text-sm">{item.studentName}</p><p className="text-xs text-fg-secondary">Gia sư: {item.tutorName}</p><StateBadge domain="enrollment" status={item.status} /><p className="text-sm">{item.completedSessions}/{item.totalSessions} buổi · <Money value={item.totalPrice} /></p><Button as={Link} to={`/admin/enrollments/${item.id}`} variant="outline" size="sm">Chi tiết hợp đồng</Button></li>)}</ul>
        <nav aria-label="Phân trang hợp đồng" className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-5 text-xs"><span>{query.data.totalCount} hợp đồng · Trang {page}/{query.data.totalPages || 1}</span><div className="flex gap-2"><Button size="sm" variant="outline" disabled={page <= 1} onClick={() => update({ page: page - 1 })}>Trước</Button><Button size="sm" variant="outline" disabled={!query.data.hasNextPage} onClick={() => update({ page: page + 1 })}>Sau</Button></div></nav>
      </>}
    </section></div>;
}
