import WorkspacePageHeader from '@/components/layout/WorkspacePageHeader';
import React, { useRef, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import adminService from '@/services/admin.service';
import { useAuthStore } from '@/store/authStore';
import { useConfirm } from '@/components/ui/Dialog';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input, { Field, Select, Textarea, Checkbox } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Avatar';

export default function AdminCatalog() {
  const kind = useLocation().pathname.endsWith('/subjects') ? 'subjects' : 'categories';
  const subject = kind === 'subjects';
  const label = subject ? 'môn học' : 'danh mục';
  const { user } = useAuthStore();
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Math.floor(Number(params.get('page')) || 1));
  const trash = params.get('tab') === 'trash';
  const search = params.get('search') || '';
  const [searchText, setSearchText] = useState(search);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);
  const client = useQueryClient();
  const confirm = useConfirm();
  const query = useQuery({ queryKey: ['admin-catalog', user?.id, kind, { page, trash, search }], queryFn: () => adminService.getCatalog(kind, { pageNumber: page, pageSize: 10, search: search || undefined }, trash), retry: false });
  const categories = useQuery({ queryKey: ['admin-catalog-options', user?.id], queryFn: adminService.getAllCategories, enabled: subject, retry: false });
  const refresh = async () => { await client.invalidateQueries({ queryKey: ['admin-catalog'] }); await client.invalidateQueries({ queryKey: ['admin-catalog-options'] }); };
  const save = async event => {
    event.preventDefault();
    if (busy.current || !editing?.name.trim()) return;
    busy.current = true; setSaving(true); setError('');
    try {
      const payload = subject ? { name: editing.name.trim(), categoryId: editing.categoryId, ...(editing.id ? { isActive: editing.isActive } : {}) }
        : { name: editing.name.trim(), description: editing.description.trim() || null, ...(editing.id ? { isActive: editing.isActive } : {}) };
      await adminService.saveCatalog(kind, editing.id, payload); setEditing(null); await refresh();
    } catch (err) { setError(err?.status === 409 ? 'Tên đã tồn tại hoặc dữ liệu đang được sử dụng. Vui lòng kiểm tra lại.' : 'Chưa lưu được thông tin. Vui lòng kiểm tra dữ liệu và thử lại.'); }
    finally { busy.current = false; setSaving(false); }
  };
  const changeState = async item => {
    if (busy.current) return;
    busy.current = true; setError('');
    try {
      const ok = await confirm({ title: `${trash ? 'Khôi phục' : 'Xóa'} ${label}?`, content: trash ? `Khôi phục “${item.name}” từ thùng rác.` : `“${item.name}” sẽ được chuyển vào thùng rác. Dữ liệu lịch sử được giữ nguyên. Hệ thống sẽ kiểm tra các ràng buộc trước khi xóa.`, danger: !trash, confirmText: trash ? 'Khôi phục' : 'Chuyển vào thùng rác' });
      if (!ok) return;
      setSaving(true);
      if (trash) await adminService.restoreCatalog(kind, item.id); else await adminService.deleteCatalog(kind, item.id);
      await refresh();
    } catch (err) { setError(err?.status === 409 ? 'Không thể thực hiện vì dữ liệu còn liên kết hoặc tên bị trùng. Vui lòng kiểm tra các môn học, gia sư và đơn học liên quan.' : 'Chưa cập nhật được dữ liệu. Vui lòng thử lại.'); }
    finally { busy.current = false; setSaving(false); }
  };
  return <div className="space-y-6 lg:space-y-8"><WorkspacePageHeader title={subject ? 'Quản lý môn học' : 'Quản lý danh mục'} description="Quản lý phân loại nội dung giảng dạy trên TutorHub." actions={!trash && <Button onClick={() => { setError(''); setEditing({ name: '', description: '', categoryId: '', isActive: true }); }}>Thêm {label}</Button>} />
    <nav aria-label="Quản lý phân loại" className="flex flex-wrap gap-3"><Button as={Link} to="/admin/categories" variant={subject ? 'outline' : 'primary'}>Danh mục</Button><Button as={Link} to="/admin/subjects" variant={subject ? 'primary' : 'outline'}>Môn học</Button><Button variant="outline" onClick={() => setParams(trash ? {} : { tab: 'trash' })}>{trash ? 'Danh sách hiện tại' : 'Thùng rác'}</Button></nav>
    <form className="flex items-end gap-3" onSubmit={e => { e.preventDefault(); setParams({ ...(trash ? { tab: 'trash' } : {}), ...(searchText.trim() ? { search: searchText.trim() } : {}) }); }}><Field label="Tìm theo tên" htmlFor="catalog-search"><Input id="catalog-search" value={searchText} onChange={e => setSearchText(e.target.value)} /></Field><Button type="submit" variant="outline">Tìm kiếm</Button></form>
    {error && !editing && <p role="alert" className="text-sm text-danger-strong">{error}</p>}
    {query.isPending ? <p role="status">Đang tải dữ liệu…</p> : query.isError ? <Card padding="lg"><p role="alert">Chưa tải được danh sách.</p><Button className="mt-3" variant="outline" onClick={() => query.refetch()}>Thử lại</Button></Card> : <>
      {!query.data?.items?.length ? <Card padding="lg"><p>{trash ? 'Thùng rác đang trống.' : 'Không có dữ liệu phù hợp.'}</p></Card> : <div className="divide-y divide-border rounded-2xl border border-border bg-surface">{query.data.items.map(item => <article key={item.id} className="flex flex-wrap items-start justify-between gap-4 p-5"><div className="min-w-0 flex-1"><h2 className="break-words font-semibold">{item.name}</h2><p className="mt-2 text-sm text-fg-secondary">{subject ? item.categoryName : item.description}</p><p className="mt-2 text-xs text-fg-secondary">{item.isActive ? 'Đang hoạt động' : 'Đã tạm ngừng'} · {subject ? `${item.tutorsCount} gia sư · ${item.bookingsCount} đơn học` : `${item.subjectsCount} môn học`}</p></div><div className="flex gap-2">{!trash && <Button size="sm" variant="outline" disabled={saving} onClick={() => { setError(''); setEditing({ ...item, description: item.description || '' }); }}>Chỉnh sửa {label}</Button>}<Button size="sm" variant="ghost" disabled={saving} onClick={() => changeState(item)}>{trash ? 'Khôi phục' : 'Xóa'}</Button></div></article>)}</div>}
      {(page > 1 || query.data?.hasNextPage) && <nav aria-label="Phân trang" className="flex items-center justify-between"><Button variant="outline" disabled={page === 1} onClick={() => setParams({ ...Object.fromEntries(params), page: page - 1 })}>Trang trước</Button><span>Trang {page}</span><Button variant="outline" disabled={!query.data?.hasNextPage} onClick={() => setParams({ ...Object.fromEntries(params), page: page + 1 })}>Trang sau</Button></nav>}
    </>}
    <Modal open={Boolean(editing)} onClose={() => { if (!busy.current) setEditing(null); }} title={`${editing?.id ? 'Chỉnh sửa' : 'Thêm'} ${label}`}>{editing && <form onSubmit={save} className="space-y-4"><Field label="Tên" htmlFor="catalog-name"><Input id="catalog-name" value={editing.name} maxLength={100} disabled={saving} required onChange={e => setEditing({ ...editing, name: e.target.value })} /></Field>{subject ? <Field label="Danh mục" htmlFor="catalog-category"><Select id="catalog-category" value={editing.categoryId} required disabled={saving || categories.isPending || categories.isError} onChange={e => setEditing({ ...editing, categoryId: e.target.value })}><option value="">Chọn danh mục</option>{categories.data?.map(item => <option key={item.id} value={item.id}>{item.name}{item.isActive ? '' : ' (tạm ngừng)'}</option>)}</Select>{categories.isError && <Button variant="ghost" type="button" onClick={() => categories.refetch()}>Tải lại danh mục</Button>}</Field> : <Field label="Mô tả" htmlFor="catalog-description"><Textarea id="catalog-description" value={editing.description} maxLength={500} disabled={saving} onChange={e => setEditing({ ...editing, description: e.target.value })} /></Field>}{editing.id && <Checkbox label="Đang hoạt động" checked={editing.isActive} disabled={saving} onChange={e => setEditing({ ...editing, isActive: e.target.checked })} />}{error && <p role="alert" className="text-sm text-danger-strong">{error}</p>}<div className="flex gap-3"><Button type="submit" loading={saving} disabled={saving || !editing.name.trim() || (subject && (!editing.categoryId || categories.isError))}>Lưu {label}</Button><Button type="button" variant="ghost" disabled={saving} onClick={() => setEditing(null)}>Hủy</Button></div></form>}</Modal>
  </div>;
}
