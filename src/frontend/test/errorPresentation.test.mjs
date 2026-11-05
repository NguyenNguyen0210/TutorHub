import test from 'node:test';
import assert from 'node:assert/strict';
import { getErrorPresentation } from '../src/utils/errorPresentation.js';

test('an unknown client error does not falsely report a network outage', () => {
  assert.equal(getErrorPresentation(new Error('render problem')).kind, 'unknown');
  assert.equal(getErrorPresentation(undefined).kind, 'unknown');
  assert.equal(getErrorPresentation({ status: 0 }).kind, 'network');
});

test('HTTP status controls recovery even when the error kind is missing or stale', () => {
  assert.equal(getErrorPresentation({ status: 404, kind: 'network' }).kind, 'notFound');
  assert.equal(getErrorPresentation({ response: { status: 503 } }).kind, 'server');
  assert.equal(getErrorPresentation({ status: 429 }).kind, 'throttled');
});

test('retry is available for recoverable failures, not missing content or restricted access', () => {
  for (const status of [0, 409, 429, 500, 503]) assert.equal(getErrorPresentation({ status }).canRetry, true);
  for (const status of [401, 403, 404]) assert.equal(getErrorPresentation({ status }).canRetry, false);
});

test('presentation preserves the original error and never interpolates diagnostics', () => {
  const error = Object.freeze({ status: 500, kind: 'server', message: 'Exception at endpoint /secret', traceId: 'original-trace' });
  const state = getErrorPresentation(error);
  assert.equal(error.message, 'Exception at endpoint /secret');
  assert.equal(error.traceId, 'original-trace');
  assert.doesNotMatch(JSON.stringify(state), /Exception|endpoint|secret|original-trace/);
});

test('unrecognized kind names use a safe presentation', () => {
  assert.equal(getErrorPresentation({ kind: 'constructor' }).kind, 'unknown');
});
