import test from 'node:test';
import assert from 'node:assert/strict';
import { URLSearchParams } from 'node:url';
import { transactionStatus, transactionFilters } from '../src/utils/adminTransactions.js';

test('transaction states distinguish escrow, settled payouts, refunds and actual failures', () => {
  assert.deepEqual(transactionStatus({ status: 'Held', type: 'BookingPayment' }), { label: 'Đang ký quỹ', tone: 'holding' });
  assert.equal(transactionStatus({ status: 'Pending' }).tone, 'blue');
  assert.equal(transactionStatus({ status: 'Failed' }).tone, 'danger');
  assert.equal(transactionStatus({ status: 'Succeeded', type: 'BookingPayment' }).label, 'Đã thanh toán');
  assert.equal(transactionStatus({ status: 'Succeeded', type: 'SessionPayoutCredit' }).label, 'Thành công');
  assert.equal(transactionStatus({ status: 'Succeeded', type: 'SessionPayoutCredit', releasedAt: '2026-11-04T00:00:00Z' }).label, 'Đã giải ngân');
  assert.equal(transactionStatus({ status: 'Succeeded', type: 'StudentRefund' }).label, 'Đã hoàn tiền');
  assert.equal(transactionStatus({ status: 'Succeeded', type: 'PlatformFeeReversal' }).label, 'Đã hoàn phí');
  assert.equal(transactionStatus({ status: 'unknown' }).tone, 'neutral');
});

test('opening reconciliation does not change list filters and pagination preserves the booking scope', () => {
  const filters = transactionFilters(new URLSearchParams('search=Vy&type=StudentRefund&sort=AmountAsc&fromDate=2026-11-03&toDate=2026-11-04&bookingId=booking&transactionId=detail&page=3'));
  assert.deepEqual(filters, { search: 'Vy', fromDate: '2026-11-03', toDate: '2026-11-04', type: 'StudentRefund', sort: 'AmountAsc', bookingId: 'booking' });
});
