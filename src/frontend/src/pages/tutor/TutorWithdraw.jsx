import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '@/utils/formatters';
import { message } from 'antd';

export default function TutorWithdraw() {
  const withdrawableLimit = 700000;
  const [amount, setAmount] = useState('500000');
  const [note, setNote] = useState('Rút thu nhập dạy Toán tháng 9');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const num = parseInt(amount);
    if (num < 50000) {
      message.error('Số tiền rút tối thiểu là 50.000 ₫');
      return;
    }
    if (num > withdrawableLimit) {
      message.error('Số tiền rút vượt quá hạn mức được phép');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      message.success(`Đã tạo lệnh rút ${formatCurrency(num)} thành công! Lệnh đang chờ chuyển khoản.`);
    }, 600);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Link to="/tutor/wallet" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-brand-indigo-600 transition-colors">
        <span className="material-symbols-outlined text-base">arrow_back</span>
        Quay lại Ví Bảo Chứng
      </Link>

      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Yêu Cầu Rút Tiền Về Tài Khoản Ngân Hàng
        </h1>
        <p className="text-xs sm:text-sm text-text-muted mt-1">
          Chỉ được rút từ Số dư khả dụng (Available) sau khi trừ đi các khoản tiền đang bị phong tỏa tranh chấp (Held)
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Card */}
        <div className="lg:col-span-2 p-6 sm:p-8 rounded-3xl bg-white border border-border-light shadow-xs space-y-6">
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
            <span className="font-bold text-emerald-900">Hạn mức được phép rút hiện tại:</span>
            <span className="text-lg font-extrabold text-financial-available font-monospace-num">
              {formatCurrency(withdrawableLimit)}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Số tiền muốn rút (₫)</label>
              <input
                type="number"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="50000"
                max={withdrawableLimit}
                className="w-full px-4 py-3 rounded-xl border border-border-light text-slate-900 font-monospace-num font-bold text-base focus:ring-2 focus:ring-brand-indigo-500 outline-hidden"
              />
              <span className="text-[11px] text-text-muted block">Tối thiểu: 50.000 ₫ • Tối đa: {formatCurrency(withdrawableLimit)}</span>
            </div>

            {/* Linked Bank Card */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">Tài khoản ngân hàng thụ hưởng đã xác thực</label>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-900 block">Ngân hàng TMCP Ngoại Thương Việt Nam (Vietcombank)</span>
                  <span className="text-slate-600 font-monospace-num">STK: 0011001234567 • NGUYEN VAN AN</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-financial-available text-[10px] font-bold">
                  ĐÃ XÁC THỰC KYC ✅
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Ghi chú giao dịch</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-border-light text-slate-900 text-xs focus:ring-2 focus:ring-brand-indigo-500 outline-hidden"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-financial-available hover:bg-emerald-600 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-base">send</span>
              {loading ? 'Đang gửi lệnh...' : `Xác Nhận Rút ${formatCurrency(parseInt(amount) || 0)} Về Ngân Hàng`}
            </button>
          </form>
        </div>

        {/* Withdrawal History Card */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white border border-border-light shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-brand-indigo-600">history</span>
              Lịch Sử Lệnh Rút Gần Đây
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex justify-between">
                  <span className="font-monospace-num font-bold text-slate-800">WTH-99214</span>
                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">Chờ Admin Duyệt ⏳</span>
                </div>
                <div className="flex justify-between text-text-muted">
                  <span>13/09/2026</span>
                  <span className="font-bold text-slate-800 font-monospace-num">300.000 ₫</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex justify-between">
                  <span className="font-monospace-num font-bold text-slate-800">WTH-88219</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">Thành công ✅</span>
                </div>
                <div className="flex justify-between text-text-muted">
                  <span>05/09/2026</span>
                  <span className="font-bold text-slate-800 font-monospace-num">500.000 ₫</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
