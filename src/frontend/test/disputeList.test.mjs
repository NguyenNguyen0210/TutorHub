import test from 'node:test';
import assert from 'node:assert/strict';
import { filterDisputes, lastDisputeActivity } from '../src/utils/disputeList.js';

test('case search matches Vietnamese participant, course and localized reason without changing submitted content', () => {
  const items = [{ id: 'a', status: 'Open', studentName: 'Ngô Thảo Vy', serviceTitle: 'Bứt phá Vật lý 12', reason: 'TutorNoShow', description: 'Original description!?!' }];
  for (const term of ['ngo thao vy', 'vat ly', 'khong tham gia']) assert.equal(filterDisputes(items, 'all', term).length, 1);
  assert.equal(filterDisputes(items, 'closed', '').length, 0);
  assert.equal(items[0].description, 'Original description!?!');
});
test('financial intervention cases stay in progress, and finished cases remain closed', () => {
  const items = ['Open', 'UnderReview', 'RequiresAdminFinancialIntervention', 'RequiresAdminRefundSettlement', 'Resolved', 'Dismissed'].map(status => ({ id: status, status }));
  assert.equal(filterDisputes(items, 'review', '').length, 3);
  assert.equal(filterDisputes(items, 'closed', '').length, 2);
  assert.equal(filterDisputes(items, 'active', '').length, 4);
  assert.equal(filterDisputes(items, 'Open', '').length, 1);
});
test('latest activity reflects real responses, evidence and resolution timestamps; unknown timestamps are ignored', () => {
  const item = { id: 'a', createdAt: '2026-11-01T10:00:00Z', updatedAt: 'invalid', responses: [{ createdAt: '2026-11-02T10:00:00Z' }], evidences: [{ createdAt: '2026-11-03T10:00:00Z' }] };
  assert.equal(lastDisputeActivity(item), '2026-11-03T10:00:00Z');
  const newer = { id: 'b', createdAt: '2026-11-01T10:00:00Z', resolvedAt: '2026-11-04T10:00:00Z' };
  assert.deepEqual(filterDisputes([item, newer], 'all', '').map(value => value.id), ['b', 'a']);
  assert.equal(lastDisputeActivity({}), null);
});
