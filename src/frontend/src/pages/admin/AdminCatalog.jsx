import WorkspacePageHeader from '@/components/layout/WorkspacePageHeader';
import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import adminService from '@/services/admin.service';
import { useAuthStore } from '@/store/authStore';
import { useConfirm } from '@/components/ui/Dialog';
import Button from '@/components/ui/Button';
import Input, { Field, Select, Textarea, Checkbox } from '@/components/ui/Input';
import { Modal, Menu } from '@/components/ui/Avatar';
import { AdminEmpty, AdminStatus } from '@/components/admin/AdminWorkspacePrimitives';
import { TableSkeleton } from '@/components/common/Skeleton';
import Icon from '@/components/ui/Icon';
import { catalogAppearance } from '@/utils/catalogPresentation';

const values = item => JSON.stringify({ name: item.name.trim(), description: (item.description || '').trim(), categoryId: item.categoryId || '', isActive: item.isActive });
function Search({ initial, label, onSearch }) {
  const [text, setText] = useState(initial);
  return <form className="flex min-w-0 items-center gap-3" onSubmit={event => { event.preventDefault(); onSearch(text.trim()); }}><div className="relative min-w-0 flex-1"><Icon name="search" size="sm" className="pointer-events-none absolute left-3 top-3 text-fg-secondary" /><input aria-label={`Tìm ${label}`} value={text} onChange={event => setText(event.target.value)} placeholder={`Tìm ${label} theo tên…`} className="h-11 w-full min-w-0 rounded-lg border border-border pl-10 pr-3 text-sm focus-visible:ring-2 focus-visible:ring-brand-primary-600" /></div><Button type="submit" variant="outline" className="shrink-0 whitespace-nowrap">Tìm kiếm</Button></form>;
}
export default function AdminCatalog() {
  const kind = useLocation().pathname.endsWith('/subjects') ? 'subjects' : 'categories';
  const subject = kind === 'subjects', label = subject ? 'môn học' : 'danh mục';
  const { user } = useAuthStore();
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Math.floor(Number(params.get('page')) || 1));
  const trash = params.get('tab') === 'trash', search = params.get('search') || '', categoryId = subject ? params.get('categoryId') || '' : '';
  const [editing, setEditing] = useState(null), original = useRef('');
  const [error, setError] = useState(''), [saving, setSaving] = useState(false);
  const busy = useRef(false);
  const client = useQueryClient(), confirm = useConfirm();
  const update = changes => setParams(previous => { const next = new URLSearchParams(previous); next.delete('page'); Object.entries(changes).forEach(([key, value]) => value ? next.set(key, value) : next.delete(key)); return next; });
  const query = useQuery({ queryKey: ['admin-catalog', user?.id, kind, { page, trash, search, categoryId }], queryFn: () => adminService.getCatalog(kind, { pageNumber: page, pageSize: 10, search: search || undefined, categoryId: categoryId || undefined }, trash), retry: false });
  const categories = useQuery({ queryKey: ['admin-catalog-options', user?.id], queryFn: adminService.getAllCategories, retry: false });
  const dirty = !!editing && values(editing) !== original.current;
  const open = item => { setError(''); const draft = { name: '', description: '', categoryId, isActive: true, ...item }; draft.description = draft.description || ''; original.current = values(draft); setEditing(draft); };
  const close = async () => { if (busy.current) return; busy.current = true; try { if (!dirty || await confirm({ title: 'Bỏ thay đổi chưa lưu?', content: 'Thông tin đang chỉnh sửa sẽ không được lưu.', confirmText: 'Bỏ thay đổi', cancelText: 'Tiếp tục chỉnh sửa' })) setEditing(null); } finally { busy.current = false; } };
  useEffect(() => { if (!dirty) return undefined; const stop = event => { event.preventDefault(); event.returnValue = ''; }; window.addEventListener('beforeunload', stop); return () => window.removeEventListener('beforeunload', stop); }, [dirty]);
  const refresh = async () => { await client.invalidateQueries({ queryKey: ['admin-catalog'] }); await client.invalidateQueries({ queryKey: ['admin-catalog-options'] }); };
  const save = async event => {
    event.preventDefault();
    if (busy.current || !editing?.name.trim() || !dirty || (subject && !editing.categoryId)) return;
    busy.current = true; setSaving(true); setError('');
    try {
      const payload = subject ? { name: editing.name.trim(), categoryId: editing.categoryId, ...(editing.id ? { isActive: editing.isActive } : {}) } : { name: editing.name.trim(), description: editing.description.trim() || null, ...(editing.id ? { isActive: editing.isActive } : {}) };
      await adminService.saveCatalog(kind, editing.id, payload); setEditing(null); await refresh();
    } catch (err) { setError(err?.status === 409 ? 'Tên đã tồn tại hoặc dữ liệu đang được sử dụng. Vui lòng kiểm tra lại.' : 'Chưa lưu được thông tin. Vui lòng kiểm tra dữ liệu và thử lại.'); }
    finally { busy.current = false; setSaving(false); }
  };
  const changeState = async item => {
    if (busy.current) return;
    busy.current = true; setError('');
    try {
      const ok = await confirm({ title: `${trash ? 'Khôi phục' : 'Chuyển vào thùng rác'} ${label}?`, content: trash ? `Khôi phục “${item.name}” từ thùng rác.` : `“${item.name}” sẽ được chuyển vào thùng rác. Các môn học, gói học và lịch sử liên quan không bị xóa theo. Danh mục còn môn học hoặc môn học đang được sử dụng sẽ không thể xóa.`, danger: !trash, confirmText: trash ? 'Khôi phục' : 'Chuyển vào thùng rác' });
      if (!ok) return;
      setSaving(true); if (trash) await adminService.restoreCatalog(kind, item.id); else await adminService.deleteCatalog(kind, item.id); await refresh();
    } catch (err) { setError(err?.status === 409 ? 'Chưa thể thực hiện: dữ liệu còn liên kết hoặc trùng tên. Hãy xem môn học liên quan hoặc tạm ngừng sử dụng thay vì xóa.' : 'Chưa cập nhật được dữ liệu. Vui lòng thử lại.'); }
    finally { busy.current = false; setSaving(false); }
  };
  const categoryName = categories.data?.find(item => item.id === categoryId)?.name;
  const childLink = item => `/admin/subjects?categoryId=${item.id}&categoriesQuery=${encodeURIComponent(params.toString())}`;
  return <div className="space-y-6"><WorkspacePageHeader title="Danh mục & Môn học" description="Tổ chức nội dung giảng dạy trên TutorHub." actions={!trash && <Button onClick={() => open({})}>Thêm {label}</Button>} />
    <nav aria-label="Quản lý phân loại" className="flex flex-wrap items-center justify-between gap-3"><div className="flex gap-3"><Button as={Link} to="/admin/categories" variant={subject ? 'ghost' : 'primary'}>Danh mục{categories.isSuccess && ` (${categories.data.length})`}</Button><Button as={Link} to="/admin/subjects" variant={subject ? 'primary' : 'ghost'}>Môn học</Button></div><Button variant="ghost" onClick={() => update({ tab: trash ? '' : 'trash' })} icon={<Icon name="delete" size="sm" />}>{trash ? 'Về danh sách' : 'Thùng rác'}</Button></nav>
    <section className="rounded-2xl border border-border bg-surface"><div className="space-y-4 border-b border-border p-5"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-base font-semibold">{trash ? 'Thùng rác' : subject ? 'Môn học' : 'Danh mục'}</h2><p className="text-xs text-fg-secondary">{query.isPending ? 'Đang tải…' : query.isError ? 'Chưa tải được kết quả' : `${query.data.totalCount} ${label}`} · Sắp xếp A–Z</p></div><Search key={`${kind}:${search}`} initial={search} label={label} onSearch={value => update({ search: value })} />{subject && <label className="block text-xs text-fg-secondary">Danh mục<select aria-label="Lọc danh mục" value={categoryId} onChange={event => update({ categoryId: event.target.value })} className="ml-3 h-10 max-w-full rounded-lg border border-border bg-surface px-3 text-sm"><option value="">Tất cả danh mục</option>{categories.data?.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}{(search || categoryId) && <div className="flex flex-wrap items-center gap-3 text-sm"><span className="text-fg-secondary">{[search, categoryName].filter(Boolean).join(' · ')}</span><Button variant="ghost" size="sm" onClick={() => update({ search: '', categoryId: '' })}>Xóa bộ lọc</Button>{categoryId && <Link className="text-brand-primary-700" to={`/admin/categories?${params.get('categoriesQuery') || ''}`}>Về danh mục</Link>}</div>}</div>
    {error && !editing && <p role="alert" className="px-5 pt-4 text-sm text-holding-strong">{error}</p>}
    {query.isPending ? <div className="p-5"><TableSkeleton /></div> : query.isError ? <AdminEmpty title="Chưa tải được danh sách" description="Vui lòng tải lại để tiếp tục quản lý."><Button className="mt-4" variant="outline" onClick={() => query.refetch()}>Thử lại</Button></AdminEmpty> : !query.data.items.length ? <AdminEmpty title={search || categoryId ? 'Không có kết quả phù hợp' : trash ? 'Thùng rác đang trống' : `Chưa có ${label}`} description={search || categoryId ? 'Thử đổi từ khóa hoặc xóa bộ lọc.' : trash ? 'Các mục được chuyển vào thùng rác sẽ xuất hiện tại đây để khôi phục.' : `Thêm ${label} để tổ chức nội dung giảng dạy.`} /> : <ul className="divide-y divide-border">{query.data.items.map(item => { const appearance = catalogAppearance(subject ? item.categoryName : item.name); return <li key={item.id} className="flex items-start gap-3 p-5 hover:bg-neutral-50 sm:gap-4"><span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${appearance.tone}`}><Icon name={appearance.icon} size="md" /></span><div className="min-w-0 flex-1"><button type="button" className="text-left text-sm font-semibold leading-6 focus-visible:ring-2 focus-visible:ring-brand-primary-600" onClick={() => { if (!trash) open(item); }}>{item.name}</button><p className="mt-1 break-words text-[13px] leading-6 text-fg-secondary">{subject ? item.categoryName : item.description || 'Chưa có mô tả.'}</p><div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2"><AdminStatus label={item.isActive ? 'Đang hoạt động' : 'Đã tạm ngừng'} tone={item.isActive ? 'mint' : 'neutral'} />{!subject && !trash ? <Link to={childLink(item)} className="inline-flex min-h-8 items-center text-sm font-medium text-brand-primary-700">{item.subjectsCount} môn học <Icon name="chevron_right" size="xs" /></Link> : subject && <p className="text-xs text-fg-secondary">{item.tutorsCount} gia sư · {item.bookingsCount} đơn học</p>}</div></div>{trash ? <Button variant="outline" size="sm" disabled={saving} onClick={() => changeState(item)}>Khôi phục</Button> : <Menu label={`Thao tác ${item.name}`} trigger={<span className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-neutral-100"><Icon name="more_vert" size="md" /></span>} items={[{ key: 'edit', label: `Chỉnh sửa ${label}`, onClick: () => open(item) }, ...(!subject ? [{ key: 'subjects', label: 'Xem các môn học', to: childLink(item) }] : []), { key: 'delete', label: 'Chuyển vào thùng rác', danger: true, onClick: () => changeState(item) }]} />}</li>; })}</ul>}
    {(page > 1 || query.data?.hasNextPage) && <nav aria-label="Phân trang" className="flex items-center justify-between gap-3 border-t border-border p-5"><Button variant="outline" disabled={page === 1} onClick={() => update({ page: page - 1 })}>Trước</Button><span className="text-xs">Trang {page}</span><Button variant="outline" disabled={!query.data?.hasNextPage} onClick={() => update({ page: page + 1 })}>Sau</Button></nav>}
    </section>
    <Modal open={Boolean(editing)} onClose={close} title={`${editing?.id ? 'Chỉnh sửa' : 'Thêm'} ${label}`}>{editing && <form onSubmit={save} className="space-y-4"><Field label="Tên" htmlFor="catalog-name"><Input id="catalog-name" value={editing.name} maxLength={100} disabled={saving} required onChange={event => setEditing({ ...editing, name: event.target.value })} /></Field>{subject ? <Field label="Danh mục" htmlFor="catalog-category"><Select id="catalog-category" value={editing.categoryId} required disabled={saving || categories.isPending || categories.isError} onChange={event => setEditing({ ...editing, categoryId: event.target.value })}><option value="">Chọn danh mục</option>{categories.data?.map(item => <option key={item.id} value={item.id} disabled={editing.isActive && !item.isActive}>{item.name}{item.isActive ? '' : ' (tạm ngừng)'}</option>)}</Select>{categories.isError && <Button variant="ghost" type="button" onClick={() => categories.refetch()}>Tải lại danh mục</Button>}</Field> : <Field label="Mô tả" htmlFor="catalog-description"><Textarea id="catalog-description" value={editing.description || ''} maxLength={500} disabled={saving} onChange={event => setEditing({ ...editing, description: event.target.value })} /><p className="mt-1 text-right text-xs text-fg-secondary">{editing.description?.length || 0}/500</p></Field>}{editing.id && <Checkbox label="Đang hoạt động" checked={editing.isActive} disabled={saving} onChange={event => setEditing({ ...editing, isActive: event.target.checked })} />}<div className="rounded-xl bg-neutral-50 p-4"><p className="text-xs text-fg-secondary">Xem trước</p><p className="mt-2 break-words text-sm font-semibold">{editing.name.trim() || `Tên ${label}`}</p><p className="mt-1 break-words text-sm leading-6 text-fg-secondary">{subject ? categories.data?.find(item => item.id === editing.categoryId)?.name : editing.description || 'Chưa có mô tả.'}</p></div>{error && <p role="alert" className="text-sm text-holding-strong">{error}</p>}<div className="flex flex-wrap justify-end gap-3"><Button type="button" variant="outline" disabled={saving} onClick={close}>Hủy</Button><Button type="submit" loading={saving} disabled={saving || !dirty || !editing.name.trim() || (subject && (!editing.categoryId || categories.isError))}>Lưu {label}</Button></div></form>}</Modal>
  </div>;
}
