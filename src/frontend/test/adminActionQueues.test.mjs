import test from 'node:test';
import assert from 'node:assert/strict';
import { adminActionQueues } from '../src/utils/adminActionQueues.js';

test('pending work links keep role, manual topup eligibility and external refund scope', () => {
  const queues = adminActionQueues({ pendingWithdrawalsCount: 2, pendingStudentWithdrawalsCount: 3, reviewableTopUpsCount: 5, outstandingRefundsCount: 7, pendingTutorsCount: 11, openReportsCount: 13, openDisputesCount: 17 });
  const student = queues.find(q => q.count === 3), tutor = queues.find(q => q.count === 2);
  assert.match(student.path, /audience=student&status=Pending/);
  assert.match(tutor.path, /audience=tutor&status=Pending/);
  assert.match(queues.find(q => q.count === 5).path, /status=Pending&reviewableOnly=true/);
  assert.match(queues.find(q => q.count === 7).path, /type=StudentRefund&settlementRequired=true/);
  assert.match(queues.find(q => q.count === 11).path, /tab=applications&status=Pending/);
  assert.equal(new Set(queues.map(q => q.path)).size, queues.length);
  assert.deepEqual(adminActionQueues(null), []);
});
