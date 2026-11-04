import React, { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import adminService from '@/services/admin.service';
import { useConfirm } from '@/components/ui/Dialog';
import Button from '@/components/ui/Button';
import Money from '@/components/ui/Money';
import { useToast } from '@/components/ui/Toast';

export default function RefundSettlementPanel({ item }) {
  const [outcome, setOutcome] = useState(''), [reference, setReference] = useState(''), [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const lock = useRef(false), confirm = useConfirm(), client = useQueryClient(), toast = useToast();
  if (item.type !== 'StudentRefund' || !item.settlementRequired || !['Pending', 'Failed'].includes(item.status)) return null;
  const valid = outcome === 'Succeeded' ? reference.trim().length > 0 : outcome === 'Failed' && reason.trim().length >= 5;
  const submit = async event => {
    event.preventDefault(); if (!valid || lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try {
      const accepted = await confirm({ title: 'Xác nhận kết quả đối soát hoàn tiền', confirmText: 'Lưu kết quả đối soát', content: <div className="space-y-3 text-sm"><p>{item.studentName}</p><Money value={item.grossAmount} className="text-xl font-semibold" /><p>{outcome === 'Succeeded' ? 'Đã đối chiếu chứng từ và xác nhận khoản tiền đã được hoàn ngoài hệ thống.' : 'Khoản hoàn tiền vẫn cần tiếp tục xử lý.'}</p><p className="break-words">{outcome === 'Succeeded' ? reference.trim() : reason.trim()}</p></div> });
      if (!accepted) return;
      await adminService.settleRefund(item.id, { outcome, providerReference: outcome === 'Succeeded' ? reference.trim() : null, failureReason: outcome === 'Failed' ? reason.trim() : null });
      toast.success('Đã lưu kết quả đối soát hoàn tiền.');
      setOutcome(''); setReference(''); setReason('');
    } catch (err) { setError(err?.status === 409 ? 'Trạng thái khoản hoàn tiền đã thay đổi. Vui lòng kiểm tra dữ liệu mới trước khi xử lý tiếp.' : 'Chưa lưu được kết quả. Vui lòng kiểm tra trạng thái giao dịch trước khi thử lại.'); }
    finally {
      await Promise.all(['admin-transaction', 'admin-transactions', 'admin-transaction-related', 'admin-disputes', 'admin-disputes-summary', 'admin-dispute-detail', 'admin-dashboard', 'admin-stats', 'admin-revenue-overview', 'admin-revenue-chart', 'admin-audit-logs'].map(key => client.invalidateQueries({ queryKey: [key] })));
      lock.current = false; setBusy(false);
    }
  };
  return <section className="space-y-4 border-t border-border pt-5" aria-label="Xử lý đối soát hoàn tiền"><h3 className="font-semibold">Đối soát hoàn tiền ngoài hệ thống</h3><p className="text-sm leading-6 text-fg-secondary">Kiểm tra chứng từ từ ngân hàng hoặc đơn vị thanh toán trước khi ghi nhận. Thao tác này cập nhật kết quả đối soát, không thực hiện chuyển tiền.</p>
    <form className="space-y-4" onSubmit={submit}><label className="block text-xs font-medium">Kết quả đối soát<select aria-label="Kết quả đối soát" value={outcome} disabled={busy} onChange={e => setOutcome(e.target.value)} className="mt-2 h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm"><option value="">Chọn kết quả sau khi đối chiếu</option><option value="Succeeded">Đã hoàn tiền thành công</option>{item.status !== 'Failed' && <option value="Failed">Hoàn tiền chưa thành công</option>}</select></label>
      {outcome === 'Succeeded' && <label className="block text-xs font-medium">Mã tham chiếu chứng từ<input aria-label="Mã tham chiếu chứng từ" value={reference} maxLength={200} disabled={busy} onChange={e => setReference(e.target.value)} className="mt-2 h-11 w-full rounded-lg border border-border px-3 text-sm" required /></label>}
      {outcome === 'Failed' && <label className="block text-xs font-medium">Lý do chưa hoàn tất<textarea aria-label="Lý do chưa hoàn tất" value={reason} maxLength={1000} disabled={busy} onChange={e => setReason(e.target.value)} rows={3} className="mt-2 w-full rounded-lg border border-border p-3 text-sm" required /></label>}
      {error && <p role="alert" className="text-sm text-holding-strong">{error}</p>}<Button type="submit" fullWidth loading={busy} disabled={!valid || busy}>Kiểm tra và xác nhận</Button>
    </form></section>;
}
