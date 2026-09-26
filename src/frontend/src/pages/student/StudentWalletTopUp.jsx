import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';
import studentWalletService from '@/services/studentWallet.service';
import { formatCurrency } from '@/utils/formatters';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Input, { Field } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

const PRESET_AMOUNTS = [100000, 200000, 500000, 1000000, 2000000, 5000000];
const MIN_TOP_UP = 10000;

/**
 * Nạp tiền vào Ví Học Viên — tách từ modal cũ sang trang riêng (SPEC §5.3).
 * `handleRequestTopUp` giữ nguyên: cùng endpoint, cùng payload, cùng redirect
 * sang VNPay Sandbox.
 */
export default function StudentWalletTopUp() {
  const toast = useToast();

  const [topUpAmount, setTopUpAmount] = useState(200000);
  const [customTopUpInput, setCustomTopUpInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.title = 'Nạp tiền — TutorHub';
    return () => {
      document.title = 'TutorHub — Nền Tảng Kết Nối Gia Sư & Học Viên';
    };
  }, []);

  const finalAmount = customTopUpInput ? Number(customTopUpInput) : Number(topUpAmount);
  const belowMinimum = !finalAmount || finalAmount < MIN_TOP_UP;

  const handleRequestTopUp = async () => {
    if (!finalAmount || finalAmount < MIN_TOP_UP) {
      toast.error('Số tiền nạp tối thiểu là 10.000 ₫');
      return;
    }

    try {
      setSubmitting(true);
      const res = await studentWalletService.createVnPayTopUp({ amount: finalAmount });
      if (res?.paymentUrl) {
        toast.info('Đang chuyển hướng đến Cổng thanh toán VNPay Sandbox...');
        window.location.href = res.paymentUrl;
      } else {
        toast.error('Không nhận được liên kết thanh toán từ VNPay.');
      }
    } catch (err) {
      toast.error(err?.message || 'Không thể tạo yêu cầu nạp tiền.');
    } finally {
      setSubmitting(false);
    }
  };

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
          Nạp tiền vào ví
        </h1>
        <p className="text-body-reg text-fg-secondary mt-1">
          Thanh toán qua cổng VNPay Sandbox 24/7. Số dư khả dụng cập nhật ngay sau khi
          xác nhận.
        </p>
      </div>

      <Card padding="lg" className="space-y-5">
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

        <Field label="Hoặc nhập số tiền tùy chọn (VND)" htmlFor="topup-amount">
          <Input
            id="topup-amount"
            type="number"
            inputMode="numeric"
            placeholder="Ví dụ: 350000"
            value={customTopUpInput}
            onChange={(e) => setCustomTopUpInput(e.target.value)}
            min={MIN_TOP_UP}
            step="10000"
          />
        </Field>

        <div className="p-3.5 rounded-brand-md bg-neutral-50 border border-border text-caption space-y-2">
          <div className="flex items-center gap-1.5 text-fg font-semibold">
            <Icon name="credit_card" size="xs" className="text-brand-primary-600" />
            <span>Cổng thanh toán trực tuyến VNPay Sandbox (24/7)</span>
          </div>
          <ul className="list-disc list-inside text-fg-muted text-[11px] space-y-1">
            <li>Hệ thống chuyển hướng bạn sang cổng VNPay Sandbox để nhập thông tin thẻ test.</li>
            <li>Sau khi xác nhận OTP, số dư khả dụng sẽ được tự động cộng vào ví ngay lập tức.</li>
            <li>Hỗ trợ thẻ ATM nội địa (NCB test) và ứng dụng ngân hàng quét mã VNPay.</li>
            <li>Số tiền nạp tối thiểu là 10.000 ₫.</li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 border-t border-border">
          <p className="text-caption text-fg-secondary m-0">
            Số tiền nạp:{' '}
            <strong className={belowMinimum ? 'text-danger-strong' : 'text-fg'}>
              {formatCurrency(finalAmount || 0)}
            </strong>
          </p>
          <div className="flex items-center gap-2.5">
            <Button as={Link} to="/student/wallet" variant="outline" size="md">
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
              Thanh toán {formatCurrency(finalAmount || 0)}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
