import test from 'node:test';
import assert from 'node:assert/strict';
import { statementIssues } from '../src/utils/walletStatement.js';
import { coursePaymentSource } from '../src/utils/coursePaymentSource.js';
import { includeActiveConversation } from '../src/utils/chatInbox.js';
import { appendToast } from '../src/utils/toastQueue.js';

test('wallet flags repeated fictitious balances instead of deriving replacement history', () => {
  const rows = [500000, 3700000, 3300000, 1300000].map((amount, i) => ({
    id: String(i), amount, direction: i === 0 ? 'Credit' : 'Debit', balanceBefore: 0, balanceAfter: 500000,
  }));
  assert.deepEqual([...statementIssues(rows, { availableBalance: 3900000 })].sort(), ['0', '1', '2', '3']);
  assert.equal(rows[0].balanceAfter, 500000);
});

test('wallet validates arithmetic, continuity, zero balances, and page boundaries', () => {
  const rows = [
    { id: 'new', amount: 500000, direction: 'Credit', balanceBefore: 3400000, balanceAfter: 3900000 },
    { id: 'old', amount: 3700000, direction: 'Debit', balanceBefore: 7100000, balanceAfter: 3400000 },
  ];
  assert.equal(statementIssues(rows, { availableBalance: 3900000 }).size, 0);
  assert.equal(statementIssues([rows[1]], { availableBalance: 3900000 }, 2).size, 0);
  assert.equal(statementIssues([{ id: 'zero', amount: 500, direction: 'Debit', balanceBefore: 500, balanceAfter: 0 }], { availableBalance: 0 }).size, 0);
  assert.equal(statementIssues([{ id: 'unknown', amount: 500, direction: 'Debit', balanceAfter: null }], {}).has('unknown'), true);
});

test('withdrawal settlement uses the reserved balance and does not break available-balance continuity', () => {
  const rows = [
    { id: 'settled', type: 'WithdrawalSuccessSettlement', amount: 500, direction: 'Debit', balanceBefore: 500, balanceAfter: 0 },
    { id: 'reserve', type: 'WithdrawalDebit', amount: 500, direction: 'Debit', balanceBefore: 1000, balanceAfter: 500 },
  ];
  assert.equal(statementIssues(rows, { availableBalance: 500, withdrawingBalance: 0 }).size, 0);
});

test('course payment source uses explicit evidence and keeps unknown payments unknown', () => {
  assert.equal(coursePaymentSource({ paymentSource: 'StudentWallet', paymentGatewayRef: null }), 'Ví học viên');
  assert.equal(coursePaymentSource({ paymentSource: 'VnPay' }), 'VNPAY');
  assert.equal(coursePaymentSource({ paymentGatewayRef: 'STUDENT_WALLET:booking' }), 'Ví học viên');
  assert.equal(coursePaymentSource({ status: 'Held' }), 'Chưa có thông tin');
});

test('opened empty conversation is visible immediately and is never duplicated', () => {
  const opened = { id: 'new', lastMessageId: null, tutorName: 'Tutor' };
  assert.deepEqual(includeActiveConversation([], opened), [opened]);
  assert.deepEqual(includeActiveConversation([opened], opened), [opened]);
  assert.deepEqual(includeActiveConversation([], null), []);
});

test('each new toast replaces the previous toast, including custom content', () => {
  let queue = [];
  for (let id = 0; id < 5; id++) queue = appendToast(queue, { id, type: 'success', content: 'Saved' });
  assert.equal(queue.length, 1); assert.equal(queue[0].id, 4);
  const undo = { type: 'undo-element' };
  queue = appendToast(queue, { id: 5, type: 'success', content: undo });
  queue = appendToast(queue, { id: 6, type: 'info', content: 'Next' });
  queue = appendToast(queue, { id: 7, type: 'error', content: 'Error' });
  assert.equal(queue.length, 1); assert.equal(queue[0].content, 'Error');
});
