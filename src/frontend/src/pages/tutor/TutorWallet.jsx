import React, { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import walletService from '@/services/wallet.service';
import Money from '@/components/ui/Money';
import { StatsSkeleton } from '@/components/common/Skeleton';
import ErrorState from '@/components/common/ErrorState';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import WorkspacePageHeader from '@/components/layout/WorkspacePageHeader';
import TutorWalletHistory from '@/components/tutor/wallet/TutorWalletHistory';
import TutorEscrowDetails from '@/components/tutor/wallet/TutorEscrowDetails';
import { MIN_TUTOR_WITHDRAWAL } from '@/utils/tutorWallet';

export default function TutorWallet() {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEscrow, setShowEscrow] = useState(false);
  const [, setParams] = useSearchParams();
  const [reload, setReload] = useState(0);
  const retry = useCallback(() => setReload(value => value + 1), []);
  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError(null);
    walletService.getMyWallet().then(result => { if (!cancelled) setWallet(result); })
      .catch(err => { if (!cancelled) setError(err); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [reload]);
  const openWithdrawals = () => {
    setParams(previous => { const next = new URLSearchParams(previous); next.set('tab', 'withdrawals'); next.delete('recordId'); next.delete('page'); return next; });
    document.getElementById('wallet-history')?.scrollIntoView({ behavior: 'auto', block: 'start' });
  };
  // AvailableBalance already excludes reserved withdrawals; do not subtract them again.
  const available = wallet?.availableBalance || 0;
  const canWithdraw = available >= MIN_TUTOR_WITHDRAWAL;

  return <div className="space-y-6 lg:space-y-8">
    <WorkspacePageHeader title="Ví gia sư" description="Quản lý thu nhập từ hoạt động giảng dạy." />
    {loading ? <div role="status" aria-label="Đang tải số dư ví"><StatsSkeleton count={3} /></div> : error || !wallet ? <ErrorState error={error} title="Chưa tải được số dư ví" onRetry={retry} /> : <>
      <section aria-label="Số dư ví gia sư" className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1.3fr_1fr_1fr]">
        <div className="flex min-w-0 flex-col rounded-2xl border border-success/20 bg-success-subtle p-5 md:col-span-2 xl:col-span-1 sm:p-6">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-surface text-success-strong"><Icon name="account_balance_wallet" size="md" /></div>
          <h2 className="text-body-reg font-medium text-success-strong">Số dư có thể rút</h2>
          <p className="mt-2 text-[30px] font-semibold leading-tight text-success-strong sm:text-[32px]"><Money value={available} /></p>
          <p className="mt-3 text-body-reg leading-relaxed text-fg-secondary">Thu nhập đã được giải ngân vào ví, sau phí sàn.</p>
          <div className="mt-auto pt-5"><p className="mb-3 text-caption text-fg-secondary">Rút tối thiểu 50.000 ₫</p><Button as={canWithdraw ? Link : 'button'} to={canWithdraw ? '/tutor/wallet/withdraw' : undefined} disabled={!canWithdraw} fullWidth icon={<Icon name="payments" size="sm" />}>Rút tiền</Button></div>
        </div>
        <button type="button" aria-expanded={showEscrow} aria-controls="escrow-details" onClick={() => setShowEscrow(value => !value)} className="flex min-w-0 flex-col rounded-2xl border border-holding/20 bg-holding-subtle p-5 text-left transition-colors hover:border-holding/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-6">
          <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-surface text-holding-strong"><Icon name="shield" size="md" /></span>
          <span className="text-body-reg font-medium text-holding-strong">Học phí chờ giải ngân</span>
          <span className="mt-2 text-2xl font-semibold text-holding-strong"><Money value={wallet.pendingBalance} /></span>
          <span className="mt-3 text-body-reg leading-relaxed text-fg-secondary">Học phí đang giữ trong Escrow, trước phí sàn.</span>
          <span className="mt-auto inline-flex items-center gap-2 pt-5 text-body-reg font-semibold text-holding-strong">{showEscrow ? 'Thu gọn chi tiết ký quỹ' : 'Xem chi tiết ký quỹ'}<Icon name={showEscrow ? 'expand_less' : 'expand_more'} size="sm" /></span>
        </button>
        <div className="flex min-w-0 flex-col rounded-2xl border border-brand-primary-100 bg-brand-primary-50 p-5 sm:p-6">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-surface text-primary"><Icon name="account_balance" size="md" /></div>
          <h2 className="text-body-reg font-medium text-brand-primary-700">Yêu cầu rút đang xử lý</h2>
          <p className="mt-2 text-2xl font-semibold text-brand-primary-700"><Money value={wallet.pendingWithdrawal} /></p>
          <p className="mt-3 text-body-reg leading-relaxed text-fg-secondary">{wallet.pendingWithdrawal > 0 ? 'Đã tạm giữ khỏi số dư có thể rút, đang chờ duyệt hoặc chuyển tiền.' : 'Chưa có yêu cầu đang chờ.'}</p>
          <Button variant="ghost" size="sm" className="mt-auto self-start px-0 pt-5 text-primary" onClick={openWithdrawals} iconRight={<Icon name="arrow_forward" size="sm" />}>Xem yêu cầu rút</Button>
        </div>
      </section>
      {showEscrow && <TutorEscrowDetails />}
    </>}
    <TutorWalletHistory />
    <details className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
      <summary className="cursor-pointer text-body-reg font-semibold text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Học phí được giải ngân như thế nào?</summary>
      <p className="mt-3 text-body-reg text-fg-secondary">Tìm hiểu cách TutorHub giữ học phí và chuyển thu nhập vào ví.</p>
      <ol className="mt-4 grid gap-4 text-body-reg leading-relaxed text-fg-secondary md:grid-cols-3">
        <li><h3 className="mb-2 font-semibold text-holding-strong">1. Học viên ký quỹ</h3>Học phí gói học được giữ trong Escrow cho các buổi học của hợp đồng.</li>
        <li><h3 className="mb-2 font-semibold text-success-strong">2. Thu nhập vào ví</h3>Sau buổi học và thời gian bảo lưu 12 giờ, học phí được giải ngân nếu không có sự cố cần xử lý. Thu nhập sau phí sàn được cộng vào số dư có thể rút.</li>
        <li><h3 className="mb-2 font-semibold text-fg">3. Rút về ngân hàng</h3>Gửi yêu cầu từ 50.000 ₫. Theo dõi trạng thái trong lịch sử rút tiền đến khi chuyển tiền hoàn tất.</li>
      </ol>
    </details>
  </div>;
}
