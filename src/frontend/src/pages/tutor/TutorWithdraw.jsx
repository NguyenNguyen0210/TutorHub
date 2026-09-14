import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Breadcrumb, Button, Input, Tag, Alert, message, Result } from 'antd';
import {
  ArrowLeftOutlined,
  BankOutlined,
  SafetyCertificateFilled,
  CheckCircleFilled,
  LockOutlined,
} from '@ant-design/icons';
import { formatCurrency } from '@/utils/formatters';

export default function TutorWithdraw() {
  const navigate = useNavigate();
  const maxWithdrawable = 700000; // Available 900k - Held 200k
  const [amount, setAmount] = useState(maxWithdrawable);
  const [otp, setOtp] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = () => {
    if (amount < 50000) {
      message.error('Số tiền rút tối thiểu là 50.000 ₫.');
      return;
    }
    if (amount > maxWithdrawable) {
      message.error(`Số tiền rút tối đa khả dụng là ${formatCurrency(maxWithdrawable)}.`);
      return;
    }
    if (otp.length < 6) {
      message.warning('Vui lòng nhập mã OTP 6 số (mặc định: 123456).');
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSuccess(true);
      message.success('Đã gửi lệnh rút tiền thành công!');
    }, 500);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Top Breadcrumb */}
      <div className="border-b border-slate-200 bg-white px-4 py-3 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl flex items-center justify-between text-xs">
          <Breadcrumb
            items={[
              { title: <Link to="/tutor/dashboard">Bảng gia sư</Link> },
              { title: <Link to="/tutor/wallet">Ví tiền</Link> },
              { title: 'Yêu cầu rút tiền' },
            ]}
          />
          <Link to="/tutor/wallet" className="flex items-center gap-1 font-medium text-slate-500 hover:text-brand-indigo-600">
            <ArrowLeftOutlined /> Quay lại ví tiền
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 mt-8">
        {success ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 sm:p-12 text-center shadow-lg">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-4xl mb-4">
              <CheckCircleFilled />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 m-0">
              Lệnh Rút Tiền Đã Được Ghi Nhận!
            </h2>
            <p className="text-xs text-slate-500 mt-2 max-w-md mx-auto">
              Hệ thống đang chuyển <strong className="text-emerald-700">{formatCurrency(amount)}</strong> về tài khoản Vietcombank 0071001234567 của bạn.
            </p>
            <div className="pt-6">
              <Button type="primary" className="rounded-xl bg-brand-indigo-600 font-bold px-6" onClick={() => navigate('/tutor/wallet')}>
                Về Trung Tâm Tài Chính
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm space-y-6">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight m-0">
                Yêu Cầu Rút Tiền Về Ngân Hàng
              </h1>
              <p className="text-xs text-slate-500 mt-1 mb-0">
                Chuyển thẳng thu nhập từ các buổi dạy hoàn thành về tài khoản ngân hàng đã KYC.
              </p>
            </div>

            {/* Bank Card */}
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white text-lg">
                  <BankOutlined />
                </div>
                <div>
                  <div className="font-bold text-slate-900">Vietcombank • 0071001234567</div>
                  <div className="text-slate-500">NGUYEN VAN AN • Đã xác minh KYC</div>
                </div>
              </div>
              <Tag color="success" className="font-bold border-0">TÀI KHOẢN MẶC ĐỊNH</Tag>
            </div>

            {/* Input Amount */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <label className="font-bold text-slate-700 uppercase">Số Tiền Rút (VND):</label>
                <span className="text-slate-500">
                  Tối đa rút được: <strong className="text-emerald-700">{formatCurrency(maxWithdrawable)}</strong>
                </span>
              </div>
              <Input
                type="number"
                size="large"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="rounded-xl font-bold text-lg text-slate-900"
              />
              <div className="flex gap-2 pt-1">
                <Button size="small" onClick={() => setAmount(200000)} className="rounded-lg text-xs">200.000 ₫</Button>
                <Button size="small" onClick={() => setAmount(500000)} className="rounded-lg text-xs">500.000 ₫</Button>
                <Button size="small" onClick={() => setAmount(maxWithdrawable)} className="rounded-lg text-xs font-bold text-brand-indigo-600">
                  Rút Toàn Bộ ({formatCurrency(maxWithdrawable)})
                </Button>
              </div>
            </div>

            {/* OTP */}
            <div className="space-y-2">
              <label className="font-bold text-slate-700 text-xs uppercase block">Mã Xác Thực OTP SMS:</label>
              <Input
                size="large"
                placeholder="Nhập 123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                prefix={<LockOutlined className="text-slate-400" />}
                className="rounded-xl font-mono text-base tracking-widest text-center max-w-xs"
              />
              <p className="text-[11px] text-slate-400 m-0">Nhập mã OTP test: <strong>123456</strong></p>
            </div>

            {/* Submit */}
            <Button
              type="primary"
              size="large"
              block
              loading={submitting}
              onClick={handleSubmit}
              className="h-12 rounded-xl bg-emerald-600 font-bold text-base hover:bg-emerald-500 border-0 shadow-md shadow-emerald-600/25"
            >
              Xác Nhận Rút {formatCurrency(amount)}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
