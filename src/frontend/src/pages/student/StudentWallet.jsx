import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/cn';
import studentWalletService from '@/services/studentWallet.service';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import Money from '@/components/ui/Money';
import { StatsSkeleton, TableSkeleton } from '@/components/common/Skeleton';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import Card, { CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import StatCard, { PageHeader } from '@/components/ui/StatCard';
import Icon from '@/components/ui/Icon';
import Tabs from '@/components/ui/Tabs';
import Input, { Field } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

const VIETNAM_BANKS = [
  { code: 'VCB', name: 'Vietcombank' },
  { code: 'TCB', name: 'Techcombank' },
  { code: 'MB', name: 'MBBank' },
  { code: 'ACB', name: 'ACB' },
  { code: 'BIDV', name: 'BIDV' },
  { code: 'VTB', name: 'VietinBank' },
  { code: 'VPB', name: 'VPBank' },
  { code: 'TPB', name: 'TPBank' },
  { code: 'HDB', name: 'HDBank' },
  { code: 'STB', name: 'Sacombank' },
];

const PRESET_AMOUNTS = [100000, 200000, 500000, 1000000, 2000000, 5000000];

export default function StudentWallet() {
  const toast = useToast();

  const [wallet, setWallet] = useState(null);
  const [loadingWallet, setLoadingWallet] = useState(true);
  const [error, setError] = useState(null);

  // Active Tab: 'statement' | 'topups' | 'withdrawals'
  const [activeTab, setActiveTab] = useState('statement');

  // Ledger Statement state
  const [statement, setStatement] = useState([]);
  const [statementLoading, setStatementLoading] = useState(false);
  const [statementPage, setStatementPage] = useState(1);
  const [statementTotal, setStatementTotal] = useState(0);

  // Top-Up history state
  const [topUps, setTopUps] = useState([]);
  const [topUpsLoading, setTopUpsLoading] = useState(false);

  // Withdrawals history state
  const [withdrawals, setWithdrawals] = useState([]);
  const [withdrawalsLoading, setWithdrawalsLoading] = useState(false);

  // Top-up Modal & Process state
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState(200000);
  const [customTopUpInput, setCustomTopUpInput] = useState('');
  const [topUpMethod, setTopUpMethod] = useState('vnpay'); // 'vnpay' | 'vietqr'
  const [activeTopUpRequest, setActiveTopUpRequest] = useState(null);
  const [topUpSubmitting, setTopUpSubmitting] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);

  // Withdrawal Modal state
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('100000');
  const [selectedBank, setSelectedBank] = useState('VCB');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [withdrawNote, setWithdrawNote] = useState('Rút tiền từ Ví Học Viên');
  const [withdrawSubmitting, setWithdrawSubmitting] = useState(false);

  // 1. Fetch wallet overview
  const fetchWallet = useCallback(async () => {
    try {
      setLoadingWallet(true);
      const data = await studentWalletService.getMyWallet();
      setWallet(data);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoadingWallet(false);
    }
  }, []);

  // 2. Fetch Statement
  const fetchStatement = useCallback(async (page = 1) => {
    try {
      setStatementLoading(true);
      const res = await studentWalletService.getStatement({ pageNumber: page, pageSize: 15 });
      setStatement(res?.items || []);
      setStatementTotal(res?.totalCount || 0);
      setStatementPage(page);
    } catch {
      toast.error('Không thể tải sao kê sổ cái ví.');
    } finally {
      setStatementLoading(false);
    }
  }, [toast]);

  // 3. Fetch Top-Up Requests
  const fetchTopUps = useCallback(async () => {
    try {
      setTopUpsLoading(true);
      const res = await studentWalletService.getMyTopUpRequests({ pageNumber: 1, pageSize: 20 });
      setTopUps(res?.items || []);
    } catch {
      toast.error('Không thể tải lịch sử nạp tiền.');
    } finally {
      setTopUpsLoading(false);
    }
  }, [toast]);

  // 4. Fetch Withdrawals
  const fetchWithdrawals = useCallback(async () => {
    try {
      setWithdrawalsLoading(true);
      const res = await studentWalletService.getMyWithdrawals({ pageNumber: 1, pageSize: 20 });
      setWithdrawals(res?.items || []);
    } catch {
      toast.error('Không thể tải lịch sử rút tiền.');
    } finally {
      setWithdrawalsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  useEffect(() => {
    if (activeTab === 'statement') fetchStatement(1);
    else if (activeTab === 'topups') fetchTopUps();
    else if (activeTab === 'withdrawals') fetchWithdrawals();
  }, [activeTab, fetchStatement, fetchTopUps, fetchWithdrawals]);

  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success('Đã sao chép vào bộ nhớ tạm');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Submit Top-Up Request (Supports both VNPay Instant & VietQR Manual)
  const handleRequestTopUp = async () => {
    const finalAmount = customTopUpInput ? Number(customTopUpInput) : Number(topUpAmount);
    if (!finalAmount || finalAmount < 10000) {
      toast.error('Số tiền nạp tối thiểu là 10.000 ₫');
      return;
    }

    try {
      setTopUpSubmitting(true);
      if (topUpMethod === 'vnpay') {
        const res = await studentWalletService.createVnPayTopUp({ amount: finalAmount });
        if (res?.paymentUrl) {
          toast.info('Đang chuyển hướng đến Cổng thanh toán VNPay Sandbox...');
          window.location.href = res.paymentUrl;
        } else {
          toast.error('Không nhận được liên kết thanh toán từ VNPay.');
        }
      } else {
        const res = await studentWalletService.requestTopUp({ amount: finalAmount });
        setActiveTopUpRequest(res);
        toast.success('Đã tạo yêu cầu nạp tiền! Vui lòng quét mã VietQR để chuyển khoản.');
        fetchTopUps();
      }
    } catch (err) {
      toast.error(err?.message || 'Không thể tạo yêu cầu nạp tiền.');
    } finally {
      setTopUpSubmitting(false);
    }
  };

  // Submit Withdrawal Request
  const handleRequestWithdrawal = async (e) => {
    e.preventDefault();
    const num = parseInt(withdrawAmount, 10);
    if (!num || num < 50000) {
      toast.error('Số tiền rút tối thiểu là 50.000 ₫');
      return;
    }
    if (num > (wallet?.availableBalance || 0)) {
      toast.error('Số tiền rút vượt quá số dư khả dụng.');
      return;
    }
    if (!accountNumber.trim() || !accountHolderName.trim()) {
      toast.error('Vui lòng nhập đầy đủ số tài khoản và tên chủ tài khoản.');
      return;
    }

    const bankObj = VIETNAM_BANKS.find((b) => b.code === selectedBank) || VIETNAM_BANKS[0];

    try {
      setWithdrawSubmitting(true);
      await studentWalletService.requestWithdrawal({
        amount: num,
        bankName: bankObj.name,
        bankCode: bankObj.code,
        accountNumber: accountNumber.trim(),
        accountHolderName: accountHolderName.trim().toUpperCase(),
        note: withdrawNote.trim() || 'Rút tiền từ Ví Học Viên',
      });
      toast.success(`Đã gửi yêu cầu rút ${formatCurrency(num)}! Yêu cầu đang được xử lý.`);
      setShowWithdrawModal(false);
      fetchWallet();
      fetchWithdrawals();
    } catch (err) {
      toast.error(err?.message || 'Không thể gửi yêu cầu rút tiền.');
    } finally {
      setWithdrawSubmitting(false);
    }
  };

  if (loadingWallet) {
    return (
      <div className="space-y-6">
        <div className="h-16 bg-neutral-200 rounded-brand-md animate-pulse" />
        <StatsSkeleton count={3} />
      </div>
    );
  }

  if (error || !wallet) {
    return (
      <div className="py-12">
        <ErrorState
          error={error}
          title="Không thể tải Ví Học Viên"
          onRetry={fetchWallet}
        />
      </div>
    );
  }

  const canWithdraw = (wallet.availableBalance || 0) >= 50000;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ví Học Viên (Student Wallet)"
        subtitle="Quản lý số dư, chủ động nạp tiền mua khóa học 1-Click hoặc rút tiền hoàn về tài khoản ngân hàng."
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="md"
              icon={<Icon name="payments" size="sm" />}
              onClick={() => setShowWithdrawModal(true)}
              disabled={!canWithdraw}
              title={!canWithdraw ? 'Số dư khả dụng tối thiểu 50.000 ₫ để rút tiền' : undefined}
            >
              Rút tiền về ngân hàng
            </Button>
            <Button
              variant="primary"
              size="md"
              icon={<Icon name="add_circle" size="sm" />}
              onClick={() => {
                setActiveTopUpRequest(null);
                setShowTopUpModal(true);
              }}
            >
              Nạp tiền vào ví
            </Button>
          </div>
        }
      />

      {/* 3 Financial Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Số dư khả dụng"
          value={<Money value={wallet.availableBalance} />}
          hint="Có thể thanh toán khóa học ngay hoặc rút về ngân hàng"
          icon={<Icon name="account_balance_wallet" size="md" />}
          tone="success"
          className="border-2 border-emerald-500/80 shadow-brand-md bg-emerald-50/20"
        />
        <StatCard
          label="Đang chờ rút (Reserved)"
          value={<Money value={wallet.reservedBalance} />}
          hint="Đang trong quá trình xét duyệt chuyển khoản về ngân hàng"
          icon={<Icon name="hourglass_top" size="md" />}
          tone="holding"
        />
        <StatCard
          label="Tổng số dư ví"
          value={<Money value={wallet.totalBalance} />}
          hint="Tổng nguồn vốn trong ví học viên TutorHub"
          icon={<Icon name="savings" size="md" />}
          tone="default"
        />
      </div>

      {/* Wallet Instructions & Security Guarantee Banner */}
      <div className="p-4 rounded-brand-lg bg-surface border border-border shadow-brand-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <Icon name="shield" size="sm" filled />
          </div>
          <div>
            <h4 className="font-bold text-caption text-fg m-0">An toàn tài chính & Sổ cái bất biến</h4>
            <p className="text-[12px] text-fg-muted m-0">
              100% giao dịch biến động số dư được ghi nhận sổ cái điện toán (Ledger) minh bạch. Tiền hoàn từ buổi học hoặc tranh chấp sẽ được tự động cộng vào số dư khả dụng.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="success" size="sm">Đảm bảo Escrow</Badge>
          <Badge variant="neutral" size="sm">Rút tối thiểu 50.000 ₫</Badge>
        </div>
      </div>

      {/* Navigation Tabs for Statements & History */}
      <div className="space-y-4">
        <Tabs
          tabs={[
            { id: 'statement', label: 'Sổ cái biến động số dư' },
            { id: 'topups', label: 'Lịch sử nạp tiền' },
            { id: 'withdrawals', label: 'Lịch sử rút tiền' },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        {/* Tab 1: Statement (Ledger) */}
        {activeTab === 'statement' && (
          <Card padding="lg" className="space-y-4 border border-border shadow-brand-sm">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <CardHeader
                title="Lịch sử giao dịch sổ cái (Audit Ledger)"
                icon={<Icon name="receipt_long" size="sm" className="text-brand-primary-600" />}
              />
              <span className="text-caption text-fg-muted">
                Tổng cộng {statementTotal} bản ghi sổ cái
              </span>
            </div>

            {statementLoading ? (
              <TableSkeleton rows={5} />
            ) : statement.length === 0 ? (
              <EmptyState
                icon="history"
                title="Chưa có giao dịch biến động nào"
                description="Khi bạn nạp tiền, thanh toán khóa học hoặc nhận hoàn tiền, lịch sử chi tiết sẽ hiển thị tại đây."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-caption text-left">
                  <thead>
                    <tr className="bg-neutral-50 border-b border-border">
                      <th className="px-4 py-3 font-semibold text-fg-secondary uppercase tracking-wide">Thời gian</th>
                      <th className="px-4 py-3 font-semibold text-fg-secondary uppercase tracking-wide">Loại giao dịch</th>
                      <th className="px-4 py-3 font-semibold text-fg-secondary uppercase tracking-wide">Diễn giải & Tham chiếu</th>
                      <th className="px-4 py-3 font-semibold text-fg-secondary uppercase tracking-wide text-right">Số dư trước</th>
                      <th className="px-4 py-3 font-semibold text-fg-secondary uppercase tracking-wide text-right">Biến động</th>
                      <th className="px-4 py-3 font-semibold text-fg-secondary uppercase tracking-wide text-right">Số dư sau</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {statement.map((item) => {
                      const isCredit = item.direction === 'Credit';
                      return (
                        <tr key={item.id} className="hover:bg-neutral-50/80 transition-colors">
                          <td className="px-4 py-3 font-mono text-fg-secondary whitespace-nowrap">
                            {formatDateTime(item.createdAt)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <Badge variant={isCredit ? 'success' : 'neutral'} size="sm">
                              {item.type}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-semibold text-fg block">
                              {item.description || item.reason || 'Biến động số dư'}
                            </span>
                            {item.referenceType && (
                              <span className="text-[11px] text-fg-muted font-mono block">
                                Nguồn: {item.referenceType} #{String(item.referenceId || '').slice(0, 8)}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-fg-muted tabular-nums">
                            {formatCurrency(item.balanceBefore)}
                          </td>
                          <td className={cn(
                            "px-4 py-3 text-right font-bold font-mono tabular-nums whitespace-nowrap",
                            isCredit ? "text-success-strong" : "text-danger-strong"
                          )}>
                            {isCredit ? `+${formatCurrency(item.amount)}` : `-${formatCurrency(item.amount)}`}
                          </td>
                          <td className="px-4 py-3 text-right font-bold font-mono text-fg tabular-nums">
                            {formatCurrency(item.balanceAfter)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {/* Tab 2: Top-Up Requests */}
        {activeTab === 'topups' && (
          <Card padding="lg" className="space-y-4 border border-border shadow-brand-sm">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <CardHeader
                title="Lịch sử yêu cầu nạp tiền"
                icon={<Icon name="add_card" size="sm" className="text-brand-primary-600" />}
              />
              <span className="text-caption text-fg-muted">{topUps.length} yêu cầu</span>
            </div>

            {topUpsLoading ? (
              <TableSkeleton rows={5} />
            ) : topUps.length === 0 ? (
              <EmptyState
                icon="account_balance"
                title="Chưa có yêu cầu nạp tiền nào"
                description="Bấm 'Nạp tiền vào ví' để tạo mã chuyển khoản nạp tiền đầu tiên."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[650px] text-caption text-left">
                  <thead>
                    <tr className="bg-neutral-50 border-b border-border">
                      <th className="px-4 py-3 font-semibold text-fg-secondary uppercase tracking-wide">Thời gian tạo</th>
                      <th className="px-4 py-3 font-semibold text-fg-secondary uppercase tracking-wide">Mã chuyển khoản</th>
                      <th className="px-4 py-3 font-semibold text-fg-secondary uppercase tracking-wide">Số tiền nạp</th>
                      <th className="px-4 py-3 font-semibold text-fg-secondary uppercase tracking-wide">Trạng thái</th>
                      <th className="px-4 py-3 font-semibold text-fg-secondary uppercase tracking-wide">Ghi chú xử lý</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {topUps.map((r) => {
                      const isPending = r.status === 'Pending';
                      const isConfirmed = r.status === 'Confirmed';
                      const isRejected = r.status === 'Rejected';
                      return (
                        <tr key={r.id} className="hover:bg-neutral-50/80 transition-colors">
                          <td className="px-4 py-3 font-mono text-fg-secondary whitespace-nowrap">
                            {formatDateTime(r.requestedAt)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-brand-primary-700 bg-brand-primary-50 px-2 py-0.5 rounded border border-brand-primary-200">
                                {r.transferReference}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopy(r.transferReference, r.id)}
                                className="text-fg-muted hover:text-fg transition-colors"
                                title="Sao chép cú pháp"
                              >
                                <Icon name={copiedKey === r.id ? 'check' : 'content_copy'} size="xs" />
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-bold font-mono text-success-strong tabular-nums">
                            +{formatCurrency(r.amount)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <Badge
                              variant={isConfirmed ? 'success' : isRejected ? 'danger' : 'warning'}
                              size="sm"
                            >
                              {isConfirmed ? 'Đã cộng tiền' : isRejected ? 'Đã từ chối' : 'Chờ xác nhận'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-fg-secondary">
                            {r.rejectionReason || r.adminNote || (isPending ? 'Đang đợi chuyển khoản đối soát' : '—')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {/* Tab 3: Withdrawals */}
        {activeTab === 'withdrawals' && (
          <Card padding="lg" className="space-y-4 border border-border shadow-brand-sm">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <CardHeader
                title="Lịch sử yêu cầu rút tiền"
                icon={<Icon name="payments" size="sm" className="text-brand-primary-600" />}
              />
              <span className="text-caption text-fg-muted">{withdrawals.length} lệnh rút</span>
            </div>

            {withdrawalsLoading ? (
              <TableSkeleton rows={5} />
            ) : withdrawals.length === 0 ? (
              <EmptyState
                icon="payments"
                title="Chưa có yêu cầu rút tiền nào"
                description="Bạn có thể rút tiền từ số dư khả dụng về bất kỳ tài khoản ngân hàng nào tại Việt Nam."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[650px] text-caption text-left">
                  <thead>
                    <tr className="bg-neutral-50 border-b border-border">
                      <th className="px-4 py-3 font-semibold text-fg-secondary uppercase tracking-wide">Thời gian yêu cầu</th>
                      <th className="px-4 py-3 font-semibold text-fg-secondary uppercase tracking-wide">Tài khoản nhận</th>
                      <th className="px-4 py-3 font-semibold text-fg-secondary uppercase tracking-wide text-right">Số tiền</th>
                      <th className="px-4 py-3 font-semibold text-fg-secondary uppercase tracking-wide">Trạng thái</th>
                      <th className="px-4 py-3 font-semibold text-fg-secondary uppercase tracking-wide">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {withdrawals.map((w) => {
                      const isCompleted = w.status === 'Completed';
                      const isFailed = w.status === 'Failed';
                      const isProcessing = w.status === 'Processing';
                      return (
                        <tr key={w.id} className="hover:bg-neutral-50/80 transition-colors">
                          <td className="px-4 py-3 font-mono text-fg-secondary whitespace-nowrap">
                            {formatDateTime(w.requestedAt)}
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-semibold text-fg block">{w.bankName}</span>
                            <span className="text-[11px] font-mono text-fg-muted">
                              {w.accountNumber} ({w.accountHolderName})
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-bold font-mono text-danger-strong tabular-nums whitespace-nowrap">
                            -{formatCurrency(w.amount)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <Badge
                              variant={isCompleted ? 'success' : isFailed ? 'danger' : isProcessing ? 'holding' : 'warning'}
                              size="sm"
                            >
                              {isCompleted ? 'Đã chuyển' : isFailed ? 'Thất bại (hoàn lại)' : isProcessing ? 'Đang chuyển khoản' : 'Chờ xử lý'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-fg-secondary">
                            {w.failureReason || w.note || '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}
      </div>

      {/* TOP-UP MODAL */}
      {showTopUpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg bg-surface rounded-brand-lg border border-border shadow-brand-xl overflow-hidden animate-scale-up">
            <div className="flex items-center justify-between p-4 border-b border-border bg-neutral-50/80">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-brand-primary-100 text-brand-primary-700 flex items-center justify-center">
                  <Icon name="add_circle" size="xs" />
                </div>
                <h3 className="text-body-reg font-bold text-fg m-0">
                  {activeTopUpRequest ? 'Quét mã VietQR để nạp tiền' : 'Nạp tiền vào Ví Học Viên'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTopUpModal(false)}
                className="p-1 rounded-brand-sm text-fg-muted hover:text-fg hover:bg-neutral-200/60 transition-colors"
              >
                <Icon name="close" size="sm" />
              </button>
            </div>

            <div className="p-5 space-y-5 max-h-[80vh] overflow-y-auto">
              {!activeTopUpRequest ? (
                // Step 1: Choose method & amount
                <div className="space-y-4">
                  {/* Payment Method Selector */}
                  <div>
                    <label className="text-caption font-semibold text-fg-secondary block mb-2">
                      Phương thức nạp tiền
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setTopUpMethod('vnpay')}
                        className={cn(
                          'p-3 rounded-brand-md border text-left transition-all cursor-pointer flex items-start gap-2.5',
                          topUpMethod === 'vnpay'
                            ? 'bg-brand-primary-50/70 border-brand-primary-600 ring-2 ring-brand-primary-600/20'
                            : 'bg-surface border-border hover:border-neutral-400'
                        )}
                      >
                        <div
                          className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5',
                            topUpMethod === 'vnpay'
                              ? 'bg-brand-primary-600 text-white'
                              : 'bg-neutral-100 text-fg-muted'
                          )}
                        >
                          <Icon name="credit_card" size="xs" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-caption font-bold text-fg">VNPay Sandbox</span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-success-subtle text-success-strong">
                              Tự động 24/7
                            </span>
                          </div>
                          <p className="text-[11px] text-fg-muted mt-0.5">
                            Thanh toán thẻ ATM/QR test, tiền vào ví tức thì.
                          </p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setTopUpMethod('vietqr')}
                        className={cn(
                          'p-3 rounded-brand-md border text-left transition-all cursor-pointer flex items-start gap-2.5',
                          topUpMethod === 'vietqr'
                            ? 'bg-brand-primary-50/70 border-brand-primary-600 ring-2 ring-brand-primary-600/20'
                            : 'bg-surface border-border hover:border-neutral-400'
                        )}
                      >
                        <div
                          className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5',
                            topUpMethod === 'vietqr'
                              ? 'bg-brand-primary-600 text-white'
                              : 'bg-neutral-100 text-fg-muted'
                          )}
                        >
                          <Icon name="qr_code_scanner" size="xs" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-caption font-bold text-fg">Chuyển khoản VietQR</span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-neutral-200 text-fg-muted">
                              Admin duyệt
                            </span>
                          </div>
                          <p className="text-[11px] text-fg-muted mt-0.5">
                            Quét QR App ngân hàng, không phí trung gian.
                          </p>
                        </div>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-caption font-semibold text-fg-secondary block mb-2">
                      Chọn nhanh mệnh giá nạp
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {PRESET_AMOUNTS.map((amt) => {
                        const isSelected = !customTopUpInput && topUpAmount === amt;
                        return (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => {
                              setTopUpAmount(amt);
                              setCustomTopUpInput('');
                            }}
                            className={cn(
                              'py-2 px-3 rounded-brand-md text-caption font-bold border transition-all text-center',
                              isSelected
                                ? 'bg-brand-primary-50 border-brand-primary-600 text-brand-primary-700 shadow-brand-xs'
                                : 'bg-surface border-border hover:border-neutral-400 text-fg'
                            )}
                          >
                            {formatCurrency(amt)}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <Field label="Hoặc nhập số tiền tùy chọn (VND)">
                    <Input
                      type="number"
                      placeholder="Ví dụ: 350000"
                      value={customTopUpInput}
                      onChange={(e) => setCustomTopUpInput(e.target.value)}
                      min="10000"
                      step="10000"
                    />
                  </Field>

                  <div className="p-3.5 rounded-brand-md bg-neutral-50 border border-border text-caption space-y-1.5">
                    <div className="flex items-center gap-1.5 text-fg font-semibold">
                      <Icon name="info" size="xs" className="text-brand-primary-600" />
                      <span>{topUpMethod === 'vnpay' ? 'Cổng thanh toán tự động VNPay:' : 'Chuyển khoản trực tiếp VietQR:'}</span>
                    </div>
                    <ul className="list-disc list-inside text-fg-muted text-[11px] space-y-1">
                      {topUpMethod === 'vnpay' ? (
                        <>
                          <li>Hệ thống chuyển hướng bạn sang cổng VNPay Sandbox để nhập thông tin thẻ test.</li>
                          <li>Sau khi xác nhận mã OTP, số dư ví sẽ được tự động cộng ngay lập tức.</li>
                          <li>Số tiền nạp tối thiểu là 10.000 ₫.</li>
                        </>
                      ) : (
                        <>
                          <li>Hệ thống tạo mã VietQR động với cú pháp định danh duy nhất.</li>
                          <li>Sau khi bạn chuyển khoản đúng cú pháp, Admin đối soát và duyệt trong 1-3 phút.</li>
                          <li>Số tiền nạp tối thiểu là 10.000 ₫.</li>
                        </>
                      )}
                    </ul>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
                    <Button variant="outline" onClick={() => setShowTopUpModal(false)}>
                      Hủy bỏ
                    </Button>
                    <Button
                      variant="primary"
                      loading={topUpSubmitting}
                      onClick={handleRequestTopUp}
                    >
                      {topUpMethod === 'vnpay'
                        ? `Thanh toán qua VNPay (${formatCurrency(customTopUpInput ? Number(customTopUpInput) : topUpAmount)})`
                        : `Tạo mã VietQR (${formatCurrency(customTopUpInput ? Number(customTopUpInput) : topUpAmount)})`}
                    </Button>
                  </div>
                </div>
              ) : (
                // Step 2: VietQR & Transfer Reference
                <div className="space-y-4">
                  {/* VietQR Code */}
                  <div className="flex flex-col items-center justify-center p-4 bg-neutral-50 rounded-brand-md border border-border">
                    <img
                      src={`https://img.vietqr.io/image/VCB-1029384756-compact2.png?amount=${activeTopUpRequest.amount}&addInfo=${encodeURIComponent(activeTopUpRequest.transferReference)}&accountName=${encodeURIComponent(activeTopUpRequest.bankAccountName || 'TUTORHUB JSC')}`}
                      alt="VietQR Chuyển Khoản"
                      className="w-56 h-auto rounded-brand-sm shadow-brand-sm border border-neutral-200"
                    />
                    <p className="text-[11px] text-fg-muted mt-2 text-center">
                      Mở ứng dụng ngân hàng bất kỳ để quét mã VietQR tự động điền thông tin
                    </p>
                  </div>

                  {/* Transfer Details Card */}
                  <div className="space-y-2.5 text-caption bg-surface p-3.5 rounded-brand-md border border-border">
                    <div className="flex items-center justify-between pb-2 border-b border-border">
                      <span className="text-fg-secondary">Ngân hàng thụ hưởng:</span>
                      <span className="font-bold text-fg">{activeTopUpRequest.bankName || 'Vietcombank'}</span>
                    </div>
                    <div className="flex items-center justify-between pb-2 border-b border-border">
                      <span className="text-fg-secondary">Số tài khoản:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-fg text-body-reg">{activeTopUpRequest.bankAccountNo || '1029384756'}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(activeTopUpRequest.bankAccountNo || '1029384756', 'acc')}
                          className="text-brand-primary-600 hover:text-brand-primary-700"
                        >
                          <Icon name={copiedKey === 'acc' ? 'check' : 'content_copy'} size="xs" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pb-2 border-b border-border">
                      <span className="text-fg-secondary">Chủ tài khoản:</span>
                      <span className="font-bold text-fg">{activeTopUpRequest.bankAccountName || 'TUTORHUB JSC'}</span>
                    </div>
                    <div className="flex items-center justify-between pb-2 border-b border-border">
                      <span className="text-fg-secondary">Số tiền nạp:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold font-mono text-success-strong text-body-reg">
                          {formatCurrency(activeTopUpRequest.amount)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(String(activeTopUpRequest.amount), 'amt')}
                          className="text-brand-primary-600 hover:text-brand-primary-700"
                        >
                          <Icon name={copiedKey === 'amt' ? 'check' : 'content_copy'} size="xs" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-fg-secondary font-semibold text-danger-strong">Nội dung chuyển khoản:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-brand-primary-700 bg-brand-primary-50 px-2 py-0.5 rounded border border-brand-primary-300">
                          {activeTopUpRequest.transferReference}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(activeTopUpRequest.transferReference, 'ref')}
                          className="text-brand-primary-600 hover:text-brand-primary-700"
                        >
                          <Icon name={copiedKey === 'ref' ? 'check' : 'content_copy'} size="xs" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-brand-md bg-amber-50/80 border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
                    ⚠️ <strong>Lưu ý bắt buộc:</strong> Vui lòng điền <strong>chính xác tuyệt đối nội dung chuyển khoản</strong> để hệ thống đối soát tự động ghi nhận tiền vào ví của bạn.
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
                    <Button
                      variant="primary"
                      fullWidth
                      onClick={() => {
                        setShowTopUpModal(false);
                        fetchWallet();
                        setActiveTab('topups');
                      }}
                    >
                      Tôi đã chuyển khoản xong
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* WITHDRAWAL MODAL */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-surface rounded-brand-lg border border-border shadow-brand-xl overflow-hidden animate-scale-up">
            <div className="flex items-center justify-between p-4 border-b border-border bg-neutral-50/80">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Icon name="payments" size="xs" />
                </div>
                <h3 className="text-body-reg font-bold text-fg m-0">Rút tiền về tài khoản ngân hàng</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowWithdrawModal(false)}
                className="p-1 rounded-brand-sm text-fg-muted hover:text-fg hover:bg-neutral-200/60 transition-colors"
              >
                <Icon name="close" size="sm" />
              </button>
            </div>

            <form onSubmit={handleRequestWithdrawal} className="p-5 space-y-4">
              <div className="p-3 rounded-brand-md bg-emerald-50/60 border border-emerald-200 text-caption flex justify-between items-center">
                <span className="text-emerald-900 font-medium">Số dư khả dụng:</span>
                <span className="font-bold text-emerald-800 text-body-reg">
                  {formatCurrency(wallet.availableBalance)}
                </span>
              </div>

              <Field label="Số tiền muốn rút (Tối thiểu 50.000 ₫)">
                <Input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  min="50000"
                  max={wallet.availableBalance}
                  step="10000"
                  required
                />
              </Field>

              <Field label="Ngân hàng nhận tiền">
                <select
                  value={selectedBank}
                  onChange={(e) => setSelectedBank(e.target.value)}
                  className="w-full h-10 rounded-brand-md border border-border bg-surface px-3 text-caption text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary-600"
                >
                  {VIETNAM_BANKS.map((b) => (
                    <option key={b.code} value={b.code}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Số tài khoản ngân hàng">
                <Input
                  placeholder="Ví dụ: 0123456789"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  required
                />
              </Field>

              <Field label="Tên chủ tài khoản (In hoa không dấu)">
                <Input
                  placeholder="Ví dụ: NGUYEN VAN A"
                  value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value.toUpperCase())}
                  required
                />
              </Field>

              <Field label="Ghi chú (Tùy chọn)">
                <Input
                  value={withdrawNote}
                  onChange={(e) => setWithdrawNote(e.target.value)}
                />
              </Field>

              <p className="text-[11px] text-fg-muted">
                Khi tạo lệnh, số tiền rút sẽ được tạm giữ (Reserved). Sau khi Admin giải ngân, tiền sẽ vào tài khoản ngân hàng của bạn.
              </p>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setShowWithdrawModal(false)}>
                  Hủy
                </Button>
                <Button type="submit" variant="primary" loading={withdrawSubmitting}>
                  Xác nhận rút {formatCurrency(Number(withdrawAmount) || 0)}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
