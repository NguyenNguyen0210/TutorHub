import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';
import studentWalletService from '@/services/studentWallet.service';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import Money from '@/components/ui/Money';
import { StatsSkeleton, TableSkeleton } from '@/components/common/Skeleton';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/ui/Icon';
import Tabs from '@/components/ui/Tabs';
import { useToast } from '@/components/ui/Toast';
import LedgerStrip from '@/components/ledger/LedgerStrip';
import LedgerTable from '@/components/ledger/LedgerTable';
import SignedAmount from '@/components/ledger/SignedAmount';
import StateBadge from '@/components/ledger/StateBadge';

const STATEMENT_COLUMNS = [
  { key: 'time', label: 'Thời gian' },
  { key: 'type', label: 'Loại' },
  { key: 'desc', label: 'Diễn giải & Tham chiếu' },
  { key: 'before', label: 'Số dư trước', align: 'right' },
  { key: 'delta', label: 'Biến động', align: 'right' },
  { key: 'after', label: 'Số dư sau', align: 'right' },
];

const TOPUP_COLUMNS = [
  { key: 'time', label: 'Thời gian tạo' },
  { key: 'ref', label: 'Mã chuyển khoản' },
  { key: 'amount', label: 'Số tiền nạp', align: 'right' },
  { key: 'status', label: 'Trạng thái' },
  { key: 'note', label: 'Ghi chú xử lý' },
];

const WITHDRAW_COLUMNS = [
  { key: 'time', label: 'Thời gian yêu cầu' },
  { key: 'account', label: 'Tài khoản nhận' },
  { key: 'amount', label: 'Số tiền', align: 'right' },
  { key: 'status', label: 'Trạng thái' },
  { key: 'note', label: 'Ghi chú' },
];

const TABS = [
  { key: 'statement', label: 'Sổ cái biến động số dư' },
  { key: 'topups', label: 'Lịch sử nạp tiền' },
  { key: 'withdrawals', label: 'Lịch sử rút tiền' },
];

/**
 * Ví Học Viên — Operational Ledger (SPEC §5.2).
 *
 * Ba số dư là chủ đạo; sổ cái là tab mặc định. Hai luồng tiền (nạp / rút) đã tách
 * sang trang riêng `/student/wallet/topup` và `/student/wallet/withdraw` vì form
 * rút có 5 trường — modal hẹp làm nghẽn trên mobile.
 */
