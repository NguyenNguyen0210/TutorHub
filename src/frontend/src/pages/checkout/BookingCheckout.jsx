import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { cn } from '@/lib/cn';
import paymentService from '@/services/payment.service';
import studentWalletService from '@/services/studentWallet.service';
import bookingService from '@/services/booking.service';
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
import Badge from '@/components/ui/Badge';

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
  const [simulating, setSimulating] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [isExpired, setIsExpired] = useState(false);

  const isDev = import.meta.env.DEV || import.meta.env.VITE_DEV_PAYMENT_SIMULATOR === 'true';

  const loadWallet = useCallback(async () => {
    try {
      setLoadingWallet(true);
      const w = await studentWalletService.getMyWallet();
      setWallet(w);
    } catch {
      // Not a student or wallet fetch failed
    } finally {
      setLoadingWallet(false);
    }
  }, []);

  useEffect(() => {
    loadWallet();
  }, [loadWallet]);

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

  const handlePayWallet = async () => {
    if (isExpired) {
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
    if (isExpired) {
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

      setPaymentError('Cổng thanh toán VNPay không trả về đường dẫn thanh toán. Vui lòng thử lại.');
    } catch (err) {
      setPaymentError(err?.message || 'Không tạo được đường dẫn thanh toán VNPay.');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulatePayment = async (success = true) => {
    try {
      setSimulating(true);
      setPaymentError(null);
      try {
        await paymentService.createVnPayUrl(booking.id);
      } catch {
        // Tiếp tục gọi simulator
      }

      const result = await paymentService.simulateIpn(booking.id, success);
      if (result?.success || result?.ackCode === '00') {
        toast.success('Giả lập thanh toán thành công! Hợp đồng học tập đã được kích hoạt.');
        navigate('/student/dashboard');
      } else {
        toast.warning(`Giả lập kết thúc với mã ${result?.ackCode || 'thất bại'}.`);
      }
    } catch (err) {
      toast.error(err?.message || 'Không thể gọi dev payment simulator.');
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Checkout Progress Stepper */}
      <div className="flex items-center justify-between px-2 sm:px-6 py-3 rounded-brand-lg bg-surface border border-border text-caption">
        <div className="flex items-center gap-2 text-emerald-700 font-semibold">
          <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
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
        onExpire={() => setIsExpired(true)}
        onReorderPath="/"
      />

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Order Summary & Escrow Guarantee */}
        <div className="lg:col-span-2 space-y-5">
          <Card padding="lg" className="space-y-4 border border-border shadow-brand-sm">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <CardHeader
                title="Chi tiết đơn đặt giữ chỗ"
                icon={<Icon name="shopping_bag" size="sm" className="text-brand-primary-600" />}
              />
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-fg-muted">Mã đơn:</span>
                <span className="font-mono text-[11px] font-bold text-brand-primary-700 bg-brand-primary-50 px-2 py-0.5 rounded border border-brand-primary-200">
                  #{String(booking.id).slice(0, 8)}
                </span>
              </div>
            </div>

            {/* Tutor identity block */}
            <div className="flex items-center gap-4 p-3.5 rounded-brand-md bg-neutral-50/80 border border-border">
              <Avatar name={booking.tutorName} size="lg" className="rounded-brand-md shrink-0 shadow-brand-sm" />
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-headline-3 text-fg font-bold truncate m-0">
                    {booking.tutorName || 'Gia sư chuyên môn'}
                  </h2>
                  <Badge variant="success" size="sm">Giữ chỗ 15p</Badge>
                </div>
                {booking.serviceId ? (
                  <Link
                    to={`/services/${booking.serviceId}`}
                    target="_blank"
                    className="text-caption text-brand-primary-700 hover:text-brand-primary-800 hover:underline font-semibold m-0 truncate inline-flex items-center gap-1"
                  >
                    <span>{booking.subjectName || 'Khóa học'}</span>
                    <Icon name="open_in_new" size="xs" />
                  </Link>
                ) : (
                  <p className="text-caption text-brand-primary-700 font-semibold m-0 truncate">
                    {booking.subjectName || 'Khóa học'}
                  </p>
                )}
              </div>
            </div>

            {/* Financial breakdown */}
            <dl className="p-4 rounded-brand-md bg-neutral-50 border border-border space-y-2.5 text-caption text-fg-secondary">
              <div className="flex justify-between items-center">
                <dt>Số buổi học được phân bổ:</dt>
                <dd className="font-bold text-fg">
                  {totalSessions} buổi ({booking.sessionDurationMinutes || 60} phút/buổi)
                </dd>
              </div>
              <div className="flex justify-between items-center">
                <dt>Hình thức giảng dạy:</dt>
                <dd className="font-bold text-fg">{booking.teachingMode || 'Online'}</dd>
              </div>
              <div className="flex justify-between items-center">
                <dt>Đơn giá từng buổi học:</dt>
                <dd className="font-bold text-brand-primary-700 tabular-nums">
                  <Money value={pricePerSession} /> / buổi
                </dd>
              </div>
              <div className="flex justify-between items-center text-[11px] text-emerald-700">
                <dt className="flex items-center gap-1">
                  <Icon name="check" size="xs" />
                  <span>Phí dịch vụ bảo chứng nền tảng:</span>
                </dt>
                <dd className="font-bold">0 ₫ (Miễn phí cho học viên)</dd>
              </div>
              <div className="flex justify-between items-baseline pt-3 border-t border-border text-body-reg font-bold text-fg">
                <dt className="text-body-reg font-bold">Tổng thanh toán gói học:</dt>
                <dd className="text-headline-1 text-success-strong font-bold">
                  <Money value={totalPrice} />
                </dd>
              </div>
            </dl>
          </Card>

          {/* High-Trust Escrow Certificate */}
          <div className="p-4 rounded-brand-lg bg-emerald-50/80 border border-emerald-200/90 text-caption space-y-2 shadow-brand-sm">
            <div className="flex items-center gap-2 text-emerald-900 font-bold text-body-reg">
              <Icon name="shield" size="sm" filled className="text-emerald-600 shrink-0" />
              <span>Chứng thư ký quỹ bảo chứng Escrow 100%</span>
            </div>
            <p className="text-emerald-800 leading-relaxed text-[12px]">
              Số tiền <strong>{formatCurrency(totalPrice)}</strong> của bạn được bảo đảm an toàn 100% trong két ký quỹ trung lập của TutorHub. Tiền chỉ được giải ngân từng buổi sau khi học viên và gia sư hoàn tất đối soát xác nhận điểm danh 2 chiều.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-emerald-700 font-medium">
              <span className="flex items-center gap-1">
                <Icon name="check_circle" size="xs" className="text-emerald-500" />
                Không thanh toán trực tiếp cho gia sư
              </span>
              <span className="flex items-center gap-1">
                <Icon name="check_circle" size="xs" className="text-emerald-500" />
                Hoàn tiền 100% khi có khiếu nại hợp lệ
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Payment Gateway Selector & CTA */}
        <div className="space-y-5">
          <Card padding="lg" className="space-y-5 border border-border shadow-brand-sm">
            <CardHeader
              title="Cổng thanh toán"
              icon={<Icon name="credit_card" size="sm" className="text-brand-primary-600" />}
            />

            {paymentError && <Callout variant="danger">{paymentError}</Callout>}

            <div className="space-y-3" role="radiogroup" aria-label="Phương thức thanh toán">
              {/* Option 1: Student Wallet (100% wallet payment) */}
              <button
                type="button"
                role="radio"
                aria-checked={selectedMethod === 'wallet'}
                onClick={() => setSelectedMethod('wallet')}
                className={cn(
                  'w-full p-3.5 rounded-brand-md border-2 transition-all flex items-center justify-between text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 cursor-pointer',
                  selectedMethod === 'wallet'
                    ? 'border-emerald-600 bg-emerald-50/40 shadow-brand-sm'
                    : 'border-border hover:border-neutral-300'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-brand-md bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-brand-sm">
                    <Icon name="account_balance_wallet" size="sm" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-caption sm:text-body-reg text-fg">
                        Ví Học Viên
                      </span>
                      <span className={cn(
                        "text-[11px] font-bold font-mono px-1.5 py-0.5 rounded",
                        hasEnoughWalletBalance
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      )}>
                        Số dư: {formatCurrency(wallet?.availableBalance || 0)}
                      </span>
                    </div>
                    <span className="text-[10px] text-fg-muted block mt-0.5">
                      {hasEnoughWalletBalance
                        ? 'Thanh toán 1-Click tức thì, tiền chuyển thẳng vào Escrow'
                        : `Còn thiếu ${formatCurrency(totalPrice - (wallet?.availableBalance || 0))} — Nạp thêm để thanh toán`}
                    </span>
                  </div>
                </div>
                <div className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
                  selectedMethod === 'wallet' ? "border-emerald-600" : "border-neutral-300"
                )}>
                  {selectedMethod === 'wallet' && <div className="w-2.5 h-2.5 rounded-full bg-emerald-600" />}
                </div>
              </button>

              {/* Option 2: VNPay */}
              <button
                type="button"
                role="radio"
                aria-checked={selectedMethod === 'vnpay'}
                onClick={() => setSelectedMethod('vnpay')}
                className={cn(
                  'w-full p-3.5 rounded-brand-md border-2 transition-all flex items-center justify-between text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary-600 cursor-pointer',
                  selectedMethod === 'vnpay'
                    ? 'border-brand-primary-600 bg-brand-primary-50/40 shadow-brand-sm'
                    : 'border-border hover:border-neutral-300'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-brand-md bg-gradient-to-br from-blue-600 to-red-600 text-white font-extrabold text-[9px] flex items-center justify-center tracking-tight shrink-0 shadow-brand-sm">
                    VNPAY
                  </div>
                  <div>
                    <span className="font-bold text-caption sm:text-body-reg text-fg block">
                      Cổng VNPay 2.1.0
                    </span>
                    <span className="text-[10px] text-fg-muted block">
                      ATM nội địa, VNPAY-QR, Visa/Mastercard
                    </span>
                  </div>
                </div>
                <div className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
                  selectedMethod === 'vnpay' ? "border-brand-primary-600" : "border-neutral-300"
                )}>
                  {selectedMethod === 'vnpay' && <div className="w-2.5 h-2.5 rounded-full bg-brand-primary-600" />}
                </div>
              </button>
            </div>

            {selectedMethod === 'wallet' ? (
              hasEnoughWalletBalance ? (
                <Button
                  variant="success"
                  size="lg"
                  fullWidth
                  loading={loading}
                  disabled={isExpired}
                  onClick={handlePayWallet}
                  icon={!loading && <Icon name="flash_on" size="sm" />}
                >
                  {isExpired
                    ? 'Đơn giữ chỗ đã hết hạn'
                    : `Thanh toán bằng Ví: ${formatCurrency(totalPrice)}`}
                </Button>
              ) : (
                <div className="space-y-2">
                  <Button
                    as={Link}
                    to="/student/wallet"
                    target="_blank"
                    variant="primary"
                    size="lg"
                    fullWidth
                    icon={<Icon name="add_circle" size="sm" />}
                  >
                    Nạp thêm tiền vào Ví Học Viên
                  </Button>
                  <p className="text-[11px] text-amber-800 text-center">
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
                disabled={isExpired || simulating}
                onClick={handlePayVNPay}
                icon={!loading && <Icon name="lock" size="sm" />}
              >
                {isExpired
                  ? 'Đơn giữ chỗ đã hết hạn'
                  : `Thanh toán ${formatCurrency(totalPrice)}`}
              </Button>
            )}

            <div className="space-y-1.5 text-center text-[11px] text-fg-muted pt-1">
              <p className="flex items-center justify-center gap-1">
                <Icon name="lock" size="xs" className="text-emerald-600" />
                <span>Bảo mật SSL 256-bit chuẩn quốc tế PCI-DSS</span>
              </p>
              <p>Hợp đồng và N buổi học sẽ được kích hoạt ngay sau thanh toán</p>
            </div>

            {/* Dev Simulator Panel */}
            {isDev && (
              <div className="pt-4 border-t border-dashed border-holding/40 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-holding-strong flex items-center gap-1">
                    <Icon name="terminal" size="xs" />
                    Dev IPN Simulator
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-holding-subtle text-holding-strong font-mono font-bold">
                    DEV ONLY
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="success"
                    size="sm"
                    disabled={simulating || isExpired || loading}
                    onClick={() => handleSimulatePayment(true)}
                    loading={simulating}
                  >
                    Giả lập thành công
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={simulating || isExpired || loading}
                    onClick={() => handleSimulatePayment(false)}
                  >
                    Giả lập thất bại
                  </Button>
                </div>
              </div>
            )}
          </Card>

          <div className="text-center">
            <Link
              to="/"
              className="text-caption text-fg-muted hover:text-brand-primary-700 font-semibold inline-flex items-center gap-1 transition-colors"
            >
              <Icon name="arrow_back" size="xs" />
              Chọn gia sư hoặc khóa học khác
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
