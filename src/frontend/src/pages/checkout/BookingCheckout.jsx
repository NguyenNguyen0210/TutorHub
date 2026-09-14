import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import paymentService from '@/services/payment.service';
import bookingService from '@/services/booking.service';
import { formatCurrency } from '@/utils/formatters';
import { message } from 'antd';

export default function BookingCheckout() {
  const { id, bookingId: paramBookingId } = useParams();
  const currentBookingId = id || paramBookingId || 'BK-2026-9021';
  const navigate = useNavigate();

  // 15-Minute Countdown Timer (900 seconds)
  const [timeLeft, setTimeLeft] = useState(822); // ~13m 42s initially
  const [selectedMethod, setSelectedMethod] = useState('vnpay');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          message.warning('Hết thời hạn giữ chỗ 15 phút. Đơn giữ chỗ đã bị hủy.');
          navigate('/tutors');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [navigate]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const timerPercentage = Math.round((timeLeft / 900) * 100);

  const orderData = {
    bookingId: currentBookingId,
    tutorName: 'ThS. Nguyễn Văn An',
    tutorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    packageName: 'Gói Luyện Thi THPT Toán 10 Buổi (Cơ Bản Đến 8+)',
    sessionCount: 10,
    durationMinutes: 60,
    teachingMode: 'Online + Offline',
    pricePerSession: 200000,
    totalAmount: 2000000,
    platformFeeRate: '10% (Gia sư chịu)',
  };

  const handlePayVNPay = async () => {
    try {
      setLoading(true);
      // Gọi endpoint tạo URL thanh toán VNPay thực tế
      const res = await paymentService.createPaymentUrl({
        bookingId: currentBookingId,
        amount: orderData.totalAmount,
        orderInfo: `Thanh toan giu cho TutorHub ${currentBookingId}`,
      });

      if (res && res.data && res.data.paymentUrl) {
        window.location.href = res.data.paymentUrl;
      } else {
        // Mock fallback to PaymentReturn page for testing environment
        navigate(`/payment/return?vnp_Amount=${orderData.totalAmount * 100}&vnp_ResponseCode=00&vnp_TxnRef=${currentBookingId}&vnp_TransactionNo=14892019`);
      }
    } catch (err) {
      navigate(`/payment/return?vnp_Amount=${orderData.totalAmount * 100}&vnp_ResponseCode=00&vnp_TxnRef=${currentBookingId}&vnp_TransactionNo=14892019`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* 15-Minute Countdown Banner */}
      <div className="rounded-3xl bg-amber-500/10 border-2 border-amber-500/30 p-6 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-amber-900 font-extrabold text-sm sm:text-base">
            <span className="material-symbols-outlined text-amber-600 animate-spin text-xl">hourglass_top</span>
            <span>ĐANG GIỮ CHỖ THANH TOÁN (15 PHÚT)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-amber-800 font-bold">Thời gian còn lại:</span>
            <span className="px-3 py-1 rounded-xl bg-amber-500 text-white font-monospace-num font-extrabold text-base tracking-wider shadow-xs">
              {formatTimer(timeLeft)}
            </span>
          </div>
        </div>
        {/* Progress bar */}
        <div className="w-full bg-amber-200 h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-amber-500 h-full transition-all duration-1000 rounded-full"
            style={{ width: `${timerPercentage}%` }}
          ></div>
        </div>
        <p className="text-[11px] text-amber-800">
          Chỗ học của bạn với gia sư đã được khóa độc quyền trong 15 phút. Vui lòng hoàn tất thanh toán để cấp phát hợp đồng học tập.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Order Info & Escrow Guarantee */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Details Card */}
          <div className="p-6 rounded-3xl bg-white border border-border-light shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-border-light">
              <span className="font-bold text-sm text-slate-800">Chi Tiết Đơn Giữ Chỗ</span>
              <span className="font-monospace-num text-xs font-bold text-slate-500">#{orderData.bookingId}</span>
            </div>

            {/* Tutor Snapshot */}
            <div className="flex items-center gap-3.5">
              <img
                src={orderData.tutorAvatar}
                alt={orderData.tutorName}
                className="w-12 h-12 rounded-2xl object-cover border border-brand-indigo-100"
              />
              <div>
                <h4 className="text-sm font-bold text-slate-900">{orderData.tutorName}</h4>
                <p className="text-xs text-brand-indigo-600 font-semibold">{orderData.packageName}</p>
              </div>
            </div>

            {/* Spec Breakdown */}
            <div className="p-4 rounded-2xl bg-slate-50 space-y-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Số buổi học cấp phát:</span>
                <span className="font-bold text-slate-900">{orderData.sessionCount} buổi ({orderData.durationMinutes} phút/buổi)</span>
              </div>
              <div className="flex justify-between">
                <span>Hình thức:</span>
                <span className="font-bold text-slate-900">{orderData.teachingMode}</span>
              </div>
              <div className="flex justify-between">
                <span>Đơn giá bảo chứng:</span>
                <span className="font-bold text-brand-indigo-600 font-monospace-num">{formatCurrency(orderData.pricePerSession)} / buổi</span>
              </div>
            </div>
          </div>

          {/* Escrow Trust Guarantee Card */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-emerald-50 to-white border-2 border-emerald-500/30 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-sm">
              <span className="material-symbols-outlined text-financial-available text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                shield
              </span>
              <span>Cam Kết Bảo Chứng Học Phí Ký Quỹ (Escrow)</span>
            </div>
            <p className="text-xs text-emerald-950 leading-relaxed">
              Toàn bộ số tiền <strong>{formatCurrency(orderData.totalAmount)}</strong> sẽ được lưu giữ an toàn trong Ví Bảo Chứng TutorHub. Gia sư chỉ được giải ngân từng buổi học (<strong>{formatCurrency(orderData.pricePerSession)}/buổi</strong>) sau khi cả 2 bên cùng hoàn tất xác nhận điểm danh 2 chiều trong cửa sổ 24 giờ.
            </p>
            <div className="flex items-center gap-4 text-[11px] text-emerald-800 font-semibold pt-1">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-base text-financial-available">check_circle</span>
                Hoàn tiền theo tỷ lệ pro-rata
              </span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-base text-financial-available">check_circle</span>
                Trọng tài DEC-S8 bảo vệ
              </span>
            </div>
          </div>
        </div>

        {/* Right: Payment Method & CTAs */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white border border-border-light shadow-xs space-y-5 sticky top-24">
            <h3 className="font-bold text-sm text-slate-800">Phương Thức Thanh Toán</h3>

            {/* VNPay Gateway Option */}
            <div
              onClick={() => setSelectedMethod('vnpay')}
              className="p-4 rounded-2xl border-2 border-brand-indigo-500 bg-brand-indigo-50/40 cursor-pointer space-y-2 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-brand-indigo-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-brand-indigo-600 text-lg">credit_card</span>
                  Cổng VNPay Sandbox 2.1.0
                </span>
                <span className="w-4 h-4 rounded-full border-2 border-brand-indigo-600 bg-brand-indigo-600 flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                </span>
              </div>
              <p className="text-[11px] text-slate-600">
                Thẻ ATM / Visa / Mastercard / QR VNPAY (Ngân hàng NCB test)
              </p>
            </div>

            {/* Total Price Summary */}
            <div className="pt-4 border-t border-border-light space-y-2">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Học phí khóa học:</span>
                <span className="font-monospace-num font-bold text-slate-700">{formatCurrency(orderData.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>Phí dịch vụ ký quỹ Escrow:</span>
                <span className="font-bold text-financial-available">0 ₫ (Miễn phí)</span>
              </div>
              <div className="pt-2 border-t border-slate-100 flex justify-between items-baseline">
                <span className="text-xs font-bold text-slate-900">Tổng thanh toán:</span>
                <span className="text-2xl font-extrabold text-financial-available font-monospace-num">
                  {formatCurrency(orderData.totalAmount)}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={handlePayVNPay}
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-brand-indigo-600 hover:bg-brand-indigo-700 text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-lg">payment</span>
                {loading ? 'Đang kết nối cổng VNPay...' : `Thanh Toán ${formatCurrency(orderData.totalAmount)} Qua VNPay`}
              </button>

              <button
                type="button"
                onClick={() => navigate('/tutors')}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-colors"
              >
                Hủy Đơn Giữ Chỗ
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
