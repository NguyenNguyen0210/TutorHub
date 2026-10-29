import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatRating,
  getPaginationRange,
  formatCount,
} from '../src/utils/marketplaceHelpers.js';

test('formatRating always returns one decimal with a Vietnamese comma', () => {
  assert.equal(formatRating(4.8), '4,8');
  assert.equal(formatRating(4.86), '4,9');
  assert.equal(formatRating('4.8'), '4,8');
  assert.equal(formatRating(0), '0,0');
  assert.equal(formatRating(null), '0,0');
  assert.equal(formatRating(undefined), '0,0');
  assert.equal(formatRating('not-a-number'), '0,0');
});

test('getPaginationRange clamps the visible range to the result count', () => {
  assert.deepEqual(getPaginationRange(1, 12, 142), { start: 1, end: 12 });
  assert.deepEqual(getPaginationRange(2, 12, 142), { start: 13, end: 24 });
  assert.deepEqual(getPaginationRange(12, 12, 142), { start: 133, end: 142 });
  assert.deepEqual(getPaginationRange(99, 12, 142), { start: 142, end: 142 });
  assert.deepEqual(getPaginationRange(0, 12, 142), { start: 1, end: 12 });
  assert.deepEqual(getPaginationRange(1, 12, 0), { start: 0, end: 0 });
});

test('formatCount uses Vietnamese grouping and handles empty values', () => {
  assert.equal(formatCount(142), '142');
  assert.equal(formatCount(1240), '1.240');
  assert.equal(formatCount(0), '0');
  assert.equal(formatCount(null), '0');
});
