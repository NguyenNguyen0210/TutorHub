import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import walletService from '@/services/wallet.service';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import { maskBankAccount, MIN_TUTOR_WITHDRAWAL, withdrawalBlocker } from '@/utils/tutorWallet';
import Money from '@/components/ui/Money';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/Dialog';
import ErrorState from '@/components/common/ErrorState';
import { DetailSkeleton } from '@/components/common/Skeleton';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Input, { Field } from '@/components/ui/Input';
import StateBadge from '@/components/common/StateBadge';
import WorkspacePageHeader from '@/components/layout/WorkspacePageHeader';

export default function TutorWithdraw() {
  const toast = useToast();
  const confirm = useConfirm();
  const navigate = useNavigate();
  const [wallet, setWallet] = useState(null);
  const [account, setAccount] = useState(null);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [amount, setAmount] = useState('50000');
  const [note, setNote] = useState('Rút thù lao giảng dạy');
  const [phase, setPhase] = useState(null);
  const [saveError, setSaveError] = useState('');
  const busy = useRef(false);
  const request = useRef(null);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    Promise.all([walletService.getMyWallet(), walletService.getPayoutAccount(), walletService.getWithdrawals({ pageSize: 5 })])
      .then(([balance, bank, history]) => { if (mounted.current) { setWallet(balance); setAccount(bank); setWithdrawals(history.items); } })
      .catch(err => { if (mounted.current) setError(err); }).finally(() => { if (mounted.current) setLoading(false); });
    return () => { mounted.current = false; };
  }, []);
  const available = wallet?.availableBalance || 0;
  const blocker = withdrawalBlocker(amount, available, account);
  const hasAccount = Boolean(account?.bankName && account?.accountNumber && account?.accountHolderName);
  const submit = async event => {
    event.preventDefault();
    if (busy.current || blocker) return;
    const value = Number(amount);
    const payload = { amount: value, bankName: account.bankName, bankCode: account.bankCode || undefined, accountNumber: account.accountNumber, accountHolderName: account.accountHolderName, note: note.trim() };
    busy.current = true; setPhase('confirming'); setSaveError('');
    try {
      const approved = await confirm({
        title: 'Xác nhận yêu cầu rút tiền', confirmText: 'Gửi yêu cầu', cancelText: 'Quay lại',
        content: <div className="space-y-3"><p className="text-2xl font-semibold text-fg"><Money value={value} /></p><dl className="space-y-2 text-body-reg"><div><dt className="text-fg-secondary">Ngân hàng nhận</dt><dd className="font-medium text-fg">{account.bankName}</dd></div><div><dt className="text-fg-secondary">Tài khoản</dt><dd className="font-medium text-fg">{maskBankAccount(account.accountNumber)} · {account.accountHolderName}</dd></div></dl><p className="leading-relaxed">Sau khi gửi, số tiền này được tạm giữ khỏi số dư có thể rút để chờ xử lý. Bạn có thể theo dõi yêu cầu trong lịch sử ví.</p></div>,
      });
      if (!approved || !mounted.current) return;
      const fingerprint = JSON.stringify(payload);
      // Retrying the same request reuses its key if a response was lost.
      if (request.current?.fingerprint !== fingerprint) request.current = { fingerprint, key: crypto.randomUUID() };
      setPhase('sending');
      const created = await walletService.createWithdrawal(payload, request.current.key);
      if (!mounted.current) return;
      toast.success('Đã gửi yêu cầu rút tiền. Bạn có thể theo dõi trạng thái trong lịch sử ví.');
      navigate(created?.id ? `/tutor/wallet?recordId=${created.id}` : '/tutor/wallet');
    } catch (err) {
      if (!mounted.current) return;
      setSaveError(err?.status === 400 || err?.status === 409
        ? 'Chưa gửi được yêu cầu. Vui lòng kiểm tra lại số dư và thông tin ngân hàng.'
        : 'Chưa xác nhận được yêu cầu rút tiền. Kiểm tra lịch sử ví hoặc thử lại.');
      if (err?.status === 400 || err?.status === 409) {
        try { const updated = await walletService.getMyWallet(); if (mounted.current) setWallet(updated); } catch { /* Retain the last known balance until the user retries. */ }
      }
    } finally { busy.current = false; if (mounted.current) setPhase(null); }
  };

  if (loading) return <div className="mx-auto max-w-4xl" role="status" aria-label="Đang tải thông tin rút tiền"><DetailSkeleton /></div>;
  if (error || !wallet) return <ErrorState error={error} title="Chưa tải được thông tin rút tiền" onRetry={() => window.location.reload()} backPath="/tutor/wallet" backLabel="Về ví gia sư" />;
  return <div className="mx-auto max-w-5xl space-y-6">
    <Button as={Link} to="/tutor/wallet" variant="ghost" disabled={Boolean(phase)} icon={<Icon name="arrow_back" size="sm" />}>Về ví gia sư</Button>
    <WorkspacePageHeader title="Rút tiền về ngân hàng" description="Kiểm tra số tiền và tài khoản nhận trước khi gửi yêu cầu." />
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(240px,1fr)]">
      <Card padding="lg" variant="outlined" className="space-y-5 rounded-2xl">
        <div className="rounded-xl border border-success/20 bg-success-subtle p-4"><p className="text-body-reg text-success-strong">Số dư có thể rút</p><p className="mt-2 text-[28px] font-semibold text-success-strong"><Money value={available} /></p></div>
        <form onSubmit={submit} className="space-y-5">
          <fieldset disabled={Boolean(phase)} className="min-w-0 space-y-5">
            <Field label="Số tiền muốn rút (₫)" htmlFor="withdraw-amount" required hint={`Từ 50.000 ₫ đến ${formatCurrency(available)}`}>
              <Input id="withdraw-amount" type="number" inputMode="decimal" min={MIN_TUTOR_WITHDRAWAL} max={available} step="0.01" required value={amount} onChange={event => { setAmount(event.target.value); setSaveError(''); }} aria-invalid={!Number.isFinite(Number(amount)) || Number(amount) < MIN_TUTOR_WITHDRAWAL || Number(amount) > available} aria-describedby={blocker ? 'withdraw-blocker' : undefined} className="text-lg font-semibold tabular-nums" />
              <Button variant="ghost" size="sm" className="mt-2 px-0 text-primary" disabled={available < MIN_TUTOR_WITHDRAWAL} onClick={() => { setAmount(String(available)); setSaveError(''); }}>Rút toàn bộ</Button>
            </Field>
            <section aria-labelledby="payout-account-title"><h2 id="payout-account-title" className="mb-2 text-body-reg font-medium text-fg">Ngân hàng nhận tiền</h2><div className="space-y-2 rounded-xl border border-border bg-neutral-50 p-4 text-body-reg">{hasAccount ? <><p className="font-semibold text-fg">{account.bankName}</p><p className="text-fg-secondary">{maskBankAccount(account.accountNumber)}</p><p className="break-words text-fg-secondary">{account.accountHolderName}</p></> : <p className="text-fg-secondary">Chưa có đủ thông tin tài khoản nhận tiền.</p>}</div></section>
            <Field label="Ghi chú" htmlFor="withdraw-note"><Input id="withdraw-note" value={note} maxLength={500} onChange={event => { setNote(event.target.value); setSaveError(''); }} /></Field>
          </fieldset>
          {blocker && <p id="withdraw-blocker" role="status" className="text-body-reg text-danger-strong">{blocker}</p>}
          {saveError && <div role="alert" className="space-y-2 rounded-xl bg-danger-subtle p-4 text-body-reg text-danger-strong"><p>{saveError}</p><Link to="/tutor/wallet" className="inline-flex min-h-11 items-center font-medium underline">Kiểm tra lịch sử ví</Link></div>}
          <Button type="submit" fullWidth disabled={Boolean(blocker || phase)} loading={phase === 'sending'} icon={<Icon name="arrow_forward" size="sm" />}>{phase === 'sending' ? 'Đang gửi yêu cầu…' : 'Kiểm tra yêu cầu rút'}</Button>
          <p className="text-caption leading-relaxed text-fg-secondary">Gửi yêu cầu chưa đồng nghĩa với tiền đã về ngân hàng. Trạng thái Hoàn tất sẽ hiển thị khi yêu cầu đã được xử lý thành công.</p>
        </form>
      </Card>
      <Card padding="lg" variant="outlined" className="space-y-4 rounded-2xl"><h2 className="text-headline-3 font-semibold text-fg">Yêu cầu gần đây</h2>
        {withdrawals.length ? <ul className="divide-y divide-border">{withdrawals.map(item => <li key={item.id} className="space-y-2 py-3"><StateBadge status={item.status} domain="withdrawal" /><p className="text-lg font-semibold text-fg"><Money value={item.amount} /></p><p className="text-caption text-fg-secondary">{formatDateTime(item.requestedAt)}</p><Link to={`/tutor/wallet?recordId=${item.id}`} className="inline-flex min-h-11 items-center text-caption font-medium text-primary">Xem yêu cầu</Link></li>)}</ul> : <p className="py-3 text-body-reg text-fg-secondary">Chưa có yêu cầu rút tiền.</p>}
      </Card>
    </div>
  </div>;
}
