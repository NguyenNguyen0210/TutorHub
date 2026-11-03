export const MIN_TUTOR_WITHDRAWAL = 50000;

export function maskBankAccount(value) {
  const account = String(value || '').trim();
  if (!account) return 'Chưa có tài khoản';
  return account.length <= 4 ? '••••' : `•••• ${account.slice(-4)}`;
}

export function withdrawalBlocker(amount, balance, account) {
  const value = Number(amount);
  if (!Number.isFinite(value) || value < MIN_TUTOR_WITHDRAWAL) return 'Số tiền rút tối thiểu là 50.000 ₫.';
  if (value > Number(balance)) return 'Số tiền rút vượt quá số dư có thể rút.';
  if (!account?.bankName?.trim() || !account?.accountNumber?.trim() || !account?.accountHolderName?.trim()) return 'Chưa có đủ thông tin ngân hàng nhận tiền.';
  return null;
}

export function pendingTuition(contract) {
  const total = Math.max(0, Number(contract.totalPrice) || 0);
  const released = Math.max(0, Number(contract.releasedAmount) || 0);
  const refunded = Math.max(0, Number(contract.refundedAmount) || 0);
  return Math.max(0, total - released - refunded);
}

const TRANSACTION_LABELS = {
  SessionPayoutCredit: 'Nhận thu nhập buổi học',
  WithdrawalDebit: 'Tạm giữ tiền theo yêu cầu rút',
  WithdrawalReversalCredit: 'Hoàn khoản tiền rút',
  WithdrawalFailedAdjustmentCredit: 'Hoàn tiền rút chưa thành công',
  WithdrawalSuccessSettlement: 'Hoàn tất chuyển tiền rút',
  AdjustmentCredit: 'Điều chỉnh tăng số dư', AdjustmentDebit: 'Điều chỉnh giảm số dư',
  DisputeHoldReservationDebit: 'Tạm giữ để xử lý khiếu nại',
  DisputeHoldReleaseCredit: 'Hoàn khoản tạm giữ khiếu nại',
  DisputeRecoveryDebit: 'Điều chỉnh theo kết quả khiếu nại',
  TopUpCredit: 'Nạp tiền vào ví', CoursePaymentDebit: 'Thanh toán gói học', RefundCredit: 'Hoàn học phí',
};
export function walletTransactionLabel(type) { return TRANSACTION_LABELS[type] || 'Giao dịch ví'; }

export function walletTransactionDirection(row) {
  // Settlement closes money already reserved; it does not debit the available balance again.
  if (row.type === 'WithdrawalSuccessSettlement') return null;
  if (['Credit', 'Debit'].includes(row.direction)) return row.direction;
  return row.type?.endsWith('Credit') ? 'Credit' : row.type?.endsWith('Debit') ? 'Debit' : null;
}

export function walletTransactionLink(row) {
  const reference = row.referenceId;
  if (row.referenceType === 'Session' && reference) return `/tutor/sessions/${encodeURIComponent(reference)}`;
  const withdrawalId = row.withdrawalId || (row.referenceType === 'Withdrawal' ? reference : null);
  return withdrawalId ? `/tutor/wallet?recordId=${encodeURIComponent(withdrawalId)}` : null;
}
