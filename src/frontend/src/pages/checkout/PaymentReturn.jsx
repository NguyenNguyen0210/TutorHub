import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Result, Button, Card, Tag, Progress, Divider } from 'antd';
import {
  SafetyCertificateFilled,
  CheckCircleFilled,
  CloseCircleFilled,
  ArrowRightOutlined,
  CalendarOutlined,
  MessageOutlined,
  HomeOutlined,
  RedoOutlined,
} from '@ant-design/icons';
import { formatCurrency } from '@/utils/formatters';

export default function PaymentReturn() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Đọc các tham số từ VNPay callback
  const responseCode = searchParams.get('vnp_ResponseCode') || '00';
  const txnRef = searchParams.get('vnp_TxnRef') || 'THB-2026-9921';
  const rawAmount = searchParams.get('vnp_Amount') || '200000000';
  const amount = Number(rawAmount) > 1000000 ? Math.round(Number(rawAmount) / 100) : Number(rawAmount);
  const bankCode = searchParams.get('vnp_BankCode') || 'NCB';
  const orderInfo = searchParams.get('vnp_OrderInfo') || 'Thanh toán học phí khóa học TutorHub';

  const isSuccess = responseCode === '00';

  // Đếm ngược 5 giây tự chuyển hướng nếu thành công
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!isSuccess) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/student/dashboard');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isSuccess, navigate]);

  return (
    <div className="min-h-screen bg-slate-50/60 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="w-full max-w-2xl">
        {isSuccess ? (
          /* TRƯỜNG HỢP 1: THANH TOÁN THÀNH CÔNG */
          <div className="glass-surface overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-8 sm:p-10 shadow-xl text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-4xl shadow-inner mb-5">
              <CheckCircleFilled />
            </div>

            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200 mb-2">
              <SafetyCertificateFilled /> GIAO DỊCH KÝ QUỸ ĐƯỢC XÁC THỰC
            </span>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Thanh Toán Thành Công!
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              Hợp đồng học tập đã được kích hoạt. Học phí của bạn đã được đưa vào két bảo chứng an toàn của TutorHub.
            </p>

            {/* Smart Contract Box */}
            <div className="mt-6 rounded-2xl border border-brand-indigo-100 bg-gradient-to-br from-brand-indigo-50/40 via-white to-emerald-50/30 p-5 text-left text-xs shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Mã Hợp Đồng Học Tập</span>
                  <div className="font-mono font-extrabold text-brand-indigo-700 text-sm">
                    CTR-2026-{txnRef.slice(0, 8).toUpperCase()}
                  </div>
                </div>
                <Tag color="emerald" className="m-0 font-bold border-0 px-2.5 py-1 rounded-full text-xs">
                  ESCROW ACTIVE
                </Tag>
              </div>

              <div className="grid grid-cols-2 gap-3 py-1">
                <div>
                  <span className="text-slate-500">Số tiền bảo chứng:</span>
                  <div className="font-extrabold text-slate-900 text-base">
                    {formatCurrency(amount)}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Cổng thanh toán:</span>
                  <div className="font-bold text-slate-800">
                    VNPay ({bankCode})
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Cấp phát buổi học:</span>
                  <div className="font-bold text-emerald-700">
                    10 Buổi học con đã sẵn sàng
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Cơ chế giải ngân:</span>
                  <div className="font-medium text-slate-700">
                    Từng buổi sau đối soát 24h
                  </div>
                </div>
              </div>
            </div>

            {/* Countdown auto-redirect progress */}
            <div className="mt-6 rounded-xl bg-slate-50 p-3.5 text-xs text-slate-600 flex items-center justify-between">
              <span>Hệ thống sẽ tự động chuyển về Bàn Học trong:</span>
              <span className="font-mono font-extrabold text-brand-indigo-600 bg-brand-indigo-50 px-2 py-0.5 rounded">
                {countdown} giây
              </span>
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                type="primary"
                size="large"
                className="w-full sm:w-auto rounded-xl bg-brand-indigo-600 px-6 font-bold shadow-md shadow-brand-indigo-600/25 hover:bg-brand-indigo-500"
                onClick={() => navigate('/student/dashboard')}
              >
                Vào Bàn Học Của Tôi Ngay <ArrowRightOutlined />
              </Button>
              <Button
                size="large"
                className="w-full sm:w-auto rounded-xl border-slate-200 text-slate-600 hover:text-brand-indigo-600"
                onClick={() => navigate('/app/messages')}
              >
                <MessageOutlined /> Nhắn Tin Cho Gia Sư
              </Button>
            </div>
          </div>
        ) : (
          /* TRƯỜNG HỢP 2: THANH TOÁN THẤT BẠI / BỊ HỦY */
          <div className="glass-surface overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-8 sm:p-10 shadow-xl text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-rose-100 text-rose-600 text-4xl shadow-inner mb-5">
              <CloseCircleFilled />
            </div>

            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700 border border-rose-200 mb-2">
              MÃ LỖI: {responseCode}
            </span>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Giao Dịch Chưa Hoàn Tất
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
              {responseCode === '24'
                ? 'Bạn đã hủy giao dịch trên cổng thanh toán VNPay. Đơn giữ chỗ 15 phút vẫn còn hiệu lực nếu thời gian chưa kết thúc.'
                : 'Thanh toán không thành công do thẻ không đủ số dư hoặc lỗi xác thực OTP. Tài khoản của bạn chưa bị trừ tiền.'}
            </p>

            <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50 p-4 text-xs text-slate-600 text-left">
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Mã đơn giữ chỗ:</span>
                <span className="font-mono font-bold text-slate-800">{txnRef}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Số tiền:</span>
                <span className="font-bold text-slate-800">{formatCurrency(amount)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                type="primary"
                size="large"
                className="w-full sm:w-auto rounded-xl bg-brand-indigo-600 px-6 font-bold shadow-md shadow-brand-indigo-600/25 hover:bg-brand-indigo-500"
                onClick={() => navigate(`/student/bookings/${txnRef}/checkout`)}
              >
                <RedoOutlined /> Thử Lại Thanh Toán
              </Button>
              <Button
                size="large"
                className="w-full sm:w-auto rounded-xl border-slate-200 text-slate-600 hover:text-brand-indigo-600"
                onClick={() => navigate('/tutors')}
              >
                <HomeOutlined /> Về Trang Khám Phá
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
