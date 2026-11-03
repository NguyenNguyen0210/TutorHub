import test from 'node:test';
import assert from 'node:assert/strict';
import { getHoldingSeconds, hasBookingExpired } from '../src/utils/checkout.js';

const now = Date.parse('2026-11-02T03:00:00Z');

test('hold uses the absolute server deadline, including elapsed time in a sleeping tab', () => {
  const deadline = '2026-11-02T03:15:00Z';
  assert.equal(getHoldingSeconds(deadline, now), 900);
  assert.equal(getHoldingSeconds(deadline, now + 603000), 297);
  assert.equal(getHoldingSeconds(deadline, now + 899500), 1);
  assert.equal(getHoldingSeconds(deadline, now + 900000), 0);
  assert.equal(getHoldingSeconds(deadline, now + 1000000), 0);
});

test('checkout cannot pay without a valid unexpired deadline', () => {
  for (const value of [null, undefined, '', 'invalid']) {
    assert.equal(getHoldingSeconds(value, now), 0);
    assert.equal(hasBookingExpired({ status: 'Holding', holdingExpiresAt: value }, now), true);
  }
  const booking = { status: 'Holding', holdingExpiresAt: '2026-11-02T03:15:00Z' };
  assert.equal(hasBookingExpired(booking, now), false);
  assert.equal(hasBookingExpired(booking, now + 900000), true);
  assert.equal(hasBookingExpired({ ...booking, status: 'Expired' }, now), true);
  assert.equal(hasBookingExpired({ ...booking, status: 'Cancelled' }, now), true);
});
