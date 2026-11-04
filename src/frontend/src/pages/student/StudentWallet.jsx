import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import studentWalletService from '@/services/studentWallet.service';
import { formatDateTime } from '@/utils/formatters';
import Money from '@/components/ui/Money';
import { TableSkeleton } from '@/components/common/Skeleton';
import ErrorState from '@/components/common/ErrorState';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Tabs from '@/components/ui/Tabs';
import { useToast } from '@/components/ui/Toast';
import DataTable from '@/components/common/DataTable';
import SignedAmount from '@/components/common/SignedAmount';
import StateBadge from '@/components/common/StateBadge';
import paymentService from '@/services/payment.service';
import enrollmentService from '@/services/enrollment.service';
import CoursePaymentHistoryRow from '@/components/checkout/CoursePaymentHistoryRow';

const PAGE_SIZE = 15;
const HISTORY_TABS = [{ key: 'wallet', label: 'Giao dịch ví' }, { key: 'payments', label: 'Thanh toán khóa học' }];
const TABS = [
  { key: 'statement', label: 'Tất cả' },
  { key: 'topups', label: 'Nạp tiền' },
  { key: 'withdrawals', label: 'Rút tiền' },
];
const TRANSACTION_LABELS = {
  TopUpCredit: 'Nạp tiền vào ví',
  CoursePaymentDebit: 'Thanh toán gói học',
  RefundCredit: 'Hoàn học phí',
  SessionPayoutCredit: 'Nhận học phí',
  WithdrawalDebit: 'Tạm giữ tiền rút',
  WithdrawalReversalCredit: 'Hoàn tiền rút',
  WithdrawalFailedAdjustmentCredit: 'Hoàn tiền rút thất bại',
  WithdrawalSuccessSettlement: 'Hoàn tất chuyển tiền rút',
  AdjustmentCredit: 'Điều chỉnh tăng số dư',
  AdjustmentDebit: 'Điều chỉnh giảm số dư',
  DisputeHoldReservationDebit: 'Tạm giữ để xử lý tranh chấp',
  DisputeHoldReleaseCredit: 'Hoàn khoản tạm giữ tranh chấp',
  DisputeRecoveryDebit: 'Thu hồi theo kết quả tranh chấp',
};
const COLUMNS = {
  payments: [
    { key: 'course', label: 'Gói học' },
    { key: 'source', label: 'Nguồn thanh toán' },
    { key: 'amount', label: 'Số tiền', align: 'right' },
    { key: 'payment', label: 'Thanh toán' },
    { key: 'escrow', label: 'Học phí hợp đồng' },
  ],
  statement: [
    { key: 'type', label: 'Giao dịch' },
    { key: 'time', label: 'Thời gian' },
    { key: 'amount', label: 'Số tiền', align: 'right' },
    { key: 'balance', label: 'Số dư sau', align: 'right' },
  ],
  topups: [
    { key: 'ref', label: 'Mã chuyển khoản' },
    { key: 'time', label: 'Thời gian' },
    { key: 'amount', label: 'Số tiền', align: 'right' },
    { key: 'status', label: 'Trạng thái' },
    { key: 'note', label: 'Chi tiết' },
  ],
  withdrawals: [
    { key: 'account', label: 'Tài khoản nhận' },
    { key: 'time', label: 'Thời gian' },
    { key: 'amount', label: 'Số tiền', align: 'right' },
    { key: 'status', label: 'Trạng thái' },
    { key: 'note', label: 'Chi tiết' },
  ],
};
const EMPTY = {
  payments: { title: 'Chưa có thanh toán khóa học', description: 'Các lần thanh toán gói học qua VNPAY hoặc Ví học viên sẽ xuất hiện tại đây.' },
  statement: { title: 'Chưa có giao dịch nào', description: 'Các thay đổi số dư trong ví sẽ được ghi nhận tại đây.' },
  topups: { title: 'Chưa có yêu cầu nạp tiền', description: 'Bạn có thể nạp tiền để thanh toán các gói học trên TutorHub.' },
  withdrawals: { title: 'Chưa có yêu cầu rút tiền', description: 'Các yêu cầu chuyển tiền về tài khoản ngân hàng sẽ xuất hiện tại đây.' },
};

