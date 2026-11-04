import React, { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { adminWorkspaceDestination } from '@/utils/adminWorkspaceNavigation';
import WorkspacePageHeader from '@/components/layout/WorkspacePageHeader';
import StudentWalletAdjustment from '@/components/admin/StudentWalletAdjustment';
import studentWalletService from '@/services/studentWallet.service';
import { formatDateTime } from '@/utils/formatters';
import { maskBankAccount } from '@/utils/tutorWallet';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/Dialog';
import Avatar, { Drawer } from '@/components/ui/Avatar';
import Card from '@/components/ui/Card';
import Icon from '@/components/ui/Icon';
import Button from '@/components/ui/Button';
import Input, { Field } from '@/components/ui/Input';
import Tabs from '@/components/ui/Tabs';
import Money from '@/components/ui/Money';
import StateBadge from '@/components/common/StateBadge';
import { TableSkeleton } from '@/components/common/Skeleton';

const TOPUP_STATES = { Pending: 'Chờ xác nhận', Confirmed: 'Đã ghi có', Rejected: 'Đã từ chối' };
const WITHDRAWAL_STATES = { Pending: 'Chờ tiếp nhận', Processing: 'Đang xử lý', Completed: 'Đã hoàn tất', Failed: 'Thất bại' };

function EmptyList({ withdrawal, filtered }) {
  return <div className="flex flex-col items-center px-4 py-14 text-center">
    <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-primary-50 text-brand-primary-600"><Icon name={withdrawal ? 'payments' : 'add_card'} size="lg" /></span>
    <h3 className="text-base font-semibold">{filtered ? 'Không có yêu cầu phù hợp' : withdrawal ? 'Chưa có yêu cầu rút tiền' : 'Chưa có yêu cầu nạp tiền'}</h3>
    <p className="mt-2 max-w-md text-sm leading-6 text-fg-secondary">{filtered ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.' : 'Yêu cầu sẽ xuất hiện tại đây khi học viên gửi lên.'}</p>
  </div>;
}

export default function AdminStudentWallets({ withdrawalsOnly = false }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [params, setParams] = useSearchParams();
  const legacyDestination = !withdrawalsOnly && adminWorkspaceDestination('/admin/student-wallets', params.toString());
  const activeTab = withdrawalsOnly ? 'withdrawals' : params.get('tab') === 'adjust' ? 'adjust' : 'topups';
  const recordId = params.get('recordId') || (withdrawalsOnly ? params.get('withdrawalId') : null) || undefined;
  const withdrawal = activeTab === 'withdrawals';
  const reviewableOnly = !withdrawal && params.get('reviewableOnly') === 'true';
  const [status, setStatus] = useState(params.get('status') || '');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reload, setReload] = useState(0);
  const [detail, setDetail] = useState(null);
  const [note, setNote] = useState('');
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const actionLock = useRef(false);
  const openedRecord = useRef(null);
  useEffect(() => { setStatus(params.get('status') || ''); }, [params]);

  useEffect(() => {
    setDetail(null); setNote(''); setChecked(false); openedRecord.current = null;
  }, [activeTab, recordId]);

  useEffect(() => { const timer = setTimeout(() => { setQuery(search.trim()); setPage(1); }, 300); return () => clearTimeout(timer); }, [search]);
  useEffect(() => {
    if (activeTab === 'adjust' || legacyDestination) return;
    const controller = new AbortController();
    setLoading(true); setError(false);
    const request = withdrawal ? studentWalletService.adminGetWithdrawals : studentWalletService.adminGetTopUps;
    request({ status: recordId ? null : status || null, search: recordId ? undefined : query, pageNumber: recordId ? 1 : page, pageSize: 10, recordId, reviewableOnly: !recordId && reviewableOnly, signal: controller.signal })
      .then(result => {
        if (controller.signal.aborted) return;
        setData(result);
        if (recordId && openedRecord.current !== `${activeTab}:${recordId}`) {
          openedRecord.current = `${activeTab}:${recordId}`;
          if (result.items[0]) { setDetail(result.items[0]); setNote(''); setChecked(false); }
        }
      }).catch(() => { if (!controller.signal.aborted) setError(true); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [activeTab, withdrawal, status, query, page, recordId, reload, legacyDestination, reviewableOnly]);

  const changeTab = tab => {
    setStatus(''); setSearch(''); setQuery(''); setPage(1); setData(null); setDetail(null); openedRecord.current = null;
    setParams({ tab });
  };
  const openDetail = row => { setDetail(row); setNote(''); setChecked(false); };
  const copy = async text => {
    try { await navigator.clipboard.writeText(text); toast.success('Đã sao chép mã tham chiếu.'); }
    catch { toast.error('Không thể sao chép. Bạn có thể chọn và sao chép mã trực tiếp.'); }
  };

  const act = async kind => {
    if (!detail || actionLock.current) return;
    const needsNote = ['confirm', 'reject', 'fail'].includes(kind);
    if (needsNote && (note.trim().length < 10 || note.trim().length > 500)) { toast.error('Vui lòng nhập ghi chú từ 10 đến 500 ký tự.'); return; }
    if (['confirm', 'complete'].includes(kind) && !checked) return;
    actionLock.current = true; setBusy(true);
    try {
      const titles = { confirm: 'Xác nhận ghi có vào ví', reject: 'Từ chối yêu cầu nạp tiền', process: 'Tiếp nhận yêu cầu rút tiền', complete: 'Xác nhận đã chuyển tiền', fail: 'Ghi nhận rút tiền thất bại' };
      const ok = await confirm({ title: titles[kind], content: <div className="space-y-2 text-sm"><p className="font-semibold">{detail.studentName}</p><p className="break-all">{detail.studentEmail}</p><Money value={detail.amount} className="block text-xl font-semibold" /><p>{kind === 'complete' ? 'Chỉ xác nhận khi tiền đã được chuyển thành công đến đúng tài khoản học viên.' : kind === 'fail' ? 'Khoản đang chờ rút sẽ được trả về số dư khả dụng.' : kind === 'process' ? 'Yêu cầu chuyển sang Đang xử lý; bước này chưa xác nhận đã chi trả.' : note.trim()}</p></div>, confirmText: titles[kind], danger: ['reject', 'fail'].includes(kind) });
      if (!ok) return;
      if (kind === 'confirm') await studentWalletService.adminConfirmTopUp(detail.id, { adminNote: note.trim() });
      if (kind === 'reject') await studentWalletService.adminRejectTopUp(detail.id, { reason: note.trim() });
      if (kind === 'process') await studentWalletService.adminProcessWithdrawal(detail.id);
      if (kind === 'complete') await studentWalletService.adminCompleteWithdrawal(detail.id);
      if (kind === 'fail') await studentWalletService.adminFailWithdrawal(detail.id, { reason: note.trim() });
      toast.success('Đã cập nhật yêu cầu.'); setDetail(null); setReload(value => value + 1);
    } catch (err) { toast.error(err?.message || 'Chưa thể xử lý yêu cầu. Vui lòng thử lại.'); }
    finally { setBusy(false); actionLock.current = false; }
  };

  const rows = data?.items || [];
  const pendingCount = rows.filter(row => row.status === 'Pending').length;
  const states = withdrawal ? WITHDRAWAL_STATES : TOPUP_STATES;

  if (legacyDestination) return <Navigate to={legacyDestination} replace />;
  return <div className="space-y-6 lg:space-y-8">
    {!withdrawalsOnly && <><WorkspacePageHeader title="Quản lý ví học viên" description="Theo dõi nạp tiền và điều chỉnh số dư." actions={<Button as={Link} to="/admin/withdrawals?audience=student" variant="outline" size="sm">Yêu cầu rút tiền học viên</Button>} />
    <Tabs tabs={[{ key: 'topups', label: 'Nạp tiền', icon: <Icon name="add_card" size="sm" /> }, { key: 'adjust', label: 'Điều chỉnh số dư', icon: <Icon name="tune" size="sm" /> }]} value={activeTab} onChange={changeTab} /></>}
    {activeTab === 'adjust' ? <StudentWalletAdjustment /> : <>
      {reviewableOnly && <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4 text-sm"><span>Đang lọc yêu cầu nạp tiền cần kiểm tra thủ công</span><Button as={Link} to="/admin/student-wallets?tab=topups" size="sm" variant="ghost">Xem tất cả yêu cầu nạp tiền</Button></div>}
      {!withdrawal && <div className="flex items-start gap-3 rounded-xl border border-brand-primary-100 bg-brand-primary-50 p-4 text-sm text-fg-secondary"><Icon name="verified_user" size="md" className="mt-0.5 text-brand-primary-600" /><p>VNPAY tự động ghi có sau khi xác thực thanh toán. Yêu cầu đang chờ chưa đồng nghĩa với học viên đã nạp tiền.</p></div>}
      <Card padding="lg">
        <div className="flex flex-col justify-between gap-4 border-b border-border pb-5 xl:flex-row xl:items-center">
          <div className="flex items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-primary-50 text-brand-primary-600"><Icon name={withdrawal ? 'payments' : 'add_card'} size="md" /></span><div><h2 className="text-lg font-semibold">{withdrawal ? 'Yêu cầu rút tiền học viên' : 'Yêu cầu nạp tiền'}</h2><p className="mt-1 text-xs text-fg-secondary">{data?.totalCount || 0} yêu cầu{!loading && pendingCount > 0 ? ` · ${pendingCount} chờ trong trang này` : ''}</p></div></div>
          <div className="flex flex-wrap items-center gap-2">
            {!withdrawal && <Input aria-label="Tìm yêu cầu nạp tiền" placeholder="Tên, email, mã tham chiếu" value={search} onChange={event => setSearch(event.target.value)} className="sm:w-56" />}
            <select aria-label="Lọc trạng thái yêu cầu" value={status} onChange={event => { const value = event.target.value; setStatus(value); setPage(1); setParams(previous => { const next = new URLSearchParams(previous); if (value) next.set('status', value); else next.delete('status'); return next; }); }} className="min-h-11 max-w-full rounded-lg border border-border bg-surface px-3 text-sm"><option value="">Tất cả trạng thái</option>{Object.entries(states).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>
            <Button variant="ghost" size="sm" loading={loading} aria-label="Làm mới yêu cầu" onClick={() => setReload(value => value + 1)}><Icon name="refresh" size="sm" /></Button>
          </div>
        </div>
        {recordId && <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-brand-primary-50 p-3 text-sm"><span>Đang xem yêu cầu từ thông báo</span><Button size="sm" variant="ghost" onClick={() => setParams(withdrawalsOnly ? { audience: 'student' } : { tab: activeTab })}>Xem tất cả</Button></div>}
        {loading ? <div className="pt-5"><TableSkeleton rows={3} /></div> : error ? <div className="py-12 text-center"><p role="alert" className="mb-4 text-sm text-danger-strong">Không thể tải danh sách yêu cầu.</p><Button variant="outline" onClick={() => setReload(value => value + 1)}>Thử lại</Button></div> : rows.length === 0 ? <EmptyList withdrawal={withdrawal} filtered={!!(status || query || recordId)} /> : <>
          <div className="divide-y divide-border">
            {rows.map(row => <article key={row.id} className="grid items-center gap-4 py-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto]">
              <div className="flex items-start gap-3"><Avatar name={row.studentName || 'Học viên'} size="sm" /><div className="min-w-0"><h3 className="text-sm font-semibold">{row.studentName || 'Học viên'}</h3><p className="mt-1 break-all text-xs text-fg-secondary">{row.studentEmail}</p><p className="mt-2 text-xs text-fg-secondary">{formatDateTime(row.requestedAt)}</p></div></div>
              <div className="min-w-0"><p className="text-xs text-fg-secondary">{withdrawal ? 'Số tiền yêu cầu rút' : 'Số tiền yêu cầu nạp'}</p><Money value={row.amount} className={row.status === 'Confirmed' ? 'mt-1 block text-xl font-semibold text-success-strong' : 'mt-1 block text-xl font-semibold'} />
                {withdrawal ? <p className="mt-2 text-xs text-fg-secondary">{row.bankName} · {maskBankAccount(row.accountNumber)}</p> : <div className="mt-2 flex min-w-0 items-center gap-2"><code className="break-all text-xs text-fg-secondary">{row.transferReference}</code><button type="button" onClick={() => copy(row.transferReference)} aria-label="Sao chép mã tham chiếu" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-brand-primary-600 hover:bg-brand-primary-50 focus-visible:ring-2 focus-visible:ring-brand-primary-500"><Icon name="content_copy" size="sm" /></button></div>}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 lg:flex-col lg:items-end"><StateBadge status={row.status} domain={withdrawal ? 'withdrawal' : 'topup'} /><Button variant="outline" size="sm" onClick={() => openDetail(row)} iconRight={<Icon name="chevron_right" size="sm" />}>{withdrawal ? 'Xem chi tiết' : 'Kiểm tra giao dịch'}</Button></div>
            </article>)}
          </div>
          {data.totalPages > 1 && <div className="flex items-center justify-between gap-2 border-t border-border pt-5 text-xs text-fg-secondary"><Button size="sm" variant="outline" disabled={!data.hasPreviousPage} onClick={() => setPage(page - 1)}>Trước</Button><span>Trang {data.pageNumber}/{data.totalPages}</span><Button size="sm" variant="outline" disabled={!data.hasNextPage} onClick={() => setPage(page + 1)}>Tiếp</Button></div>}
        </>}
      </Card>
    </>}

    <Drawer open={!!detail} onClose={() => { if (!busy) setDetail(null); }} side="right" title={withdrawal ? 'Chi tiết rút tiền' : 'Kiểm tra nạp tiền'} widthClass="w-full sm:max-w-lg" panelClassName="max-w-full">
      {detail && <div className="space-y-5">
        <div className="flex items-center gap-3"><Avatar name={detail.studentName} size="md" /><div className="min-w-0"><p className="font-semibold">{detail.studentName}</p><p className="mt-1 break-all text-sm text-fg-secondary">{detail.studentEmail}</p></div></div>
        <div className="rounded-xl border border-brand-primary-100 bg-brand-primary-50 p-4"><p className="text-xs text-fg-secondary">{withdrawal ? 'Số tiền yêu cầu rút' : 'Số tiền yêu cầu nạp'}</p><Money value={detail.amount} className="mt-2 block text-3xl font-semibold" /><div className="mt-3"><StateBadge status={detail.status} domain={withdrawal ? 'withdrawal' : 'topup'} /></div></div>
        <dl className="space-y-3 text-sm">
          <div><dt className="text-xs text-fg-secondary">Thời gian yêu cầu</dt><dd className="mt-1">{formatDateTime(detail.requestedAt)}</dd></div>
          {detail.processedAt && <div><dt className="text-xs text-fg-secondary">Thời gian xử lý</dt><dd className="mt-1">{formatDateTime(detail.processedAt)}</dd></div>}
          {withdrawal ? <><div><dt className="text-xs text-fg-secondary">Ngân hàng nhận</dt><dd>{detail.bankName}</dd></div><div><dt className="text-xs text-fg-secondary">Chủ tài khoản</dt><dd>{detail.accountHolderName}</dd></div><div><dt className="text-xs text-fg-secondary">Số tài khoản đối soát</dt><dd className="break-all">{detail.accountNumber}</dd></div></> : <div><dt className="text-xs text-fg-secondary">Mã tham chiếu giao dịch</dt><dd className="mt-1 flex items-start gap-2"><code className="min-w-0 flex-1 break-all">{detail.transferReference}</code><Button variant="ghost" size="sm" aria-label="Sao chép mã tham chiếu trong chi tiết" onClick={() => copy(detail.transferReference)}><Icon name="content_copy" size="sm" /></Button></dd></div>}
          {(detail.failureReason || detail.rejectionReason) && <div><dt className="text-xs text-fg-secondary">Lý do</dt><dd className="mt-1 break-words">{detail.failureReason || detail.rejectionReason}</dd></div>}
        </dl>
        {!withdrawal && !detail.canManuallyReview && <div className="rounded-xl bg-brand-primary-50 p-4 text-sm leading-6 text-fg-secondary">{detail.status === 'Pending' ? 'Chờ kết quả xác thực thanh toán từ VNPAY. Yêu cầu này chưa được ghi có vào ví.' : detail.status === 'Confirmed' ? 'Yêu cầu đã được ghi có vào ví.' : 'Yêu cầu đã kết thúc và không được ghi có vào ví.'}</div>}
        {((!withdrawal && detail.canManuallyReview && detail.status === 'Pending') || (withdrawal && detail.status === 'Processing')) && <Field label={withdrawal ? 'Lý do nếu chuyển tiền thất bại' : 'Ghi chú đối soát / Lý do từ chối'} htmlFor="wallet-review-note"><textarea id="wallet-review-note" rows={3} minLength={10} maxLength={500} value={note} onChange={event => setNote(event.target.value)} disabled={busy} placeholder="Nhập thông tin đối soát cụ thể, từ 10 đến 500 ký tự" className="w-full rounded-lg border border-border bg-surface p-3 text-sm focus-visible:ring-2 focus-visible:ring-brand-primary-500" /></Field>}
        {((!withdrawal && detail.canManuallyReview && detail.status === 'Pending') || (withdrawal && detail.status === 'Processing')) && <label className="flex items-start gap-3 rounded-xl bg-holding-subtle p-4 text-sm leading-6"><input type="checkbox" checked={checked} onChange={event => setChecked(event.target.checked)} disabled={busy} className="mt-1 h-4 w-4 shrink-0" /><span>{withdrawal ? 'Tôi đã kiểm tra và xác nhận tiền được chuyển thành công đến đúng tài khoản trên.' : 'Tôi đã đối chiếu chứng từ và xác nhận thực nhận đúng số tiền, người nạp và mã tham chiếu.'}</span></label>}
        <div className="space-y-3 border-t border-border pt-4">
          {!withdrawal && detail.canManuallyReview && detail.status === 'Pending' && <><Button fullWidth loading={busy} disabled={!checked || note.trim().length < 10} onClick={() => act('confirm')}>Xác nhận ghi có</Button><Button fullWidth variant="danger-outline" disabled={busy || note.trim().length < 10} onClick={() => act('reject')}>Từ chối yêu cầu</Button></>}
          {withdrawal && detail.status === 'Pending' && <Button fullWidth loading={busy} onClick={() => act('process')}>Tiếp nhận xử lý</Button>}
          {withdrawal && detail.status === 'Processing' && <><Button fullWidth loading={busy} disabled={!checked} onClick={() => act('complete')}>Xác nhận đã chuyển tiền</Button><Button fullWidth variant="danger-outline" disabled={busy || note.trim().length < 10} onClick={() => act('fail')}>Ghi nhận chuyển tiền thất bại</Button></>}
        </div>
      </div>}
    </Drawer>
  </div>;
}