export default function StudentWallet() {
  const toast = useToast();

  const [wallet, setWallet] = useState(null);
  const [loadingWallet, setLoadingWallet] = useState(true);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState('statement');

  const [statement, setStatement] = useState([]);
  const [statementLoading, setStatementLoading] = useState(false);
  const [statementTotal, setStatementTotal] = useState(0);

  const [topUps, setTopUps] = useState([]);
  const [topUpsLoading, setTopUpsLoading] = useState(false);

  const [withdrawals, setWithdrawals] = useState([]);
  const [withdrawalsLoading, setWithdrawalsLoading] = useState(false);

  const [copiedKey, setCopiedKey] = useState(null);

  const handleCopy = (text, key) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
    toast.success('Đã sao chép vào bộ nhớ tạm');
  };

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

  const fetchStatement = useCallback(async (page = 1) => {
    try {
      setStatementLoading(true);
      const res = await studentWalletService.getStatement({ pageNumber: page, pageSize: 15 });
      setStatement(res?.items || []);
      setStatementTotal(res?.totalCount || 0);
    } catch {
      toast.error('Không thể tải sao kê sổ cái ví.');
    } finally {
      setStatementLoading(false);
    }
  }, [toast]);

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
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-headline-page text-fg tracking-tight">
            Ví Học Viên
          </h1>
          <p className="text-body-reg text-fg-secondary mt-1">
            Số dư, sổ cái giao dịch và lịch sử nạp / rút.
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            as={Link}
            to="/student/wallet/withdraw"
            variant="outline"
            size="md"
            icon={<Icon name="payments" size="sm" />}
            disabled={!canWithdraw}
            title={!canWithdraw ? 'Số dư khả dụng tối thiểu 50.000 ₫ để rút tiền' : undefined}
          >
            Rút tiền
          </Button>
          <Button
            as={Link}
            to="/student/wallet/topup"
            variant="primary"
            size="md"
            icon={<Icon name="add_circle" size="sm" />}
          >
            Nạp tiền
          </Button>
        </div>
      </div>

      <div>
        <LedgerStrip
          columns={3}
          figures={[
            {
              key: 'available',
              label: 'Số dư khả dụng',
              value: <Money value={wallet.availableBalance} />,
              hint: 'Dùng để mua gói học hoặc rút về ngân hàng',
            },
            {
              key: 'reserved',
              label: 'Đang chờ rút',
              value: <Money value={wallet.reservedBalance} />,
              hint: 'Đã tạm giữ, chờ Admin giải ngân',
              tone: 'holding',
            },
            {
              key: 'total',
              label: 'Tổng số dư',
              value: <Money value={wallet.totalBalance} />,
              hint: 'Tổng nguồn vốn trong ví',
              tone: 'muted',
            },
          ]}
        />
        <p className="text-[12px] text-fg-muted mt-2.5">
          Mọi giao dịch đều được ghi vào sổ cái điện toán. Tiền hoàn từ buổi học hoặc
          tranh chấp sẽ tự động cộng vào số dư khả dụng. Rút tối thiểu 50.000 ₫.
        </p>
      </div>

      <div className="space-y-4">
        <Tabs tabs={TABS} value={activeTab} onChange={setActiveTab} />

        {activeTab === 'statement' && (
          <Card padding="lg" className="space-y-4">
            <div className="flex items-center justify-between gap-3 pb-2 border-b border-border">
              <h2 className="text-[20px] font-semibold text-fg tracking-tight">
                Sổ cái biến động số dư
              </h2>
              <span className="text-caption text-fg-muted tabular-nums">
                {statementTotal} bản ghi
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
              <LedgerTable caption="Sổ cái biến động số dư Ví Học Viên" columns={STATEMENT_COLUMNS} minWidth={720}>
                {statement.map((item) => {
                  const isCredit = item.direction === 'Credit';
                  return (
                    <tr key={item.id} className="hover:bg-neutral-50/60 transition-colors">
                      <td className="px-4 py-2.5 font-mono text-fg-muted whitespace-nowrap text-[12px]">
                        {formatDateTime(item.createdAt)}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <Badge variant={isCredit ? 'success' : 'neutral'} size="sm">
                          {item.type}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="font-semibold text-fg block">
                          {item.description || item.reason || 'Biến động số dư'}
                        </span>
                        {item.referenceType && (
                          <span className="text-[11px] text-fg-muted font-mono block">
                            Nguồn: {item.referenceType} #{String(item.referenceId || '').slice(0, 8)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right text-fg-muted tabular-nums whitespace-nowrap">
                        {formatCurrency(item.balanceBefore)}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <SignedAmount amount={item.amount} direction={item.direction} />
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold text-fg tabular-nums whitespace-nowrap">
                        {formatCurrency(item.balanceAfter)}
                      </td>
                    </tr>
                  );
                })}
              </LedgerTable>
            )}
          </Card>
        )}

        {activeTab === 'topups' && (
          <Card padding="lg" className="space-y-4">
            <div className="flex items-center justify-between gap-3 pb-2 border-b border-border">
              <h2 className="text-[20px] font-semibold text-fg tracking-tight">
                Lịch sử yêu cầu nạp tiền
              </h2>
              <span className="text-caption text-fg-muted tabular-nums">
                {topUps.length} yêu cầu
              </span>
            </div>

            {topUpsLoading ? (
              <TableSkeleton rows={5} />
            ) : topUps.length === 0 ? (
              <EmptyState
                icon="account_balance"
                title="Chưa có yêu cầu nạp tiền nào"
                description="Bấm 'Nạp tiền' để tạo mã chuyển khoản nạp tiền đầu tiên."
                actionLabel="Nạp tiền vào ví"
                actionPath="/student/wallet/topup"
              />
            ) : (
              <LedgerTable caption="Lịch sử yêu cầu nạp tiền Ví Học Viên" columns={TOPUP_COLUMNS} minWidth={680}>
                {topUps.map((r) => (
                  <tr key={r.id} className="hover:bg-neutral-50/60 transition-colors">
                    <td className="px-4 py-2.5 font-mono text-fg-muted whitespace-nowrap text-[12px]">
                      {formatDateTime(r.requestedAt)}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-brand-primary-700 bg-brand-primary-50 px-2 py-0.5 rounded border border-brand-primary-200">
                          {r.transferReference}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(r.transferReference, r.id)}
                          className={cn(
                            'p-1 rounded-brand-sm text-fg-muted hover:text-fg hover:bg-neutral-100 transition-colors'
                          )}
                          aria-label={`Sao chép mã chuyển khoản ${r.transferReference}`}
                          title="Sao chép cú pháp"
                        >
                          <Icon name={copiedKey === r.id ? 'check' : 'content_copy'} size="xs" />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <SignedAmount amount={r.amount} direction="Credit" />
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <StateBadge status={r.status} domain="topup" />
                    </td>
                    <td className="px-4 py-2.5 text-fg-secondary">
                      {r.rejectionReason || r.adminNote || (r.status === 'Pending' ? 'Đang đợi chuyển khoản đối soát' : '—')}
                    </td>
                  </tr>
                ))}
              </LedgerTable>
            )}
          </Card>
        )}

        {activeTab === 'withdrawals' && (
          <Card padding="lg" className="space-y-4">
            <div className="flex items-center justify-between gap-3 pb-2 border-b border-border">
              <h2 className="text-[20px] font-semibold text-fg tracking-tight">
                Lịch sử yêu cầu rút tiền
              </h2>
              <span className="text-caption text-fg-muted tabular-nums">
                {withdrawals.length} lệnh rút
              </span>
            </div>

            {withdrawalsLoading ? (
              <TableSkeleton rows={5} />
            ) : withdrawals.length === 0 ? (
              <EmptyState
                icon="payments"
                title="Chưa có yêu cầu rút tiền nào"
                description="Bạn có thể rút tiền từ số dư khả dụng về bất kỳ tài khoản ngân hàng nào tại Việt Nam."
                actionLabel="Rút tiền về ngân hàng"
                actionPath="/student/wallet/withdraw"
              />
            ) : (
              <LedgerTable caption="Lịch sử yêu cầu rút tiền Ví Học Viên" columns={WITHDRAW_COLUMNS} minWidth={680}>
                {withdrawals.map((w) => (
                  <tr key={w.id} className="hover:bg-neutral-50/60 transition-colors">
                    <td className="px-4 py-2.5 font-mono text-fg-muted whitespace-nowrap text-[12px]">
                      {formatDateTime(w.requestedAt)}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="font-semibold text-fg block">{w.bankName}</span>
                      <span className="text-[11px] font-mono text-fg-muted">
                        {w.accountNumber} ({w.accountHolderName})
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <SignedAmount amount={w.amount} direction="Debit" />
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <StateBadge status={w.status} domain="withdrawal" />
                    </td>
                    <td className="px-4 py-2.5 text-fg-secondary">
                      {w.failureReason || w.note || '—'}
                    </td>
                  </tr>
                ))}
              </LedgerTable>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
