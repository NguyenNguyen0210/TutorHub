import test from 'node:test';
import assert from 'node:assert/strict';
import { tutorSessionPermissions } from '../src/utils/tutorSessionDetail.js';

const now = Date.parse('2026-11-03T05:00:00Z');
const active = { status: 'Active' };
test('records follow the completed-only, write-once backend policy', () => {
  for (const status of ['Unscheduled', 'Scheduled', 'AwaitingPayout', 'Cancelled']) assert.equal(tutorSessionPermissions({ status }, active, null, now).canCreateRecord, false);
  assert.equal(tutorSessionPermissions({ status: 'Completed' }, active, null, now).canCreateRecord, true);
  assert.equal(tutorSessionPermissions({ status: 'Completed' }, active, { content: 'Saved' }, now).canCreateRecord, false);
});
test('scheduling respects active contracts and 2h notice while recognizing the actual time window', () => {
  assert.equal(tutorSessionPermissions({ status: 'Unscheduled' }, active, null, now).canSchedule, true);
  assert.equal(tutorSessionPermissions({ status: 'Unscheduled' }, { status: 'Cancelled' }, null, now).canSchedule, false);
  const future = { status: 'Scheduled', startAt: '2026-11-03T07:00:00Z', endAt: '2026-11-03T08:30:00Z' };
  assert.equal(tutorSessionPermissions(future, active, null, now).canSchedule, true);
  assert.equal(tutorSessionPermissions(future, active, null, now + 1).canSchedule, false);
  const current = tutorSessionPermissions(future, active, null, now + 2.5 * 3600000);
  assert.equal(current.currentWindow, true);
  assert.equal(current.canSchedule, false);
  assert.equal(tutorSessionPermissions(future, active, null, now + 4 * 3600000).pastWindow, true);
});
