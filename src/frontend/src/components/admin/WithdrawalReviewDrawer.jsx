import React, { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import adminService from '@/services/admin.service';
import { formatDateTime } from '@/utils/formatters';
import Avatar, { Drawer } from '@/components/ui/Avatar';
import Money from '@/components/ui/Money';
import Button from '@/components/ui/Button';
import Input, { Field } from '@/components/ui/Input';
import Icon from '@/components/ui/Icon';
import { useConfirm } from '@/components/ui/Dialog';
import { useToast } from '@/components/ui/Toast';
import { WithdrawalStatus } from './WithdrawalStatus';

export default function WithdrawalReviewDrawer({ id, onClose }) {
  const userId = useAuthStore(state => state.user?.id);
  const client = useQueryClient();
  const confirm = useConfirm();
  const toast = useToast();
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [failureReason, setFailureReason] = useState('');
  const [verified, setVerified] = useState(false);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const attempt = useRef(null);
  const detail = useQuery({ queryKey: ['admin-tutor-withdrawals', userId, 'detail', id], queryFn: () => adminService.getWithdrawalById(id), enabled: !!id, retry: false });
  const item = detail.data;
  const copy = async value => { try { await navigator.clipboard.writeText(value); toast.success('Đã sao chép số tài khoản.'); } catch { toast.error('Không thể sao chép. Bạn có thể chọn số tài khoản để sao chép trực tiếp.'); } };

  const act = async action => {
    if (!item || lock.current) return;
    const payload = { bankTransferReference: reference.trim(), reconciliationNote: note.trim() || null };
    if (action === 'complete' && (!verified || payload.bankTransferReference.length < 4 || payload.bankTransferReference.length > 128 || note.length > 500)) return;
    if (action === 'fail' && (failureReason.trim().length < 10 || failureReason.length > 500)) return;
    lock.current = true; setBusy(true);
    try {
      const titles = { process: 'Tiếp nhận yêu cầu rút tiền', complete: 'Xác nhận đã chuyển tiền', fail: 'Ghi nhận chuyển tiền thất bại' };
      const ok = await confirm({ title: titles[action], confirmText: titles[action], danger: action === 'fail', content: <div className="space-y-3 text-sm"><p className="font-semibold">{item.tutorName}</p><Money value={item.amount} className="block text-xl font-semibold" /><p>{item.bankName} · {item.accountNumber}</p><p>{item.accountHolderName}</p><p className="text-fg-secondary">{action === 'process' ? 'Yêu cầu chuyển sang Đang xử lý. Bước này chưa xác nhận tiền đã được chuyển.' : action === 'complete' ? `Mã chuyển khoản: ${payload.bankTransferReference}. Chỉ xác nhận khi tiền đã được chuyển thành công đến đúng tài khoản trên.` : `Khoản chờ rút sẽ được trả về ví gia sư. Lý do: ${failureReason.trim()}`}</p></div> });
      if (!ok) return;
      if (action === 'process') await adminService.processWithdrawal(item.id);
      if (action === 'complete') {
        const fingerprint = JSON.stringify({ id: item.id, ...payload });
        if (attempt.current?.fingerprint !== fingerprint) attempt.current = { fingerprint, key: crypto.randomUUID() };
        await adminService.completeWithdrawal(item.id, payload, attempt.current.key);
      }
      if (action === 'fail') await adminService.failWithdrawal(item.id, failureReason.trim());
      toast.success(action === 'process' ? 'Đã tiếp nhận yêu cầu.' : action === 'complete' ? 'Đã ghi nhận chi trả hoàn tất.' : 'Đã ghi nhận thất bại và hoàn khoản chờ rút về ví.');
      await client.invalidateQueries({ queryKey: ['admin-tutor-withdrawals', userId] });
      setVerified(false);
    } catch (err) {
      toast.error(err?.message || 'Chưa thể cập nhật yêu cầu. Vui lòng thử lại.');
      if (err?.status === 409 || err?.response?.status === 409) await detail.refetch();
    } finally { lock.current = false; setBusy(false); }
  };

  return <Drawer open={!!id} onClose={() => { if (!busy) onClose(); }} side="right" title="Chi tiết rút tiền gia sư" widthClass="w-full sm:max-w-xl" panelClassName="max-w-full">
    {detail.isPending ? <p role="status" className="py-10 text-sm text-fg-secondary">Đang tải yêu cầu…</p> : detail.isError || !item ? <div className="space-y-4 py-10"><p role="alert" className="text-sm text-fg-secondary">Không thể mở yêu cầu rút tiền này.</p><Button variant="outline" onClick={() => detail.refetch()}>Thử lại</Button></div> : <div className="space-y-6">
      <div className="flex items-center gap-3"><Avatar src={item.tutorAvatarUrl} name={item.tutorName} size="md" /><div className="min-w-0"><h3 className="font-semibold">{item.tutorName}</h3><p className="mt-1 break-all text-xs text-fg-secondary">{item.tutorEmail}</p></div></div>
      <div className="rounded-xl border border-brand-primary-100 bg-brand-primary-50 p-4"><p className="text-xs text-fg-secondary">Số tiền yêu cầu rút</p><Money value={item.amount} className="mt-2 block text-3xl font-semibold" /><div className="mt-3"><WithdrawalStatus status={item.status} /></div></div>
      <section><h3 className="mb-3 text-sm font-semibold">Tài khoản thụ hưởng</h3><dl className="space-y-3 text-sm"><div><dt className="text-xs text-fg-secondary">Ngân hàng</dt><dd className="mt-1">{item.bankName}</dd></div><div><dt className="text-xs text-fg-secondary">Số tài khoản</dt><dd className="mt-1 flex items-center gap-2"><span className="min-w-0 select-all break-all font-semibold">{item.accountNumber}</span><Button variant="ghost" size="sm" aria-label="Sao chép số tài khoản" onClick={() => copy(item.accountNumber)}><Icon name="content_copy" size="sm" /></Button></dd></div><div><dt className="text-xs text-fg-secondary">Chủ tài khoản</dt><dd className="mt-1">{item.accountHolderName}</dd></div></dl></section>
      <section className="rounded-xl border border-border bg-neutral-50 p-4"><h3 className="text-sm font-semibold">Số dư tại thời điểm gửi</h3>{item.availableBalanceAtRequest == null ? <p className="mt-2 text-xs text-fg-secondary">Chưa có dữ liệu lưu tại thời điểm gửi yêu cầu này.</p> : <dl className="mt-3 space-y-2 text-sm"><div className="flex flex-wrap justify-between gap-2"><dt>Khả dụng trước yêu cầu</dt><dd><Money value={item.availableBalanceAtRequest} /></dd></div><div className="flex flex-wrap justify-between gap-2"><dt>Khả dụng sau khi giữ tiền rút</dt><dd>{item.availableBalanceAfterReservation == null ? '—' : <Money value={item.availableBalanceAfterReservation} />}</dd></div></dl>}</section>
      {item.note && <section><h3 className="text-sm font-semibold">Ghi chú của gia sư</h3><p className="mt-2 whitespace-pre-wrap break-words text-sm text-fg-secondary">{item.note}</p></section>}
      <section><h3 className="text-sm font-semibold">Lịch sử xử lý</h3><p className="mt-1 text-xs text-fg-secondary">Giờ Việt Nam (UTC+7)</p><ol className="mt-4 space-y-4 border-l border-border pl-4 text-sm">{[
        { label: 'Gửi yêu cầu', at: item.requestedAt },
        { label: 'Tiếp nhận xử lý', at: item.processingStartedAt, by: item.processingStartedByAdminName },
        { label: item.status === 'Failed' ? 'Ghi nhận thất bại' : 'Hoàn tất chi trả', at: item.processedAt, by: item.processedByAdminName },
      ].filter(event => event.at).map(event => <li key={event.label}><p className="font-medium">{event.label}</p><p className="mt-1 text-xs text-fg-secondary">{formatDateTime(event.at)}{event.by && ` · ${event.by}`}</p></li>)}</ol></section>
      {item.failureReason && <div className="rounded-xl bg-danger-subtle p-4 text-sm"><p className="font-medium text-danger-strong">Lý do thất bại</p><p className="mt-2 whitespace-pre-wrap break-words">{item.failureReason}</p></div>}
      {item.bankTransferReference && <section className="rounded-xl border border-success/20 bg-success-subtle p-4"><h3 className="text-sm font-semibold">Đối soát chi trả</h3><p className="mt-2 break-all text-sm">Mã chuyển khoản: {item.bankTransferReference}</p>{item.reconciliationNote && <p className="mt-2 whitespace-pre-wrap break-words text-sm text-fg-secondary">{item.reconciliationNote}</p>}</section>}

      {item.status === 'Pending' && <div className="space-y-3 border-t border-border pt-5"><p className="text-xs text-fg-secondary">Tiếp nhận yêu cầu để bắt đầu kiểm tra và thực hiện chi trả.</p><Button fullWidth loading={busy} onClick={() => act('process')}>Tiếp nhận xử lý</Button></div>}
      {item.status === 'Processing' && <div className="space-y-4 border-t border-border pt-5">
        <h3 className="text-sm font-semibold">Xác nhận chi trả</h3>
        <Field label="Mã giao dịch chuyển khoản" htmlFor="withdrawal-bank-reference"><Input id="withdrawal-bank-reference" value={reference} maxLength={128} disabled={busy} placeholder="Mã tham chiếu trên chứng từ ngân hàng" onChange={event => setReference(event.target.value)} /></Field>
        <Field label="Ghi chú đối soát (nếu có)" htmlFor="withdrawal-reconciliation-note"><textarea id="withdrawal-reconciliation-note" rows={2} maxLength={500} disabled={busy} value={note} onChange={event => setNote(event.target.value)} className="w-full rounded-lg border border-border p-3 text-sm focus-visible:ring-2 focus-visible:ring-brand-primary-500" /></Field>
        <label className="flex items-start gap-3 rounded-xl bg-holding-subtle p-4 text-sm leading-6"><input type="checkbox" checked={verified} disabled={busy} onChange={event => setVerified(event.target.checked)} className="mt-1 h-4 w-4 shrink-0" /><span>Tôi đã kiểm tra chứng từ và xác nhận chuyển tiền thành công đến đúng tài khoản thụ hưởng.</span></label>
        <Button fullWidth loading={busy} disabled={!verified || reference.trim().length < 4} onClick={() => act('complete')}>Xác nhận đã chuyển tiền</Button>
        <details className="border-t border-border pt-4"><summary className="cursor-pointer rounded text-sm font-medium text-danger-strong focus-visible:ring-2 focus-visible:ring-brand-primary-500">Chuyển tiền không thành công?</summary><div className="mt-4 space-y-3"><Field label="Lý do thất bại" htmlFor="withdrawal-failure-reason"><textarea id="withdrawal-failure-reason" rows={3} minLength={10} maxLength={500} disabled={busy} value={failureReason} onChange={event => setFailureReason(event.target.value)} className="w-full rounded-lg border border-border p-3 text-sm focus-visible:ring-2 focus-visible:ring-brand-primary-500" /></Field><Button fullWidth variant="danger-outline" disabled={busy || failureReason.trim().length < 10} onClick={() => act('fail')}>Ghi nhận thất bại và hoàn lại ví</Button></div></details>
      </div>}
      <details className="text-xs text-fg-secondary"><summary className="cursor-pointer rounded focus-visible:ring-2 focus-visible:ring-brand-primary-500">Mã yêu cầu đối soát</summary><code className="mt-2 block select-all break-all">{item.id}</code></details>
    </div>}
  </Drawer>;
}
