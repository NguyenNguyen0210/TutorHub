import React, { useState, useEffect, useCallback } from 'react';
import studentWalletService from '@/services/studentWallet.service';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import Money from '@/components/ui/Money';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/Dialog';
import Card, { CardHeader } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/ui/Icon';
import Button from '@/components/ui/Button';
import Input, { Field } from '@/components/ui/Input';
import Tabs from '@/components/ui/Tabs';
import { TableSkeleton } from '@/components/common/Skeleton';
import EmptyState from '@/components/common/EmptyState';
import { PageHeader } from '@/components/ui/StatCard';

export default function AdminStudentWallets() {
  const toast = useToast();
  const confirm = useConfirm();

  const [activeTab, setActiveTab] = useState('topups');

  // Top-Up Requests State
  const [topUps, setTopUps] = useState([]);
  const [loadingTopUps, setLoadingTopUps] = useState(false);
  const [topUpStatusFilter, setTopUpStatusFilter] = useState('All');
  const [topUpSearch, setTopUpSearch] = useState('');

  // Confirm / Reject Modal State
  const [confirmModalData, setConfirmModalData] = useState(null);
  const [adminNoteInput, setAdminNoteInput] = useState('');
  const [submittingConfirm, setSubmittingConfirm] = useState(false);

  const [rejectModalData, setRejectModalData] = useState(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [submittingReject, setSubmittingReject] = useState(false);

  // Withdrawals State
  const [withdrawals, setWithdrawals] = useState([]);
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(false);
  const [withdrawalStatusFilter, setWithdrawalStatusFilter] = useState('All');
  const [failModalData, setFailModalData] = useState(null);
  const [failReasonInput, setFailReasonInput] = useState('');
  const [submittingFail, setSubmittingFail] = useState(false);

  // Adjustment State
  const [adjustWalletId, setAdjustWalletId] = useState('');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustDirection, setAdjustDirection] = useState('Credit');
  const [adjustReason, setAdjustReason] = useState('');
  const [submittingAdjust, setSubmittingAdjust] = useState(false);

  // 1. Fetch Top-Up Requests
  const fetchTopUps = useCallback(async () => {
    try {
      setLoadingTopUps(true);
      const params = {
        status: topUpStatusFilter === 'All' ? null : topUpStatusFilter,
        pageNumber: 1,
        pageSize: 50,
      };
      const res = await studentWalletService.adminGetTopUps(params);
      setTopUps(res?.items || []);
    } catch {
      toast.error('Không thể tải danh sách nạp tiền học viên.');
    } finally {
      setLoadingTopUps(false);
    }
  }, [topUpStatusFilter, toast]);

  // 2. Fetch Withdrawals
  const fetchWithdrawals = useCallback(async () => {
    try {
      setLoadingWithdrawals(true);
      const params = {
        status: withdrawalStatusFilter === 'All' ? null : withdrawalStatusFilter,
        pageNumber: 1,
        pageSize: 50,
      };
      const res = await studentWalletService.adminGetWithdrawals(params);
      setWithdrawals(res?.items || []);
    } catch {
      toast.error('Không thể tải danh sách rút tiền học viên.');
    } finally {
      setLoadingWithdrawals(false);
    }
  }, [withdrawalStatusFilter, toast]);

  useEffect(() => {
    if (activeTab === 'topups') fetchTopUps();
    else if (activeTab === 'withdrawals') fetchWithdrawals();
  }, [activeTab, fetchTopUps, fetchWithdrawals]);

  // Handle Confirm Top-Up
  const handleConfirmTopUp = async () => {
    if (!confirmModalData) return;
    try {
      setSubmittingConfirm(true);
      await studentWalletService.adminConfirmTopUp(confirmModalData.id, {
        adminNote: adminNoteInput.trim() || null,
      });
      toast.success(`Đã duyệt nạp ${formatCurrency(confirmModalData.amount)} cho học viên!`);
      setConfirmModalData(null);
      setAdminNoteInput('');
      fetchTopUps();
    } catch (err) {
      toast.error(err?.message || 'Không thể duyệt nạp tiền.');
    } finally {
      setSubmittingConfirm(false);
    }
  };

  // Handle Reject Top-Up
  const handleRejectTopUp = async () => {
    if (!rejectModalData) return;
    if (!rejectionReasonInput.trim()) {
      toast.error('Vui lòng nhập lý do từ chối.');
      return;
    }
    try {
      setSubmittingReject(true);
      await studentWalletService.adminRejectTopUp(rejectModalData.id, {
        reason: rejectionReasonInput.trim(),
      });
      toast.warning('Đã từ chối yêu cầu nạp tiền.');
      setRejectModalData(null);
      setRejectionReasonInput('');
      fetchTopUps();
    } catch (err) {
      toast.error(err?.message || 'Không thể từ chối yêu cầu.');
    } finally {
      setSubmittingReject(false);
    }
  };

  // Handle Process Withdrawal
  const handleProcessWithdrawal = async (id) => {
    const ok = await confirm({
      title: 'Bắt đầu xử lý rút tiền',
      content: 'Chuyển trạng thái sang "Đang xử lý" để kế toán thực hiện chuyển khoản?',
      confirmText: 'Bắt đầu xử lý',
    });
    if (!ok) return;

    try {
      await studentWalletService.adminProcessWithdrawal(id);
      toast.success('Lệnh rút tiền đã được chuyển sang trạng thái Đang xử lý.');
      fetchWithdrawals();
    } catch (err) {
      toast.error(err?.message || 'Không thể cập nhật trạng thái.');
    }
  };

  // Handle Complete Withdrawal
  const handleCompleteWithdrawal = async (id) => {
    const ok = await confirm({
      title: 'Xác nhận hoàn tất chuyển khoản',
      content: 'Bạn đã chuyển tiền thành công qua ngân hàng cho học viên?',
      confirmText: 'Đã chuyển tiền',
    });
    if (!ok) return;

    try {
      await studentWalletService.adminCompleteWithdrawal(id);
      toast.success('Đã hoàn tất lệnh rút tiền và giải phóng tiền giữ.');
      fetchWithdrawals();
    } catch (err) {
      toast.error(err?.message || 'Không thể hoàn tất lệnh rút tiền.');
    }
  };

  // Handle Fail Withdrawal
  const handleFailWithdrawal = async () => {
    if (!failModalData) return;
    if (!failReasonInput.trim()) {
      toast.error('Vui lòng nhập lý do thất bại.');
      return;
    }

    try {
      setSubmittingFail(true);
      await studentWalletService.adminFailWithdrawal(failModalData.id, {
        reason: failReasonInput.trim(),
      });
      toast.success('Đã ghi nhận thất bại và hoàn trả tiền về ví học viên.');
      setFailModalData(null);
      setFailReasonInput('');
      fetchWithdrawals();
    } catch (err) {
      toast.error(err?.message || 'Không thể cập nhật trạng thái.');
    } finally {
      setSubmittingFail(false);
    }
  };

  // Handle Manual Adjustment
  const handleAdjustWallet = async (e) => {
    e.preventDefault();
    const num = Number(adjustAmount);
    if (!adjustWalletId.trim() || !num || num <= 0 || !adjustReason.trim()) {
      toast.error('Vui lòng điền đầy đủ Mã Ví, Số tiền hợp lệ và Lý do điều chỉnh.');
      return;
    }

    const ok = await confirm({
      title: 'Xác nhận điều chỉnh số dư ví học viên',
      content: `Bạn có chắc muốn ${adjustDirection === 'Credit' ? 'CỘNG' : 'TRỪ'} ${formatCurrency(num)} vào ví ${adjustWalletId}? Hành động này sẽ được ghi vào sổ cái bất biến.`,
      confirmText: 'Xác nhận điều chỉnh',
      danger: adjustDirection === 'Debit',
    });
    if (!ok) return;

    try {
      setSubmittingAdjust(true);
      await studentWalletService.adminAdjustWallet({
        studentWalletId: adjustWalletId.trim(),
        amount: num,
        direction: adjustDirection,
        reason: adjustReason.trim(),
      });
      toast.success('Điều chỉnh số dư thành công và đã ghi sổ cái.');
      setAdjustAmount('');
      setAdjustReason('');
    } catch (err) {
      toast.error(err?.message || 'Không thể điều chỉnh số dư ví.');
    } finally {
      setSubmittingAdjust(false);
    }
  };

  // Filtered TopUps
  const filteredTopUps = topUps.filter((item) => {
    if (!topUpSearch.trim()) return true;
    const q = topUpSearch.toLowerCase();
    return (
      item.transferReference?.toLowerCase().includes(q) ||
      item.studentName?.toLowerCase().includes(q) ||
      item.studentEmail?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản trị Ví Học Viên (Student Wallets)"
        subtitle="Đối soát duyệt lệnh nạp tiền, xử lý rút tiền về ngân hàng và kiểm soát sổ cái học viên."
      />

      {/* Tabs */}
      <div className="space-y-4">
        <Tabs
          tabs={[
            { id: 'topups', label: 'Duyệt nạp tiền (Top-Up)' },
            { id: 'withdrawals', label: 'Xử lý rút tiền (Withdrawals)' },
            { id: 'adjust', label: 'Điều chỉnh số dư đặc biệt' },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        {/* TAB 1: TOP-UPS */}
        {activeTab === 'topups' && (
          <Card padding="lg" className="space-y-4 border border-border shadow-brand-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <CardHeader
                  title="Danh sách yêu cầu nạp tiền"
                  icon={<Icon name="add_card" size="sm" className="text-brand-primary-600" />}
                />
                <span className="text-caption text-fg-muted font-mono">
                  ({filteredTopUps.length} yêu cầu)
                </span>
              </div>

              {/* Status Filters & Search */}
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <select
                  value={topUpStatusFilter}
                  onChange={(e) => setTopUpStatusFilter(e.target.value)}
                  className="h-9 px-3 rounded-brand-md border border-border bg-surface text-caption text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary-600"
                >
                  <option value="All">Tất cả trạng thái</option>
                  <option value="Pending">Chờ duyệt (Pending)</option>
                  <option value="Confirmed">Đã duyệt (Confirmed)</option>
                  <option value="Rejected">Đã từ chối (Rejected)</option>
                </select>

                <div className="w-full sm:w-56">
                  <Input
                    placeholder="Tìm tên, email, mã ref..."
                    value={topUpSearch}
                    onChange={(e) => setTopUpSearch(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {loadingTopUps ? (
              <TableSkeleton rows={6} />
            ) : filteredTopUps.length === 0 ? (
              <EmptyState
                icon="inbox"
                title="Không có yêu cầu nạp tiền nào"
                description="Khi học viên tạo yêu cầu nạp tiền chuyển khoản, thông tin sẽ xuất hiện ở đây."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[750px] text-caption text-left">
                  <thead>
                    <tr className="bg-neutral-50 border-b border-border">
                      <th className="px-4 py-3 font-semibold text-fg-secondary uppercase tracking-wide">Học viên</th>
                      <th className="px-4 py-3 font-semibold text-fg-secondary uppercase tracking-wide">Mã chuyển khoản</th>
                      <th className="px-4 py-3 font-semibold text-fg-secondary uppercase tracking-wide text-right">Số tiền nạp</th>
                      <th className="px-4 py-3 font-semibold text-fg-secondary uppercase tracking-wide">Thời gian</th>
                      <th className="px-4 py-3 font-semibold text-fg-secondary uppercase tracking-wide">Trạng thái</th>
                      <th className="px-4 py-3 font-semibold text-fg-secondary uppercase tracking-wide text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredTopUps.map((row) => {
                      const isPending = row.status === 'Pending';
                      const isConfirmed = row.status === 'Confirmed';
                      const isRejected = row.status === 'Rejected';
                      return (
                        <tr key={row.id} className="hover:bg-neutral-50/80 transition-colors">
                          <td className="px-4 py-3">
                            <span className="font-bold text-fg block">{row.studentName || 'Học viên'}</span>
                            <span className="text-[11px] text-fg-muted font-mono block">{row.studentEmail}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-mono font-bold text-brand-primary-700 bg-brand-primary-50 px-2 py-0.5 rounded border border-brand-primary-200">
                              {row.transferReference}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-bold font-mono text-success-strong tabular-nums whitespace-nowrap">
                            +{formatCurrency(row.amount)}
                          </td>
                          <td className="px-4 py-3 font-mono text-fg-secondary whitespace-nowrap">
                            {formatDateTime(row.requestedAt)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <Badge
                              variant={isConfirmed ? 'success' : isRejected ? 'danger' : 'warning'}
                              size="sm"
                            >
                              {isConfirmed ? 'Đã cộng tiền' : isRejected ? 'Đã từ chối' : 'Chờ xác nhận'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            {isPending ? (
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="success"
                                  size="sm"
                                  onClick={() => setConfirmModalData(row)}
                                >
                                  Xác nhận nạp
                                </Button>
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() => setRejectModalData(row)}
                                >
                                  Từ chối
                                </Button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-fg-muted italic">
                                {row.rejectionReason || row.adminNote || 'Đã hoàn tất'}
                              </span>
                            )}
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

        {/* TAB 2: WITHDRAWALS */}
        {activeTab === 'withdrawals' && (
          <Card padding="lg" className="space-y-4 border border-border shadow-brand-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <CardHeader
                  title="Danh sách yêu cầu rút tiền học viên"
                  icon={<Icon name="payments" size="sm" className="text-brand-primary-600" />}
                />
                <span className="text-caption text-fg-muted font-mono">
                  ({withdrawals.length} lệnh)
                </span>
              </div>

              <select
                value={withdrawalStatusFilter}
                onChange={(e) => setWithdrawalStatusFilter(e.target.value)}
                className="h-9 px-3 rounded-brand-md border border-border bg-surface text-caption text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary-600"
              >
                <option value="All">Tất cả trạng thái</option>
                <option value="Pending">Chờ tiếp nhận (Pending)</option>
                <option value="Processing">Đang xử lý (Processing)</option>
                <option value="Completed">Đã hoàn tất (Completed)</option>
                <option value="Failed">Thất bại (Failed)</option>
              </select>
            </div>

            {loadingWithdrawals ? (
              <TableSkeleton rows={6} />
            ) : withdrawals.length === 0 ? (
              <EmptyState
                icon="payments"
                title="Không có yêu cầu rút tiền nào"
                description="Khi học viên tạo lệnh rút tiền, thông tin sẽ xuất hiện ở đây để kế toán xử lý."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] text-caption text-left">
                  <thead>
                    <tr className="bg-neutral-50 border-b border-border">
                      <th className="px-4 py-3 font-semibold text-fg-secondary uppercase tracking-wide">Học viên</th>
                      <th className="px-4 py-3 font-semibold text-fg-secondary uppercase tracking-wide">Tài khoản nhận tiền</th>
                      <th className="px-4 py-3 font-semibold text-fg-secondary uppercase tracking-wide text-right">Số tiền rút</th>
                      <th className="px-4 py-3 font-semibold text-fg-secondary uppercase tracking-wide">Thời gian</th>
                      <th className="px-4 py-3 font-semibold text-fg-secondary uppercase tracking-wide">Trạng thái</th>
                      <th className="px-4 py-3 font-semibold text-fg-secondary uppercase tracking-wide text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {withdrawals.map((w) => {
                      const isPending = w.status === 'Pending';
                      const isProcessing = w.status === 'Processing';
                      const isCompleted = w.status === 'Completed';
                      const isFailed = w.status === 'Failed';
                      return (
                        <tr key={w.id} className="hover:bg-neutral-50/80 transition-colors">
                          <td className="px-4 py-3">
                            <span className="font-bold text-fg block">{w.studentName || 'Học viên'}</span>
                            <span className="text-[11px] text-fg-muted font-mono block">{w.studentEmail}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-semibold text-fg block">{w.bankName}</span>
                            <span className="text-[11px] font-mono text-fg-muted block">
                              STK: {w.accountNumber} ({w.accountHolderName})
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-bold font-mono text-danger-strong tabular-nums whitespace-nowrap">
                            -{formatCurrency(w.amount)}
                          </td>
                          <td className="px-4 py-3 font-mono text-fg-secondary whitespace-nowrap">
                            {formatDateTime(w.requestedAt)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <Badge
                              variant={isCompleted ? 'success' : isFailed ? 'danger' : isProcessing ? 'holding' : 'warning'}
                              size="sm"
                            >
                              {isCompleted ? 'Đã hoàn tất' : isFailed ? 'Thất bại (hoàn lại)' : isProcessing ? 'Đang chuyển' : 'Chờ xử lý'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            {isPending && (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleProcessWithdrawal(w.id)}
                              >
                                Bắt đầu xử lý
                              </Button>
                            )}
                            {isProcessing && (
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="success"
                                  size="sm"
                                  onClick={() => handleCompleteWithdrawal(w.id)}
                                >
                                  Hoàn tất
                                </Button>
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() => setFailModalData(w)}
                                >
                                  Báo lỗi / Hủy
                                </Button>
                              </div>
                            )}
                            {(isCompleted || isFailed) && (
                              <span className="text-[11px] text-fg-muted italic">
                                {w.failureReason || 'Đã kết thúc'}
                              </span>
                            )}
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

        {/* TAB 3: ADJUSTMENT */}
        {activeTab === 'adjust' && (
          <Card padding="lg" className="max-w-xl mx-auto space-y-4 border border-border shadow-brand-sm">
            <CardHeader
              title="Điều chỉnh số dư sổ cái học viên (Manual Ledger Adjustment)"
              icon={<Icon name="tune" size="sm" className="text-brand-primary-600" />}
            />
            <p className="text-caption text-fg-muted">
              Hành động này áp dụng các nghiệp vụ đền bù hoặc xử lý offline đặc biệt. Mọi biến động được ghi vào sổ cái bất biến với dấu vết tài khoản Admin thực hiện.
            </p>

            <form onSubmit={handleAdjustWallet} className="space-y-4 pt-2">
              <Field label="Mã Ví Học Viên (StudentWalletId - GUID)">
                <Input
                  placeholder="Ví dụ: 3fa85f64-5717-4562-b3fc-2c963f66afa6"
                  value={adjustWalletId}
                  onChange={(e) => setAdjustWalletId(e.target.value)}
                  required
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Loại điều chỉnh">
                  <select
                    value={adjustDirection}
                    onChange={(e) => setAdjustDirection(e.target.value)}
                    className="w-full h-10 rounded-brand-md border border-border bg-surface px-3 text-caption text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary-600"
                  >
                    <option value="Credit">Cộng tiền (+ Credit)</option>
                    <option value="Debit">Trừ tiền (- Debit)</option>
                  </select>
                </Field>

                <Field label="Số tiền điều chỉnh (VND)">
                  <Input
                    type="number"
                    placeholder="Ví dụ: 100000"
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(e.target.value)}
                    min="1000"
                    step="1000"
                    required
                  />
                </Field>
              </div>

              <Field label="Lý do điều chỉnh (Bắt buộc)">
                <Input
                  placeholder="Ví dụ: Đền bù gián đoạn hệ thống theo quyết định #123"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  required
                />
              </Field>

              <Button
                type="submit"
                variant="primary"
                fullWidth
                loading={submittingAdjust}
              >
                Ghi sổ điều chỉnh số dư
              </Button>
            </form>
          </Card>
        )}
      </div>

      {/* CONFIRM TOP-UP MODAL */}
      {confirmModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-surface rounded-brand-lg border border-border shadow-brand-xl p-5 space-y-4 animate-scale-up">
            <div className="flex items-center gap-2 text-success-strong font-bold">
              <Icon name="check_circle" size="sm" />
              <span>Xác nhận đã nhận tiền nạp</span>
            </div>
            <p className="text-caption text-fg leading-relaxed">
              Bạn xác nhận đã nhận được khoản chuyển <strong>{formatCurrency(confirmModalData.amount)}</strong> từ học viên <strong>{confirmModalData.studentName}</strong> (Cú pháp: <code>{confirmModalData.transferReference}</code>)?
            </p>
            <Field label="Ghi chú đối soát (Tùy chọn)">
              <Input
                placeholder="Ví dụ: Khớp giao dịch VCB 10:30 ngày 22/09"
                value={adminNoteInput}
                onChange={(e) => setAdminNoteInput(e.target.value)}
              />
            </Field>
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
              <Button variant="outline" onClick={() => setConfirmModalData(null)}>
                Hủy bỏ
              </Button>
              <Button variant="success" loading={submittingConfirm} onClick={handleConfirmTopUp}>
                Cộng {formatCurrency(confirmModalData.amount)} vào ví
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT TOP-UP MODAL */}
      {rejectModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-surface rounded-brand-lg border border-border shadow-brand-xl p-5 space-y-4 animate-scale-up">
            <div className="flex items-center gap-2 text-danger-strong font-bold">
              <Icon name="cancel" size="sm" />
              <span>Từ chối yêu cầu nạp tiền</span>
            </div>
            <p className="text-caption text-fg leading-relaxed">
              Từ chối yêu cầu nạp tiền <strong>{formatCurrency(rejectModalData.amount)}</strong> (Ref: <code>{rejectModalData.transferReference}</code>). Vui lòng cung cấp lý do để gửi thông báo cho học viên.
            </p>
            <Field label="Lý do từ chối (Bắt buộc)">
              <Input
                placeholder="Ví dụ: Không tìm thấy giao dịch ngân hàng khớp cú pháp sau 24h"
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                required
              />
            </Field>
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
              <Button variant="outline" onClick={() => setRejectModalData(null)}>
                Hủy
              </Button>
              <Button variant="danger" loading={submittingReject} onClick={handleRejectTopUp}>
                Từ chối yêu cầu
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* FAIL WITHDRAWAL MODAL */}
      {failModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-surface rounded-brand-lg border border-border shadow-brand-xl p-5 space-y-4 animate-scale-up">
            <div className="flex items-center gap-2 text-danger-strong font-bold">
              <Icon name="error" size="sm" />
              <span>Báo lỗi rút tiền & Hoàn trả ví</span>
            </div>
            <p className="text-caption text-fg leading-relaxed">
              Lệnh rút <strong>{formatCurrency(failModalData.amount)}</strong> sẽ chuyển sang trạng thái Thất bại. Số tiền đang tạm giữ sẽ được <strong>tự động hoàn trả 100% về số dư khả dụng</strong> của học viên.
            </p>
            <Field label="Lý do thất bại (Bắt buộc)">
              <Input
                placeholder="Ví dụ: Số tài khoản thụ hưởng không tồn tại hoặc sai tên chủ thẻ"
                value={failReasonInput}
                onChange={(e) => setFailReasonInput(e.target.value)}
                required
              />
            </Field>
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
              <Button variant="outline" onClick={() => setFailModalData(null)}>
                Hủy
              </Button>
              <Button variant="danger" loading={submittingFail} onClick={handleFailWithdrawal}>
                Xác nhận hoàn lại tiền vào ví
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
