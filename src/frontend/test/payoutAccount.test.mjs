import test from 'node:test';
import assert from 'node:assert/strict';
import { findBank } from '../src/config/vietnamBanks.js';
import {
  isPayoutAccountComplete,
  normalizeAccountHolder,
  normalizeAccountNumber,
  payoutAccountPayload,
  validatePayoutAccount,
} from '../src/utils/payoutAccount.js';

const valid = { bankName: 'Vietcombank', bankCode: 'VCB', accountNumber: '0123456789', accountHolderName: 'NGUYEN VAN A' };

test('payout account is only complete when all three required fields are present', () => {
  assert.equal(isPayoutAccountComplete(valid), true);
  assert.equal(isPayoutAccountComplete(null), false);
  assert.equal(isPayoutAccountComplete({}), false);
  for (const key of ['bankName', 'accountNumber', 'accountHolderName']) {
    assert.equal(isPayoutAccountComplete({ ...valid, [key]: '   ' }), false, key);
  }
});

test('validation mirrors the backend length limits and account-number shape', () => {
  assert.deepEqual(validatePayoutAccount(valid), {});
  assert.ok(validatePayoutAccount({ ...valid, bankName: '' }).bankName);
  assert.ok(validatePayoutAccount({ ...valid, accountNumber: '' }).accountNumber);
  assert.ok(validatePayoutAccount({ ...valid, accountNumber: '12345' }).accountNumber);
  assert.ok(validatePayoutAccount({ ...valid, accountNumber: '1234abcd' }).accountNumber);
  assert.ok(validatePayoutAccount({ ...valid, accountHolderName: '' }).accountHolderName);
  assert.ok(validatePayoutAccount({ ...valid, accountHolderName: 'NGUYEN 123' }).accountHolderName);
  assert.ok(validatePayoutAccount({ ...valid, bankName: 'x'.repeat(101) }).bankName);
  assert.ok(validatePayoutAccount({ ...valid, accountHolderName: 'A'.repeat(151) }).accountHolderName);
});

test('payload normalises whitespace, casing and resolves bankName from bankCode', () => {
  assert.deepEqual(
    payoutAccountPayload({ bankCode: 'TCB', accountNumber: ' 0123 456 789 ', accountHolderName: ' nguyen van a ' }),
    { bankName: 'Techcombank', bankCode: 'TCB', accountNumber: '0123456789', accountHolderName: 'NGUYEN VAN A' },
  );
  assert.equal(normalizeAccountNumber('12 34\t56'), '123456');
  assert.equal(normalizeAccountHolder('  le thi b  '), 'LE THI B');
});

test('unknown bank codes are preserved instead of being silently dropped', () => {
  const payload = payoutAccountPayload({ bankCode: 'XYZ', accountNumber: '0123456789', accountHolderName: 'TRAN B' });
  assert.equal(payload.bankCode, 'XYZ');
  assert.equal(payload.bankName, 'XYZ');
});

test('bank lookup accepts either code or display name', () => {
  assert.equal(findBank('VCB')?.name, 'Vietcombank');
  assert.equal(findBank('vietcombank')?.code, 'VCB');
  assert.equal(findBank('  MBBank ')?.code, 'MB');
  assert.equal(findBank('not-a-bank'), null);
  assert.equal(findBank(''), null);
});
