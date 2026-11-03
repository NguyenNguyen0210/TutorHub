import test from 'node:test';
import assert from 'node:assert/strict';
import { idempotencyHeaders } from '../src/services/idempotency.js';

test('financial request headers always contain a reusable idempotency key', () => {
  const generated = idempotencyHeaders()['Idempotency-Key'];
  assert.match(generated, /^[0-9a-f-]{36}$/i);
  assert.equal(idempotencyHeaders(generated)['Idempotency-Key'], generated);
});
