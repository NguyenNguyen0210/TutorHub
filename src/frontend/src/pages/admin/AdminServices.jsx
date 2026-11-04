import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import adminService from '@/services/admin.service';
import WorkspacePageHeader from '@/components/layout/WorkspacePageHeader';
import { AdminEmpty, AdminStatus } from '@/components/admin/AdminWorkspacePrimitives';
import ModerationAction from '@/components/admin/ModerationAction';
import { Drawer } from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Money from '@/components/ui/Money';
import { formatDateTime } from '@/utils/formatters';

const STATES = { Draft: ['Bản nháp', 'neutral'], Published: ["Đang hiển thị", 'mint'], Paused: ['Tạm dừng', 'amber'], Unpublished: ['Đã ẩn', 'neutral'] };
const CONTROL = 'h-11 w-full min-w-0 rounded-lg border border-border bg-surface px-3 text-sm';
function Filters({ initial, apply }) {
  const [search, setSearch] = useState(initial.search), [status, setStatus] = useState(initial.status);
  return <form onSubmit={e => { e.preventDefault(); apply({ search: search.trim(), status, page: '' }); }} className="grid gap-3 border-b border-border p-5 lg:grid-cols-[minmax(0,1fr)_220px_auto]"><label className="space-y-2 text-xs font-medium"><span>Tìm gói học</span><input className={CONTROL} aria-label="Tìm gói học" placeholder="Tên gói học, gia sư, môn học hoặc mã gói" value={search} onChange={e => setSearch(e.target.value)} /></label><label className="space-y-2 text-xs font-medium"><span>Trạng thái</span><select className={CONTROL} aria-label="Trạng thái gói học" value={status} onChange={e => setStatus(e.target.value)}><option value="">Tất cả trạng thái</option>{Object.entries(STATES).map(([value, [label]]) => <option key={value} value={value}>{label}</option>)}</select></label><Button type="submit" className="self-end">Tra cứu</Button></form>;
}
function ServiceReview({ id, close }) {
  const userId = useAuthStore(s => s.user?.id), client = useQueryClient();
  const query = useQuery({ queryKey: ['admin-service', userId, id], queryFn: () => adminService.getService(id), retry: false });
  const item = query.data;
  let curriculum = [];
  try { const parsed = JSON.parse(item?.curriculumJson || '[]'); if (Array.isArray(parsed)) curriculum = parsed.filter(entry => entry && typeof entry === 'object').map(entry => ({ title: entry.title ?? entry.Title, description: entry.description ?? entry.Description })); } catch { /* Legacy content is not interpreted as structured curriculum. */ }
  return <Drawer open onClose={close} side="right" title="Kiểm tra gói học" widthClass="w-full sm:max-w-2xl" panelClassName="max-w-full">
    {query.isPending ? <p role="status">Đang tải nội dung gói học…</p> : query.isError || !item ? <div className="space-y-4"><p role="alert">Chưa tải được nội dung gói học.</p><Button variant="outline" onClick={() => query.refetch()}>Thử lại</Button></div> : <div className="space-y-6"><div><h2 className="text-xl font-semibold leading-8">{item.title}</h2><div className="mt-3"><AdminStatus label={STATES[item.status]?.[0] || 'Chưa rõ trạng thái'} tone={STATES[item.status]?.[1]} /></div><Link to={`/admin/users?userId=${item.tutorUserId}`} className="mt-4 inline-block text-sm text-primary hover:underline">Gia sư: {item.tutorName}</Link></div>
      <dl className="grid gap-4 text-sm sm:grid-cols-2">{[['Môn học', item.subjectName], ['Số buổi', `${item.totalSessions} buổi`], ['Thời lượng', `${item.sessionDurationMinutes} phút/buổi`], ['Hợp đồng đang học', item.activeEnrollmentCount], ['Ngày tạo', formatDateTime(item.createdAt)]].map(([label, value]) => <div key={label}><dt className="text-xs text-fg-secondary">{label}</dt><dd className="mt-2">{value}</dd></div>)}<div><dt className="text-xs text-fg-secondary">Tổng học phí gói</dt><dd className="mt-2 font-semibold"><Money value={item.price} /></dd></div></dl>
      {[['Mô tả gói học', item.description], ['Phạm vi học tập', item.learningScope], ['Kết quả mong đợi', item.expectedOutcome]].filter(([, value]) => value).map(([label, value]) => <section key={label} className="border-t border-border pt-5"><h3 className="font-semibold">{label}</h3><p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-fg-secondary">{value}</p></section>)}
      {!!curriculum.length && <section className="border-t border-border pt-5"><h3 className="font-semibold">Lộ trình gói học</h3><ol className="mt-3 space-y-4">{curriculum.map((entry, index) => <li key={index} className="border-l-2 border-brand-primary-100 pl-4"><p className="text-sm font-medium">{typeof entry.title === 'string' ? entry.title : `Nội dung ${index + 1}`}</p>{typeof entry.description === 'string' && <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-fg-secondary">{entry.description}</p>}</li>)}</ol></section>}
      <div className="flex flex-wrap gap-3 border-t border-border pt-5"><Button as={Link} to={`/admin/enrollments?serviceId=${item.id}`} variant="outline" size="sm">Hợp đồng liên quan</Button><Button as={Link} to={`/admin/audit-logs?entityName=Service&entityId=${item.id}`} variant="outline" size="sm">Lịch sử kiểm duyệt</Button>{['Published', 'Paused'].includes(item.status) && <ModerationAction type="service" targetId={item.id} onSaved={async () => { await Promise.all([client.invalidateQueries({ queryKey: ['admin-services'] }), query.refetch()]); }} />}</div>
    </div>}
  </Drawer>;
}
export default function AdminServices() {
  const [params, setParams] = useSearchParams(), userId = useAuthStore(s => s.user?.id);
  const search = params.get('search') || '', status = params.get('status') || '', tutorUserId = params.get('tutorUserId') || '';
  const page = Math.max(1, Math.floor(Number(params.get('page')) || 1)), id = params.get('serviceId');
  const filters = { search, status: status || undefined, tutorUserId: tutorUserId || undefined, pageNumber: page, pageSize: 10 };
  const query = useQuery({ queryKey: ['admin-services', userId, filters], queryFn: () => adminService.getServices(filters), retry: false });
  const update = patch => setParams(previous => { const next = new URLSearchParams(previous); Object.entries(patch).forEach(([key, value]) => value ? next.set(key, value) : next.delete(key)); return next; }, { preventScrollReset: true });
  return <div className="space-y-6"><WorkspacePageHeader title="Kiểm duyệt gói học" description="Kiểm tra nội dung và trạng thái đăng của gói học trên nền tảng." /><section className="overflow-hidden rounded-2xl border border-border bg-surface"><Filters key={`${search}-${status}`} initial={{ search, status }} apply={update} />
    {(search || status || tutorUserId) && <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3 text-xs text-fg-secondary"><span>{tutorUserId ? 'Đang lọc gói học theo gia sư' : 'Đang áp dụng bộ lọc'}</span><Button variant="ghost" size="sm" onClick={() => setParams({})}>Xóa bộ lọc</Button></div>}
    {query.isPending ? <p role="status" className="p-8 text-sm">Đang tải danh sách gói học…</p> : query.isError ? <AdminEmpty title="Chưa tải được gói học" description="Vui lòng thử lại để tiếp tục kiểm tra."><Button className="mt-4" variant="outline" onClick={() => query.refetch()}>Thử lại</Button></AdminEmpty> : !query.data.items.length ? <AdminEmpty title="Không có gói học phù hợp" description="Thử thay đổi từ khóa hoặc trạng thái." /> : <><ul className="divide-y divide-border">{query.data.items.map(item => <li key={item.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center"><div className="min-w-0 flex-1"><h2 className="text-sm font-semibold leading-6">{item.title}</h2><p className="mt-2 text-sm text-fg-secondary">{item.tutorName}</p><p className="mt-2 text-xs text-fg-secondary">{item.subjectName} · {item.totalSessions} buổi · {item.sessionDurationMinutes} phút/buổi</p></div><div className="space-y-2 sm:text-right"><AdminStatus label={STATES[item.status]?.[0]} tone={STATES[item.status]?.[1]} /><Money value={item.price} className="block text-sm font-semibold" /></div><Button size="sm" variant="outline" onClick={() => update({ serviceId: item.id })}>Kiểm tra nội dung</Button></li>)}</ul><nav aria-label="Phân trang gói học" className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-5 text-xs"><span>{query.data.totalCount} gói học · Trang {page}/{query.data.totalPages || 1}</span><div className="flex gap-2"><Button variant="outline" size="sm" disabled={page <= 1} onClick={() => update({ page: page - 1 })}>Trước</Button><Button variant="outline" size="sm" disabled={!query.data.hasNextPage} onClick={() => update({ page: page + 1 })}>Sau</Button></div></nav></>}
  </section>{id && <ServiceReview key={id} id={id} close={() => update({ serviceId: '' })} />}</div>;
}
