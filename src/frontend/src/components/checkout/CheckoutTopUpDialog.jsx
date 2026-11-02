import React, { useEffect, useRef, useState } from 'react';
import { Drawer } from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Callout from '@/components/ui/Callout';
import Money from '@/components/ui/Money';
import studentWalletService from '@/services/studentWallet.service';

const MIN_TOP_UP = 10000;

export default function CheckoutTopUpDialog({ open, onClose, shortfall, expired, onRefresh }) {
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState(null);
  const [error, setError] = useState(null);
  const wasOpenRef = useRef(false);
  const requestRef = useRef(null);

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      setAmount(String(Math.max(MIN_TOP_UP, shortfall)));
      setPaymentUrl(null);
      setError(null);
      requestRef.current = null;
    }
    wasOpenRef.current = open;
  }, [open, shortfall]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting || expired) return;
    const value = Number(amount);
    if (!Number.isSafeInteger(value) || value < MIN_TOP_UP) {
      setError('Số tiền nạp phải là số nguyên, tối thiểu 10.000 ₫.');
      return;
    }
    // Open during the user gesture so a bank redirect is not blocked as an async popup.
    const paymentTab = window.open('', '_blank');
    if (paymentTab) paymentTab.opener = null;
    setSubmitting(true);
    setError(null);
    try {
      if (requestRef.current?.amount !== value) {
        requestRef.current = { amount: value, key: crypto.randomUUID() };
      }
      const result = await studentWalletService.createVnPayTopUp({ amount: value }, requestRef.current.key);
      if (!result?.paymentUrl) throw new Error('Chưa thể mở trang nạp tiền. Vui lòng thử lại.');
      setPaymentUrl(result.paymentUrl);
      if (paymentTab) paymentTab.location.href = result.paymentUrl;
    } catch (err) {
      paymentTab?.close();
      setError(err?.message || 'Không thể tạo yêu cầu nạp tiền. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const refreshBalance = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      if (await onRefresh()) onClose();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={() => { if (!submitting) onClose(); }}
      title="Nạp tiền vào Ví Học Viên"
      widthClass="w-[480px]"
      footer={paymentUrl ? (
        <Button fullWidth onClick={refreshBalance} loading={refreshing}>Tôi đã nạp xong — Cập nhật số dư</Button>
      ) : (
        <Button type="submit" form="checkout-topup-form" fullWidth loading={submitting} disabled={expired}>
          Nạp <Money value={Number(amount) || 0} className="whitespace-nowrap" /> qua VNPAY
        </Button>
      )}
    >
      <div className="space-y-5">
        <p className="text-body-reg text-fg-secondary">{shortfall > 0 ? <>Ví còn thiếu <Money value={shortfall} className="whitespace-nowrap font-semibold text-fg" /> để thanh toán gói học.</> : 'Ví đã đủ số dư. Cập nhật số dư bên dưới để tiếp tục thanh toán.'}</p>
        <Callout variant={expired ? 'danger' : 'warning'}>
          {expired ? 'Đơn giữ chỗ đã hết hạn. Vui lòng quay lại gói học để tạo đơn mới.' : 'Thời gian giữ chỗ vẫn tiếp tục chạy trong lúc nạp tiền. Nạp tiền vào ví chưa hoàn tất thanh toán gói học.'}
        </Callout>
        {error && <Callout variant="danger">{error}</Callout>}
        {paymentUrl ? (
          <div className="space-y-3 text-body-reg text-fg-secondary">
            <p>Hoàn tất nạp tiền ở tab VNPAY, sau đó quay lại đây cập nhật số dư và thanh toán bằng ví.</p>
            <a href={paymentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center font-semibold text-brand-primary-700 underline underline-offset-4">Mở trang nạp tiền VNPAY</a>
          </div>
        ) : (
          <form id="checkout-topup-form" onSubmit={handleSubmit} className="space-y-2">
            <label htmlFor="checkout-topup-amount" className="block text-body-reg font-semibold text-fg">Số tiền muốn nạp (VND)</label>
            <input
              id="checkout-topup-amount"
              type="number"
              inputMode="numeric"
              min={MIN_TOP_UP}
              step="1"
              required
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              disabled={submitting || expired}
              aria-describedby="checkout-topup-help"
              className="h-12 w-full rounded-brand-md border border-border bg-surface px-3 text-body-lg text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <p id="checkout-topup-help" className="text-caption text-fg-muted">Tối thiểu 10.000 ₫. VNPAY sẽ mở trong tab mới để giữ nguyên trang thanh toán này.</p>
          </form>
        )}
      </div>
    </Drawer>
  );
}
