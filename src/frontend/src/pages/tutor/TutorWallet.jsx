import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';
import walletService from '@/services/wallet.service';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import Money from '@/components/ui/Money';
import { StatsSkeleton } from '@/components/common/Skeleton';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import Card, { CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import StatCard, { PageHeader } from '@/components/ui/StatCard';
import Icon from '@/components/ui/Icon';
import { getWithdrawalStatusMeta } from '@/config/enums';

/**
 * Quản trị ví bảo chứng & Trung tâm tài chính Gia sư.
 *
 * Tuân thủ bất biến tài chính:
 * - DEC-WD-001: Withdrawable = AvailableBalance - HeldBalance (không được rút vào phần phong tỏa tranh chấp).
 * - DEC-S8-028: HeldBalance chỉ giữ khi WithdrawableBalance >= MaxTutorRecovery, ngược lại giữ 0 đồng.
 * - Hạn mức tối thiểu tạo lệnh rút: 50.000 ₫.
 */
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
      <div className="space-y-6">
        <div className="h-16 bg-neutral-200 rounded-brand-md animate-pulse" />
        <StatsSkeleton count={4} />
      </div>
    );
  }

  if (error || !wallet) {
    return (
      <div className="py-12">
        <ErrorState
          error={error}
          title="Không thể tải ví bảo chứng"
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  // DEC-WD-001: Withdrawable = Available - Held (không được rút phần đang giữ).
  const withdrawable = Math.max(0, (wallet.availableBalance || 0) - (wallet.heldBalance || 0));
  const canWithdraw = withdrawable >= 50000;
  const hasHeldFunds = (wallet.heldBalance || 0) > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trung tâm tài chính & Ví bảo chứng gia sư"
        subtitle="Quản trị minh bạch dòng tiền Escrow, thu nhập từng buổi học và hạn mức rút tiền (Quy tắc bất biến DEC-WD-001)"
        actions={
          canWithdraw ? (
            <Button
              as={Link}
              to="/tutor/wallet/withdraw"
              variant="success"
              size="md"
              icon={<Icon name="payments" size="sm" />}
            >
              Yêu cầu rút tiền về ngân hàng
            </Button>
          ) : (
            <Button
              variant="outline"
              disabled
              size="md"
              title="Số dư khả dụng phải từ 50.000 ₫ trở lên mới được tạo lệnh rút."
              icon={<Icon name="payments" size="sm" />}
            >
              Hạn mức rút dưới 50.000 ₫
            </Button>
          )
        }
      />

      {/* 4 Financial Stat Cards - DESIGN.md v2 §7.3 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="1. Chờ giải ngân (Pending)"
          value={<Money value={wallet.pendingBalance} />}
          hint="Tạm giữ an toàn trong Escrow các hợp đồng đang học"
          icon={<Icon name="hourglass_top" size="md" />}
          tone="holding"
        />
        <StatCard
          label="2. Số dư khả dụng (Available)"
          value={<Money value={wallet.availableBalance} />}
          hint="Thu nhập các buổi học đã xong (sau trừ phí sàn 10%)"
          icon={<Icon name="account_balance_wallet" size="md" />}
          tone="success"
        />
        <StatCard
          label="3. Phong tỏa tranh chấp (Held)"
          value={<Money value={wallet.heldBalance} />}
          hint={
            hasHeldFunds
              ? 'Đang có khiếu nại chờ bàn trọng tài giải quyết'
              : 'Không có khoản tiền nào bị phong tỏa'
          }
          icon={<Icon name="lock" size="md" />}
          tone="danger"
          className={cn(hasHeldFunds && 'border-2 border-danger shadow-brand-sm animate-pulse')}
        />
        <StatCard
          label="4. Hạn mức được rút"
          value={<Money value={withdrawable} />}
          hint={`= Khả dụng (${formatCurrency(wallet.availableBalance)}) − Phong tỏa (${formatCurrency(wallet.heldBalance)})`}
          icon={<Icon name="savings" size="md" />}
          tone="success"
          className="border-2 border-emerald-500/80 shadow-brand-md bg-emerald-50/30"
        />
      </div>

      {/* Escrow Flow Explainer Banner */}
      <div className="p-4 rounded-brand-lg bg-surface border border-border shadow-brand-sm space-y-3">
        <div className="flex items-center gap-2 font-bold text-caption text-fg uppercase tracking-wider">
          <Icon name="info" size="xs" className="text-brand-primary-600" />
          <span>Quy trình vận hành dòng tiền Escrow minh bạch</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-caption">
          <div className="p-3 rounded-brand-md bg-neutral-50 border border-border/80 space-y-1">
            <span className="font-bold text-holding-strong block text-[11px] uppercase">
              Bước 1: Giữ tiền hợp đồng
            </span>
            <p className="text-fg-secondary text-[11px] leading-relaxed">
              Khi học viên mua gói, toàn bộ học phí nằm trong két Escrow trung lập (Pending).
            </p>
          </div>
          <div className="p-3 rounded-brand-md bg-neutral-50 border border-border/80 space-y-1">
            <span className="font-bold text-success-strong block text-[11px] uppercase">
              Bước 2: Đối soát điểm danh
            </span>
            <p className="text-fg-secondary text-[11px] leading-relaxed">
              Sau mỗi buổi học, hai bên xác nhận có mặt trong 24h. Tiền buổi đó được giải ngân vào Available.
            </p>
          </div>
          <div className="p-3 rounded-brand-md bg-neutral-50 border border-border/80 space-y-1">
            <span className="font-bold text-brand-primary-700 block text-[11px] uppercase">
              Bước 3: Rút tiền về ngân hàng
            </span>
            <p className="text-fg-secondary text-[11px] leading-relaxed">
              Rút thù lao về tài khoản ngân hàng nội địa bất kỳ lúc nào khi hạn mức đạt từ 50.000 ₫.
            </p>
          </div>
        </div>
      </div>

      {/* Withdrawal History Table */}
      <Card padding="lg" className="space-y-4 border border-border shadow-brand-sm">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <CardHeader
            title="Lịch sử lệnh rút tiền về ngân hàng"
            icon={<Icon name="receipt_long" size="sm" className="text-brand-primary-600" />}
          />
          <span className="text-caption text-fg-muted">
            {withdrawals.length} giao dịch gần nhất
          </span>
        </div>

        {withdrawals.length === 0 ? (
          <EmptyState
            icon="history"
            title="Chưa có giao dịch rút tiền nào"
            description="Lệnh rút tiền của bạn sẽ hiển thị tại đây sau khi tạo yêu cầu."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-caption text-left">
              <thead>
                <tr className="bg-neutral-50 border-b border-border">
                  <th scope="col" className="px-4 py-3 font-semibold text-fg-secondary uppercase tracking-wide">
                    Thời gian yêu cầu
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold text-fg-secondary uppercase tracking-wide">
                    Ngân hàng thụ hưởng
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold text-fg-secondary uppercase tracking-wide">
                    Ghi chú
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold text-fg-secondary uppercase tracking-wide">
                    Trạng thái
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold text-fg-secondary uppercase tracking-wide text-right">
                    Số tiền rút
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {withdrawals.map((row) => {
                  const meta = getWithdrawalStatusMeta(row.status);
                  return (
                    <tr key={row.id} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono text-fg-secondary">
                        {formatDateTime(row.requestedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Icon name="account_balance" size="xs" className="text-brand-primary-600 shrink-0" />
                          <div>
                            <span className="font-semibold text-fg block">{row.bankName}</span>
                            <span className="text-[11px] text-fg-muted font-mono">
                              {row.accountNumber} ({row.accountHolderName})
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-fg-secondary">
                        {row.note || 'Rút thù lao giảng dạy'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={meta.color} size="sm">
                          {meta.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-bold tabular-nums text-danger-strong">
                        -{formatCurrency(row.amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
