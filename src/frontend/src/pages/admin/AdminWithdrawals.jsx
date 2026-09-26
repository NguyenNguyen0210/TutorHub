import React, { useState, useEffect, useCallback, useMemo } from 'react';
import adminService from '@/services/admin.service';
import { WITHDRAWAL_STATUS, getWithdrawalStatusMeta } from '@/config/enums';
import { formatDateTime, formatRelativeTime } from '@/utils/formatters';
import Money from '@/components/ui/Money';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/Dialog';
import Avatar from '@/components/ui/Avatar';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/ui/Icon';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Tabs from '@/components/ui/Tabs';
import { TableSkeleton } from '@/components/common/Skeleton';
import EmptyState from '@/components/common/EmptyState';
import StatCard, { PageHeader } from '@/components/ui/StatCard';

const STATUS_TABS = [
  { id: 'All', label: 'Tất cả' },
  { id: WITHDRAWAL_STATUS.PENDING, label: 'Chờ tiếp nhận' },
  { id: WITHDRAWAL_STATUS.PROCESSING, label: 'Đang xử lý' },
  { id: WITHDRAWAL_STATUS.COMPLETED, label: 'Đã hoàn tất' },
  { id: WITHDRAWAL_STATUS.FAILED, label: 'Thất bại' },
];

