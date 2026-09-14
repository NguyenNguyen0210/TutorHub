import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { formatCurrency } from '@/utils/formatters';

export default function PaymentReturn() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const vnp_ResponseCode = searchParams.get('vnp_ResponseCode') || '00';
  const vnp_TxnRef = searchParams.get('vnp_TxnRef') || 'THB-BK-2026-9021';
  const vnp_TransactionNo = searchParams.get('vnp_TransactionNo') || '14892019';
  const rawAmount = searchParams.get('vnp_Amount');
  const amount = rawAmount ? parseInt(rawAmount) / 100 : 2000000;

  const isSuccess = vnp_ResponseCode === '00';
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (isSuccess) {
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
  }, [isSuccess, navigate]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white rounded-3xl border border-border-light p-8 sm:p-10 shadow-xl space-y-6 text-center">
        {/* Status Icon */}
        <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center bg-emerald-100 text-financial-available border-4 border-emerald-50">
          <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            check_circle
          </span>
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Thanh Toán Ký Quỹ Thành Công!
          </h1>
          <p className="text-xs text-text-muted">
            Hợp đồng học tập đã được kích hoạt & học phí đã được bảo toàn trong ví Escrow
          </p>
        </div>

        {/* Receipt Details Card */}
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 text-left text-xs">
          <div className="flex justify-between pb-2 border-b border-slate-200">
            <span className="text-slate-500">Cổng thanh toán:</span>
            <span className="font-bold text-slate-800">VNPay Sandbox 2.1.0 (NCB)</span>
          </div>
          <div className="flex justify-between pb-2 border-b border-slate-200">
            <span className="text-slate-500">Mã giao dịch VNPay:</span>
            <span className="font-monospace-num font-bold text-slate-800">{vnp_TransactionNo}</span>
          </div>
          <div className="flex justify-between pb-2 border-b border-slate-200">
            <span className="text-slate-500">Mã đơn đặt chỗ:</span>
            <span className="font-monospace-num font-bold text-brand-indigo-600">{vnp_TxnRef}</span>
          </div>
          <div className="flex justify-between items-baseline pt-1">
            <span className="text-slate-500 font-bold">Số tiền đã ký quỹ:</span>
            <span className="text-lg font-extrabold text-financial-available font-monospace-num">
              {formatCurrency(amount)}
            </span>
          </div>
        </div>

        {/* Escrow Notification Box */}
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-left space-y-1.5 text-xs text-emerald-900">
          <div className="flex items-center gap-1.5 font-bold">
            <span className="material-symbols-outlined text-financial-available text-lg">verified_user</span>
            Hệ Thống Smart Escrow Đã Tiếp Nhận Học Phí:
          </div>
          <ul className="list-disc list-inside space-y-1 text-[11px] text-emerald-800 pl-1">
            <li>Hợp đồng học tập đã chính thức có hiệu lực pháp lý.</li>
            <li>Tự động phân rã 10 buổi học con tương ứng (200.000 ₫/buổi).</li>
            <li>Học phí chỉ giải ngân từng buổi sau khi học viên xác nhận điểm danh 24h.</li>
          </ul>
        </div>

        <p className="text-xs text-slate-500">
          Đang tự động chuyển hướng đến Bàn học sau <span className="font-bold text-brand-indigo-600 font-monospace-num">{countdown}</span> giây...
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
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
        </div>
      </div>
    </div>
  );
}
