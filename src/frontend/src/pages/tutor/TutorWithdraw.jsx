import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import walletService from '@/services/wallet.service';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import Money from '@/components/ui/Money';
import { useToast } from '@/components/ui/Toast';
import ErrorState from '@/components/common/ErrorState';
import { DetailSkeleton } from '@/components/common/Skeleton';
import Card, { CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Callout from '@/components/ui/Callout';
import Icon from '@/components/ui/Icon';
import Input, { Field } from '@/components/ui/Input';
import StateBadge from '@/components/ledger/StateBadge';

const MIN_WITHDRAW = 50000;

/**
 * Yêu cầu rút tiền về tài khoản ngân hàng — Operational Ledger (SPEC Tutor §4.4).
 *
 * Rút tiền là TIỀN RA, không phải "đã quyết toán" → nút submit và Callout hạn
 * mức dùng `primary` / trung tính, không dùng `success` (xanh lá) như bản cũ.
 *
 * Bất biến tài chính:
 * - DEC-WD-001: Withdrawable = AvailableBalance - HeldBalance.
 * - Hạn mức tối thiểu tạo lệnh rút: 50.000 ₫.
 */
export default function TutorWithdraw() {
  const toast = useToast();
  const navigate = useNavigate();
  const [wallet, setWallet] = useState(null);
  const [payoutAccount, setPayoutAccount] = useState(null);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [amount, setAmount] = useState('50000');
  const [note, setNote] = useState('Rút thù lao giảng dạy');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        const [walletData, account, history] = await Promise.all([
          walletService.getMyWallet(),
          walletService.getPayoutAccount(),
          walletService.getWithdrawals({ pageSize: 5 }),
        ]);
        if (isMounted) {
          setWallet(walletData);
          setPayoutAccount(account);
          setWithdrawals(history?.items || []);
          if (walletData?.withdrawableBalance) {
            setAmount(String(Math.min(walletData.withdrawableBalance, 500000)));
          }
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // DEC-WD-001
  const withdrawableLimit = Math.max(0, (wallet?.availableBalance || 0) - (wallet?.heldBalance || 0));
  const parsedAmount = parseInt(amount, 10);

  // Lý do chặn submit — hiện ngay cạnh nút thay vì chỉ bắt người dùng bấm rồi mới
  // nhận toast, để họ biết trước mình đang thiếu gì.
  const blocker = useMemo(() => {
    if (!Number.isFinite(parsedAmount) || parsedAmount < MIN_WITHDRAW) {
      return 'Số tiền rút tối thiểu là 50.000 ₫';
    }
    if (parsedAmount > withdrawableLimit) {
      return 'Số tiền rút vượt quá hạn mức được rút hiện tại';
    }
    if (!payoutAccount?.accountNumber) {
      return 'Chưa có thông tin tài khoản ngân hàng thụ hưởng.';
    }
    return null;
  }, [parsedAmount, withdrawableLimit, payoutAccount]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const num = parseInt(amount, 10);
    if (!num || num < MIN_WITHDRAW) {
      toast.error('Số tiền rút tối thiểu là 50.000 ₫');
      return;
    }
    if (num > withdrawableLimit) {
      toast.error('Số tiền rút vượt quá hạn mức được phép');
      return;
    }
    if (!payoutAccount?.accountNumber) {
      toast.error('Chưa có thông tin tài khoản ngân hàng thụ hưởng.');
      return;
    }

    try {
      setSubmitting(true);
      await walletService.createWithdrawal({
        amount: num,
        bankName: payoutAccount.bankName || 'Ngân Hàng',
        bankCode: payoutAccount.bankCode || 'BANK',
        accountNumber: payoutAccount.accountNumber,
        accountHolderName: payoutAccount.accountHolderName,
        note: note.trim() || 'Rút thù lao giảng dạy',
      });
      toast.success(`Đã tạo lệnh rút ${formatCurrency(num)} thành công! Lệnh đang chờ xử lý.`);
      navigate('/tutor/wallet');
    } catch (err) {
      toast.error(err?.message || 'Không thể tạo lệnh rút tiền.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <DetailSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <ErrorState error={error} backPath="/tutor/wallet" backLabel="Quay lại ví" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <nav aria-label="Breadcrumb">
        <Link
          to="/tutor/wallet"
          className="inline-flex items-center gap-1.5 text-caption font-semibold text-fg-secondary hover:text-brand-primary-700 transition-colors"
        >
          <Icon name="arrow_back" size="sm" />
          Quay lại ví bảo chứng
        </Link>
      </nav>

      <div>
        <h1 className="text-headline-page text-fg tracking-tight">
          Yêu cầu rút tiền về tài khoản ngân hàng
        </h1>
        <p className="text-body-reg text-fg-secondary mt-1">
          Chỉ được rút từ Số dư khả dụng (Available) sau khi trừ đi các khoản tiền đang
          bị phong tỏa tranh chấp (Held)
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card padding="lg" className="lg:col-span-2 space-y-5">
          {/* Callout trung tính: hạn mức là số liệu tham chiếu, không phải
              "đã quyết toán" — xanh lá là sai ngữ nghĩa tiền. */}
          <Callout variant="neutral" title="Hạn mức được phép rút hiện tại">
            <span className="text-headline-2 font-semibold">
              <Money value={withdrawableLimit} />
            </span>
          </Callout>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Field
              label="Số tiền muốn rút (₫)"
              htmlFor="withdraw-amount"
              required
              hint={`Tối thiểu: 50.000 ₫ • Tối đa: ${formatCurrency(withdrawableLimit)}`}
            >
              <Input
                id="withdraw-amount"
                type="number"
                inputMode="numeric"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min={MIN_WITHDRAW}
                max={withdrawableLimit}
                className="tabular-nums font-bold text-body-lg"
              />
            </Field>

            <div className="space-y-2">
              <span className="block text-caption font-semibold text-fg-secondary uppercase tracking-wide">
                Tài khoản ngân hàng thụ hưởng đã xác thực
              </span>
              <div className="p-4 rounded-brand-md bg-neutral-50 border border-border flex items-center justify-between gap-3 text-caption">
                <div className="min-w-0">
                  <span className="font-semibold text-fg block">
                    {payoutAccount?.bankName || 'Ngân hàng thụ hưởng'}
                  </span>
                  <span className="text-fg-secondary font-mono">
                    STK: {payoutAccount?.accountNumber || '—'} •{' '}
                    {payoutAccount?.accountHolderName || ''}
                  </span>
                </div>
                <Badge variant="success" size="sm" className="shrink-0">
                  Đã xác thực KYC
                </Badge>
              </div>
            </div>

            <Field label="Ghi chú giao dịch" htmlFor="withdraw-note">
              <Input
                id="withdraw-note"
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </Field>

            {blocker && (
              <p className="text-caption text-danger-strong m-0" role="status">
                {blocker}
              </p>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={submitting}
              disabled={Boolean(blocker)}
              icon={!submitting && <Icon name="send" size="sm" />}
            >
              {`Xác nhận rút ${formatCurrency(parseInt(amount, 10) || 0)} về ngân hàng`}
            </Button>
          </form>
        </Card>

        <Card padding="md" className="space-y-4">
          <CardHeader title="Lệnh rút gần đây" icon={<Icon name="history" size="sm" />} />

          {withdrawals.length === 0 ? (
            <p className="text-caption text-fg-muted text-center py-4">
              Chưa có giao dịch rút tiền nào.
            </p>
          ) : (
            <ul className="space-y-3 text-caption">
              {withdrawals.map((w) => (
                <li
                  key={w.id}
                  className="p-3.5 rounded-brand-md bg-neutral-50 border border-border space-y-1"
                >
                  <div className="flex justify-between items-center gap-2">
                    <span className="font-mono font-bold text-fg">
                      {w.id.slice(0, 8).toUpperCase()}
                    </span>
                    <StateBadge status={w.status} domain="withdrawal" />
                  </div>
                  <div className="flex justify-between items-center gap-2 text-fg-muted">
                    <span>{formatDateTime(w.requestedAt, 'DD/MM/YYYY')}</span>
                    <span className="font-bold text-fg tabular-nums">
                      {formatCurrency(w.amount)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
