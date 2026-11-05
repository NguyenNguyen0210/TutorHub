import test from 'node:test';
import assert from 'node:assert/strict';
import { getResetEmailError } from '../src/utils/resetEmail.js';

test('reset email rejects empty, malformed, duplicate separators and invalid domain labels', () => {
  for (const email of ['', ' ', null, undefined, 'not-an-email', 'owner@', '@example.com', 'owner@example', 'owner@@example.com', 'owner name@example.com', 'owner@example..com', 'owner@-example.com', 'owner@example/com']) {
    assert.ok(getResetEmailError(email), String(email));
  }
});

test('reset email accepts normalized addresses and subdomains without changing the input', () => {
  for (const email of ['owner@example.com', ' OWNER@EXAMPLE.COM ', 'owner+reset@mail.example.com']) {
    assert.equal(getResetEmailError(email), '');
  }
});

test('reset email respects the API length limit', () => {
  assert.match(getResetEmailError('a'.repeat(250) + '@example.com'), /256/);
});
