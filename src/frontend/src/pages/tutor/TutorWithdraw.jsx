import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import walletService from '@/services/wallet.service';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import { message } from 'antd';
import ErrorState from '@/components/common/ErrorState';

export default function TutorWithdraw() {
  const navigate = useNavigate();
  const [wallet, setWallet] = useState(null);
  const [payoutAccount, setPayoutAccount] = useState(null);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [amount, setAmount] = useState('50000');
  const [note, setNote] = useState('Rút thù lao giảng dạy');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        const [walletData, account, history] = await Promise.all([
          walletService.getMyWallet(),
          walletService.getPayoutAccount(),
          walletService.getWithdrawals({ pageSize: 5 }),
        ]);
        if (isMounted) {
          setWallet(walletData);
          setPayoutAccount(account);
          setWithdrawals(history?.items || []);
          if (walletData?.withdrawableBalance) {
            setAmount(String(Math.min(walletData.withdrawableBalance, 500000)));
          }
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

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const withdrawableLimit = Math.max(0, (wallet?.availableBalance || 0) - (wallet?.heldBalance || 0));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const num = parseInt(amount, 10);
    if (!num || num < 50000) {
      message.error('Số tiền rút tối thiểu là 50.000 ₫');
      return;
    }
    if (num > withdrawableLimit) {
      message.error('Số tiền rút vượt quá hạn mức được phép');
      return;
    }
    if (!payoutAccount?.accountNumber) {
      message.error('Chưa có thông tin tài khoản ngân hàng thụ hưởng.');
      return;
    }

    try {
      setSubmitting(true);
      await walletService.createWithdrawal({
        amount: num,
        bankName: payoutAccount.bankName || 'Ngân Hàng',
        bankCode: payoutAccount.bankCode || 'BANK',
        accountNumber: payoutAccount.accountNumber,
        accountHolderName: payoutAccount.accountHolderName,
        note: note.trim() || 'Rút thù lao giảng dạy',
      });
      message.success(`Đã tạo lệnh rút ${formatCurrency(num)} thành công! Lệnh đang chờ xử lý.`);
      navigate('/tutor/wallet');
    } catch (err) {
      message.error(err?.message || 'Không thể tạo lệnh rút tiền.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center text-slate-500">
        <span className="material-symbols-outlined text-3xl animate-spin text-brand-indigo-600 block mb-2">
          sync
        </span>
        Đang tải thông tin ví và tài khoản ngân hàng...
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <ErrorState error={error} backPath="/tutor/wallet" backLabel="Quay lại ví" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Link
        to="/tutor/wallet"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-brand-indigo-600 transition-colors"
      >
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
              <label htmlFor="withdraw-amount" className="text-xs font-bold text-slate-700 block">
                Số tiền muốn rút (₫)
              </label>
              <input
                id="withdraw-amount"
                type="number"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="50000"
                max={withdrawableLimit}
                className="w-full px-4 py-3 rounded-xl border border-border-light text-slate-900 font-monospace-num font-bold text-base focus:ring-2 focus:ring-brand-indigo-500 outline-none"
              />
              <span className="text-[11px] text-text-muted block">
                Tối thiểu: 50.000 ₫ • Tối đa: {formatCurrency(withdrawableLimit)}
              </span>
            </div>

            {/* Linked Bank Card */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 block">
                Tài khoản ngân hàng thụ hưởng đã xác thực
              </span>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-900 block">
                    {payoutAccount?.bankName || 'Ngân hàng thụ hưởng'}
                  </span>
                  <span className="text-slate-600 font-monospace-num">
                    STK: {payoutAccount?.accountNumber || '—'} • {payoutAccount?.accountHolderName || ''}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-financial-available text-[10px] font-bold">
                  ĐÃ XÁC THỰC KYC ✅
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="withdraw-note" className="text-xs font-bold text-slate-700 block">
                Ghi chú giao dịch
              </label>
              <input
                id="withdraw-note"
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-border-light text-slate-900 text-xs focus:ring-2 focus:ring-brand-indigo-500 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || withdrawableLimit < 50000}
              className="w-full py-3.5 rounded-2xl bg-financial-available hover:bg-emerald-600 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-base">send</span>
              {submitting
                ? 'Đang gửi lệnh...'
                : `Xác Nhận Rút ${formatCurrency(parseInt(amount, 10) || 0)} Về Ngân Hàng`}
            </button>
          </form>
        </div>

        {/* Withdrawal History Card */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white border border-border-light shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-brand-indigo-600">history</span>
              Lệnh Rút Gần Đây
            </h3>

            {withdrawals.length === 0 ? (
              <p className="text-xs text-slate-400 m-0 text-center py-4">Chưa có giao dịch rút tiền nào.</p>
            ) : (
              <div className="space-y-3 text-xs">
                {withdrawals.map((w) => (
                  <div key={w.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                    <div className="flex justify-between">
                      <span className="font-monospace-num font-bold text-slate-800">
                        {w.id.slice(0, 8).toUpperCase()}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          w.status === 'Completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : w.status === 'Processing'
                            ? 'bg-blue-100 text-blue-800'
                            : w.status === 'Failed'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {w.status === 'Completed'
                          ? 'Thành công ✅'
                          : w.status === 'Processing'
                          ? 'Đang xử lý'
                          : w.status === 'Failed'
                          ? 'Thất bại'
                          : 'Chờ duyệt ⏳'}
                      </span>
                    </div>
                    <div className="flex justify-between text-text-muted">
                      <span>{formatDateTime(w.requestedAt, 'DD/MM/YYYY')}</span>
                      <span className="font-bold text-slate-800 font-monospace-num">
                        {formatCurrency(w.amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
