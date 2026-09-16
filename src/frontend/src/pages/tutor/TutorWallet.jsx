import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import walletService from '@/services/wallet.service';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import { StatsSkeleton } from '@/components/common/Skeleton';
import ErrorState from '@/components/common/ErrorState';

export default function TutorWallet() {
  const [wallet, setWallet] = useState(null);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadWalletData() {
      try {
        setLoading(true);
        const [walletData, withdrawalRes] = await Promise.all([
          walletService.getMyWallet(),
          walletService.getWithdrawals({ pageSize: 15 }),
        ]);
        if (isMounted) {
          setWallet(walletData);
          setWithdrawals(withdrawalRes?.items || []);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadWalletData();
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="h-16 bg-slate-100 rounded-2xl animate-pulse" />
        <StatsSkeleton count={4} />
      </div>
    );
  }

  if (error || !wallet) {
    return (
      <div className="py-12">
        <ErrorState
          error={error}
          title="Không thể tải Ví bảo chứng"
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  const withdrawable = Math.max(0, (wallet.availableBalance || 0) - (wallet.heldBalance || 0));
  const canWithdraw = withdrawable >= 50000;
  const hasHeldFunds = (wallet.heldBalance || 0) > 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Trung Tâm Tài Chính & Ví Bảo Chứng Gia Sư
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Quản trị minh bạch dòng tiền Escrow, số dư khả dụng và hạn mức rút tiền (Quy tắc bất biến DEC-WD-001)
          </p>
        </div>

        {canWithdraw ? (
          <Link
            to="/tutor/wallet/withdraw"
            className="px-5 py-3 rounded-2xl bg-financial-available hover:bg-emerald-600 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-2 self-start sm:self-auto"
          >
            <span className="material-symbols-outlined text-lg">payments</span>
            Yêu Cầu Rút Tiền Về Ngân Hàng
          </Link>
        ) : (
          <button
            type="button"
            disabled
            title="Số dư khả dụng phải từ 50.000 ₫ trở lên mới được tạo lệnh rút."
            className="px-5 py-3 rounded-2xl bg-slate-200 text-slate-400 font-bold text-xs flex items-center gap-2 self-start sm:self-auto cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-lg">payments</span>
            Hạn Mức Rút Dưới 50.000 ₫
          </button>
        )}
      </div>

      {/* Signature 4-Card Escrow Wallet Metrics Grid DESIGN §3.3 */}
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
        <div
          className={`p-5 rounded-3xl bg-rose-500/10 border-2 space-y-2 transition-all ${
            hasHeldFunds ? 'border-rose-500 animate-pulse' : 'border-rose-500/20'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-900">3. Phong Tỏa Tranh Chấp (Held)</span>
            <span className={`material-symbols-outlined ${hasHeldFunds ? 'text-rose-600' : 'text-slate-400'}`}>
              lock
            </span>
          </div>
          <div className="text-2xl font-extrabold text-rose-950 font-monospace-num">
            {formatCurrency(wallet.heldBalance)}
          </div>
          <p className="text-[11px] text-rose-800">
            {hasHeldFunds
              ? 'Đang có khiếu nại chờ Bàn Trọng Tài giải quyết'
              : 'Không có khoản tiền nào bị phong tỏa'}
          </p>
        </div>

        {/* Card 4: Withdrawable — 28px bold Emerald token */}
        <div className="p-5 rounded-3xl bg-white border-2 border-financial-available shadow-md space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">4. Hạn Mức Được Rút</span>
            <span className="material-symbols-outlined text-financial-available text-xl">savings</span>
          </div>
          <div className="text-[28px] font-extrabold text-financial-available font-monospace-num leading-tight">
            {formatCurrency(withdrawable)}
          </div>
          <p className="text-[11px] text-text-muted">
            = Khả dụng ({formatCurrency(wallet.availableBalance)}) - Phong tỏa ({formatCurrency(wallet.heldBalance)})
          </p>
        </div>
      </div>

      {/* Wallet Withdrawals Statement Table */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-border-light shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <span className="material-symbols-outlined text-brand-indigo-600">receipt_long</span>
          Lịch Sử Lệnh Rút Tiền Về Ngân Hàng
        </h3>

        {withdrawals.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400 space-y-1">
            <span className="material-symbols-outlined text-2xl text-slate-300 block">history</span>
            <p className="m-0 font-medium">Chưa có giao dịch rút tiền nào.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-border-light">
                <tr>
                  <th className="p-3">Thời gian</th>
                  <th className="p-3">Ngân hàng thụ hưởng</th>
                  <th className="p-3">Ghi chú</th>
                  <th className="p-3">Trạng thái</th>
                  <th className="p-3 text-right">Số tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {withdrawals.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-monospace-num text-slate-600">
                      {formatDateTime(row.requestedAt)}
                    </td>
                    <td className="p-3">
                      <span className="font-bold text-slate-800 block">{row.bankName}</span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {row.accountNumber} ({row.accountHolderName})
                      </span>
                    </td>
                    <td className="p-3 text-slate-600">{row.note || 'Rút thù lao giảng dạy'}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          row.status === 'Completed'
                            ? 'bg-emerald-50 text-emerald-700'
                            : row.status === 'Processing'
                            ? 'bg-blue-50 text-blue-700'
                            : row.status === 'Failed'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {row.status === 'Completed'
                          ? 'Thành công ✅'
                          : row.status === 'Processing'
                          ? 'Đang xử lý'
                          : row.status === 'Failed'
                          ? 'Thất bại'
                          : 'Chờ duyệt'}
                      </span>
                    </td>
                    <td className="p-3 text-right font-extrabold font-monospace-num text-rose-600">
                      -{formatCurrency(row.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