// Tất cả lấy biến động ví; hai tab còn lại lấy yêu cầu, kể cả yêu cầu đang xử lý.
export default function StudentWallet() {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const recordId = searchParams.get('recordId');
  const bookingId = searchParams.get('bookingId');
  const matchesTarget = item => Boolean(recordId && item.id === recordId) || Boolean(bookingId && item.bookingId === bookingId);
  const [wallet, setWallet] = useState(null);
  const [loadingWallet, setLoadingWallet] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('statement');
  const [page, setPage] = useState(1);
  const [history, setHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState(null);
  const [reloadHistory, setReloadHistory] = useState(0);
  useEffect(() => {
    if (['statement', 'payments', 'topups', 'withdrawals'].includes(requestedTab)) {
      setActiveTab(requestedTab); setPage(1); setHistory(null); setHistoryLoading(true);
    }
  }, [requestedTab, recordId, bookingId]);
  useEffect(() => {
    if (historyLoading || !history) return;
    const item = history.items.find(value => (recordId && value.id === recordId) || (bookingId && value.bookingId === bookingId));
    if (item) document.getElementById(`wallet-record-${item.id}`)?.scrollIntoView({ block: 'center', behavior: 'auto' });
  }, [history, historyLoading, recordId, bookingId]);

  const fetchWallet = useCallback(async () => {
    try {
      setLoadingWallet(true);
      setWallet(await studentWalletService.getMyWallet());
      setError(null);
    } catch (err) { setError(err); }
    finally { setLoadingWallet(false); }
  }, []);
  useEffect(() => { fetchWallet(); }, [fetchWallet]);

  useEffect(() => {
    let cancelled = false;
    setHistoryLoading(true);
    setHistoryError(null);
    const fetchPayments = async params => {
      const [payments, enrollments] = await Promise.allSettled([
        paymentService.getMyCoursePayments(params), enrollmentService.getAllMyEnrollments(),
      ]);
      if (payments.status === 'rejected') throw payments.reason;
      const byBooking = new Map(enrollments.status === 'fulfilled' ? enrollments.value.items.map(item => [item.bookingId, item]) : []);
      return { ...payments.value, items: (payments.value.items || []).map(item => ({ ...item, enrollment: byBooking.get(item.bookingId) || null })) };
    };
    const fetch = activeTab === 'payments' ? fetchPayments : activeTab === 'statement' ? studentWalletService.getStatement
      : activeTab === 'topups' ? studentWalletService.getMyTopUpRequests
      : studentWalletService.getMyWithdrawals;
    (async () => {
      let targetPage = page;
      let data = await fetch({ pageNumber: targetPage, pageSize: PAGE_SIZE });
      while (!cancelled && page === 1 && (recordId || bookingId) && data.hasNextPage
          && !data.items.some(item => (recordId && item.id === recordId) || (bookingId && item.bookingId === bookingId))) {
        data = await fetch({ pageNumber: ++targetPage, pageSize: PAGE_SIZE });
      }
      if (!cancelled) { setHistory(data); if (targetPage !== page) setPage(targetPage); }
    })()
      .catch(err => { if (!cancelled) setHistoryError(err); })
      .finally(() => { if (!cancelled) setHistoryLoading(false); });
    return () => { cancelled = true; };
  }, [activeTab, page, reloadHistory, recordId, bookingId]);

  const copyReference = async (reference) => {
    try {
      await navigator.clipboard.writeText(reference);
      toast.success('Đã sao chép mã chuyển khoản.');
    } catch { toast.error('Chưa thể sao chép. Bạn có thể chọn và sao chép mã chuyển khoản.'); }
  };

  if (loadingWallet) {
    return (
      <div role="status" aria-label="Đang tải ví học viên" className="mx-auto max-w-[1200px] space-y-6">
        <div className="h-5 w-40 rounded bg-neutral-200 motion-safe:animate-pulse" />
        <div className="h-14 w-64 rounded bg-neutral-100 motion-safe:animate-pulse" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Card variant="outlined" padding="lg" className="space-y-5 rounded-2xl">
            <div className="h-5 w-36 rounded bg-neutral-100 motion-safe:animate-pulse" />
            <div className="h-10 w-56 rounded bg-neutral-100 motion-safe:animate-pulse" />
            <div className="h-11 w-64 max-w-full rounded bg-neutral-100 motion-safe:animate-pulse" />
          </Card>
          <div className="grid gap-4 sm:grid-cols-2">
            {[0, 1].map(key => <Card key={key} variant="outlined" padding="lg" className="space-y-5 rounded-2xl"><div className="h-5 rounded bg-neutral-100 motion-safe:animate-pulse" /><div className="h-8 rounded bg-neutral-100 motion-safe:animate-pulse" /></Card>)}
          </div>
        </div>
        <Card variant="outlined" padding="lg" className="rounded-2xl"><TableSkeleton rows={4} /></Card>
      </div>
    );
  }
  if (error || !wallet) {
    return <div className="mx-auto max-w-[1200px] py-12"><ErrorState error={error} title="Không thể tải Ví học viên" onRetry={fetchWallet} /></div>;
  }

  const items = history?.items || [];
  const empty = EMPTY[activeTab];
  const total = history?.totalCount ?? 0;
  const changeTab = key => {
    if (key === activeTab) return;
    const next = new URLSearchParams(searchParams);
    next.set('tab', key); next.delete('recordId'); next.delete('bookingId');
    setSearchParams(next, { replace: true });
    setActiveTab(key); setPage(1); setHistory(null); setHistoryLoading(true); setHistoryError(null);
  };

  return (
    <div className="mx-auto max-w-[1200px] space-y-6">
      <nav aria-label="Đường dẫn ví học viên" className="text-caption text-fg-secondary">
        <ol className="flex items-center gap-2">
          <li><Link to="/student/dashboard" className="hover:text-primary focus-visible:underline">Bàn học</Link></li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="font-medium text-fg">Ví học viên</li>
        </ol>
      </nav>
      <header>
        <h1 className="text-headline-page text-fg tracking-tight">Ví học viên</h1>
        <p className="mt-1 text-body-reg text-fg-secondary">Quản lý số dư và theo dõi các giao dịch của bạn.</p>
      </header>

      <section aria-label="Số dư ví" className="grid gap-4 lg:grid-cols-2">
        <Card padding="lg" variant="outlined" className="rounded-2xl bg-brand-primary-50/60">
          <div className="flex items-center gap-2 text-primary">
            <Icon name="account_balance_wallet" size="sm" />
            <h2 className="text-caption font-semibold">Số dư khả dụng</h2>
          </div>
          <p className="mt-3 text-[32px] font-bold leading-tight text-fg"><Money value={wallet.availableBalance} /></p>
          <p className="mt-2 text-caption text-fg-secondary">Có thể sử dụng để thanh toán hoặc rút về ngân hàng.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button as={Link} to="/student/wallet/topup" icon={<Icon name="add_circle" size="sm" />}>Nạp tiền</Button>
            <Button as={Link} to="/student/wallet/withdraw" variant="outline" icon={<Icon name="payments" size="sm" />}>Rút tiền</Button>
          </div>
        </Card>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card padding="lg" variant="outlined" className="rounded-2xl">
            <h2 className="text-caption font-medium text-fg-secondary">Đang chờ rút</h2>
            <p className="mt-4 text-[26px] font-semibold leading-tight text-fg"><Money value={wallet.withdrawingBalance} /></p>
            <p className="mt-3 text-caption leading-relaxed text-fg-secondary">Đã tạm giữ để xử lý yêu cầu chuyển tiền.</p>
          </Card>
          <Card padding="lg" variant="outlined" className="rounded-2xl">
            <h2 className="text-caption font-medium text-fg-secondary">Tổng số dư</h2>
            <p className="mt-4 text-[26px] font-semibold leading-tight text-fg"><Money value={wallet.totalBalance} /></p>
            <p className="mt-3 text-caption leading-relaxed text-fg-secondary">Bao gồm số dư khả dụng và tiền đang chờ xử lý trong ví.</p>
          </Card>
        </div>
      </section>
      <p className="flex items-start gap-2 text-caption leading-relaxed text-fg-secondary">
        <Icon name="shield" size="sm" className="mt-0.5 shrink-0 text-primary" />
        <span>Thanh toán trực tiếp qua VNPAY không làm thay đổi số dư ví. <button type="button" onClick={() => changeTab('payments')} className="rounded font-medium text-primary underline underline-offset-2 focus-visible:ring-2 focus-visible:ring-ring">Xem thanh toán khóa học</button>.</span>
      </p>

      <Card as="section" variant="outlined" padding="none" className="rounded-2xl" aria-labelledby="wallet-history-title">
        <div className="p-5 pb-0 sm:p-6 sm:pb-0">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 id="wallet-history-title" className="text-headline-3 font-semibold text-fg">Lịch sử giao dịch</h2>
            {!historyLoading && !historyError && <span className="text-caption tabular-nums text-fg-secondary">{total} {['statement', 'payments'].includes(activeTab) ? 'giao dịch' : 'yêu cầu'}</span>}
          </div>
          <Tabs tabs={HISTORY_TABS} value={activeTab === 'payments' ? 'payments' : 'wallet'} onChange={key => changeTab(key === 'payments' ? 'payments' : 'statement')} />
          {activeTab !== 'payments' && <div className="mt-4"><Tabs tabs={TABS} value={activeTab} onChange={changeTab} /></div>}
          <p className="my-4 text-caption leading-relaxed text-fg-secondary">
            {activeTab === 'payments' ? 'Theo dõi các khoản thanh toán, học phí đang giữ, tiền đã chuyển cho gia sư và tiền hoàn của hợp đồng.'
              : activeTab === 'statement' ? 'Tất cả biến động số dư, gồm thanh toán bằng ví, hoàn tiền và điều chỉnh. Thanh toán trực tiếp qua VNPAY nằm trong tab Thanh toán khóa học.'
              : activeTab === 'topups' ? 'Theo dõi các yêu cầu nạp tiền. Số dư chỉ được cập nhật khi thanh toán được xác nhận.'
              : 'Theo dõi yêu cầu rút tiền và kết quả chuyển khoản về ngân hàng.'}
          </p>
        </div>
        <div aria-busy={historyLoading}>
          {!historyLoading && !historyError && (recordId || bookingId) && !items.some(matchesTarget) && <p role="status" className="px-6 pb-4 text-caption text-fg-secondary">Không tìm thấy giao dịch được liên kết trong danh sách của bạn.</p>}
          {historyLoading ? <div className="px-5 pb-6 sm:px-6"><TableSkeleton rows={4} /></div>
            : historyError ? (
              <div className="px-6 py-10 text-center">
                <p className="text-body-reg text-fg-secondary">Chưa tải được lịch sử giao dịch. Vui lòng thử lại.</p>
                <Button variant="outline" className="mt-4" onClick={() => setReloadHistory(value => value + 1)}>Thử lại</Button>
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center px-6 py-12 text-center">
                <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-100 text-fg-secondary"><Icon name="history" size="md" /></span>
                <h3 className="font-semibold text-fg">{empty.title}</h3>
                <p className="mt-2 max-w-md text-body-reg leading-relaxed text-fg-secondary">{empty.description}</p>
              </div>
            ) : (
              <DataTable caption={activeTab === 'payments' ? 'Thanh toán khóa học' : activeTab === 'statement' ? "Lịch sử số dư ví học viên" : activeTab === 'topups' ? 'Yêu cầu nạp tiền' : 'Yêu cầu rút tiền'} columns={COLUMNS[activeTab]} minWidth={activeTab === 'payments' ? 900 : activeTab === 'statement' ? 650 : 740}>
                {activeTab === 'payments' ? items.map(item => <CoursePaymentHistoryRow key={item.id} payment={item} focused={matchesTarget(item)} />) : items.map(item => (
                  <tr id={`wallet-record-${item.id}`} key={item.id} className={matchesTarget(item) ? 'bg-brand-primary-50 ring-1 ring-inset ring-brand-primary-200' : 'transition-colors hover:bg-neutral-50'}>
                    {activeTab === 'statement' ? (
                      <>
                        <td className="px-4 py-4">
                          <p className="font-semibold text-fg">{TRANSACTION_LABELS[item.type] || "Thay đổi số dư"}</p>
                          <details open={matchesTarget(item) || undefined} className="mt-2 text-fg-secondary">
                            <summary className="w-fit cursor-pointer rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Chi tiết giao dịch</summary>
                            <div className="mt-2 max-w-xs space-y-1 break-words">
                              {(item.description || item.reason) && <p>{item.description || item.reason}</p>}
                              <p>Số dư trước: <Money value={item.balanceBefore} /></p>
                              <p>Mã giao dịch: <span className="break-all">{item.id}</span></p>
                              {item.referenceId && <p>Mã tham chiếu: <span className="break-all">{item.referenceId}</span></p>}
                            </div>
                          </details>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-fg-secondary">{formatDateTime(item.createdAt)}</td>
                        <td className="whitespace-nowrap px-4 py-4 text-right"><SignedAmount amount={item.amount} direction={item.direction} /></td>
                        <td className="whitespace-nowrap px-4 py-4 text-right font-medium text-fg">
                          <Money value={item.balanceAfter} />
                          {item.type === 'WithdrawalSuccessSettlement' && <span className="mt-1 block text-[11px] text-fg-secondary">Số dư chờ rút</span>}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-4">
                          {activeTab === 'topups' ? (
                            <div className="flex items-center gap-1">
                              <span className="break-all font-semibold text-fg">{item.transferReference || 'Chưa có mã'}</span>
                              {item.transferReference && <button type="button" onClick={() => copyReference(item.transferReference)} aria-label="Sao chép mã chuyển khoản" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-fg-secondary hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Icon name="content_copy" size="sm" /></button>}
                            </div>
                          ) : (
                            <><p className="font-semibold text-fg">{item.bankName}</p><p className="mt-1 text-fg-secondary">{item.accountNumber}</p><p className="text-fg-secondary">{item.accountHolderName}</p></>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-fg-secondary">{formatDateTime(item.requestedAt)}</td>
                        <td className="whitespace-nowrap px-4 py-4 text-right font-semibold text-fg"><Money value={item.amount} /></td>
                        <td className="whitespace-nowrap px-4 py-4"><StateBadge status={item.status} domain={activeTab === 'topups' ? 'topup' : 'withdrawal'} /></td>
                        <td className="max-w-xs px-4 py-4 text-fg-secondary">
                          {item.rejectionReason || item.failureReason || item.adminNote || (activeTab === 'topups' && item.status === 'Pending' ? 'Chờ xác nhận thanh toán' : item.status === 'Pending' ? 'Chờ duyệt yêu cầu' : item.status === 'Processing' ? 'Đang xử lý chuyển khoản' : item.note || '—')}
                          {item.processedAt && <p className="mt-1">Cập nhật {formatDateTime(item.processedAt)}</p>}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </DataTable>
            )}
        </div>
        {!historyLoading && !historyError && total > PAGE_SIZE && (
          <nav aria-label="Phân trang lịch sử giao dịch" className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-5 sm:px-6">
            <p className="text-caption tabular-nums text-fg-secondary">Trang {history.pageNumber} / {history.totalPages}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={!history.hasPreviousPage} onClick={() => { setHistoryLoading(true); setPage(value => value - 1); }}>Trang trước</Button>
              <Button variant="outline" size="sm" disabled={!history.hasNextPage} onClick={() => { setHistoryLoading(true); setPage(value => value + 1); }}>Trang sau</Button>
            </div>
          </nav>
        )}
      </Card>
    </div>
  );
}
