import test from 'node:test';
import assert from 'node:assert/strict';
import { filterApplications } from '../src/utils/applicationReview.js';

const items = [
  { id: '1', userFullName: 'Đặng Hoàng Nam', subject: 'Toán', degreeLevel: 'Thạc sĩ', status: 'Pending', submittedAt: '2026-11-03T17:30:00' },
  { id: '2', userFullName: 'Hà', subject: 'Vật lý', degreeLevel: 'Tiến sĩ', status: 'Approved', submittedAt: '2026-11-03T16:59:00Z' },
  { id: '3', userEmail: 'teacher@example.invalid', status: 'Rejected', submittedAt: null },
];
test('application filters search Vietnamese names and subjects without diacritics and preserve status scope', () => {
  assert.deepEqual(filterApplications(items, { search: 'dang hoang' }).map(x => x.id), ['1']);
  assert.deepEqual(filterApplications(items, { search: 'vat ly', status: 'Approved' }).map(x => x.id), ['2']);
  assert.equal(filterApplications(items, { search: 'vat ly', status: 'Pending' }).length, 0);
  assert.deepEqual(filterApplications(items, { subject: 'Toán', education: 'Thạc sĩ' }).map(x => x.id), ['1']);
});
test('submission filters use Vietnam calendar days, UTC timestamps without suffix, and exclude missing dates', () => {
  const now = Date.parse('2026-11-04T03:00:00Z');
  assert.deepEqual(filterApplications(items, { date: 'today' }, now).map(x => x.id), ['1']);
  assert.deepEqual(filterApplications(items, { date: '7days' }, now).map(x => x.id), ['1', '2']);
  assert.equal(filterApplications([{ submittedAt: '2026-11-05T01:00:00Z' }], { date: 'today' }, now).length, 0);
});
