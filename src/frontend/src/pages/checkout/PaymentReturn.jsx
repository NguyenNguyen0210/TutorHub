import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import paymentService from '@/services/payment.service';
import { formatCurrency } from '@/utils/formatters';

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

  useEffect(() => {
    if (result?.success) {
      const timer = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            clearInterval(timer);
            navigate('/student/dashboard');
            return 0;
          }
          return c - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [result?.success, navigate]);

  if (verifying) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="w-full max-w-xl bg-white rounded-3xl border border-border-light p-8 sm:p-10 shadow-xl space-y-4 text-center">
          <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center bg-brand-indigo-50 text-brand-indigo-600">
            <span className="material-symbols-outlined text-3xl animate-spin">sync</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">Đang đối soát kết quả với VNPay...</h2>
          <p className="text-xs text-slate-500">Vui lòng chờ trong giây lát, hệ thống đang kiểm tra chữ ký số và cập nhật hợp đồng học tập.</p>
        </div>
      </div>
    );
  }

  const isSuccess = Boolean(result?.success);

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white rounded-3xl border border-border-light p-8 sm:p-10 shadow-xl space-y-6 text-center">
        {/* Status Icon */}
        <div
          className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center border-4 ${
            isSuccess
              ? 'bg-emerald-100 text-financial-available border-emerald-50'
              : 'bg-rose-100 text-rose-600 border-rose-50'
          }`}
        >
          <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            {isSuccess ? 'check_circle' : 'cancel'}
          </span>
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {isSuccess ? 'Thanh Toán Ký Quỹ Thành Công!' : 'Thanh Toán Không Thành Công'}
          </h1>
          <p className="text-xs text-text-muted">
            {result?.message ||
              (isSuccess
                ? 'Hợp đồng học tập đã được kích hoạt & học phí đã được bảo toàn trong ví Escrow.'
                : 'Giao dịch bị từ chối hoặc đã hủy. Tiền chưa được khấu trừ khỏi tài khoản của bạn.')}
          </p>
        </div>

        {/* Receipt Details Card */}
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 text-left text-xs">
          <div className="flex justify-between pb-2 border-b border-slate-200">
            <span className="text-slate-500">Cổng thanh toán:</span>
            <span className="font-bold text-slate-800">VNPay Sandbox 2.1.0</span>
          </div>
          {result?.transactionNo && (
            <div className="flex justify-between pb-2 border-b border-slate-200">
              <span className="text-slate-500">Mã giao dịch VNPay:</span>
              <span className="font-monospace-num font-bold text-slate-800">{result.transactionNo}</span>
            </div>
          )}
          {result?.merchantReference && (
            <div className="flex justify-between pb-2 border-b border-slate-200">
              <span className="text-slate-500">Mã đơn đặt chỗ:</span>
              <span className="font-monospace-num font-bold text-brand-indigo-600">{result.merchantReference}</span>
            </div>
          )}
          <div className="flex justify-between items-baseline pt-1">
            <span className="text-slate-500 font-bold">Số tiền:</span>
            <span
              className={`text-lg font-extrabold font-monospace-num ${
                isSuccess ? 'text-financial-available' : 'text-slate-700'
              }`}
            >
              {formatCurrency(result?.amount || 0)}
            </span>
          </div>
        </div>

        {/* Escrow Information (Success only) */}
        {isSuccess ? (
          <>
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-left space-y-1.5 text-xs text-emerald-900">
              <div className="flex items-center gap-1.5 font-bold">
                <span className="material-symbols-outlined text-financial-available text-lg">verified_user</span>
                Hệ Thống Smart Escrow Đã Tiếp Nhận Học Phí:
              </div>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-emerald-800 pl-1">
                <li>Hợp đồng học tập đã chính thức có hiệu lực.</li>
                <li>Tự động phân rã các buổi học con tương ứng.</li>
                <li>Học phí chỉ giải ngân từng buổi sau khi học viên và gia sư đối soát điểm danh 2 chiều.</li>
              </ul>
            </div>

            <p className="text-xs text-slate-500">
              Đang tự động chuyển hướng đến Bàn học sau{' '}
              <span className="font-bold text-brand-indigo-600 font-monospace-num">{countdown}</span> giây...
            </p>
          </>
        ) : (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-left text-xs text-amber-900 space-y-1">
            <p className="font-bold m-0 flex items-center gap-1">
              <span className="material-symbols-outlined text-amber-600 text-sm">info</span>
              Lưu ý an toàn:
            </p>
            <p className="m-0 text-[11px] text-amber-800">
              Nếu bạn đã bị trừ tiền trong tài khoản ngân hàng nhưng màn hình thông báo thất bại, vui lòng giữ lại mã tham chiếu và liên hệ ban hỗ trợ TutorHub để đối soát.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          {isSuccess ? (
            <>
              <Link
                to="/student/dashboard"
                className="flex-1 py-3 rounded-xl bg-brand-indigo-600 hover:bg-brand-indigo-700 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">space_dashboard</span>
                Vào Bàn Học Của Tôi
              </Link>
              <button
                type="button"
                onClick={() => window.print()}
                className="py-3 px-5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">receipt</span>
                In Biên Lai
              </button>
            </>
          ) : (
            <>
              <Link
                to="/tutors"
                className="flex-1 py-3 rounded-xl bg-brand-indigo-600 hover:bg-brand-indigo-700 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">arrow_back</span>
                Khám Phá Gia Sư Khác
              </Link>
              {result?.bookingId && result?.bookingId !== '00000000-0000-0000-0000-000000000000' && (
                <Link
                  to={`/student/bookings/${result.bookingId}/checkout`}
                  className="py-3 px-5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-base">refresh</span>
                  Thử Thanh Toán Lại
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
