import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTeachingSummary, classSchedulePath } from '../src/utils/tutorDashboard.js';

const now = new Date(2026, 10, 3, 12).getTime();
const time = hour => new Date(2026, 10, 3, hour).toISOString();
const contract = (id, studentProfileId, status = 'Active') => ({ id, studentProfileId, studentName: 'Trùng tên', status, createdAt: time(8) });

test('counts active learner IDs across multiple contracts; names and cancelled/completed classes do not inflate totals', () => {
  const result = buildTeachingSummary([contract('a', 'learner-1'), contract('b', 'learner-1'), contract('c', 'learner-2'), contract('d', 'learner-3', 'Cancelled'), contract('e', 'learner-4', 'Completed')], [], now);
  assert.equal(result.activeStudentCount, 2);
  assert.equal(result.classes.length, 3);
  assert.equal(result.pastClasses.length, 2);
});

test('groups unscheduled sessions by contract and chooses the next session number without mixing learners or closed classes', () => {
  const result = buildTeachingSummary([contract('a', 'x'), contract('b', 'y'), contract('c', 'z', 'Cancelled')], [
    { id: '1', enrollmentId: 'a', sessionNumber: 5, status: 'Unscheduled' },
    { id: '2', enrollmentId: 'a', sessionNumber: 2, status: 'Unscheduled' },
    { id: '3', enrollmentId: 'b', sessionNumber: 2, status: 'Unscheduled' },
    { id: '4', enrollmentId: 'c', sessionNumber: 1, status: 'Unscheduled' },
  ], now);
  assert.equal(result.pendingClasses.length, 2);
  assert.equal(result.unscheduledCount, 3);
  assert.equal(result.classes.find(item => item.id === 'a').nextUnscheduled.id, '2');
  assert.equal(result.classes.find(item => item.id === 'b').unscheduledCount, 1);
  assert.equal(classSchedulePath('contract-1'), '/tutor/schedule?tab=unscheduled&enrollmentId=contract-1');
});

test('upcoming includes an ongoing session, excludes past/cancelled sessions and closed contracts, and sorts by time', () => {
  const session = (id, start, end, status = 'Scheduled', enrollmentId = 'a') => ({ id, enrollmentId, startAt: time(start), endAt: time(end), status });
  const result = buildTeachingSummary([contract('a', 'x'), contract('b', 'y', 'Cancelled')], [
    session('later', 16, 17), session('past', 8, 9), session('ongoing', 11, 13), session('cancelled', 14, 15, 'Cancelled'),
    session('closed', 14, 15, 'Scheduled', 'b'), session('completed', 9, 10, 'Completed'),
  ], now);
  assert.deepEqual(result.upcoming.map(item => item.id), ['ongoing', 'later']);
  assert.equal(result.todayCount, 4);
});

test('empty dashboard has real zero values and no pending classes', () => {
  const result = buildTeachingSummary([], [], now);
  assert.equal(result.activeStudentCount, 0);
  assert.equal(result.todayCount, 0);
  assert.equal(result.unscheduledCount, 0);
  assert.deepEqual(result.upcoming, []);
});
