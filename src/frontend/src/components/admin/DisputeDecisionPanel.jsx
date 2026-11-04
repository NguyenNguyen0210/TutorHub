import React, { useRef, useState } from 'react';
import adminService from '@/services/admin.service';
import { VERDICTS } from '@/utils/adminDisputes';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/Dialog';
import Money from '@/components/ui/Money';
import Button from '@/components/ui/Button';

export function AllocationTable({ value }) {
  return <dl className="space-y-3 text-sm">{[['Học phí buổi học', value.gross], ['Hoàn vào ví học viên', value.studentRefund], ['Gia sư thực nhận', value.tutorNet], ['Phí nền tảng', value.platformFee], ...(value.unchangedAmount > 0 ? [['Chưa điều chỉnh trong quyết định này', value.unchangedAmount]] : [])].map(([label, amount]) => <div key={label} className="flex flex-wrap justify-between gap-2"><dt className="text-fg-secondary">{label}</dt><dd className="font-semibold"><Money value={amount} maximumFractionDigits={2} /></dd></div>)}</dl>;
}
export default function DisputeDecisionPanel({ id, gross, onSaved }) {
  const [decision, setDecision] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [review, setReview] = useState(null);
  const [verified, setVerified] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false), attempt = useRef(null);
  const toast = useToast(), confirm = useConfirm();
  const payload = { decision, customRefundAmount: decision === 'StudentWinsPartialRefund' ? Number(amount) : null, adminNotes: notes.trim() };
  const key = JSON.stringify(payload);
  const partialValid = decision !== 'StudentWinsPartialRefund' || (amount !== '' && Number(amount) > 0 && Number(amount) < gross && /^\d+(\.\d{1,2})?$/.test(amount));
  const current = review?.key === key ? review.value : null;
  const preview = async () => {
    if (lock.current || !decision || !partialValid || notes.trim().length < 10) return;
    lock.current = true; setBusy(true); setError(''); setVerified(false);
    try { setReview({ key, value: await adminService.previewDisputeAllocation(id, payload) }); }
    catch { setError('Chưa kiểm tra được phân bổ. Nội dung đang nhập được giữ lại để bạn thử lại.'); }
    finally { lock.current = false; setBusy(false); }
  };
  const submit = async () => {
    if (lock.current || !current?.canResolve || !verified) return;
    lock.current = true; setBusy(true); setError('');
    try {
      const ok = await confirm({ title: 'Kiểm tra và xác nhận phán quyết', confirmText: 'Ghi nhận phán quyết', content: <div className="space-y-4"><p className="text-sm font-semibold">{VERDICTS[decision]}</p><AllocationTable value={current} /><p className="whitespace-pre-wrap break-words text-sm text-fg-secondary">{notes.trim()}</p></div> });
      if (!ok) return;
      if (attempt.current?.payload !== key) attempt.current = { payload: key, id: crypto.randomUUID() };
      await adminService.applyDisputeVerdict(id, payload, attempt.current.id);
      toast.success('Đã ghi nhận phán quyết.');
      await onSaved();
    } catch { setError('Chưa thể ghi nhận phán quyết. Vui lòng kiểm tra trạng thái vụ việc trước khi thử lại.'); await onSaved(); }
    finally { lock.current = false; setBusy(false); }
  };
  return <section className="space-y-4 border-t border-border pt-5" aria-label="Phương án xử lý"><h2 className="text-base font-semibold">Đề xuất hướng xử lý</h2>
    <label className="block text-xs font-medium">Phương án<select aria-label="Phương án xử lý" value={decision} disabled={busy} onChange={event => { setDecision(event.target.value); setVerified(false); }} className="mt-2 h-11 w-full rounded-lg border border-border bg-surface px-2 text-sm"><option value="">Chọn sau khi kiểm tra vụ việc</option>{Object.entries(VERDICTS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    {decision === 'StudentWinsPartialRefund' && <label className="block text-xs font-medium">Số tiền hoàn cho học viên (₫)<input aria-label="Số tiền hoàn" type="number" min="0.01" max={gross} step="0.01" value={amount} disabled={busy} onChange={event => setAmount(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-border px-3 text-sm" /><span className="mt-2 block font-normal text-fg-secondary">Lớn hơn 0 và nhỏ hơn học phí buổi học.</span></label>}
    <label className="block text-xs font-medium">Căn cứ và kết luận<textarea aria-label="Căn cứ và kết luận" value={notes} disabled={busy} onChange={event => setNotes(event.target.value)} maxLength={2000} rows={4} className="mt-2 w-full rounded-lg border border-border p-3 text-sm leading-6" /><span className="mt-1 block font-normal text-fg-secondary">Tối thiểu 10 ký tự · {notes.length}/2.000</span></label>
    <Button variant="outline" fullWidth disabled={busy || !decision || !partialValid || notes.trim().length < 10} onClick={preview}>Kiểm tra phân bổ</Button>
    {current && <div className="space-y-4 rounded-xl border border-insight/20 bg-insight-subtle p-4"><h3 className="text-sm font-semibold">Phân bổ dự kiến</h3><AllocationTable value={current} /><p className="text-xs leading-5 text-fg-secondary">Phí nền tảng {Number(current.feeRate * 100).toLocaleString('vi-VN')}% chỉ tính trên phần học phí giải ngân. Hoàn toàn bộ học phí thì không phát sinh phí.</p>{decision === 'DismissedNoFinancialChange' && <p className="text-xs leading-5 text-fg-secondary">Đóng vụ việc và gỡ tạm dừng. Buổi học tiếp tục theo quy trình giải ngân hiện hành.</p>}{!current.canResolve ? <p role="alert" className="text-sm text-holding-strong">{current.blockReason}</p> : <><label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={verified} disabled={busy} onChange={event => setVerified(event.target.checked)} className="mt-1 h-4 w-4 shrink-0" /><span>Tôi đã đối chiếu báo cáo, giải trình và căn cứ cho phương án này.</span></label><Button fullWidth loading={busy} disabled={!verified || busy} onClick={submit}>Xác nhận phân bổ</Button></>}</div>}
    {error && <p role="alert" className="text-sm leading-6 text-holding-strong">{error}</p>}
  </section>;
}
