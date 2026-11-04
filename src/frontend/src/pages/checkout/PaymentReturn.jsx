import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import paymentService from '@/services/payment.service';
import bookingService from '@/services/booking.service';
import tutorService from '@/services/tutor.service';
import { getPaymentReturnMessage } from '@/utils/paymentReturn';
import Money from '@/components/ui/Money';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Callout from '@/components/ui/Callout';
import Icon from '@/components/ui/Icon';
import { Spinner } from '@/components/ui/StatCard';

/**
 * The server verifies and settles the signed VNPAY callback idempotently.
 * Browser query parameters alone never establish payment or enrollment success.
 */
export default function PaymentReturn() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [verifying, setVerifying] = useState(true);
  const [result, setResult] = useState(null);
  const [countdown, setCountdown] = useState(10);
  const [autoRedirectPaused, setAutoRedirectPaused] = useState(false);
  const redirectTimerRef = useRef(null);
  const [booking, setBooking] = useState(null);
  const [service, setService] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [verificationAttempt, setVerificationAttempt] = useState(0);
  const paymentCompleted = result?.success === true && result?.status === 'Completed';
  const isPending = result?.status === 'Pending' || Boolean(result?.success && !result?.status);
  const isRefundPending = result?.status === 'RefundPending';

  const hasParams = [...searchParams.keys()].length > 0;

  useEffect(() => {
    let isMounted = true;

    async function verifyPayment() {
      setVerifying(true);
      setResult(null);
      setAutoRedirectPaused(false);
      if (!hasParams) {
        if (isMounted) {
          setResult({
            success: false,
            message: 'Không tìm thấy thông tin giao dịch trong đường dẫn.',
            bookingId: null,
            merchantReference: null,
            transactionNo: null,
            amount: 0,
          });
          setVerifying(false);
        }
        return;
      }

      try {
        const data = await paymentService.processPaymentReturn(searchParams);
        if (isMounted) {
          setResult(data);
          setVerifying(false);
        }
      } catch (err) {
        if (isMounted) {
          setResult({
            success: false,
            message: err?.message || 'Chưa thể xác nhận kết quả thanh toán. Vui lòng thử lại.',
            bookingId: null,
            merchantReference: searchParams.get('vnp_TxnRef'),
            transactionNo: searchParams.get('vnp_TransactionNo'),
            amount: Number(searchParams.get('vnp_Amount') || '0') / 100,
          });
          setVerifying(false);
        }
      }
    }

    verifyPayment();

    return () => {
      isMounted = false;
    };
  }, [hasParams, searchParams, verificationAttempt]);

  const isTopUp = Boolean(
    result?.merchantReference?.startsWith('TOPUP') ||
    searchParams.get('vnp_TxnRef')?.startsWith('TOPUP')
  );

  useEffect(() => {
    let cancelled = false;
    setBooking(null);
    setService(null);
    const bookingId = result?.bookingId;
    if (!paymentCompleted || isTopUp || !bookingId || bookingId === '00000000-0000-0000-0000-000000000000') {
      setLoadingDetails(false);
      return undefined;
    }
    setLoadingDetails(true);
    (async () => {
      try {
        const detail = await bookingService.getBookingById(bookingId);
        if (cancelled) return;
        setBooking(detail);
        if (detail?.serviceId) {
          const purchasedService = await tutorService.getServiceById(detail.serviceId);
          if (!cancelled) setService(purchasedService);
        }
      } catch {
        // Receipt verification remains valid if extra order details are unavailable.
      } finally {
        if (!cancelled) setLoadingDetails(false);
      }
    })();
    return () => { cancelled = true; };
  }, [paymentCompleted, result?.bookingId, isTopUp]);

  const stopAutoRedirect = useCallback(() => {
    clearInterval(redirectTimerRef.current);
    redirectTimerRef.current = null;
    setAutoRedirectPaused(true);
  }, []);

  useEffect(() => {
    window.addEventListener('beforeprint', stopAutoRedirect);
    return () => window.removeEventListener('beforeprint', stopAutoRedirect);
  }, [stopAutoRedirect]);

  useEffect(() => {
    clearInterval(redirectTimerRef.current);
    if (!paymentCompleted || verifying || loadingDetails || autoRedirectPaused) return undefined;
    let remaining = 10;
    setCountdown(remaining);
    redirectTimerRef.current = setInterval(() => {
      remaining -= 1;
      setCountdown(remaining);
      if (remaining === 0) {
        clearInterval(redirectTimerRef.current);
        redirectTimerRef.current = null;
        navigate(isTopUp ? '/student/wallet' : '/student/dashboard', { replace: true });
      }
    }, 1000);
    return () => clearInterval(redirectTimerRef.current);
  }, [paymentCompleted, verifying, loadingDetails, autoRedirectPaused, isTopUp, navigate]);

  const handlePrint = () => {
    stopAutoRedirect();
    window.print();
  };

  if (verifying) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <Card padding="lg" className="w-full max-w-xl text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center bg-brand-primary-50 text-brand-primary-600">
            <Spinner size="lg" label="Đang xác nhận thanh toán" />
          </div>
          <h2 className="text-headline-2 text-fg">Đang xác nhận thanh toán</h2>
          <p className="text-caption text-fg-muted">
            Vui lòng chờ kết quả giao dịch.
          </p>
        </Card>
      </div>
    );
  }

  const isSuccess = paymentCompleted;
  const bookingConfirmed = booking?.status === 'Paid' || Boolean(booking?.enrollment);
  const totalSessions = booking?.enrollment?.totalSessions || booking?.totalSessions;
  const serviceTitle = service?.title || booking?.serviceTitle || booking?.subjectName;
  const tutorName = booking?.tutorName || service?.tutor?.fullName;

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card padding="lg" className="w-full max-w-xl text-center space-y-5 p-4 sm:p-6">
        <div
          className={
            isSuccess
              ? 'w-20 h-20 mx-auto rounded-full flex items-center justify-center bg-success-strong text-white'
              : isPending || isRefundPending
                ? 'w-20 h-20 mx-auto rounded-full flex items-center justify-center bg-holding-subtle text-holding-strong'
                : 'w-20 h-20 mx-auto rounded-full flex items-center justify-center bg-danger-subtle text-danger border-4 border-danger/10'
          }
          role="img"
          aria-label={isSuccess ? 'Thanh toán thành công' : isPending ? 'Đang chờ xác nhận' : isRefundPending ? 'Đang chờ hoàn tiền' : 'Thanh toán chưa được xác nhận'}
        >
          <Icon name={isSuccess ? 'check' : isPending || isRefundPending ? 'hourglass_top' : 'close'} size="xl" strokeWidth={3} />
        </div>

        <div className="space-y-1">
          <h1 className="text-headline-1 text-fg">
            {isSuccess
              ? (isTopUp ? 'Nạp tiền vào ví thành công!' : "Thanh toán thành công!")
              : isPending ? 'Giao dịch đang chờ xác nhận' : isRefundPending ? 'Khoản thanh toán đang chờ hoàn tiền' : 'Thanh toán chưa được xác nhận'}
          </h1>
          <p className="text-caption text-fg-muted">
            {isSuccess && !isTopUp && bookingConfirmed
              ? 'Thanh toán đã được xác nhận. TutorHub đang giữ học phí cho các buổi học trong gói.'
              : getPaymentReturnMessage(result, isTopUp)}
          </p>
        </div>

        <dl className="p-4 sm:p-5 rounded-brand-md bg-neutral-50 border border-border space-y-3 text-left text-caption">
          {!isTopUp && isSuccess && (
            <>
              <div className="grid grid-cols-[90px_minmax(0,1fr)] gap-3 pb-2 border-b border-border">
                <dt className="text-fg-muted">Gói học:</dt>
                <dd className="min-w-0 font-semibold leading-relaxed text-fg">{serviceTitle || (loadingDetails ? 'Đang tải thông tin…' : 'Chưa tải được tên gói học')}</dd>
              </div>
              <div className="grid grid-cols-[90px_minmax(0,1fr)] gap-3 pb-2 border-b border-border">
                <dt className="text-fg-muted">Gia sư:</dt>
                <dd className="min-w-0 font-semibold text-fg">{tutorName || (loadingDetails ? 'Đang tải thông tin…' : 'Chưa tải được thông tin gia sư')}</dd>
              </div>
            </>
          )}
          <div className="flex flex-wrap justify-between gap-x-3 gap-y-1 pb-2 border-b border-border">
            <dt className="text-fg-muted">Cổng thanh toán:</dt>
            <dd className="font-semibold text-fg">Cổng thanh toán VNPAY</dd>
          </div>
          {result?.transactionNo && (
            <div className="flex flex-wrap justify-between gap-x-3 gap-y-1 pb-2 border-b border-border">
              <dt className="text-fg-muted">Mã giao dịch VNPAY:</dt>
              <dd className="min-w-0 break-all font-mono font-bold text-fg">{result.transactionNo}</dd>
            </div>
          )}
          {result?.merchantReference && (
            <div className="flex flex-wrap justify-between gap-x-3 gap-y-1 pb-2 border-b border-border">
              <dt className="text-fg-muted">{isTopUp ? 'Mã yêu cầu nạp:' : 'Mã đơn đặt chỗ:'}</dt>
              <dd className="min-w-0 break-all font-mono font-bold text-brand-primary-700">
                {result.merchantReference}
              </dd>
            </div>
          )}
          <div className="flex justify-between items-baseline pt-1">
            <dt className="text-fg-muted font-semibold">Số tiền:</dt>
            <dd
              className={
                isSuccess
                  ? 'text-headline-2 text-success-strong font-semibold'
                  : 'text-headline-2 text-fg font-semibold'
              }
            >
              <Money value={result?.amount || 0} />
            </dd>
          </div>
        </dl>

        {isSuccess ? (
          <>
            <Callout
              variant="success"
              title={isTopUp ? "Tiền đã được cộng vào Ví học viên" : bookingConfirmed ? "TutorHub đã tiếp nhận học phí" : 'Thanh toán đang được xác nhận'}
              icon={<Icon name="verified_user" size="md" />}
              className="text-left"
            >
              {isTopUp ? (
                <ul className="mt-2 list-disc list-outside space-y-1.5 pl-4 leading-relaxed">
                  <li>Số tiền nạp đã được cộng vào ví.</li>
                  <li>Bạn có thể sử dụng ngay để đăng ký bất kỳ khóa học nào.</li>
                  <li>Thông tin giao dịch đã được lưu trong lịch sử ví.</li>
                </ul>
              ) : (
                <ul className="mt-2 list-disc list-outside space-y-1.5 pl-4 leading-relaxed">
                  <li>{bookingConfirmed ? 'Hợp đồng học tập đã chính thức có hiệu lực.' : 'Hợp đồng học tập sẽ được kích hoạt khi giao dịch được xác nhận.'}</li>
                  <li>{bookingConfirmed
                    ? totalSessions ? `Lộ trình của bạn gồm ${totalSessions} buổi học.` : 'Bạn có thể xem lộ trình học trong Bàn học.'
                    : totalSessions ? `Lộ trình gồm ${totalSessions} buổi học và sẽ xuất hiện trong Bàn học sau khi thanh toán được xác nhận.` : 'Bạn có thể xem lộ trình trong Bàn học sau khi thanh toán được xác nhận.'}</li>
                  <li>
                    Học phí được giải ngân sau mỗi buổi học thành công và qua 12 giờ để học viên phản hồi.
                  </li>
                </ul>
              )}
            </Callout>

            {!autoRedirectPaused && !loadingDetails && (
              <p className="text-caption text-fg-muted print:hidden">
                Chuyển đến {isTopUp ? 'Ví học viên' : 'Bàn học'} sau{' '}
                <span className="font-bold text-brand-primary-700 font-mono">{countdown}</span>{' '}giây…
              </p>
            )}
          </>
        ) : (
          <Callout variant="warning" title={isPending ? 'Chưa kích hoạt khóa học' : isRefundPending ? 'Thông tin hoàn tiền' : 'Lưu ý an toàn'} className="text-left">
            {isPending ? 'Khóa học sẽ xuất hiện trong Bàn học sau khi giao dịch được xác nhận. Bạn có thể kiểm tra lại kết quả bên dưới.'
              : isRefundPending ? 'Khoản thanh toán đã được ghi nhận nhưng đơn học đã bị hủy. Vui lòng giữ mã giao dịch để theo dõi việc hoàn tiền.'
              : 'Nếu tài khoản ngân hàng đã bị trừ tiền, vui lòng giữ mã giao dịch và liên hệ hỗ trợ để kiểm tra.'}
          </Callout>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-1 print:hidden">
          {isSuccess ? (
            <>
              <Button
                as={Link}
                to={isTopUp ? '/student/wallet' : '/student/dashboard'}
                variant="primary"
                size="lg"
                className="sm:flex-1"
                icon={<Icon name={isTopUp ? 'account_balance_wallet' : 'space_dashboard'} size="sm" />}
              >
                {isTopUp ? 'Xem ví học viên của tôi' : 'Vào bàn học của tôi'}
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={handlePrint}
                icon={<Icon name="receipt" size="sm" />}
              >
                In biên lai
              </Button>
            </>
          ) : (
            <>
              {isPending && (
                <Button variant="primary" size="lg" onClick={() => setVerificationAttempt((attempt) => attempt + 1)} icon={<Icon name="refresh" size="sm" />}>
                  Kiểm tra lại giao dịch
                </Button>
              )}
              <Button
                as={Link}
                to={isTopUp ? '/student/wallet' : '/tutors'}
                variant={isPending ? 'outline' : 'primary'}
                size="lg"
                className="sm:flex-1"
                icon={<Icon name={isTopUp ? 'account_balance_wallet' : 'arrow_back'} size="sm" />}
              >
                {isTopUp ? "Quay lại Ví học viên" : 'Khám phá gia sư khác'}
              </Button>
              {!isPending && !isRefundPending && result?.bookingId && result?.bookingId !== '00000000-0000-0000-0000-000000000000' && (
                <Button
                  as={Link}
                  to={`/student/bookings/${result.bookingId}/checkout`}
                  variant="outline"
                  size="lg"
                  icon={<Icon name="refresh" size="sm" />}
                >
                  Thử thanh toán lại
                </Button>
              )}
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
