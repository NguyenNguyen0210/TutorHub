import { userFacingError } from '@/utils/userFacingError';
import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import studentWalletService from '@/services/studentWallet.service';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input, { Field } from '@/components/ui/Input';
import Money from '@/components/ui/Money';
import Icon from '@/components/ui/Icon';
import { Drawer } from '@/components/ui/Avatar';
import { useToast } from '@/components/ui/Toast';

export default function StudentWalletAdjustment() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [selected, setSelected] = useState(null);
  const [amount, setAmount] = useState('');
  const [direction, setDirection] = useState('Credit');
  const [reason, setReason] = useState('');
  const [reference, setReference] = useState('');
  const [review, setReview] = useState(null);
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const attempt = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    setResults(null); setSearchError('');
    if (!search.trim()) { setSearching(false); return () => controller.abort(); }
    setSearching(true);
    const timer = window.setTimeout(() => {
      studentWalletService.adminFindWallets(search.trim(), page, controller.signal)
        .then(data => { if (!controller.signal.aborted) setResults(data); })
        .catch(() => { if (!controller.signal.aborted) setSearchError('Không thể tìm ví. Vui lòng thử lại.'); })
        .finally(() => { if (!controller.signal.aborted) setSearching(false); });
    }, 300);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [search, page]);

  const value = Number(amount);
  const after = selected ? Number(selected.availableBalance) + (direction === 'Credit' ? value : -value) : 0;
  const fullReason = `${reason.trim()}${reference.trim() ? ` [Vụ việc: ${reference.trim()}]` : ''}`;
  const valid = selected && Number.isSafeInteger(value) && value > 0 && after >= 0 && reason.trim().length >= 10 && fullReason.length <= 500;

  const prepare = async event => {
    event.preventDefault();
    if (!valid || inFlight.current) return;
    const payload = { studentWalletId: selected.id, amount: value, direction, reason: fullReason, expectedAvailableBalance: Number(selected.availableBalance) };
    const fingerprint = JSON.stringify(payload);
    if (attempt.current?.fingerprint !== fingerprint) attempt.current = { fingerprint, key: crypto.randomUUID() };
    setReview({ payload, before: Number(selected.availableBalance), after, name: selected.studentName, email: selected.studentEmail, key: attempt.current.key });
  };

  const submit = async () => {
    if (!review || inFlight.current) return;
    inFlight.current = true; setBusy(true);
    try {
      const wallet = await studentWalletService.adminAdjustWallet(review.payload, review.key);
      setSelected(current => ({ ...current, ...wallet }));
      setAmount(''); setReason(''); setReference(''); setReview(null); attempt.current = null;
      toast.success('Đã điều chỉnh số dư học viên.');
    } catch (err) {
      toast.error(userFacingError(err, 'Chưa thể điều chỉnh số dư. Vui lòng thử lại.'));
      // Keep the same intent/key on retry, including uncertain network outcomes.
    } finally { inFlight.current = false; setBusy(false); }
  };

  const refreshWallet = async () => {
    if (!selected || busy) return;
    setBusy(true);
    try {
      const data = await studentWalletService.adminFindWallets(selected.id);
      const wallet = data.items.find(item => item.id === selected.id);
      if (!wallet) throw new Error('Không tìm thấy ví học viên.');
      setSelected(wallet);
    } catch (err) { toast.error(userFacingError(err, 'Không thể cập nhật số dư.')); }
    finally { setBusy(false); }
  };

  return <>
    <Card padding="lg">
      <div className="mb-6 flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-insight-subtle text-insight-strong"><Icon name="tune" size="md" /></span><div><h2 className="text-lg font-semibold">Điều chỉnh số dư học viên</h2><p className="mt-1 text-xs text-fg-secondary">Chọn học viên và kiểm tra số dư trước khi điều chỉnh.</p></div></div>
      <div className="grid items-start gap-6 xl:grid-cols-2">
        <div className="space-y-4">
          <Field label="Tìm học viên" htmlFor="wallet-student-search"><Input id="wallet-student-search" placeholder="Tên, email hoặc mã học viên" value={search} disabled={busy || !!review} onChange={event => { setSearch(event.target.value); setPage(1); }} /></Field>
          {searching && <p role="status" className="text-sm text-fg-secondary">Đang tìm học viên…</p>}
          {searchError && <p role="alert" className="text-sm text-danger-strong">{searchError}</p>}
          {results && <div className="space-y-2">
            {results.items.length === 0 && <p className="rounded-xl bg-neutral-50 p-4 text-sm text-fg-secondary">Không tìm thấy ví phù hợp. Chỉ hiển thị học viên đã có ví.</p>}
            {results.items.map(wallet => <button type="button" key={wallet.id} disabled={busy || !!review} onClick={() => setSelected(wallet)} aria-pressed={selected?.id === wallet.id} className="flex w-full items-center gap-3 rounded-xl border border-border p-3 text-left hover:bg-brand-primary-50 aria-pressed:border-brand-primary-500 aria-pressed:bg-brand-primary-50 focus-visible:ring-2 focus-visible:ring-brand-primary-500">
              <Icon name="person" size="md" className="text-brand-primary-600" /><span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{wallet.studentName}</span><span className="block break-all text-xs text-fg-secondary">{wallet.studentEmail}</span></span><Icon name="chevron_right" size="sm" />
            </button>)}
            {results.totalPages > 1 && <div className="flex items-center justify-between gap-2 text-xs"><Button size="sm" variant="outline" disabled={page === 1 || searching} onClick={() => setPage(page - 1)}>Trước</Button><span>Trang {page}/{results.totalPages}</span><Button size="sm" variant="outline" disabled={!results.hasNextPage || searching} onClick={() => setPage(page + 1)}>Tiếp</Button></div>}
          </div>}
          {selected && <div className="rounded-xl border border-brand-primary-100 bg-brand-primary-50 p-4">
            <div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="font-semibold">{selected.studentName}</p><p className="mt-1 break-all text-xs text-fg-secondary">{selected.studentEmail}</p></div><Button variant="ghost" size="sm" loading={busy} onClick={refreshWallet} disabled={!!review} aria-label="Cập nhật số dư"><Icon name="refresh" size="sm" /></Button></div>
            <dl className="mt-4 space-y-2 text-sm"><div className="flex flex-wrap justify-between gap-2"><dt>Số dư khả dụng</dt><dd><Money value={selected.availableBalance} className="font-semibold" /></dd></div><div className="flex flex-wrap justify-between gap-2 text-fg-secondary"><dt>Đang chờ rút</dt><dd><Money value={selected.withdrawingBalance} /></dd></div></dl>
          </div>}
        </div>
        <form onSubmit={prepare} className="space-y-4">
          <fieldset disabled={!selected || busy || !!review} className="space-y-4 disabled:opacity-60">
            <Field label="Loại điều chỉnh" htmlFor="adjust-direction"><select id="adjust-direction" value={direction} onChange={event => setDirection(event.target.value)} className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm"><option value="Credit">Cộng tiền</option><option value="Debit">Trừ tiền</option></select></Field>
            <Field label="Số tiền điều chỉnh (₫)" htmlFor="adjust-amount"><Input id="adjust-amount" type="number" min="1" step="1" required value={amount} onChange={event => setAmount(event.target.value)} /></Field>
            <Field label="Lý do điều chỉnh" htmlFor="adjust-reason"><textarea id="adjust-reason" required minLength={10} maxLength={500} rows={3} value={reason} onChange={event => setReason(event.target.value)} placeholder="Nhập lý do cụ thể, ít nhất 10 ký tự" className="w-full rounded-lg border border-border bg-surface p-3 text-sm focus-visible:ring-2 focus-visible:ring-brand-primary-500" /></Field>
            <Field label="Mã vụ việc liên quan (nếu có)" htmlFor="adjust-reference"><Input id="adjust-reference" maxLength={100} value={reference} onChange={event => setReference(event.target.value)} /></Field>
          </fieldset>
          {selected && value > 0 && <div className="rounded-xl border border-border bg-neutral-50 p-4">
            <h3 className="mb-3 text-sm font-medium">Xem trước số dư khả dụng</h3>
            <dl className="space-y-2 text-sm"><div className="flex flex-wrap justify-between gap-2"><dt>Hiện tại</dt><dd><Money value={selected.availableBalance} /></dd></div><div className="flex flex-wrap justify-between gap-2"><dt>{direction === 'Credit' ? 'Cộng tiền' : 'Trừ tiền'}</dt><dd className={direction === 'Credit' ? 'text-success-strong' : 'text-danger-strong'}>{direction === 'Credit' ? '+' : '−'}<Money value={value} /></dd></div><div className="flex flex-wrap justify-between gap-2 border-t border-border pt-3 font-semibold"><dt>Dự kiến</dt><dd><Money value={after} /></dd></div></dl>
          </div>}
          {selected && after < 0 && <p role="alert" className="text-sm text-danger-strong">Số tiền trừ vượt quá số dư khả dụng.</p>}
          {fullReason.length > 500 && <p role="alert" className="text-sm text-danger-strong">Lý do và mã vụ việc tối đa 500 ký tự.</p>}
          <Button type="submit" fullWidth disabled={!valid || busy} icon={<Icon name="fact_check" size="sm" />}>Kiểm tra điều chỉnh</Button>
        </form>
      </div>
    </Card>
    <Drawer open={!!review} onClose={() => { if (!busy) setReview(null); }} side="right" title="Xác nhận điều chỉnh" widthClass="w-full sm:max-w-lg" panelClassName="max-w-full">
      {review && <div className="space-y-5">
        <div><p className="font-semibold">{review.name}</p><p className="mt-1 break-all text-sm text-fg-secondary">{review.email}</p></div>
        <dl className="space-y-3 rounded-xl bg-neutral-50 p-4 text-sm">
          <div className="flex flex-wrap justify-between gap-2"><dt>Số dư hiện tại</dt><dd><Money value={review.before} /></dd></div>
          <div className="flex flex-wrap justify-between gap-2"><dt>{review.payload.direction === 'Credit' ? 'Cộng tiền' : 'Trừ tiền'}</dt><dd><Money value={review.payload.amount} className="font-semibold" /></dd></div>
          <div className="flex flex-wrap justify-between gap-2 border-t border-border pt-3"><dt>Số dư dự kiến</dt><dd><Money value={review.after} className="font-semibold" /></dd></div>
        </dl>
        <div><h3 className="text-sm font-medium">Lý do</h3><p className="mt-2 whitespace-pre-wrap break-words text-sm text-fg-secondary">{review.payload.reason}</p></div>
        <p className="text-xs leading-5 text-fg-secondary">Điều chỉnh sẽ được lưu trong lịch sử ví và nhật ký quản trị.</p>
        <Button fullWidth variant={review.payload.direction === 'Debit' ? 'danger' : 'primary'} loading={busy} onClick={submit}>Xác nhận điều chỉnh</Button>
        <Link to="/admin/audit-logs" className="inline-flex min-h-10 items-center text-sm text-brand-primary-600">Xem nhật ký quản trị</Link>
      </div>}
    </Drawer>
  </>;
}
