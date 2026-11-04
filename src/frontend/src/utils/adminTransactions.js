export const TRANSACTION_TYPES = {
  BookingPayment: { label: 'Thanh toán gói học', short: 'Thanh toán', icon: 'receipt_long', tone: 'blue' },
  SessionPayoutCredit: { label: 'Giải ngân buổi học', short: 'Giải ngân', icon: 'payments', tone: 'success' },
  StudentRefund: { label: 'Hoàn học phí', short: 'Hoàn tiền', icon: 'refresh', tone: 'holding' },
  PlatformFeeReversal: { label: 'Hoàn phí nền tảng', short: 'Hoàn phí', icon: 'refresh', tone: 'insight' },
  DisputeAdjustment: { label: 'Điều chỉnh tranh chấp', short: 'Điều chỉnh', icon: 'tune', tone: 'neutral' },
};

export const TRANSACTION_STATUSES = { Held: "Đang giữ học phí", Released: 'Đã giải ngân', Refunded: 'Đã hoàn tiền', Pending: 'Đang xử lý', Succeeded: 'Thành công', Failed: 'Thất bại' };
export const TRANSACTION_SORTS = { Newest: 'Mới nhất', Oldest: 'Cũ nhất', AmountDesc: 'Số tiền giảm dần', AmountAsc: 'Số tiền tăng dần' };

export function transactionStatus(item) {
  if (item.status === 'Succeeded') {
    if (item.type === 'SessionPayoutCredit' && item.releasedAt) return { label: 'Đã giải ngân', tone: 'success' };
    if (item.type === 'StudentRefund') return { label: 'Đã hoàn tiền', tone: 'success' };
    if (item.type === 'PlatformFeeReversal') return { label: 'Đã hoàn phí', tone: 'success' };
    if (item.type === 'BookingPayment') return { label: 'Đã thanh toán', tone: 'blue' };
    return { label: 'Thành công', tone: 'success' };
  }
  const tones = { Held: 'holding', Released: 'success', Refunded: 'success', Pending: 'blue', Failed: 'danger' };
  return { label: TRANSACTION_STATUSES[item.status] || 'Chưa xác định', tone: tones[item.status] || 'neutral' };
}

export function transactionFilters(params) {
  return Object.fromEntries(['search', 'status', 'fromDate', 'toDate', 'type', 'sort', 'bookingId', 'settlementRequired']
    .filter(key => params.get(key)).map(key => [key, params.get(key)]));
}
