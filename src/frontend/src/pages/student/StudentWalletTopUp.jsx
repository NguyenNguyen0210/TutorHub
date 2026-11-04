import { userFacingError } from '@/utils/userFacingError';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';
import studentWalletService from '@/services/studentWallet.service';
import { formatCurrency } from '@/utils/formatters';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Money from '@/components/ui/Money';
import Input, { Field } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

const PRESET_AMOUNTS = [100000, 200000, 500000, 1000000, 2000000, 5000000];
const MIN_TOP_UP = 10000;

/**
 * Nạp tiền vào Ví Học Viên — tách từ modal cũ sang trang riêng.
 * `handleRequestTopUp` giữ nguyên: cùng endpoint, cùng payload, cùng redirect
 * sang VNPay Sandbox.
 */
export default function StudentWalletTopUp() {
  const toast = useToast();

  const [topUpAmount, setTopUpAmount] = useState(200000);
  const [customTopUpInput, setCustomTopUpInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.title = 'Nạp tiền ví';
  }, []);

  const finalAmount = customTopUpInput ? Number(customTopUpInput) : Number(topUpAmount);
  const belowMinimum = !Number.isFinite(finalAmount) || finalAmount < MIN_TOP_UP;

  const handleRequestTopUp = async () => {
    if (submitting) return;
    if (belowMinimum) {
      toast.error('Số tiền nạp tối thiểu là 10.000 ₫');
      return;
    }

    try {
      setSubmitting(true);
      const res = await studentWalletService.createVnPayTopUp({ amount: finalAmount });
      if (res?.paymentUrl) {
        window.location.href = res.paymentUrl;
      } else {
        toast.error('Chưa thể mở trang nạp tiền. Vui lòng thử lại.');
      }
    } catch (err) {
      toast.error(userFacingError(err, 'Chưa tạo được yêu cầu nạp tiền. Vui lòng thử lại.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <nav aria-label="Đường dẫn trang">
        <Link
          to="/student/wallet"
          className="inline-flex items-center gap-1.5 text-caption font-semibold text-fg-secondary hover:text-brand-primary-700 transition-colors"
        >
          <Icon name="arrow_back" size="sm" />
          Quay lại Ví học viên
        </Link>
      </nav>

      <div>
        <h1 className="text-headline-page text-fg tracking-tight">
          Nạp tiền vào ví
        </h1>
        <p className="mt-2 text-body-reg text-fg-secondary">Chọn số tiền và tiếp tục thanh toán qua VNPAY.</p>
      </div>

      <Card padding="lg" variant="outlined" className="space-y-6 rounded-2xl">
        <div>
          <span className="text-caption font-semibold text-fg-secondary block mb-2">
            Chọn nhanh mệnh giá nạp
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {PRESET_AMOUNTS.map((amt) => {
              const isSelected = !customTopUpInput && topUpAmount === amt;
              return (
                <button
                  key={amt}
                  type="button"
                  onClick={() => {
                    setTopUpAmount(amt);
                    setCustomTopUpInput('');
                  }}
                  className={cn(
                    'py-2.5 px-3 rounded-brand-md text-caption font-bold border transition-colors cursor-pointer',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary-600',
                    isSelected
                      ? 'bg-brand-primary-50 border-brand-primary-600 text-brand-primary-700'
                      : 'bg-surface border-border hover:border-neutral-400 text-fg'
                  )}
                  aria-pressed={isSelected}
                >
                  {formatCurrency(amt)}
                </button>
              );
            })}
          </div>
        </div>

        <Field label="Hoặc nhập số tiền tùy chọn (VND)" htmlFor="topup-amount"
          hint="Nạp tối thiểu 10.000 ₫."
          error={customTopUpInput !== '' && belowMinimum ? 'Số tiền nạp tối thiểu là 10.000 ₫.' : undefined}>
          <Input
            id="topup-amount"
            type="number"
            inputMode="numeric"
            placeholder="Ví dụ: 350000"
            value={customTopUpInput}
            onChange={(e) => setCustomTopUpInput(e.target.value)}
            min={MIN_TOP_UP}
            step="10000"
            state={customTopUpInput !== '' && belowMinimum ? 'error' : 'default'}
            aria-invalid={customTopUpInput !== '' && belowMinimum || undefined}
          />
        </Field>

        <section aria-label="Thông tin thanh toán" className="space-y-4 border-t border-border pt-5">
          <div className="flex items-center gap-3">
            <Icon name="lock" size="md" className="shrink-0 text-primary" />
            <div>
              <h2 className="font-semibold text-fg">Cổng thanh toán VNPAY</h2>
              <p className="mt-1 text-caption text-fg-secondary">Số dư ví được cập nhật sau khi thanh toán được xác nhận.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-neutral-50 p-4">
            <span className="text-body-reg text-fg-secondary">Số tiền nạp vào ví</span>
            <span className="text-headline-3 font-semibold text-fg"><Money value={belowMinimum ? 0 : finalAmount} /></span>
          </div>
        </section>
        <div className="flex flex-col gap-3 border-t border-border pt-5">
          <p className="text-caption leading-relaxed text-fg-secondary">Bạn sẽ được chuyển đến VNPAY để xác nhận thanh toán.</p>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button as={Link} to="/student/wallet" variant="outline" size="md" disabled={submitting}>
              Hủy bỏ
            </Button>
            <Button
              variant="primary"
              size="md"
              loading={submitting}
              disabled={belowMinimum}
              onClick={handleRequestTopUp}
              icon={!submitting && <Icon name="payments" size="sm" />}
            >
              {submitting ? 'Đang mở VNPAY…' : 'Tiếp tục đến VNPAY'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
