import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import studentWalletService from '@/services/studentWallet.service';
import { formatCurrency } from '@/utils/formatters';
import { DetailSkeleton } from '@/components/common/Skeleton';
import ErrorState from '@/components/common/ErrorState';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Input, { Select, Field } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

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
 * Rút tiền về ngân hàng — tách từ modal cũ sang trang riêng (SPEC §5.3).
 *
 * Form này có 5 trường + cảnh báo giữ tiền; đặt trong modal hẹp là nghẽn trên
 * mobile. `handleRequestWithdrawal` giữ nguyên endpoint + payload, chỉ chuyển
 * nguyên vẹn logic validate từ modal cũ sang đây.
 *
 * Sửa B-3: `<select>` thô → `Select` chung (focus ring + height đồng nhất).
 */
export default function StudentWalletWithdraw() {
  const toast = useToast();

  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [withdrawAmount, setWithdrawAmount] = useState('100000');
  const [selectedBank, setSelectedBank] = useState('VCB');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [withdrawNote, setWithdrawNote] = useState('Rút tiền từ Ví Học Viên');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.title = 'Rút tiền — TutorHub';
    return () => {
      document.title = 'TutorHub — Nền Tảng Kết Nối Gia Sư & Học Viên';
    };
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

    try {
      setSubmitting(true);
      await studentWalletService.requestWithdrawal({
        amount,
        bankName: bankObj.name,
        bankCode: bankObj.code,
        accountNumber: accountNumber.trim(),
        accountHolderName: accountHolderName.trim().toUpperCase(),
        note: withdrawNote.trim() || 'Rút tiền từ Ví Học Viên',
      });
      toast.success(`Đã gửi yêu cầu rút ${formatCurrency(amount)}! Yêu cầu đang được xử lý.`);
    } catch (err) {
      toast.error(err?.message || 'Không thể gửi yêu cầu rút tiền.');
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
          Rút từ số dư khả dụng về tài khoản Việt Nam. Yêu cầu được Admin xử lý thủ công.
        </p>
      </div>

      <form onSubmit={handleRequestWithdrawal}>
        <Card padding="lg" className="space-y-4">
          <div className="p-3.5 rounded-brand-md bg-neutral-50 border border-border flex justify-between items-center gap-3">
            <span className="text-caption text-fg-secondary">Số dư khả dụng:</span>
            <span className="text-body-reg font-bold text-fg tabular-nums">
              {formatCurrency(available)}
            </span>
          </div>

          <Field label="Số tiền muốn rút (Tối thiểu 50.000 ₫)" htmlFor="withdraw-amount" required>
            <Input
              id="withdraw-amount"
              type="number"
              inputMode="numeric"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
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
            Khi tạo lệnh, số tiền rút sẽ được tạm giữ (Reserved) và không còn khả dụng cho
            tới khi Admin giải ngân, hoặc được hoàn lại nếu lệnh thất bại.
          </p>

          {blocker && (
            <p className="text-caption text-danger-strong m-0" role="status">
              {blocker}
            </p>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2.5 pt-2 border-t border-border">
            <Button as={Link} to="/student/wallet" variant="outline" size="md">
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
              Xác nhận rút {formatCurrency(Number(withdrawAmount) || 0)}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
