import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import paymentService from '@/services/payment.service';
import bookingService from '@/services/booking.service';
import CountdownTimer from '@/components/feedback/CountdownTimer';
import { formatCurrency } from '@/utils/formatters';
import { message } from 'antd';
import { DetailSkeleton } from '@/components/common/Skeleton';
import ErrorState from '@/components/common/ErrorState';

export default function BookingCheckout() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loadingBooking, setLoadingBooking] = useState(true);
  const [bookingError, setBookingError] = useState(null);

  const [selectedMethod, setSelectedMethod] = useState('vnpay');
  const [loading, setLoading] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [isExpired, setIsExpired] = useState(false);

  const isDev = import.meta.env.DEV || import.meta.env.VITE_DEV_PAYMENT_SIMULATOR === 'true';

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
            message.info('Đơn hàng này đã được thanh toán.');
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
  }, [id, navigate]);

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
          backPath="/tutors"
          backLabel="Quay lại danh sách gia sư"
        />
      </div>
    );
  }

  const totalPrice = Number(booking.totalPrice || 0);
  const totalSessions = Number(booking.totalSessions || 1);
  const pricePerSession = totalSessions > 0 ? Math.round(totalPrice / totalSessions) : totalPrice;

  const handlePayVNPay = async () => {
    if (isExpired) {
      message.error('Đơn giữ chỗ đã hết hạn. Vui lòng tạo lại đơn hàng mới.');
      return;
    }
    try {
      setLoading(true);
      setPaymentError(null);
      // POST /payments/vnpay/create-url { bookingId } → PaymentRedirectDto
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
      // Đảm bảo gateway attempt đã tồn tại
      try {
        await paymentService.createVnPayUrl(booking.id);
      } catch {
        // Tiếp tục gọi simulator
      }

      const result = await paymentService.simulateIpn(booking.id, success);
      if (result?.success || result?.ackCode === '00') {
        message.success('Giả lập thanh toán thành công! Hợp đồng học tập đã được kích hoạt.');
        navigate('/student/dashboard');
      } else {
        message.warning(`Giả lập kết thúc với mã ${result?.ackCode || 'thất bại'}.`);
      }
    } catch (err) {
      message.error(err?.message || 'Không thể gọi dev payment simulator.');
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* 15-Minute Countdown Timer */}
      <CountdownTimer
        expiresAt={booking.holdingExpiresAt}
        onExpire={() => setIsExpired(true)}
        onReorderPath="/tutors"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Order Info & Escrow Certificate */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Details Card */}
          <div className="p-6 sm:p-8 rounded-3xl glass-panel-premium space-y-5 bg-white border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
              <span className="font-extrabold text-sm text-slate-900">Chi Tiết Đơn Giữ Chỗ</span>
              <span className="font-monospace-num text-xs font-extrabold text-brand-indigo-600 truncate max-w-[200px]">
                #{booking.id}
              </span>
            </div>

            {/* Tutor Snapshot */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-brand-indigo-50 border-2 border-brand-indigo-100 flex items-center justify-center text-brand-indigo-700 font-extrabold text-lg shrink-0">
                {booking.tutorName?.charAt(0) || 'G'}
              </div>
              <div>
                <h4 className="text-base font-extrabold text-slate-900 m-0">{booking.tutorName || 'Gia sư'}</h4>
                <p className="text-xs text-brand-indigo-600 font-bold m-0">{booking.subjectName || 'Khóa học'}</p>
              </div>
            </div>

            {/* Spec Breakdown */}
            <div className="p-4 rounded-2xl bg-slate-50/80 space-y-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Số buổi học cấp phát:</span>
                <span className="font-extrabold text-slate-900">
                  {totalSessions} buổi ({booking.sessionDurationMinutes || 60}p/buổi)
                </span>
              </div>
              <div className="flex justify-between">
                <span>Hình thức học:</span>
                <span className="font-extrabold text-slate-900">{booking.teachingMode || 'Online'}</span>
              </div>
              <div className="flex justify-between">
                <span>Đơn giá từng buổi:</span>
                <span className="font-extrabold text-slate-900 font-monospace-num">
                  {formatCurrency(pricePerSession)} / buổi
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-extrabold text-slate-900">
                <span>Tổng chi phí trọn gói:</span>
                <span className="text-financial-available font-monospace-num">
                  {formatCurrency(totalPrice)}
                </span>
              </div>
            </div>
          </div>

          {/* Escrow Certificate */}
          <div className="p-6 rounded-3xl bg-emerald-50/60 border border-emerald-200/80 space-y-3">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wide">
              <span className="material-symbols-outlined text-base">verified_user</span>
              Chứng Thư Ký Quỹ Bảo Chứng Escrow
            </div>
            <p className="text-xs text-emerald-950/80 leading-relaxed m-0">
              Số tiền <strong>{formatCurrency(totalPrice)}</strong> của bạn được bảo đảm an toàn 100% trong két ký quỹ trung lập của TutorHub. Tiền chỉ được giải ngân từng buổi sau khi học viên và gia sư hoàn tất đối soát xác nhận điểm danh 2 chiều.
            </p>
          </div>
        </div>

        {/* Right: Payment Gateway Selection */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl glass-panel-premium space-y-5 bg-white border border-slate-200">
            <h4 className="text-sm font-extrabold text-slate-900 pb-2 border-b border-slate-100 m-0">
              Phương Thức Thanh Toán
            </h4>

            {paymentError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                {paymentError}
              </div>
            )}

            <div className="space-y-3" role="radiogroup" aria-label="Phương thức thanh toán">
              {/* VNPay Option */}
              <div
                role="radio"
                aria-checked={selectedMethod === 'vnpay'}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedMethod('vnpay');
                  }
                }}
                onClick={() => setSelectedMethod('vnpay')}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                  selectedMethod === 'vnpay'
                    ? 'border-brand-indigo-600 bg-brand-indigo-50/30'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-extrabold text-[10px] flex items-center justify-center tracking-tighter">
                    VNPAY
                  </div>
                  <div>
                    <span className="font-bold text-xs text-slate-900 block">Cổng VNPay 2.1.0</span>
                    <span className="text-[10px] text-text-muted">ATM, QR Pay, Thẻ quốc tế</span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-brand-indigo-600">
                  {selectedMethod === 'vnpay' ? 'radio_button_checked' : 'radio_button_unchecked'}
                </span>
              </div>
            </div>

            {/* Pay CTA */}
            <button
              type="button"
              disabled={loading || isExpired || simulating}
              onClick={handlePayVNPay}
              className={`w-full py-4 rounded-2xl font-extrabold text-xs text-white shadow-sm transition-all flex items-center justify-center gap-2 ${
                isExpired
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-brand-indigo-600 hover:bg-brand-indigo-700'
              }`}
            >
              <span className="material-symbols-outlined text-base">lock</span>
              {loading
                ? 'Đang kết nối cổng VNPay...'
                : isExpired
                ? 'Đơn Giữ Chỗ Đã Hết Hạn'
                : `Thanh Toán ${formatCurrency(totalPrice)} Qua VNPay`}
            </button>

            {/* Development-only payment simulator button */}
            {isDev && (
              <div className="pt-3 border-t border-dashed border-amber-300 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                    Dev IPN Simulator
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-mono">
                    DEV ONLY
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={simulating || isExpired || loading}
                    onClick={() => handleSimulatePayment(true)}
                    className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1"
                  >
                    ✓ Giả Lập Thành Công
                  </button>
                  <button
                    type="button"
                    disabled={simulating || isExpired || loading}
                    onClick={() => handleSimulatePayment(false)}
                    className="py-2 px-3 rounded-xl bg-slate-700 hover:bg-slate-800 text-slate-200 font-bold text-xs transition-colors flex items-center justify-center gap-1"
                  >
                    ✕ Giả Lập Thất Bại
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
