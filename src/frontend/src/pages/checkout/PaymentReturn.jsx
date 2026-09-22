import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import paymentService from '@/services/payment.service';
import Money from '@/components/ui/Money';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Callout from '@/components/ui/Callout';
import Icon from '@/components/ui/Icon';
import { Spinner } from '@/components/ui/StatCard';

/**
 * Màn hình tiếp nhận kết quả VNPay — READ-ONLY.
 * Mọi mutation tài chính nằm trong IPN webhook + DB transaction ở backend.
 * Trang này chỉ đọc kết quả đã được server xác nhận qua `processPaymentReturn`.
 */
export default function PaymentReturn() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [verifying, setVerifying] = useState(true);
  const [result, setResult] = useState(null);
  const [countdown, setCountdown] = useState(5);

  const hasParams = [...searchParams.keys()].length > 0;

  useEffect(() => {
    let isMounted = true;

    async function verifyPayment() {
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
            message: err?.message || 'Không thể đối soát giao dịch với máy chủ.',
            bookingId: searchParams.get('vnp_TxnRef'),
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
  }, [hasParams, searchParams]);

  const isTopUp = Boolean(result?.merchantReference?.startsWith('TOPUP'));

  useEffect(() => {
    if (result?.success) {
      const timer = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            clearInterval(timer);
            navigate(isTopUp ? '/student/wallet' : '/student/dashboard');
            return 0;
          }
          return c - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [result?.success, isTopUp, navigate]);

  if (verifying) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <Card padding="lg" className="w-full max-w-xl text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center bg-brand-primary-50 text-brand-primary-600">
            <Spinner size="lg" label="Đang đối soát kết quả với VNPay" />
          </div>
          <h2 className="text-headline-2 text-fg">Đang đối soát kết quả với VNPay...</h2>
          <p className="text-caption text-fg-muted">
            Vui lòng chờ trong giây lát, hệ thống đang kiểm tra chữ ký số và cập nhật hợp đồng
            học tập.
          </p>
        </Card>
      </div>
    );
  }

  const isSuccess = Boolean(result?.success);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card padding="lg" className="w-full max-w-xl text-center space-y-5">
        <div
          className={
            isSuccess
              ? 'w-20 h-20 mx-auto rounded-full flex items-center justify-center bg-success-subtle text-success border-4 border-success/10'
              : 'w-20 h-20 mx-auto rounded-full flex items-center justify-center bg-danger-subtle text-danger border-4 border-danger/10'
          }
          role="img"
          aria-label={isSuccess ? 'Thanh toán thành công' : 'Thanh toán thất bại'}
        >
          <Icon name={isSuccess ? 'check_circle' : 'cancel'} size="xl" filled />
        </div>

        <div className="space-y-1">
          <h1 className="text-headline-1 text-fg">
            {isSuccess
              ? (isTopUp ? 'Nạp tiền vào ví thành công!' : 'Thanh toán ký quỹ thành công!')
              : 'Thanh toán không thành công'}
          </h1>
          <p className="text-caption text-fg-muted">
            {result?.message ||
              (isSuccess
                ? (isTopUp
                    ? 'Số dư khả dụng trong Ví Học Viên của bạn đã được cộng tiền thành công.'
                    : 'Hợp đồng học tập đã được kích hoạt & học phí đã được bảo toàn trong ví Escrow.')
                : 'Giao dịch bị từ chối hoặc đã hủy. Tiền chưa được khấu trừ khỏi tài khoản của bạn.')}
          </p>
        </div>

        <dl className="p-5 rounded-brand-md bg-neutral-50 border border-border space-y-3 text-left text-caption">
          <div className="flex justify-between pb-2 border-b border-border">
            <dt className="text-fg-muted">Cổng thanh toán:</dt>
            <dd className="font-semibold text-fg">VNPay Sandbox 2.1.0</dd>
          </div>
          {result?.transactionNo && (
            <div className="flex justify-between pb-2 border-b border-border">
              <dt className="text-fg-muted">Mã giao dịch VNPay:</dt>
              <dd className="font-mono font-bold text-fg">{result.transactionNo}</dd>
            </div>
          )}
          {result?.merchantReference && (
            <div className="flex justify-between pb-2 border-b border-border">
              <dt className="text-fg-muted">{isTopUp ? 'Mã yêu cầu nạp:' : 'Mã đơn đặt chỗ:'}</dt>
              <dd className="font-mono font-bold text-brand-primary-700">
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
              title={isTopUp ? 'Tiền đã được cộng vào Ví Học Viên' : 'Hệ thống Escrow đã tiếp nhận học phí'}
              icon={<Icon name="verified_user" size="md" filled />}
            >
              {isTopUp ? (
                <ul className="list-disc list-inside space-y-1 pl-1">
                  <li>Số dư khả dụng đã được cập nhật theo thời gian thực.</li>
                  <li>Bạn có thể sử dụng ngay để đăng ký bất kỳ khóa học nào.</li>
                  <li>Lịch sử nạp tiền và sổ cái biến động đã được lưu trữ bất biến.</li>
                </ul>
              ) : (
                <ul className="list-disc list-inside space-y-1 pl-1">
                  <li>Hợp đồng học tập đã chính thức có hiệu lực.</li>
                  <li>Tự động phân rã các buổi học con tương ứng.</li>
                  <li>
                    Học phí chỉ giải ngân từng buổi sau khi học viên và gia sư đối soát điểm danh 2
                    chiều.
                  </li>
                </ul>
              )}
            </Callout>

            <p className="text-caption text-fg-muted">
              Đang tự động chuyển hướng đến {isTopUp ? 'Ví học viên' : 'Bàn học'} sau{' '}
              <span className="font-bold text-brand-primary-700 font-mono">{countdown}</span>{' '}
              giây...
            </p>
          </>
        ) : (
          <Callout variant="holding" title="Lưu ý an toàn">
            Nếu bạn đã bị trừ tiền trong tài khoản ngân hàng nhưng màn hình thông báo thất bại,
            vui lòng giữ lại mã tham chiếu và liên hệ ban hỗ trợ TutorHub để đối soát.
          </Callout>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          {isSuccess ? (
            <>
              <Button
                as={Link}
                to={isTopUp ? '/student/wallet' : '/student/dashboard'}
                variant="primary"
                size="lg"
                className="flex-1"
                icon={<Icon name={isTopUp ? 'account_balance_wallet' : 'space_dashboard'} size="sm" />}
              >
                {isTopUp ? 'Xem ví học viên của tôi' : 'Vào bàn học của tôi'}
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => window.print()}
                icon={<Icon name="receipt" size="sm" />}
              >
                In biên lai
              </Button>
            </>
          ) : (
            <>
              <Button
                as={Link}
                to="/tutors"
                variant="primary"
                size="lg"
                className="flex-1"
                icon={<Icon name="arrow_back" size="sm" />}
              >
                Khám phá gia sư khác
              </Button>
              {result?.bookingId && result?.bookingId !== '00000000-0000-0000-0000-000000000000' && (
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
