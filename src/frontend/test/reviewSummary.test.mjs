import test from 'node:test';
import assert from 'node:assert/strict';
import { reviewSummary } from '../src/utils/reviewSummary.js';

test('a stale 4.9 average with zero or absent reviews cannot produce a star rating', () => {
  for (const count of [0, undefined, null, -1, '0']) {
    assert.deepEqual(reviewSummary(4.9, count), { rating: null, total: 0, hasRating: false });
  }
});

test('real review counts and valid averages remain visible, including serialized numbers', () => {
  assert.deepEqual(reviewSummary('4.9', '10'), { rating: 4.9, total: 10, hasRating: true });
  assert.equal(reviewSummary(1, 1).hasRating, true);
  assert.equal(reviewSummary(5, 1).hasRating, true);
});

test('invalid averages and fractional review counts cannot display a score', () => {
  for (const average of [null, undefined, 0, 6, -1, 'invalid']) assert.equal(reviewSummary(average, 10).hasRating, false);
  assert.equal(reviewSummary(null, 10).total, 10, 'an unavailable score must not erase a known review count');
  assert.equal(reviewSummary(4.9, 0.5).hasRating, false);
});
