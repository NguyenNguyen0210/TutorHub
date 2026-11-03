import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/cn';
import adminService from '@/services/admin.service';
import { filterApplications } from '@/utils/applicationReview';
import WorkspacePageHeader from '@/components/layout/WorkspacePageHeader';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/Dialog';
import Button from '@/components/ui/Button';
import { Drawer } from '@/components/ui/Avatar';
import { StatsSkeleton, TableSkeleton } from '@/components/common/Skeleton';
import ApplicationTable from '@/components/admin/ApplicationTable';
import ApplicationReviewDrawer from '@/components/admin/ApplicationReviewDrawer';
import ApplicationDocumentModal from '@/components/admin/ApplicationDocumentModal';

const STATUSES = [['', 'Tất cả'], ['Pending', 'Chờ xét duyệt'], ['Approved', 'Đã phê duyệt'], ['Rejected', 'Đã từ chối']];
const DATE_LABELS = { today: 'Hôm nay', '7days': '7 ngày qua', '30days': '30 ngày qua' };
const CONTROL = 'h-11 min-w-0 rounded-lg border border-border bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary-600';
const EMPTY = [];

export default function AdminTutorApplications() {
  const [params, setParams] = useSearchParams();
  const userId = useAuthStore(state => state.user?.id);
  const client = useQueryClient();
  const toast = useToast();
  const confirm = useConfirm();
  const lock = useRef(false);
  const [processing, setProcessing] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [wide, setWide] = useState(() => window.matchMedia('(min-width: 1280px)').matches);
  const [previewBusy, setPreviewBusy] = useState(false);
  const previewLock = useRef(false);
  const queryKey = ['admin-tutor-applications', userId];
  const query = useQuery({ queryKey, retry: false, queryFn: async () => {
    let page = 1;
    let result = await adminService.getTutorApplications({ pageNumber: page, pageSize: 100 });
    const items = [...result.items];
    while (result.hasNextPage) {
      result = await adminService.getTutorApplications({ pageNumber: ++page, pageSize: 100 });
      items.push(...result.items);
    }
    return items;
  } });
  const items = query.data || EMPTY;
  const filters = { status: params.get('status') || '', search: params.get('search') || '', subject: params.get('subject') || '', education: params.get('education') || '', date: params.get('date') || '' };
  const filtered = filterApplications(items, filters);
  const totalPages = Math.max(1, Math.ceil(filtered.length / 7));
  const page = Math.min(totalPages, Math.max(1, Number(params.get('page')) || 1));
  const id = params.get('applicationId');
  const active = items.find(item => item.id === id);
  const subjects = useMemo(() => [...new Set(items.map(item => item.subject).filter(Boolean))].sort(), [items]);
  const degrees = useMemo(() => [...new Set(items.map(item => item.degreeLevel).filter(Boolean))].sort(), [items]);
  const update = (changes, resetPage = true) => setParams(previous => {
    const next = new URLSearchParams(previous);
    if (resetPage) next.delete('page');
    Object.entries(changes).forEach(([key, value]) => value ? next.set(key, value) : next.delete(key));
    return next;
  }, { replace: true });
  const close = () => { if (!lock.current && !previewLock.current) update({ applicationId: '' }, false); };
  useEffect(() => {
    const media = window.matchMedia('(min-width: 1280px)');
    const changed = () => setWide(media.matches);
    media.addEventListener('change', changed);
    return () => media.removeEventListener('change', changed);
  }, []);
  useEffect(() => {
    if (!id || !wide || previewDoc) return undefined;
    const escape = event => { if (event.key === 'Escape' && !lock.current && !previewLock.current) setParams(previous => { const next = new URLSearchParams(previous); next.delete('applicationId'); return next; }, { replace: true }); };
    document.addEventListener('keydown', escape);
    return () => document.removeEventListener('keydown', escape);
  }, [id, wide, previewDoc, setParams]);

  const decide = async action => {
    if (!active || active.status !== 'Pending' || lock.current) return;
    const applicant = active;
    lock.current = true; setProcessing(true);
    try {
      let reason = '';
      const ok = await confirm({ title: action === 'approve' ? 'Phê duyệt hồ sơ gia sư' : 'Từ chối hồ sơ gia sư',
        content: <div className="space-y-3 text-sm"><p className="font-semibold">{applicant.userFullName}</p><p>{action === 'approve' ? 'Xác nhận đã đối chiếu thông tin hồ sơ. Sau khi phê duyệt, gia sư có thể đăng gói học trên TutorHub.' : 'Nêu rõ nội dung chưa đạt để ứng viên có thể chỉnh sửa và gửi lại hồ sơ.'}</p>{action === 'approve' && !applicant.documents.length && <p className="text-holding-strong">Hồ sơ chưa có tài liệu đính kèm. Hãy kiểm tra căn cứ thẩm định trước khi phê duyệt.</p>}</div>,
        danger: action === 'reject', confirmText: action === 'approve' ? 'Xác nhận phê duyệt' : 'Xác nhận từ chối', requireReason: action === 'reject', minReasonLength: 10, maxReasonLength: 500, reasonLabel: 'Lý do từ chối', onConfirmReason: value => { reason = value; } });
      if (!ok) return;
      if (action === 'approve') await adminService.approveTutorApplication(applicant.id);
      else await adminService.rejectTutorApplication(applicant.id, reason);
      toast.success(action === 'approve' ? 'Đã phê duyệt hồ sơ.' : 'Đã từ chối hồ sơ và ghi nhận lý do.');
      await client.invalidateQueries({ queryKey });
    } catch {
      toast.error('Chưa thể cập nhật hồ sơ. Vui lòng kiểm tra trạng thái mới nhất và thử lại.');
      await client.invalidateQueries({ queryKey });
    } finally { lock.current = false; setProcessing(false); }
  };
  const preview = async doc => {
    if (previewLock.current) return;
    previewLock.current = true; setPreviewBusy(true);
    try {
      const media = doc.mediaId ? await adminService.getApplicationDocumentUrl(doc.mediaId) : null;
      const url = media?.accessUrl || doc.previewUrl;
      if (!url || !/^https?:\/\//i.test(url)) throw new Error('Unavailable document');
      setPreviewDoc({ ...doc, format: media?.contentType || doc.format, previewUrl: url });
    } catch { toast.error('Không thể mở tài liệu. Vui lòng thử lại.'); }
    finally { previewLock.current = false; setPreviewBusy(false); }
  };
  const panel = active && <ApplicationReviewDrawer key={active.id} applicant={active} embedded={!wide} processing={processing || previewBusy} onApprove={() => decide('approve')} onReject={() => decide('reject')} onPreviewDoc={preview} onClose={close} />;
  const metrics = [
    ['Tổng hồ sơ', items.length, 'bg-brand-primary-50 border-brand-primary-100'],
    ['Chờ xét duyệt', items.filter(item => item.status === 'Pending').length, 'bg-holding-subtle border-holding/25'],
    ['Đã phê duyệt', items.filter(item => item.status === 'Approved').length, 'bg-success-subtle border-success/20'],
    ['Đã từ chối', items.filter(item => item.status === 'Rejected').length, 'bg-danger-subtle border-danger/20'],
  ];
  return <div className="space-y-6">
    <WorkspacePageHeader title="Xét duyệt gia sư" description="Quản lý hồ sơ đăng ký và kết quả thẩm định." actions={<Button variant="outline" loading={query.isFetching} disabled={processing} onClick={() => query.refetch()}>Làm mới</Button>} />
    {query.isPending ? <StatsSkeleton count={4} /> : <section aria-label="Thống kê hồ sơ" className="grid grid-cols-2 gap-3 lg:grid-cols-4">{metrics.map(([label, value, tone]) => <div key={label} className={cn('min-h-[104px] rounded-2xl border p-4', tone)}><h2 className="text-xs font-medium text-fg-secondary">{label}</h2><p className="mt-3 text-3xl font-semibold tabular-nums">{query.isError ? '—' : value}</p></div>)}</section>}
    <section aria-label="Lọc hồ sơ" className="space-y-4 rounded-2xl border border-border bg-surface p-4 sm:p-5">
      <label className="block"><span className="mb-2 block text-xs font-medium">Tìm hồ sơ</span><input aria-label="Tìm hồ sơ" className={cn(CONTROL, 'w-full')} value={filters.search} placeholder="Tên, email hoặc chuyên môn…" onChange={event => update({ search: event.target.value })} /></label>
      <div className="flex gap-5 overflow-x-auto border-b border-border">{STATUSES.map(([value, label]) => <button key={value} type="button" aria-pressed={filters.status === value} onClick={() => update({ status: value })} className={cn('shrink-0 whitespace-nowrap border-b-2 pb-3 text-[13px] font-medium focus-visible:ring-2 focus-visible:ring-brand-primary-600', filters.status === value ? 'border-brand-primary-600 text-brand-primary-700' : 'border-transparent text-fg-secondary')}>{label} ({query.isPending || query.isError ? '—' : value ? items.filter(item => item.status === value).length : items.length})</button>)}</div>
      <details><summary className="cursor-pointer text-sm font-medium text-fg-secondary focus-visible:ring-2 focus-visible:ring-brand-primary-600">Bộ lọc nâng cao</summary><div className="mt-4 grid gap-3 sm:grid-cols-3">{[['subject', 'Chuyên môn', subjects], ['education', 'Học vị', degrees], ['date', 'Ngày nộp', Object.keys(DATE_LABELS)]].map(([key, label, values]) => <label key={key} className="min-w-0"><span className="mb-2 block text-xs text-fg-secondary">{label}</span><select aria-label={label} className={cn(CONTROL, 'w-full')} value={filters[key]} onChange={event => update({ [key]: event.target.value })}><option value="">Tất cả</option>{values.map(value => <option key={value} value={value}>{DATE_LABELS[value] || value}</option>)}</select></label>)}</div></details>
      {Object.values(filters).some(Boolean) && <div aria-label="Điều kiện đang áp dụng" className="flex flex-wrap gap-2">{Object.entries(filters).filter(([, value]) => value).map(([key, value]) => <button key={key} type="button" onClick={() => update({ [key]: '' })} aria-label={`Xóa điều kiện ${key}`} className="rounded-md bg-neutral-100 px-3 py-2 text-xs focus-visible:ring-2 focus-visible:ring-brand-primary-600">{STATUSES.find(([status]) => key === 'status' && status === value)?.[1] || DATE_LABELS[value] || value}<span aria-hidden="true" className="ml-2">×</span></button>)}<Button variant="ghost" size="sm" onClick={() => update({ status: '', search: '', subject: '', education: '', date: '' })}>Xóa bộ lọc</Button></div>}
    </section>
    {query.isError ? <div role="alert" className="space-y-4 rounded-2xl border border-border bg-surface p-8 text-center"><h2 className="font-semibold">Không thể tải hồ sơ gia sư</h2><p className="text-sm text-fg-secondary">Vui lòng tải lại danh sách để tiếp tục xét duyệt.</p><Button variant="outline" onClick={() => query.refetch()}>Thử lại</Button></div> : <div className={cn('grid items-start gap-5', id && wide ? 'xl:grid-cols-[minmax(320px,2fr)_minmax(0,3fr)]' : 'grid-cols-1')}>
      <ApplicationTable rows={filtered.slice((page - 1) * 7, page * 7)} loading={query.isPending} selectedId={id} totalFiltered={filtered.length} currentPage={page} totalPages={totalPages} onToggleRow={app => { if (!lock.current) update({ applicationId: app.id }, false); }} onPageChange={value => update({ page: value }, false)} />
      {wide && id && <div className="sticky top-6 min-w-0">{query.isPending ? <TableSkeleton rows={4} /> : panel || <div className="rounded-2xl border border-border bg-surface p-6 text-sm"><p>Không tìm thấy hồ sơ được liên kết.</p><Button variant="ghost" onClick={close}>Đóng chi tiết</Button></div>}</div>}
    </div>}
    {!wide && <Drawer open={!!id && !query.isPending && !query.isError} onClose={() => { if (!previewDoc) close(); }} side="right" title="Hồ sơ gia sư" widthClass="w-full sm:max-w-2xl" panelClassName="max-w-full">{panel || <p>Không tìm thấy hồ sơ được liên kết.</p>}</Drawer>}
    <ApplicationDocumentModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />
  </div>;
}
