import test from 'node:test';
import assert from 'node:assert/strict';
import { maskBankAccount, pendingTuition, withdrawalBlocker, walletTransactionDirection, walletTransactionLabel, walletTransactionLink } from '../src/utils/tutorWallet.js';

test('bank account labels expose at most the final four characters', () => {
  assert.equal(maskBankAccount('1234567890'), '•••• 7890');
  assert.equal(maskBankAccount('1234'), '••••');
  assert.equal(maskBankAccount(null), 'Chưa có tài khoản');
});

test('withdrawal eligibility uses available balance directly and requires a complete destination', () => {
  const account = { bankName: 'Bank', accountNumber: '1234567890', accountHolderName: 'Tutor' };
  assert.equal(withdrawalBlocker(50000, 50000, account), null);
  assert.equal(withdrawalBlocker('50000.99', 50000.99, account), null);
  for (const value of ['', 'abc', -1, 49999]) assert.ok(withdrawalBlocker(value, 100000, account));
  assert.ok(withdrawalBlocker(100001, 100000, account));
  assert.ok(withdrawalBlocker(50000, 100000, { ...account, accountHolderName: '' }));
});

test('pending tuition excludes gross payouts and refunds without going below zero', () => {
  assert.equal(pendingTuition({ totalPrice: 1000000, releasedAmount: 300000, refundedAmount: 200000 }), 500000);
  assert.equal(pendingTuition({ totalPrice: 1000000, releasedAmount: 900000, refundedAmount: 200000 }), 0);
});

test('ledger labels and destinations follow actual references, and settlement is not another debit', () => {
  assert.equal(walletTransactionLabel('SessionPayoutCredit'), 'Nhận thu nhập buổi học');
  assert.equal(walletTransactionDirection({ type: 'WithdrawalSuccessSettlement', direction: 'Debit' }), null);
  assert.equal(walletTransactionDirection({ type: 'WithdrawalDebit' }), 'Debit');
  assert.equal(walletTransactionDirection({ type: 'SessionPayoutCredit' }), 'Credit');
  assert.equal(walletTransactionLink({ referenceType: 'Session', referenceId: 'session-id' }), '/tutor/sessions/session-id');
  assert.equal(walletTransactionLink({ referenceType: 'Withdrawal', referenceId: 'withdraw-id' }), '/tutor/wallet?recordId=withdraw-id');
  assert.equal(walletTransactionLink({ referenceType: 'Booking', referenceId: 'booking-id' }), null);
});
