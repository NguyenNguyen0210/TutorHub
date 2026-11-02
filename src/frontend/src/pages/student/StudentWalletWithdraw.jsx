import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import studentWalletService from '@/services/studentWallet.service';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import { DetailSkeleton } from '@/components/common/Skeleton';
import ErrorState from '@/components/common/ErrorState';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Input, { Select, Field } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/Dialog';
import Money from '@/components/ui/Money';
import StateBadge from '@/components/common/StateBadge';
import Callout from '@/components/ui/Callout';

const VIETNAM_BANKS = [
  { code: 'VCB', name: 'Vietcombank' },
  { code: 'TCB', name: 'Techcombank' },
  { code: 'MB', name: 'MBBank' },
  { code: 'ACB', name: 'ACB' },
  { code: 'BIDV', name: 'BIDV' },
  { code: 'VTB', name: 'VietinBank' },
  { code: 'VPB', name: 'VPBank' },
  { code: 'TPB', name: 'TPBank' },
  { code: 'HDB', name: 'HDBank' },
  { code: 'STB', name: 'Sacombank' },
];

const MIN_WITHDRAW = 50000;

/**
 * Rút tiền về ngân hàng — tách từ modal cũ sang trang riêng.
 *
 * Form này có 5 trường + cảnh báo giữ tiền; đặt trong modal hẹp là nghẽn trên
 * mobile. `handleRequestWithdrawal` giữ nguyên endpoint + payload, chỉ chuyển
 * nguyên vẹn logic validate từ modal cũ sang đây.
 *
 * Sửa B-3: `<select>` thô → `Select` chung (focus ring + height đồng nhất).
 */
