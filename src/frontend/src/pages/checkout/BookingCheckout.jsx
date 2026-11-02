import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { cn } from '@/lib/cn';
import paymentService from '@/services/payment.service';
import studentWalletService from '@/services/studentWallet.service';
import bookingService from '@/services/booking.service';
import tutorService from '@/services/tutor.service';
import CheckoutTopUpDialog from '@/components/checkout/CheckoutTopUpDialog';
import { hasBookingExpired } from '@/utils/checkout';
import CountdownTimer from '@/components/feedback/CountdownTimer';
import { formatCurrency } from '@/utils/formatters';
import Money from '@/components/ui/Money';
import { useToast } from '@/components/ui/Toast';
import { DetailSkeleton } from '@/components/common/Skeleton';
import ErrorState from '@/components/common/ErrorState';
import Card, { CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Callout from '@/components/ui/Callout';
import Icon from '@/components/ui/Icon';
import Avatar from '@/components/ui/Avatar';

export default function BookingCheckout() {
  const toast = useToast();
  const { id } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loadingBooking, setLoadingBooking] = useState(true);
  const [bookingError, setBookingError] = useState(null);

  const [selectedMethod, setSelectedMethod] = useState('vnpay');
  const [wallet, setWallet] = useState(null);
  const [loadingWallet, setLoadingWallet] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [isExpired, setIsExpired] = useState(false);
  const [service, setService] = useState(null);
  const [topUpOpen, setTopUpOpen] = useState(false);

  const loadWallet = useCallback(async () => {
    try {
      setLoadingWallet(true);
      const w = await studentWalletService.getMyWallet();
      setWallet(w);
      return w;
    } catch {
      return null;
    } finally {
      setLoadingWallet(false);
    }
  }, []);

  useEffect(() => {
    loadWallet();
    const refreshOnVisible = () => {
      if (document.visibilityState === 'visible') loadWallet();
    };
    window.addEventListener('focus', loadWallet);
    document.addEventListener('visibilitychange', refreshOnVisible);
    return () => {
      window.removeEventListener('focus', loadWallet);
      document.removeEventListener('visibilitychange', refreshOnVisible);
    };
  }, [loadWallet]);

  useEffect(() => {
    let cancelled = false;
    setService(null);
    if (booking?.serviceId) {
      tutorService.getServiceById(booking.serviceId).then((data) => {
        if (!cancelled) setService(data);
      }).catch(() => { /* Keep checkout usable if the public listing is unavailable. */ });
    }
    return () => { cancelled = true; };
  }, [booking?.serviceId]);

  useEffect(() => {
    let cancelled = false;
    async function loadBooking() {
      if (!id) {
        setBookingError(new Error('Thiếu mã đơn đặt chỗ trong đường dẫn.'));
        setLoadingBooking(false);
        return;
      }
      try {
        setLoadingBooking(true);
        setBookingError(null);
        const data = await bookingService.getBookingById(id);
        if (!cancelled) {
          setBooking(data);
          setIsExpired(hasBookingExpired(data));
          if (data?.status === 'Paid') {
            toast.info('Đơn hàng này đã được thanh toán thành công.');
            navigate('/student/dashboard');
          } else if (data?.status === 'Cancelled' || data?.status === 'Expired') {
            setIsExpired(true);
          }
        }
      } catch (err) {
        if (!cancelled) setBookingError(err);
      } finally {
        if (!cancelled) setLoadingBooking(false);
      }
    }

    loadBooking();
    return () => {
      cancelled = true;
    };
  }, [id, navigate, toast]);

  // Background status sync (polls every 5s while waiting for payment)
  useEffect(() => {
    if (!id || isExpired || !booking || booking.status === 'Paid') return;

    const pollInterval = setInterval(async () => {
      try {
        const fresh = await bookingService.getBookingById(id);
        if (fresh?.status === 'Paid') {
          toast.success('Thanh toán thành công! Hợp đồng học tập đã được kích hoạt.');
          navigate('/student/dashboard');
        } else if (fresh?.status === 'Cancelled' || fresh?.status === 'Expired') {
          setIsExpired(true);
        }
      } catch {
        // Silently ignore transient background poll errors
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [id, isExpired, booking, navigate, toast]);

  if (loadingBooking) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
        <DetailSkeleton />
      </div>
    );
  }

  if (bookingError || !booking) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <ErrorState
          error={bookingError || new Error('Không tìm thấy đơn đặt chỗ.')}
          title="Không thể tải đơn thanh toán"
          onRetry={() => window.location.reload()}
          backPath="/"
          backLabel="Quay lại danh sách gia sư"
        />
      </div>
    );
  }

  const totalPrice = Number(booking.totalPrice || 0);
  const totalSessions = Number(booking.totalSessions || 1);
  const pricePerSession = totalSessions > 0 ? Math.round(totalPrice / totalSessions) : totalPrice;

  const hasEnoughWalletBalance = (wallet?.availableBalance || 0) >= totalPrice;
  const shortfall = Math.max(0, totalPrice - (wallet?.availableBalance || 0));
  const servicePath = booking.serviceId ? `/services/${booking.serviceId}` : '/';
  const serviceTitle = booking.serviceTitle || service?.title || booking.subjectName || 'Gói học';
  const paymentDisabled = isExpired || hasBookingExpired(booking);

  const refreshTopUpBalance = async () => {
    const updated = await loadWallet();
    if (!updated) {
      toast.error('Chưa thể tải số dư ví. Vui lòng thử lại.');
      return false;
    }
    if (updated.availableBalance >= totalPrice) {
      if (isExpired || hasBookingExpired(booking)) {
        setIsExpired(true);
        toast.info('Số dư đã cập nhật, nhưng đơn giữ chỗ đã hết hạn. Vui lòng tạo đơn mới để thanh toán.');
        return true;
      }
      setSelectedMethod('wallet');
      toast.success('Số dư đã cập nhật. Bạn có thể thanh toán bằng ví.');
      return true;
    }
    toast.info('Ví chưa đủ số dư. Nếu vừa nạp tiền, vui lòng chờ xác nhận rồi cập nhật lại.');
    return false;
  };

  const handlePayWallet = async () => {
    if (isExpired || hasBookingExpired(booking)) {
      setIsExpired(true);
      toast.error('Đơn giữ chỗ đã hết hạn. Vui lòng tạo lại đơn hàng mới.');
      return;
    }
    if (!hasEnoughWalletBalance) {
      toast.error('Số dư Ví Học Viên không đủ để thanh toán toàn bộ khóa học.');
      return;
    }
    try {
      setLoading(true);
      setPaymentError(null);
      await studentWalletService.payBookingFromWallet(booking.id);
      toast.success('Thanh toán thành công từ Ví Học Viên! Hợp đồng đã được kích hoạt.');
      navigate('/student/dashboard');
    } catch (err) {
      setPaymentError(err?.message || 'Không thể thanh toán từ Ví Học Viên.');
    } finally {
      setLoading(false);
    }
  };

  const handlePayVNPay = async () => {
    if (isExpired || hasBookingExpired(booking)) {
      setIsExpired(true);
      toast.error('Đơn giữ chỗ đã hết hạn. Vui lòng tạo lại đơn hàng mới.');
      return;
    }
    try {
      setLoading(true);
      setPaymentError(null);
      const redirect = await paymentService.createVnPayUrl(booking.id);

      if (redirect?.paymentUrl) {
        window.location.href = redirect.paymentUrl;
        return;
      }

      setPaymentError('Chưa thể mở trang thanh toán VNPAY. Vui lòng thử lại.');
    } catch (err) {
      setPaymentError(err?.message || 'Không tạo được đường dẫn thanh toán VNPay.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">
      {/* Checkout Progress Stepper */}
      <div className="flex items-center justify-between px-2 sm:px-6 py-3 rounded-brand-lg bg-surface border border-border text-caption">
        <div className="flex items-center gap-2 text-success-strong font-semibold">
          <span className="w-6 h-6 rounded-full bg-success-subtle text-success-strong flex items-center justify-center">
            <Icon name="check" size="xs" />
          </span>
          <span className="hidden sm:inline">1. Chọn gói học</span>
        </div>
        <div className="w-8 sm:w-16 h-0.5 bg-brand-primary-200" />
        <div className="flex items-center gap-2 text-brand-primary-700 font-bold">
          <span className="w-6 h-6 rounded-full bg-brand-primary-600 text-white flex items-center justify-center text-[11px] font-bold">
            2
          </span>
          <span>Khóa giữ chỗ & Thanh toán</span>
        </div>
        <div className="w-8 sm:w-16 h-0.5 bg-neutral-200" />
        <div className="flex items-center gap-2 text-fg-muted font-medium">
          <span className="w-6 h-6 rounded-full bg-neutral-100 text-fg-muted flex items-center justify-center text-[11px] font-bold">
            3
          </span>
          <span className="hidden sm:inline">Kích hoạt hợp đồng</span>
        </div>
      </div>

      {/* 15-Minute Countdown Timer */}
      <CountdownTimer
        expiresAt={booking.holdingExpiresAt}
        expired={isExpired}
        onExpire={() => setIsExpired(true)}
        onReorderPath={servicePath}
      />

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] gap-6 items-start">
        {/* Left Column: Order Summary & Escrow Guarantee */}
        <div className="contents lg:block lg:min-w-0 lg:space-y-5">
          <Card padding="lg" className="order-1 space-y-4 border border-border shadow-brand-sm p-4 sm:p-6 lg:order-none">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border">
              <CardHeader
                title="Chi tiết đơn đặt giữ chỗ"
                className="mb-0 [&_h3]:whitespace-normal"
                icon={<Icon name="shopping_bag" size="sm" className="text-brand-primary-600" />}
              />
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-fg-muted">Mã đơn:</span>
                <span className="font-mono text-[11px] font-bold text-brand-primary-700 bg-brand-primary-50 px-2 py-0.5 rounded border border-brand-primary-200">
                  #{String(booking.id).slice(0, 8)}
                </span>
              </div>
            </div>

            <div className="space-y-3 p-4 rounded-brand-md bg-neutral-50/80 border border-border">
              <h1 className="text-headline-2 font-bold leading-snug text-fg">
                {booking.serviceId ? (
                  <Link
                    to={servicePath}
                    className="hover:text-brand-primary-700 hover:underline underline-offset-4"
                  >
                    {serviceTitle}
                  </Link>
                ) : serviceTitle}
              </h1>
              <div className="flex min-w-0 items-center gap-2.5 text-body-reg text-fg-secondary">
                <Avatar src={booking.tutorAvatarUrl || service?.tutor?.avatarUrl || service?.tutorAvatarUrl} name={booking.tutorName} size="md" />
                <span>Gia sư: <span className="font-medium text-fg">{booking.tutorName || 'Gia sư chuyên môn'}</span></span>
              </div>
            </div>

            {/* Financial breakdown */}
            <dl className="p-4 rounded-brand-md bg-neutral-50 border border-border space-y-2.5 text-caption text-fg-secondary">
              <div className="flex flex-wrap justify-between items-center gap-x-3 gap-y-1">
                <dt>Số buổi học được phân bổ:</dt>
                <dd className="font-bold text-fg">
                  {totalSessions} buổi ({booking.sessionDurationMinutes || 60} phút/buổi)
                </dd>
              </div>
              <div className="flex flex-wrap justify-between items-center gap-x-3 gap-y-1">
                <dt>Đơn giá từng buổi học:</dt>
                <dd className="font-bold text-brand-primary-700 tabular-nums">
                  <Money value={pricePerSession} /> / buổi
                </dd>
              </div>
              <div className="flex flex-wrap justify-between items-center gap-x-3 gap-y-1 text-[11px] text-success-strong">
                <dt className="flex items-center gap-1">
                  <Icon name="check" size="xs" />
                  <span>Phí dịch vụ bảo chứng nền tảng:</span>
                </dt>
                <dd className="font-bold">0 ₫ (Miễn phí cho học viên)</dd>
              </div>
              <div className="flex flex-wrap justify-between items-baseline gap-x-3 gap-y-1 pt-3 border-t border-border text-body-reg font-bold text-fg">
                <dt className="text-body-reg font-bold">Tổng thanh toán gói học:</dt>
                <dd className="text-headline-1 text-success-strong font-bold">
                  <Money value={totalPrice} className="whitespace-nowrap" />
                </dd>
              </div>
            </dl>
          </Card>

          {/* High-Trust Escrow Certificate */}
          <div className="order-3 p-4 rounded-brand-lg bg-success-subtle/80 border border-success-subtle/90 text-caption space-y-2 shadow-brand-sm lg:order-none">
            <div className="flex items-center gap-2 text-success-strong font-bold text-body-reg">
              <Icon name="shield" size="sm" filled className="text-success-strong shrink-0" />
              <span>Chứng thư ký quỹ bảo chứng Escrow 100%</span>
            </div>
            <p className="text-success-strong leading-relaxed text-[12px]">
              Số tiền <strong>{formatCurrency(totalPrice)}</strong> của bạn được bảo đảm an toàn 100% trong két ký quỹ trung lập của TutorHub. Tiền chỉ được giải ngân sau mỗi buổi học thành công và qua thời gian bảo lưu 12 giờ nếu không có khiếu nại phát sinh.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-success-strong font-medium">
              <span className="flex items-center gap-1">
                <Icon name="check_circle" size="xs" className="text-success" />
                Không thanh toán trực tiếp cho gia sư
              </span>
              <span className="flex items-center gap-1">
                <Icon name="check_circle" size="xs" className="text-success" />
                Hoàn tiền 100% khi có khiếu nại hợp lệ
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Payment Gateway Selector & CTA */}
        <div className="order-2 min-w-0 space-y-5 lg:order-none">
          <Card padding="lg" className="space-y-5 border border-border shadow-brand-sm p-4 sm:p-6">
            <CardHeader
              title="Cổng thanh toán"
              icon={<Icon name="credit_card" size="sm" className="text-brand-primary-600" />}
            />

            {paymentError && <Callout variant="danger">{paymentError}</Callout>}

            <fieldset className="min-w-0 space-y-3">
              <legend className="sr-only">Phương thức thanh toán</legend>
              <div className={cn(
                'rounded-brand-md border-2 p-3.5 transition-colors',
                selectedMethod === 'wallet' ? 'border-success-strong bg-success-subtle/40' : 'border-border'
              )}>
                <label className="flex cursor-pointer items-start gap-3" htmlFor="checkout-wallet">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-brand-md bg-success-strong text-white">
                    <Icon name="account_balance_wallet" size="sm" />
                  </span>
                  <span className="min-w-0 flex-1 space-y-1">
                    <span className="block text-body-reg font-bold text-fg">Ví Học Viên</span>
                    <span className="block text-caption text-fg-secondary">
                      {loadingWallet ? 'Đang tải số dư…' : wallet ? <>Số dư: <Money value={wallet.availableBalance} className="whitespace-nowrap font-semibold" /></> : 'Chưa tải được số dư ví'}
                    </span>
                    {wallet && hasEnoughWalletBalance && <span className="block text-caption text-fg-muted">Thanh toán toàn bộ gói học bằng ví.</span>}
                  </span>
                  <input
                    id="checkout-wallet"
                    type="radio"
                    name="checkout-payment"
                    value="wallet"
                    checked={selectedMethod === 'wallet'}
                    onChange={() => setSelectedMethod('wallet')}
                    disabled={paymentDisabled || loading || loadingWallet || !wallet}
                    className="mt-1 h-5 w-5 shrink-0 accent-success-strong"
                  />
                </label>
                {wallet && !hasEnoughWalletBalance && (
                  <button
                    type="button"
                    disabled={paymentDisabled || loading || loadingWallet}
                    onClick={() => setTopUpOpen(true)}
                    className="ml-[52px] inline-flex min-h-11 flex-wrap items-center gap-1 text-left text-caption font-semibold text-brand-primary-700 underline underline-offset-4 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Nạp thêm <Money value={shortfall} className="whitespace-nowrap" /> <Icon name="arrow_forward" size="xs" />
                  </button>
                )}
                {!wallet && !loadingWallet && (
                  <button type="button" onClick={loadWallet} className="ml-[52px] min-h-11 text-caption font-semibold text-brand-primary-700 underline">Thử tải lại số dư</button>
                )}
              </div>

              <label htmlFor="checkout-vnpay" className={cn(
                'flex cursor-pointer items-start gap-3 rounded-brand-md border-2 p-3.5 transition-colors',
                selectedMethod === 'vnpay' ? 'border-brand-primary-600 bg-brand-primary-50/40' : 'border-border'
              )}>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-brand-md bg-brand-primary-600 text-[9px] font-extrabold text-white">VNPAY</span>
                <span className="min-w-0 flex-1 space-y-1">
                  <span className="block text-body-reg font-bold text-fg">VNPAY</span>
                  <span className="block text-caption leading-relaxed text-fg-muted">ATM nội địa, VNPAY-QR, Visa/Mastercard</span>
                </span>
                <input
                  id="checkout-vnpay"
                  type="radio"
                  name="checkout-payment"
                  value="vnpay"
                  checked={selectedMethod === 'vnpay'}
                  onChange={() => setSelectedMethod('vnpay')}
                  disabled={paymentDisabled || loading}
                  className="mt-1 h-5 w-5 shrink-0 accent-brand-primary-600"
                />
              </label>
            </fieldset>

            {selectedMethod === 'wallet' ? (
              hasEnoughWalletBalance ? (
                <Button
                  variant="success"
                  size="lg"
                  fullWidth
                  loading={loading}
                  disabled={paymentDisabled || loadingWallet}
                  onClick={handlePayWallet}
                  className="whitespace-nowrap px-3 text-[14px]"
                  icon={!loading && <Icon name="flash_on" size="sm" />}
                >
                  {paymentDisabled
                    ? 'Đơn giữ chỗ đã hết hạn'
                    : <>Thanh toán <Money value={totalPrice} className="whitespace-nowrap" /></>}
                </Button>
              ) : (
                <div className="space-y-2">
                  <Button
                    onClick={() => setTopUpOpen(true)}
                    disabled={paymentDisabled || loadingWallet || !wallet}
                    variant="primary"
                    size="lg"
                    fullWidth
                    icon={<Icon name="add_circle" size="sm" />}
                    className="whitespace-nowrap px-3 text-[14px]"
                  >
                    {paymentDisabled ? 'Đơn giữ chỗ đã hết hạn' : <>Nạp thêm <Money value={shortfall} className="whitespace-nowrap" /></>}
                  </Button>
                  <p className="text-[11px] text-holding-strong text-center">
                    Sau khi nạp xong, vui lòng <button type="button" onClick={loadWallet} disabled={loadingWallet} className="underline font-bold text-brand-primary-700">{loadingWallet ? 'đang làm mới...' : 'bấm vào đây để làm mới số dư'}</button>.
                  </p>
                </div>
              )
            ) : (
              <Button
                variant="primary"
                size="lg"
                fullWidth
                loading={loading}
                disabled={paymentDisabled}
                onClick={handlePayVNPay}
                className="whitespace-nowrap px-3 text-[14px]"
                icon={!loading && <Icon name="lock" size="sm" />}
              >
                {paymentDisabled
                  ? 'Đơn giữ chỗ đã hết hạn'
                  : <>Thanh toán <Money value={totalPrice} className="whitespace-nowrap" /></>}
              </Button>
            )}

            <div className="space-y-1.5 text-center text-[11px] text-fg-muted pt-1">
              <p className="flex items-center justify-center gap-1">
                <Icon name="lock" size="xs" className="text-success-strong" />
                <span>Bảo mật SSL 256-bit chuẩn quốc tế PCI-DSS</span>
              </p>
              <p>Hợp đồng và các buổi học sẽ được kích hoạt ngay sau thanh toán</p>
            </div>
          </Card>

          <div className="text-center">
            <Link
              to={servicePath}
              className="text-caption text-fg-muted hover:text-brand-primary-700 font-semibold inline-flex items-center gap-1 transition-colors"
            >
              <Icon name="arrow_back" size="xs" />
              Chọn gia sư hoặc khóa học khác
            </Link>
          </div>
        </div>
      </div>
      <CheckoutTopUpDialog
        open={topUpOpen}
        onClose={() => setTopUpOpen(false)}
        shortfall={shortfall}
        expired={paymentDisabled}
        onRefresh={refreshTopUpBalance}
      />
    </div>
  );
}
