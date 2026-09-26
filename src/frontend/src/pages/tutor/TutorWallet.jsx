import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import walletService from '@/services/wallet.service';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import Money from '@/components/ui/Money';
import { StatsSkeleton, TableSkeleton } from '@/components/common/Skeleton';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import LedgerStrip from '@/components/ledger/LedgerStrip';
import LedgerTable from '@/components/ledger/LedgerTable';
import SignedAmount from '@/components/ledger/SignedAmount';
import StateBadge from '@/components/ledger/StateBadge';

const WITHDRAW_COLUMNS = [
  { key: 'time', label: 'Thời gian yêu cầu' },
  { key: 'bank', label: 'Ngân hàng thụ hưởng' },
  { key: 'note', label: 'Ghi chú' },
  { key: 'status', label: 'Trạng thái' },
  { key: 'amount', label: 'Số tiền rút', align: 'right' },
];

/**
 * Quy trình Escrow dạng 3 bước ngang có spine (SPEC Tutor §4.3).
 *
 * Màu tiêu đề bước = trạng thái tiền ở bước đó: `holding` (đang ký quỹ) →
 * `success` (đã đối soát) → trung tính (tiền ra khỏi ví). Bước 3 cố tình KHÔNG
 * dùng màu CTA `brand-primary-700` như bản cũ: màu CTA dành cho hành động, không
 * dành cho tiêu đề thông tin.
 */
const ESCROW_STEPS = [
  {
    title: 'Bước 1: Giữ tiền hợp đồng',
    body: 'Khi học viên mua gói, toàn bộ học phí nằm trong két Escrow trung lập (Pending).',
    titleClass: 'text-holding-strong',
  },
  {
    title: 'Bước 2: Đối soát điểm danh',
    body: 'Sau mỗi buổi học, hai bên xác nhận có mặt trong 24h. Tiền buổi đó được giải ngân vào Available.',
    titleClass: 'text-success-strong',
  },
  {
    title: 'Bước 3: Rút tiền về ngân hàng',
    body: 'Rút thù lao về tài khoản ngân hàng nội địa bất kỳ lúc nào khi hạn mức đạt từ 50.000 ₫.',
    titleClass: 'text-fg',
  },
];

