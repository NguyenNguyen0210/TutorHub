import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import adminService from '@/services/admin.service';
import WorkspacePageHeader from '@/components/layout/WorkspacePageHeader';
import UserReviewModal, { USER_ROLES, USER_STATES } from '@/components/admin/UserReviewModal';
import { AdminKpis, AdminStatus, AdminEmpty } from '@/components/admin/AdminWorkspacePrimitives';
import { TableSkeleton } from '@/components/common/Skeleton';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import { formatDateTime } from '@/utils/formatters';

export default function AdminUsers() {
  const [params, setParams] = useSearchParams();
  const selfId = useAuthStore(state => state.user?.id);
  const search = params.get('search') || '', role = params.get('role') || '', status = params.get('status') || '';
  const page = Math.max(1, Number(params.get('page')) || 1), id = params.get('userId');
  const [text, setText] = useState(search);
  const timer = useRef(null), opener = useRef(null);
  useEffect(() => { setText(search); }, [search]);
  useEffect(() => () => clearTimeout(timer.current), []);
  const update = (changes, reset = true) => setParams(previous => { const next = new URLSearchParams(previous); if (reset) next.delete('page'); Object.entries(changes).forEach(([key, value]) => value ? next.set(key, value) : next.delete(key)); return next; }, { replace: true, preventScrollReset: true });
  const list = useQuery({ queryKey: ['admin-users', selfId, search, role, status, page], queryFn: () => adminService.getUsers({ search, role, status, pageNumber: page, pageSize: 15 }), retry: false });
  const summary = useQuery({ queryKey: ['admin-users-summary', selfId], queryFn: adminService.getUserSummary, retry: false });
  const counts = summary.data;
  const open = (row, event) => { opener.current = event.currentTarget; update({ userId: row.id }, false); };
  const close = () => { update({ userId: '' }, false); requestAnimationFrame(() => { if (opener.current?.isConnected) opener.current.focus(); else document.querySelector('[aria-label="Tìm người dùng"]')?.focus(); }); };
  const rows = list.data?.items || [];
  return <div className="space-y-6"><WorkspacePageHeader title="Quản lý người dùng" description="Theo dõi tài khoản, vai trò và quyền truy cập." actions={<Button variant="outline" loading={list.isFetching || summary.isFetching} onClick={() => { list.refetch(); summary.refetch(); }}>Làm mới</Button>} />
    <AdminKpis items={[{ label: 'Tổng tài khoản', value: counts?.total }, { label: 'Đang hoạt động', value: counts?.active, tone: 'mint' }, { label: 'Tạm khóa / Cấm', value: counts ? counts.suspended + counts.banned : null, tone: 'amber' }]} />
    {summary.isError && <p role="alert" className="text-sm text-fg-secondary">Chưa tải được thống kê toàn bộ tài khoản.</p>}
    <section className="overflow-hidden rounded-2xl border border-border bg-surface"><div className="space-y-4 border-b border-border p-5"><nav aria-label="Vai trò" className="flex gap-5 overflow-x-auto">{[['', 'Tất cả'], ...Object.entries(USER_ROLES)].map(([key, label]) => <button type="button" key={key} aria-pressed={role === key} onClick={() => update({ role: key })} className={`min-h-10 shrink-0 text-sm font-medium ${role === key ? 'text-brand-primary-700' : 'text-fg-secondary'}`}>{label}</button>)}</nav><div className="flex flex-wrap gap-3"><input aria-label="Tìm người dùng" value={text} placeholder="Tên, email hoặc mã tài khoản…" onChange={event => { const value = event.target.value; setText(value); clearTimeout(timer.current); timer.current = setTimeout(() => update({ search: value.trim() }), 300); }} className="h-11 min-w-0 flex-1 rounded-lg border border-border px-3 text-sm focus-visible:ring-2 focus-visible:ring-brand-primary-600" /><select aria-label="Trạng thái tài khoản" value={status} onChange={event => update({ status: event.target.value })} className="h-11 rounded-lg border border-border bg-surface px-3 text-sm"><option value="">Tất cả trạng thái</option>{Object.entries(USER_STATES).map(([key, [label]]) => <option key={key} value={key}>{label}</option>)}</select></div><p className="text-xs text-fg-secondary">{list.isPending ? 'Đang tải…' : list.isError ? 'Chưa tải được kết quả' : `${list.data.totalCount} tài khoản phù hợp`}</p></div>
      {list.isPending ? <div className="p-5"><TableSkeleton /></div> : list.isError ? <AdminEmpty title="Không thể tải người dùng" description="Vui lòng tải lại danh sách."><Button className="mt-4" onClick={() => list.refetch()}>Thử lại</Button></AdminEmpty> : !rows.length ? <AdminEmpty title="Không tìm thấy tài khoản phù hợp" description="Thử điều chỉnh từ khóa hoặc bộ lọc."><Button className="mt-4" variant="outline" onClick={() => { clearTimeout(timer.current); setParams({}); setText(''); }}>Xóa bộ lọc</Button></AdminEmpty> : <><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-neutral-50 text-xs text-fg-secondary"><tr>{['Người dùng', 'Vai trò', 'Trạng thái', 'Ngày tham gia', ''].map(label => <th key={label} scope="col" className="px-5 py-3 font-medium">{label}</th>)}</tr></thead><tbody className="divide-y divide-border">{rows.map(row => <tr key={row.id} className="cursor-pointer hover:bg-neutral-50" onClick={event => { if (!event.target.closest('button')) open(row, event); }}><td className="px-5 py-5"><div className="flex items-center gap-3"><Avatar src={row.avatarUrl} name={row.fullName} size="md" /><div><p className="text-sm font-semibold">{row.fullName}</p><p className="mt-1 text-xs text-fg-secondary">{row.email}</p></div></div></td><td className="px-5 py-5 text-[13px] text-fg-secondary">{USER_ROLES[row.role]}</td><td className="px-5 py-5"><AdminStatus label={USER_STATES[row.status]?.[0]} tone={USER_STATES[row.status]?.[1]} /></td><td className="whitespace-nowrap px-5 py-5 text-xs text-fg-secondary">{formatDateTime(row.createdAt)}</td><td className="px-5 py-5"><Button variant="ghost" size="sm" className="whitespace-nowrap text-brand-primary-700" onClick={event => open(row, event)}>Xem hồ sơ</Button></td></tr>)}</tbody></table></div><nav aria-label="Phân trang người dùng" className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-5 text-xs"><span>Trang {page}/{list.data.totalPages || 1} · {list.data.totalCount} tài khoản</span><div className="flex gap-3"><Button variant="outline" size="sm" disabled={page <= 1} onClick={() => update({ page: page - 1 }, false)}>Trước</Button><Button variant="outline" size="sm" disabled={!list.data.hasNextPage} onClick={() => update({ page: page + 1 }, false)}>Sau</Button></div></nav></>}
    </section>{id && <UserReviewModal key={id} id={id} onClose={close} />}</div>;
}