export default function AdminWithdrawals() {
  const toast = useToast();
  const confirm = useConfirm();

  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Filter & Pagination States
  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [hasPrev, setHasPrev] = useState(false);
  const [hasNext, setHasNext] = useState(false);

  // Selected Withdrawal Detail Modal
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);
  const [actionInProgressId, setActionInProgressId] = useState(null);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Load withdrawals from API
  const fetchWithdrawals = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        status: activeTab === 'All' ? undefined : activeTab,
        pageNumber: page,
        pageSize,
      };
      const res = await adminService.getWithdrawals(params);
      setWithdrawals(res?.items || []);
      setTotalCount(res?.totalCount || 0);
      setTotalPages(res?.totalPages || 1);
      setHasPrev(res?.hasPreviousPage || false);
      setHasNext(res?.hasNextPage || false);
    } catch (err) {
      toast.error(err?.message || 'Không thể tải danh sách lệnh rút tiền.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, pageSize, toast]);

  useEffect(() => {
    fetchWithdrawals();
  }, [fetchWithdrawals]);

  // Copy helper
  const handleCopy = (text, key, e) => {
    if (e) e.stopPropagation();
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success('Đã sao chép vào bộ nhớ tạm');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Client-side search filtering
  const filteredWithdrawals = useMemo(() => {
    if (!debouncedSearch.trim()) return withdrawals;
    const term = debouncedSearch.trim().toLowerCase();
    return withdrawals.filter((item) => {
      return (
        item.tutorName?.toLowerCase().includes(term) ||
        item.tutorEmail?.toLowerCase().includes(term) ||
        item.accountNumber?.toLowerCase().includes(term) ||
        item.accountHolderName?.toLowerCase().includes(term) ||
        item.bankName?.toLowerCase().includes(term)
      );
    });
  }, [withdrawals, debouncedSearch]);

  // Summary statistics calculation
  const stats = useMemo(() => {
    const pendingItems = withdrawals.filter((w) => w.status === WITHDRAWAL_STATUS.PENDING);
    const processingItems = withdrawals.filter((w) => w.status === WITHDRAWAL_STATUS.PROCESSING);

    const pendingTotal = pendingItems.reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const processingTotal = processingItems.reduce((acc, curr) => acc + (curr.amount || 0), 0);

    return {
      pendingCount: pendingItems.length,
      processingCount: processingItems.length,
      pendingTotal,
      processingTotal,
    };
  }, [withdrawals]);

  // 1. Process Action (Pending -> Processing)
  const handleProcess = async (item) => {
    const ok = await confirm({
      title: 'Tiếp nhận xử lý lệnh rút tiền',
      content: (
        <div className="space-y-2 text-caption text-fg-secondary">
          <p>
            Bạn có chắc chắn muốn tiếp nhận lệnh rút tiền của gia sư{' '}
            <strong className="text-fg">{item.tutorName}</strong>?
          </p>
          <div className="bg-neutral-50 p-3 rounded-brand-md border border-border space-y-1">
            <div className="flex justify-between">
              <span>Số tiền:</span>
              <strong className="text-success-strong">
                <Money value={item.amount} />
              </strong>
            </div>
            <div className="flex justify-between">
              <span>Ngân hàng:</span>
              <span className="font-semibold text-fg">{item.bankName}</span>
            </div>
            <div className="flex justify-between">
              <span>Số tài khoản:</span>
              <span className="font-mono text-fg">{item.accountNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Chủ tài khoản:</span>
              <span className="uppercase text-fg font-semibold">{item.accountHolderName}</span>
            </div>
          </div>
          <p className="text-[11px] text-fg-muted">
            Trạng thái sẽ chuyển sang <strong>Đang xử lý (Processing)</strong> để kế toán tiến hành lệnh chuyển khoản.
          </p>
        </div>
      ),
      confirmText: 'Tiếp nhận lệnh',
      cancelText: 'Hủy',
      danger: false,
    });

    if (!ok) return;

    try {
      setActionInProgressId(item.id);
      await adminService.processWithdrawal(item.id);
      toast.success('Đã chuyển trạng thái lệnh rút tiền sang Đang xử lý.');
      await fetchWithdrawals();
      if (selectedWithdrawal?.id === item.id) {
        setSelectedWithdrawal((prev) => ({ ...prev, status: WITHDRAWAL_STATUS.PROCESSING }));
      }
    } catch (err) {
      toast.error(err?.message || 'Không thể tiếp nhận lệnh rút tiền.');
    } finally {
      setActionInProgressId(null);
    }
  };

  // 2. Complete Action (Processing -> Completed)
  const handleComplete = async (item) => {
    const ok = await confirm({
      title: 'Xác nhận hoàn tất chi tiền',
      content: (
        <div className="space-y-2 text-caption text-fg-secondary">
          <p>
            Vui lòng chỉ xác nhận sau khi lệnh chuyển khoản ngân hàng đã <strong>thành công thực tế</strong>:
          </p>
          <div className="bg-neutral-50 p-3 rounded-brand-md border border-border space-y-1">
            <div className="flex justify-between">
              <span>Số tiền chi:</span>
              <strong className="text-success-strong">
                <Money value={item.amount} />
              </strong>
            </div>
            <div className="flex justify-between">
              <span>Người thụ hưởng:</span>
              <span className="uppercase text-fg font-semibold">{item.accountHolderName}</span>
            </div>
            <div className="flex justify-between">
              <span>Tài khoản:</span>
              <span className="font-mono text-fg">
                {item.bankName} - {item.accountNumber}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-danger-strong font-medium">
            Thao tác này là bất biến theo quy tắc sổ cái và không thể hoàn tác sau khi đã quyết toán.
          </p>
        </div>
      ),
      confirmText: 'Xác nhận đã chuyển khoản',
      cancelText: 'Đóng',
      danger: false,
    });

    if (!ok) return;

    try {
      setActionInProgressId(item.id);
      await adminService.completeWithdrawal(item.id);
      toast.success('Đã hoàn tất lệnh chi trả rút tiền.');
      await fetchWithdrawals();
      if (selectedWithdrawal?.id === item.id) {
        setSelectedWithdrawal((prev) => ({ ...prev, status: WITHDRAWAL_STATUS.COMPLETED }));
      }
    } catch (err) {
      toast.error(err?.message || 'Không thể xác nhận hoàn tất lệnh rút tiền.');
    } finally {
      setActionInProgressId(null);
    }
  };

  // 3. Fail Action (Processing -> Failed, refund to AvailableBalance)
  const handleFail = async (item) => {
    let failureReason = '';
    const ok = await confirm({
      title: 'Báo lỗi & Từ chối lệnh rút tiền',
      content: (
        <div className="space-y-2 text-caption text-fg-secondary">
          <p>
            Giao dịch chuyển khoản không thành công hoặc thông tin tài khoản ngân hàng không hợp lệ.
          </p>
          <div className="bg-holding-subtle text-holding-strong p-3 rounded-brand-md text-caption">
            <strong>Cơ chế hoàn trả ví (DEC-WD-003):</strong> Số tiền{' '}
            <strong><Money value={item.amount} /></strong> sẽ được{' '}
            <strong>tự động hoàn trả ngay lập tức</strong> về số dư khả dụng (AvailableBalance) của gia sư.
          </div>
        </div>
      ),
      confirmText: 'Xác nhận báo lỗi & Hoàn tiền ví',
      cancelText: 'Hủy',
      danger: true,
      requireReason: true,
      reasonLabel: 'Lý do thất bại',
      reasonPlaceholder: 'Ví dụ: Sai số tài khoản, tên người thụ hưởng không khớp, tài khoản ngân hàng đã đóng...',
      minReasonLength: 5,
      onConfirmReason: (val) => {
        failureReason = val;
      },
    });

    if (!ok || !failureReason) return;

    try {
      setActionInProgressId(item.id);
      await adminService.failWithdrawal(item.id, failureReason);
      toast.success('Đã từ chối lệnh rút và hoàn trả tiền vào ví gia sư thành công.');
      await fetchWithdrawals();
      if (selectedWithdrawal?.id === item.id) {
        setSelectedWithdrawal((prev) => ({
          ...prev,
          status: WITHDRAWAL_STATUS.FAILED,
          failureReason,
        }));
      }
    } catch (err) {
      toast.error(err?.message || 'Không thể cập nhật trạng thái thất bại.');
    } finally {
      setActionInProgressId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản trị Lệnh Rút tiền"
        subtitle="Tiếp nhận, đối soát thông tin tài khoản ngân hàng thụ hưởng và giải ngân thu nhập khả dụng cho Gia sư"
        actions={
          <Button
            variant="outline"
            size="md"
            onClick={fetchWithdrawals}
            loading={loading}
            icon={<Icon name="refresh" size="sm" />}
          >
            Làm mới
          </Button>
        }
      />

      {/* Financial Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Chờ tiếp nhận"
          value={`${stats.pendingCount} lệnh`}
          hint={
            stats.pendingTotal > 0 ? (
              <span>
                Tổng chờ:{' '}
                <strong className="text-holding-strong">
                  <Money value={stats.pendingTotal} />
                </strong>
              </span>
            ) : (
              'Không có lệnh chờ tiếp nhận'
            )
          }
          icon={<Icon name="hourglass_top" size="md" />}
          tone="holding"
        />
        <StatCard
          label="Đang xử lý / Chi trả"
          value={`${stats.processingCount} lệnh`}
          hint={
            stats.processingTotal > 0 ? (
              <span>
                Đang chuyển:{' '}
                <strong className="text-info">
                  <Money value={stats.processingTotal} />
                </strong>
              </span>
            ) : (
              'Không có lệnh đang xử lý dở dang'
            )
          }
          icon={<Icon name="sync" size="md" />}
          tone="info"
        />
        <StatCard
          label="Tổng số lệnh trên hệ thống"
          value={`${totalCount} yêu cầu`}
          hint="Toàn bộ lịch sử các lệnh rút tiền từ trước tới nay"
          icon={<Icon name="payments" size="md" />}
          tone="primary"
        />
      </div>

      {/* Main Content Card */}
      <Card padding="none" className="overflow-hidden">
        {/* Filter & Search Bar */}
        <div className="p-4 border-b border-border flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-surface">
          <Tabs
            items={STATUS_TABS}
            value={activeTab}
            onChange={(tab) => {
              setActiveTab(tab);
              setPage(1);
            }}
          />
          <div className="w-full md:w-80">
            <Input
              type="search"
              placeholder="Tìm theo tên, email, STK, ngân hàng..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              iconLeft={<Icon name="search" size="sm" />}
            />
          </div>
        </div>

        {/* Content Table / Skeleton / Empty */}
        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={5} columns={6} />
          </div>
        ) : filteredWithdrawals.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={<Icon name="account_balance_wallet" size="xl" />}
              title="Không có lệnh rút tiền nào"
              description={
                debouncedSearch
                  ? `Không tìm thấy kết quả phù hợp với từ khóa "${debouncedSearch}".`
                  : activeTab !== 'All'
                    ? `Không có yêu cầu rút tiền nào ở trạng thái ${
                        STATUS_TABS.find((t) => t.id === activeTab)?.label
                      }.`
                    : 'Hiện chưa có gia sư nào tạo yêu cầu rút tiền trên hệ thống.'
              }
            />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-caption">
                <thead>
                  <tr className="border-b border-border bg-neutral-50/75 text-fg-muted font-semibold text-[11px] uppercase tracking-wider">
                    <th className="px-4 py-3">Gia sư yêu cầu</th>
                    <th className="px-4 py-3">Số tiền rút</th>
                    <th className="px-4 py-3">Tài khoản ngân hàng thụ hưởng</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3">Thời gian</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredWithdrawals.map((item) => {
                    const statusMeta = getWithdrawalStatusMeta(item.status);
                    const isProcessingThis = actionInProgressId === item.id;

                    return (
                      <tr
                        key={item.id}
                        onClick={() => setSelectedWithdrawal(item)}
                        className="hover:bg-neutral-50/60 transition-colors cursor-pointer"
                      >
                        {/* Tutor Information */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={item.tutorName} size="sm" />
                            <div>
                              <span className="font-semibold text-fg block">{item.tutorName}</span>
                              <span className="text-[11px] text-fg-muted block">{item.tutorEmail}</span>
                            </div>
                          </div>
                        </td>

                        {/* Amount */}
                        <td className="px-4 py-3.5">
                          <div className="space-y-0.5">
                            <span className="text-body-reg font-bold text-success-strong">
                              <Money value={item.amount} />
                            </span>
                          </div>
                        </td>

                        {/* Bank Details */}
                        <td className="px-4 py-3.5">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 font-semibold text-fg">
                              <span>{item.bankName}</span>
                              {item.bankCode && (
                                <span className="text-[10px] text-fg-muted bg-neutral-100 px-1 rounded font-mono">
                                  {item.bankCode}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="font-mono text-fg text-caption font-semibold">
                                {item.accountNumber}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => handleCopy(item.accountNumber, `acc-${item.id}`, e)}
                                title="Sao chép số tài khoản"
                                className="text-fg-muted hover:text-brand-primary-600 p-0.5 rounded transition-colors"
                              >
                                <Icon
                                  name={copiedKey === `acc-${item.id}` ? 'check' : 'content_copy'}
                                  size="xs"
                                />
                              </button>
                            </div>
                            <span className="text-[11px] uppercase text-fg-muted tracking-wide block font-mono">
                              {item.accountHolderName}
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3.5">
                          <Badge variant={statusMeta.color} size="sm">
                            {statusMeta.label}
                          </Badge>
                          {item.status === WITHDRAWAL_STATUS.FAILED && item.failureReason && (
                            <span
                              className="text-[10px] text-danger-strong block mt-0.5 max-w-[160px] truncate"
                              title={item.failureReason}
                            >
                              {item.failureReason}
                            </span>
                          )}
                        </td>

                        {/* Timestamps */}
                        <td className="px-4 py-3.5">
                          <div className="space-y-0.5 text-[11px] text-fg-muted">
                            <span className="block font-medium text-fg-secondary">
                              {formatDateTime(item.requestedAt)}
                            </span>
                            <span className="block text-[10px]">{formatRelativeTime(item.requestedAt)}</span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td
                          className="px-4 py-3.5 text-right space-x-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {item.status === WITHDRAWAL_STATUS.PENDING && (
                            <Button
                              variant="primary"
                              size="sm"
                              loading={isProcessingThis}
                              disabled={actionInProgressId !== null}
                              onClick={() => handleProcess(item)}
                              icon={<Icon name="sync" size="xs" />}
                            >
                              Tiếp nhận
                            </Button>
                          )}

                          {item.status === WITHDRAWAL_STATUS.PROCESSING && (
                            <div className="inline-flex items-center gap-1.5">
                              <Button
                                variant="primary"
                                size="sm"
                                loading={isProcessingThis}
                                disabled={actionInProgressId !== null}
                                onClick={() => handleComplete(item)}
                                icon={<Icon name="check_circle" size="xs" />}
                              >
                                Đã chuyển
                              </Button>
                              <Button
                                variant="danger-ghost"
                                size="sm"
                                disabled={actionInProgressId !== null}
                                onClick={() => handleFail(item)}
                                icon={<Icon name="cancel" size="xs" />}
                              >
                                Báo lỗi
                              </Button>
                            </div>
                          )}

                          {(item.status === WITHDRAWAL_STATUS.COMPLETED ||
                            item.status === WITHDRAWAL_STATUS.FAILED) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedWithdrawal(item)}
                              icon={<Icon name="visibility" size="xs" />}
                            >
                              Chi tiết
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-3.5 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 bg-neutral-50/50">
                <span className="text-caption text-fg-muted font-mono">
                  Trang <strong>{page}</strong> / {totalPages} (Tổng {totalCount} lệnh)
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!hasPrev || loading}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    icon={<Icon name="chevron_left" size="sm" />}
                  >
                    Trang trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!hasNext || loading}
                    onClick={() => setPage((p) => p + 1)}
                    iconRight={<Icon name="chevron_right" size="sm" />}
                  >
                    Trang sau
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Modal: Full Withdrawal Details */}
      {selectedWithdrawal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="withdrawal-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn"
        >
          <button
            type="button"
            aria-label="Đóng cửa sổ"
            className="fixed inset-0 w-full h-full bg-brand-navy-950/60 backdrop-blur-sm cursor-default"
            onClick={() => setSelectedWithdrawal(null)}
            tabIndex={-1}
          />
          <div className="relative bg-surface rounded-brand-xl shadow-brand-xl border border-border w-full max-w-xl max-h-[90vh] flex flex-col z-10">
            {/* Modal Header */}
            <div className="p-5 border-b border-border flex items-center justify-between bg-neutral-50/50">
              <div className="flex items-center gap-2">
                <Icon name="account_balance" size="md" className="text-brand-primary-600" />
                <div>
                  <h3 id="withdrawal-modal-title" className="text-headline-3 text-fg font-bold m-0">
                    Chi tiết lệnh rút tiền
                  </h3>
                  <span className="text-[11px] font-mono text-fg-muted">
                    ID: {selectedWithdrawal.id}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedWithdrawal(null)}
                aria-label="Đóng"
                className="text-fg-muted hover:text-fg p-1 rounded-brand-md transition-colors"
              >
                <Icon name="close" size="sm" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-caption">
              {/* Status Banner */}
              <div className="flex items-center justify-between p-3 rounded-brand-lg bg-neutral-50 border border-border">
                <span className="text-fg-muted font-medium">Trạng thái xử lý:</span>
                <Badge variant={getWithdrawalStatusMeta(selectedWithdrawal.status).color} size="md">
                  {getWithdrawalStatusMeta(selectedWithdrawal.status).label}
                </Badge>
              </div>

              {/* Amount Breakdown */}
              <div className="p-4 rounded-brand-lg bg-success-subtle border border-success/30 flex items-center justify-between">
                <div>
                  <span className="text-caption text-fg-secondary block font-medium">
                    Số tiền yêu cầu rút:
                  </span>
                  <span className="text-headline-1 font-bold text-success-strong">
                    <Money value={selectedWithdrawal.amount} />
                  </span>
                </div>
                <Icon name="payments" size="xl" className="text-success-strong" />
              </div>

              {/* Tutor Details */}
              <div className="space-y-2">
                <h4 className="text-caption font-bold text-fg uppercase tracking-wider">
                  Thông tin Gia sư
                </h4>
                <div className="bg-neutral-50 p-3 rounded-brand-md border border-border space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-fg-muted">Họ và tên:</span>
                    <strong className="text-fg">{selectedWithdrawal.tutorName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-fg-muted">Email tài khoản:</span>
                    <span className="text-fg">{selectedWithdrawal.tutorEmail}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-fg-muted">Mã ví (WalletId):</span>
                    <span className="font-mono text-xs text-fg-muted">
                      {selectedWithdrawal.walletId}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              <div className="space-y-2">
                <h4 className="text-caption font-bold text-fg uppercase tracking-wider">
                  Tài khoản nhận tiền (Ngân hàng thụ hưởng)
                </h4>
                <div className="bg-neutral-50 p-3 rounded-brand-md border border-border space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-fg-muted">Tên ngân hàng:</span>
                    <strong className="text-fg">{selectedWithdrawal.bankName}</strong>
                  </div>
                  {selectedWithdrawal.bankCode && (
                    <div className="flex justify-between items-center">
                      <span className="text-fg-muted">Mã ngân hàng (BIN/Code):</span>
                      <span className="font-mono text-fg font-semibold">
                        {selectedWithdrawal.bankCode}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-fg-muted">Số tài khoản:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-headline-3 font-bold text-brand-primary-700">
                        {selectedWithdrawal.accountNumber}
                      </span>
                      <button
                        type="button"
                        onClick={(e) =>
                          handleCopy(selectedWithdrawal.accountNumber, 'modal-acc', e)
                        }
                        title="Sao chép STK"
                        className="text-fg-muted hover:text-brand-primary-600 p-1 rounded transition-colors"
                      >
                        <Icon
                          name={copiedKey === 'modal-acc' ? 'check' : 'content_copy'}
                          size="xs"
                        />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-fg-muted">Chủ tài khoản:</span>
                    <strong className="uppercase font-mono text-fg text-body-reg">
                      {selectedWithdrawal.accountHolderName}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Audit Timeline */}
              <div className="space-y-2">
                <h4 className="text-caption font-bold text-fg uppercase tracking-wider">
                  Lịch sử xử lý & Kiểm toán
                </h4>
                <div className="bg-neutral-50 p-3 rounded-brand-md border border-border space-y-1.5 text-xs text-fg-secondary">
                  <div className="flex justify-between">
                    <span>Thời điểm yêu cầu:</span>
                    <span className="font-medium text-fg">
                      {formatDateTime(selectedWithdrawal.requestedAt)}
                    </span>
                  </div>

                  {selectedWithdrawal.processingStartedAt && (
                    <div className="flex justify-between">
                      <span>Bắt đầu xử lý:</span>
                      <span className="font-medium text-fg">
                        {formatDateTime(selectedWithdrawal.processingStartedAt)}
                        {selectedWithdrawal.processingStartedByAdminName &&
                          ` (bởi ${selectedWithdrawal.processingStartedByAdminName})`}
                      </span>
                    </div>
                  )}

                  {selectedWithdrawal.processedAt && (
                    <div className="flex justify-between">
                      <span>Hoàn tất / Quyết toán:</span>
                      <span className="font-medium text-fg">
                        {formatDateTime(selectedWithdrawal.processedAt)}
                        {selectedWithdrawal.processedByAdminName &&
                          ` (bởi ${selectedWithdrawal.processedByAdminName})`}
                      </span>
                    </div>
                  )}

                  {selectedWithdrawal.failureReason && (
                    <div className="pt-2 border-t border-border mt-2">
                      <span className="text-danger-strong font-semibold block">Lý do thất bại:</span>
                      <p className="text-fg mt-0.5 bg-danger-subtle/50 p-2 rounded text-caption border border-danger/20">
                        {selectedWithdrawal.failureReason}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 border-t border-border flex items-center justify-end gap-2 bg-neutral-50/50">
              {selectedWithdrawal.status === WITHDRAWAL_STATUS.PENDING && (
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => handleProcess(selectedWithdrawal)}
                  icon={<Icon name="sync" size="sm" />}
                >
                  Tiếp nhận lệnh chi
                </Button>
              )}

              {selectedWithdrawal.status === WITHDRAWAL_STATUS.PROCESSING && (
                <>
                  <Button
                    variant="danger-outline"
                    size="md"
                    onClick={() => handleFail(selectedWithdrawal)}
                    icon={<Icon name="cancel" size="sm" />}
                  >
                    Báo lỗi / Hoàn tiền
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => handleComplete(selectedWithdrawal)}
                    icon={<Icon name="check_circle" size="sm" />}
                  >
                    Xác nhận hoàn tất chi tiền
                  </Button>
                </>
              )}

              <Button
                variant="outline"
                size="md"
                onClick={() => setSelectedWithdrawal(null)}
              >
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
