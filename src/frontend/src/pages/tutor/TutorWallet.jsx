import React from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '@/utils/formatters';

export default function TutorWallet() {
  const wallet = {
    pendingBalance: 3600000,
    availableBalance: 900000,
    heldBalance: 200000,
    withdrawableBalance: 700000,
    statement: [
      { id: 'tx-1', date: '10/09/2026 19:15', type: 'SessionPayoutCredit', desc: 'Giải ngân buổi học Toán #1 (Học viên Tuấn)', amount: 180000, balance: 900000 },
      { id: 'tx-2', date: '05/09/2026 14:00', type: 'WithdrawalDebit', desc: 'Rút tiền về Vietcombank (STK 0011001234567)', amount: -500000, balance: 720000 },
      { id: 'tx-3', date: '02/09/2026 19:00', type: 'SessionPayoutCredit', desc: 'Giải ngân buổi học Toán #5 (Học viên Hùng)', amount: 180000, balance: 1220000 },
    ]
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Trung Tâm Tài Chính & Ví Bảo Chứng Gia Sư
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Quản trị minh bạch dòng tiền Escrow, số dư khả dụng và hạn mức rút tiền về tài khoản ngân hàng
          </p>
        </div>

        <Link
          to="/tutor/wallet/withdraw"
          className="px-5 py-3 rounded-2xl bg-financial-available hover:bg-emerald-600 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-lg">payments</span>
          Yêu Cầu Rút Tiền Về Ngân Hàng
        </Link>
      </div>

      {/* Signature 4-Card Escrow Wallet Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Pending */}
        <div className="p-5 rounded-3xl bg-amber-500/10 border-2 border-amber-500/20 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900">1. Chờ Giải Ngân (Pending)</span>
            <span className="material-symbols-outlined text-amber-600">hourglass_top</span>
          </div>
          <div className="text-2xl font-extrabold text-amber-950 font-monospace-num">
            {formatCurrency(wallet.pendingBalance)}
          </div>
          <p className="text-[11px] text-amber-800">Tạm giữ an toàn trong Escrow các hợp đồng đang học</p>
        </div>

        {/* Card 2: Available */}
        <div className="p-5 rounded-3xl bg-emerald-500/10 border-2 border-emerald-500/20 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-900">2. Số Dư Khả Dụng (Available)</span>
            <span className="material-symbols-outlined text-financial-available">account_balance_wallet</span>
          </div>
          <div className="text-2xl font-extrabold text-emerald-950 font-monospace-num">
            {formatCurrency(wallet.availableBalance)}
          </div>
          <p className="text-[11px] text-emerald-800">Thu nhập các buổi học đã xong (sau trừ phí sàn 10%)</p>
        </div>

        {/* Card 3: Held */}
        <div className="p-5 rounded-3xl bg-rose-500/10 border-2 border-rose-500/20 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-900">3. Phong Tỏa Tranh Chấp (Held)</span>
            <span className="material-symbols-outlined text-rose-600">lock</span>
          </div>
          <div className="text-2xl font-extrabold text-rose-950 font-monospace-num">
            {formatCurrency(wallet.heldBalance)}
          </div>
          <p className="text-[11px] text-rose-800">Tạm khóa do có khiếu nại đang chờ phân xử</p>
        </div>

        {/* Card 4: Withdrawable */}
        <div className="p-5 rounded-3xl bg-white border-2 border-financial-available shadow-md space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">4. Hạn Mức Được Rút</span>
            <span className="material-symbols-outlined text-financial-available text-xl">savings</span>
          </div>
          <div className="text-2xl font-extrabold text-financial-available font-monospace-num">
            {formatCurrency(wallet.withdrawableBalance)}
          </div>
          <p className="text-[11px] text-text-muted">= Khả dụng ({formatCurrency(wallet.availableBalance)}) - Phong tỏa ({formatCurrency(wallet.heldBalance)})</p>
        </div>
      </div>

      {/* Wallet Statement Table */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-border-light shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <span className="material-symbols-outlined text-brand-indigo-600">receipt_long</span>
          Sổ Cái Sao Kê Ví Bảo Chứng
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-border-light">
              <tr>
                <th className="p-3">Thời gian</th>
                <th className="p-3">Loại biến động</th>
                <th className="p-3">Diễn giải giao dịch</th>
                <th className="p-3 text-right">Biến động</th>
                <th className="p-3 text-right">Số dư ví</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {wallet.statement.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/50">
                  <td className="p-3 font-monospace-num text-slate-600">{row.date}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      row.amount > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    }`}>
                      {row.type}
                    </span>
                  </td>
                  <td className="p-3 text-slate-800 font-medium">{row.desc}</td>
                  <td className={`p-3 text-right font-extrabold font-monospace-num ${
                    row.amount > 0 ? 'text-financial-available' : 'text-rose-600'
                  }`}>
                    {row.amount > 0 ? '+' : ''}{formatCurrency(row.amount)}
                  </td>
                  <td className="p-3 text-right font-extrabold font-monospace-num text-slate-900">
                    {formatCurrency(row.balance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
