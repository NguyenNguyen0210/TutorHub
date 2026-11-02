import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeTuition } from '../src/utils/studentDashboard.js';

test('new active course retains its full tuition in escrow', () => {
  assert.deepEqual(summarizeTuition([{ status: 'Active', totalPrice: 3450000, releasedAmount: 0 }]), {
    totalTuition: 3450000, escrowReleased: 0, escrowRefunded: 0, escrowRemaining: 3450000,
  });
});

test('completed contracts remain in original tuition and disbursement totals', () => {
  const summary = summarizeTuition([
    { status: 'Active', totalPrice: 300, releasedAmount: 100 },
    { status: 'Completed', totalPrice: 200, releasedAmount: 200 },
    { status: 'Pending', totalPrice: 900 },
  ]);
  assert.deepEqual(summary, { totalTuition: 500, escrowReleased: 300, escrowRefunded: 0, escrowRemaining: 200 });
});

test('successful refunds are not counted as remaining escrow; empty dashboard is zero', () => {
  const summary = summarizeTuition([{ status: 'Cancelled', totalPrice: 300, releasedAmount: 100, refundedAmount: 200 }]);
  assert.equal(summary.escrowRemaining, 0);
  assert.equal(summary.escrowRefunded, 200);
  assert.equal(summarizeTuition([]).totalTuition, 0);
});
