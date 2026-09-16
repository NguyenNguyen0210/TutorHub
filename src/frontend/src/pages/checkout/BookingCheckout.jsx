import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import paymentService from '@/services/payment.service';
import CountdownTimer from '@/components/feedback/CountdownTimer';
import { formatCurrency } from '@/utils/formatters';
import { message } from 'antd';

export default function BookingCheckout() {
  const { id, bookingId: paramBookingId } = useParams();
  const currentBookingId = id || paramBookingId || 'BK-2026-9021';
  const navigate = useNavigate();

  const [selectedMethod, setSelectedMethod] = useState('vnpay');
  const [loading, setLoading] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [isExpired, setIsExpired] = useState(false);

  const isDev = import.meta.env.DEV || import.meta.env.VITE_DEV_PAYMENT_SIMULATOR === 'true';

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
  };

  const handlePayVNPay = async () => {
    if (isExpired) {
      message.error('Đơn giữ chỗ đã hết hạn. Vui lòng tạo lại đơn hàng mới.');
      return;
    }
    try {
      setLoading(true);
      setPaymentError(null);
      // POST /payments/vnpay/create-url { bookingId } → PaymentRedirectDto
      const redirect = await paymentService.createVnPayUrl(currentBookingId);

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
        await paymentService.createVnPayUrl(currentBookingId);
      } catch {
        // Tiếp tục gọi simulator
      }

      const result = await paymentService.simulateIpn(currentBookingId, success);
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
      {/* Signature Component: 15-Minute Countdown Timer §3.1 */}
      <CountdownTimer
        onExpire={() => setIsExpired(true)}
        onReorderPath="/tutors"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Order Info & Escrow Certificate */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Details Card */}
          <div className="p-6 sm:p-8 rounded-3xl glass-panel-premium space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
              <span className="font-extrabold text-sm text-slate-900">Chi Tiết Đơn Giữ Chỗ</span>
              <span className="font-monospace-num text-xs font-extrabold text-brand-indigo-600">#{orderData.bookingId}</span>
            </div>

            {/* Tutor Snapshot */}
            <div className="flex items-center gap-4">
              <img
                src={orderData.tutorAvatar}
                alt={orderData.tutorName}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-brand-indigo-100 shadow-xs shrink-0"
              />
              <div>
                <h4 className="text-base font-extrabold text-slate-900">{orderData.tutorName}</h4>
                <p className="text-xs text-brand-indigo-600 font-bold">{orderData.packageName}</p>
              </div>
            </div>

            {/* Spec Breakdown */}
            <div className="p-4 rounded-2xl bg-slate-50/80 space-y-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Số buổi học cấp phát:</span>
                <span className="font-extrabold text-slate-900">{orderData.sessionCount} buổi ({orderData.durationMinutes}p/buổi)</span>
              </div>
              <div className="flex justify-between">
                <span>Hình thức học:</span>
                <span className="font-extrabold text-slate-900">{orderData.teachingMode}</span>
              </div>
              <div className="flex justify-between">
                <span>Đơn giá từng buổi:</span>
                <span className="font-extrabold text-brand-indigo-600 font-monospace-num">{formatCurrency(orderData.pricePerSession)} / buổi</span>
              </div>
            </div>
          </div>

          {/* Smart Escrow Seal Certificate Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-emerald-500/15 via-emerald-50/70 to-white border-2 border-emerald-500/40 shadow-sm space-y-3.5 glow-emerald">
            <div className="flex items-center gap-2.5 text-emerald-950 font-extrabold text-sm">
              <span className="material-symbols-outlined text-financial-available text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                shield
              </span>
              <span>Chứng Thư Bảo Chứng Học Phí Ký Quỹ (Smart Escrow Protocol)</span>
            </div>
            <p className="text-xs text-emerald-950 leading-relaxed">
              Toàn bộ số tiền <strong>{formatCurrency(orderData.totalAmount)}</strong> sẽ được lưu giữ an toàn trong Ví Ký Quỹ TutorHub. Gia sư chỉ được giải ngân từng buổi học (<strong>{formatCurrency(orderData.pricePerSession)}/buổi</strong>) sau khi cả 2 bên cùng hoàn tất xác nhận điểm danh trong cửa sổ 24 giờ.
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-emerald-800 font-bold pt-1">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-base text-financial-available">check_circle</span>
                Hoàn tiền pro-rata nếu hủy
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
          <div className="p-6 sm:p-7 rounded-3xl glass-panel-premium space-y-5 sticky top-24">
            <h3 className="font-extrabold text-sm text-slate-900">Cổng Thanh Toán Trực Tuyến</h3>

            {/* VNPay Gateway Option with Active Border */}
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
              className="p-4 rounded-2xl border-2 border-brand-indigo-600 bg-brand-indigo-50/50 cursor-pointer space-y-2 transition-all shadow-xs focus:outline-none focus:ring-2 focus:ring-brand-indigo-500"
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-xs text-brand-indigo-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-brand-indigo-600 text-lg">credit_card</span>
                  Cổng VNPay Sandbox 2.1.0
                </span>
                <span className="w-4 h-4 rounded-full border-2 border-brand-indigo-600 bg-brand-indigo-600 flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                </span>
              </div>
              <p className="text-[11px] text-slate-600">
                Thẻ ATM Nội Địa / QR VNPAY / Thẻ Quốc Tế (Ngân hàng NCB test)
              </p>
            </div>

            {/* Total Price Summary */}
            <div className="pt-4 border-t border-slate-200/80 space-y-2">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Học phí khóa học:</span>
                <span className="font-monospace-num font-bold text-slate-800">{formatCurrency(orderData.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>Phí dịch vụ ký quỹ Escrow:</span>
                <span className="font-extrabold text-financial-available">0 ₫ (Miễn phí)</span>
              </div>
              <div className="pt-2 border-t border-slate-100 flex justify-between items-baseline">
                <span className="text-xs font-extrabold text-slate-900">Tổng thanh toán:</span>
                <span className="text-2xl font-extrabold text-financial-available font-monospace-num">
                  {formatCurrency(orderData.totalAmount)}
                </span>
              </div>
            </div>

              {paymentError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                  <span className="material-symbols-outlined text-rose-600 text-base shrink-0">error</span>
                  <div className="flex-1">
                    <p className="font-bold">{paymentError}</p>
                    <button
                      type="button"
                      onClick={handlePayVNPay}
                      className="mt-1.5 text-xs text-rose-700 underline font-bold hover:text-rose-900"
                    >
                      Thử lại kết nối VNPay
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-2">
                <button
                  type="button"
                  onClick={handlePayVNPay}
                  disabled={loading || simulating || isExpired}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-brand-indigo-600 to-indigo-700 hover:from-brand-indigo-500 hover:to-indigo-600 text-white font-extrabold text-sm shadow-md shadow-brand-indigo-500/30 transition-all sheen-btn flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-lg">payment</span>
                  {isExpired
                    ? 'Đơn Giữ Chỗ Đã Hết Hạn'
                    : loading
                      ? 'Đang kết nối VNPay...'
                      : `Thanh Toán ${formatCurrency(orderData.totalAmount)} Qua VNPay`}
                </button>

                {isDev && (
                  <div className="pt-2 border-t border-dashed border-amber-300/80 space-y-1.5">
                    <div className="flex items-center gap-1 text-[11px] text-amber-800 font-bold">
                      <span className="material-symbols-outlined text-sm text-amber-600">developer_mode</span>
                      Công cụ kiểm thử (Dev Simulator):
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSimulatePayment(true)}
                      disabled={loading || simulating}
                      className="w-full py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-900 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-base text-amber-600">bolt</span>
                      {simulating ? 'Đang kích hoạt...' : 'Giả lập VNPay thành công (Kích hoạt hợp đồng)'}
                    </button>
                  </div>
                )}

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