/**
 * Quản trị ví bảo chứng & Trung tâm tài chính Gia sư — Operational Ledger
 * (SPEC Tutor §4.3).
 *
 * Bốn số dư đọc ngang như một dòng sổ cái: ký quỹ → khả dụng → phong tỏa → được
 * rút. Công thức hạn mức nổi thành một dòng phương trình ngay dưới strip thay vì
 * nhét dài gói trong `hint` của StatCard (bản cũ bị bó/khó đọc).
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
        <StatsSkeleton count={4} />
        <TableSkeleton rows={5} />
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
      {/* Page title row — 1 CTA duy nhất của trang */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-headline-page text-fg tracking-tight">
            Trung tâm tài chính &amp; Ví bảo chứng gia sư
          </h1>
          <p className="text-body-reg text-fg-secondary mt-1">
            Quản trị minh bạch dòng tiền Escrow, thu nhập từng buổi học và hạn mức rút
            tiền (Quy tắc bất biến DEC-WD-001)
          </p>
        </div>
        {canWithdraw ? (
          <Button
            as={Link}
            to="/tutor/wallet/withdraw"
            variant="primary"
            size="md"
            icon={<Icon name="payments" size="sm" />}
            className="shrink-0"
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
            className="shrink-0"
          >
            Hạn mức rút dưới 50.000 ₫
          </Button>
        )}
      </div>

      {/* 4 số dư — hàng sổ cái phẳng, số là nhân vật chính */}
      <div>
        <LedgerStrip
          columns={4}
          figures={[
            {
              key: 'pending',
              label: 'Chờ giải ngân (Pending)',
              value: <Money value={wallet.pendingBalance} />,
              hint: 'Tạm giữ an toàn trong Escrow các hợp đồng đang học',
              tone: 'holding',
            },
            {
              key: 'available',
              label: 'Số dư khả dụng (Available)',
              value: <Money value={wallet.availableBalance} />,
              hint: 'Thu nhập các buổi học đã xong (sau trừ phí sàn 10%)',
            },
            {
              key: 'held',
              label: 'Phong tỏa tranh chấp (Held)',
              value: <Money value={wallet.heldBalance} />,
              hint: hasHeldFunds
                ? 'Đang có khiếu nại chờ bàn trọng tài giải quyết'
                : 'Không có khoản tiền nào bị phong tỏa',
              tone: hasHeldFunds ? 'danger' : 'muted',
            },
            {
              key: 'withdrawable',
              label: 'Hạn mức được rút',
              value: <Money value={withdrawable} />,
            },
          ]}
        />

        {/* DEC-WD-001 nổi thành 1 dòng phương trình — tabular để dọc theo cột */}
        <p className="text-body-reg text-fg-secondary mt-3 leading-relaxed tabular-nums">
          <span className="font-semibold text-fg">Hạn mức được rút</span>
          <span className="mx-1.5 text-fg-muted">=</span>
          Khả dụng {formatCurrency(wallet.availableBalance)}
          <span className="mx-1.5 text-fg-muted">−</span>
          Phong tỏa {formatCurrency(wallet.heldBalance)}
          <span className="mx-1.5 text-fg-muted">=</span>
          <span className="font-bold text-fg">{formatCurrency(withdrawable)}</span>
          <span className="ml-2 inline-block align-middle text-[11px] font-semibold uppercase tracking-wide text-fg-muted border border-border rounded-brand-sm px-1.5 py-0.5">
            DEC-WD-001
          </span>
        </p>
      </div>

      {/* Escrow Flow Explainer Banner — 3 bước ngang có spine */}
      <section className="p-4 rounded-brand-lg bg-surface border border-border shadow-brand-sm">
        <h2 className="flex items-center gap-2 text-caption font-bold text-fg uppercase tracking-wider">
          <Icon name="info" size="xs" className="text-brand-primary-600" />
          <span>Quy trình vận hành dòng tiền Escrow minh bạch</span>
        </h2>
        <ol className="grid grid-cols-1 gap-y-3 mt-3.5 md:grid-cols-3 md:gap-y-0 md:divide-x md:divide-border">
          {ESCROW_STEPS.map((step) => (
            <li key={step.title} className="md:px-5 md:first:pl-0 md:last:pr-0">
              <p className={`text-[11px] font-bold uppercase tracking-wide ${step.titleClass}`}>
                {step.title}
              </p>
              <p className="text-[11px] leading-relaxed text-fg-secondary mt-1">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* Withdrawal History Table */}
      <Card padding="lg" className="space-y-4">
        <div className="flex items-center justify-between gap-3 pb-2 border-b border-border">
          <h2 className="text-[20px] font-semibold text-fg tracking-tight">
            Lịch sử lệnh rút tiền về ngân hàng
          </h2>
          <span className="text-caption text-fg-muted tabular-nums whitespace-nowrap">
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
          <LedgerTable
            caption="Lịch sử lệnh rút tiền về ngân hàng của Gia sư"
            columns={WITHDRAW_COLUMNS}
            minWidth={680}
          >
            {withdrawals.map((row) => (
              <tr key={row.id} className="hover:bg-neutral-50/60 transition-colors">
                <td className="px-4 py-2.5 font-mono text-fg-muted whitespace-nowrap text-[12px]">
                  {formatDateTime(row.requestedAt)}
                </td>
                <td className="px-4 py-2.5">
                  <span className="font-semibold text-fg block">{row.bankName}</span>
                  <span className="text-[11px] font-mono text-fg-muted">
                    {row.accountNumber} ({row.accountHolderName})
                  </span>
                </td>
                <td className="px-4 py-2.5 text-fg-secondary">
                  {row.note || 'Rút thù lao giảng dạy'}
                </td>
                <td className="px-4 py-2.5 whitespace-nowrap">
                  <StateBadge status={row.status} domain="withdrawal" />
                </td>
                <td className="px-4 py-2.5 text-right">
                  <SignedAmount amount={row.amount} direction="Debit" />
                </td>
              </tr>
            ))}
          </LedgerTable>
        )}
      </Card>
    </div>
  );
}