export default function StudentWalletWithdraw() {
  const toast = useToast();
  const confirm = useConfirm();

  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [withdrawAmount, setWithdrawAmount] = useState('100000');
  const [selectedBank, setSelectedBank] = useState('VCB');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [withdrawNote, setWithdrawNote] = useState('Rút tiền từ Ví Học Viên');
  const [submitting, setSubmitting] = useState(false);
  const [withdrawalResult, setWithdrawalResult] = useState(null);
  const [amountTouched, setAmountTouched] = useState(false);
  const [submissionError, setSubmissionError] = useState(null);

  useEffect(() => {
    document.title = 'Rút tiền ví';
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await studentWalletService.getMyWallet();
        if (!cancelled) {
          setWallet(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const amount = parseInt(withdrawAmount, 10);
  const available = wallet?.availableBalance || 0;
  const amountError = !Number.isFinite(amount) || amount < MIN_WITHDRAW
    ? `Số tiền rút tối thiểu là ${formatCurrency(MIN_WITHDRAW)}.`
    : amount > available ? 'Số tiền rút vượt quá số dư khả dụng.' : null;

  // Lý do chặn submit — hiện ngay cạnh nút thay vì chỉ bắt người dùng bấm rồi mới
  // nhận toast, để họ biết trước mình đang thiếu gì.
  const blocker = useMemo(() => {
    if (!Number.isFinite(amount) || amount < MIN_WITHDRAW) {
      return `Số tiền rút tối thiểu là ${formatCurrency(MIN_WITHDRAW)}.`;
    }
    if (amount > available) {
      return 'Số tiền rút vượt quá số dư khả dụng.';
    }
    if (!accountNumber.trim() || !accountHolderName.trim()) {
      return 'Vui lòng nhập đầy đủ số tài khoản và tên chủ tài khoản.';
    }
    return null;
  }, [amount, available, accountNumber, accountHolderName]);

  const handleRequestWithdrawal = async (e) => {
    e.preventDefault();
    if (submitting || withdrawalResult) return;

    // Giữ nguyên các ngưỡng validate như bản modal cũ.
    if (!amount || amount < MIN_WITHDRAW) {
      toast.error('Số tiền rút tối thiểu là 50.000 ₫');
      return;
    }
    if (amount > available) {
      toast.error('Số tiền rút vượt quá số dư khả dụng.');
      return;
    }
    if (!accountNumber.trim() || !accountHolderName.trim()) {
      toast.error('Vui lòng nhập đầy đủ số tài khoản và tên chủ tài khoản.');
      return;
    }

    const bankObj = VIETNAM_BANKS.find((b) => b.code === selectedBank) || VIETNAM_BANKS[0];

    const confirmed = await confirm({
      title: 'Xác nhận yêu cầu rút tiền',
      content: <div className="space-y-3 text-body-reg text-fg-secondary">
        <p>Số tiền: <strong className="text-fg"><Money value={amount} /></strong></p>
        <p>Ngân hàng: <strong className="text-fg">{bankObj.name}</strong></p>
        <p>Số tài khoản: <strong className="break-all text-fg">{accountNumber.trim()}</strong></p>
        <p>Chủ tài khoản: <strong className="break-words text-fg">{accountHolderName.trim().toUpperCase()}</strong></p>
        <p className="text-caption">Số tiền được tạm giữ trong thời gian xét duyệt và chuyển khoản.</p>
      </div>,
      confirmText: 'Gửi yêu cầu',
      cancelText: 'Kiểm tra lại',
    });
    if (!confirmed) return;

    try {
      setSubmitting(true);
      setSubmissionError(null);
      const result = await studentWalletService.requestWithdrawal({
        amount,
        bankName: bankObj.name,
        bankCode: bankObj.code,
        accountNumber: accountNumber.trim(),
        accountHolderName: accountHolderName.trim().toUpperCase(),
        note: withdrawNote.trim() || 'Rút tiền từ Ví Học Viên',
      });
      setWithdrawalResult(result);
    } catch (err) {
      setSubmissionError(err?.message || 'Không thể gửi yêu cầu rút tiền. Vui lòng kiểm tra thông tin và thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <DetailSkeleton />
      </div>
    );
  }

  if (error || !wallet) {
    return (
      <div className="py-12">
        <ErrorState
          error={error}
          title="Không thể tải Ví Học Viên"
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <nav aria-label="Breadcrumb">
        <Link
          to="/student/wallet"
          className="inline-flex items-center gap-1.5 text-caption font-semibold text-fg-secondary hover:text-brand-primary-700 transition-colors"
        >
          <Icon name="arrow_back" size="sm" />
          Quay lại Ví Học Viên
        </Link>
      </nav>

      <div>
        <h1 className="text-headline-page text-fg tracking-tight">
          Rút tiền về ngân hàng
        </h1>
        <p className="text-body-reg text-fg-secondary mt-1">
          Chuyển tiền từ số dư khả dụng về tài khoản ngân hàng của bạn.
        </p>
      </div>

      {withdrawalResult ? (
        <Card padding="lg" variant="outlined" className="space-y-5 rounded-2xl">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-primary-50 text-primary"><Icon name="schedule" size="md" /></span>
            <div><h2 className="text-headline-3 font-semibold text-fg">Đã gửi yêu cầu rút tiền</h2><p className="mt-2 text-body-reg text-fg-secondary">Theo dõi trạng thái xét duyệt và chuyển khoản trong lịch sử rút tiền.</p></div>
          </div>
          <dl className="divide-y divide-border text-body-reg">
            <div className="flex flex-wrap justify-between gap-2 py-3"><dt className="text-fg-secondary">Số tiền</dt><dd className="font-semibold text-fg"><Money value={withdrawalResult.amount} /></dd></div>
            <div className="flex flex-wrap justify-between gap-2 py-3"><dt className="text-fg-secondary">Trạng thái</dt><dd><StateBadge domain="withdrawal" status={withdrawalResult.status} /></dd></div>
            <div className="flex flex-wrap justify-between gap-2 py-3"><dt className="text-fg-secondary">Tài khoản nhận</dt><dd className="text-fg">{withdrawalResult.bankName} · {withdrawalResult.accountNumber}</dd></div>
            <div className="flex flex-wrap justify-between gap-2 py-3"><dt className="text-fg-secondary">Chủ tài khoản</dt><dd className="break-words text-fg">{withdrawalResult.accountHolderName}</dd></div>
            {withdrawalResult.requestedAt && <div className="flex flex-wrap justify-between gap-2 py-3"><dt className="text-fg-secondary">Thời gian gửi</dt><dd className="text-fg">{formatDateTime(withdrawalResult.requestedAt)}</dd></div>}
            {withdrawalResult.id && <div className="space-y-1 py-3"><dt className="text-fg-secondary">Mã yêu cầu</dt><dd className="break-all text-caption text-fg">{withdrawalResult.id}</dd></div>}
          </dl>
          <Button as={Link} to="/student/wallet" fullWidth>Quay lại ví học viên</Button>
        </Card>
      ) : <form onSubmit={handleRequestWithdrawal}>
        <Card padding="lg" variant="outlined" className="space-y-5 rounded-2xl">
          <div className="p-3.5 rounded-brand-md bg-neutral-50 border border-border flex justify-between items-center gap-3">
            <span className="text-caption text-fg-secondary">Số dư khả dụng:</span>
            <span className="text-body-reg font-bold text-fg tabular-nums">
              {formatCurrency(available)}
            </span>
          </div>

          <Field label="Số tiền muốn rút" htmlFor="withdraw-amount" required hint="Rút tối thiểu 50.000 ₫."
            error={amountTouched ? amountError : undefined}>
            <Input
              id="withdraw-amount"
              type="number"
              inputMode="numeric"
              value={withdrawAmount}
              onChange={(e) => { setWithdrawAmount(e.target.value); setAmountTouched(true); }}
              onBlur={() => setAmountTouched(true)}
              state={amountTouched && amountError ? 'error' : 'default'}
              aria-invalid={amountTouched && Boolean(amountError) || undefined}
              min={MIN_WITHDRAW}
              max={available}
              step="10000"
              required
            />
          </Field>

          <Field label="Ngân hàng nhận tiền" htmlFor="withdraw-bank" required>
            <Select
              id="withdraw-bank"
              value={selectedBank}
              onChange={(e) => setSelectedBank(e.target.value)}
            >
              {VIETNAM_BANKS.map((b) => (
                <option key={b.code} value={b.code}>
                  {b.name} ({b.code})
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Số tài khoản ngân hàng" htmlFor="withdraw-account-number" required>
            <Input
              id="withdraw-account-number"
              inputMode="numeric"
              placeholder="Ví dụ: 0123456789"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              required
            />
          </Field>

          <Field
            label="Tên chủ tài khoản (In hoa không dấu)"
            htmlFor="withdraw-account-holder"
            required
          >
            <Input
              id="withdraw-account-holder"
              placeholder="Ví dụ: NGUYEN VAN A"
              value={accountHolderName}
              onChange={(e) => setAccountHolderName(e.target.value.toUpperCase())}
              required
            />
          </Field>

          <Field label="Ghi chú (Tùy chọn)" htmlFor="withdraw-note">
            <Input
              id="withdraw-note"
              value={withdrawNote}
              onChange={(e) => setWithdrawNote(e.target.value)}
            />
          </Field>

          <p className="text-[12px] text-fg-secondary leading-relaxed m-0 p-3 rounded-brand-md bg-holding-subtle border border-holding/30 text-holding-strong">
            Số tiền rút được tạm giữ trong thời gian xét duyệt và chuyển khoản. Nếu yêu cầu thất bại, tiền được hoàn vào số dư khả dụng.
          </p>

          {submissionError && <Callout variant="danger" icon={<Icon name="report_problem" size="sm" />}>{submissionError}</Callout>}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2.5 pt-2 border-t border-border">
            <Button as={Link} to="/student/wallet" variant="outline" size="md" disabled={submitting}>
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={submitting}
              disabled={Boolean(blocker)}
              icon={!submitting && <Icon name="payments" size="sm" />}
            >
              {submitting ? 'Đang gửi yêu cầu…' : 'Gửi yêu cầu rút tiền'}
            </Button>
          </div>
        </Card>
      </form>}
    </div>
  );
}
