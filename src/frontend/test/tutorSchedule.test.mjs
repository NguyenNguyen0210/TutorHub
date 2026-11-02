import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyTeachingSessions, minTeachingStart, schedulingItem, sessionTime, teachingWeek, unscheduledGroups, validCalendarDay, vietnamDay, scheduleReturn } from '../src/utils/tutorSchedule.js';

test('calendar handles UTC and offset-less API timestamps consistently in Vietnam', () => {
  assert.equal(sessionTime('2026-11-02T20:35:00'), sessionTime('2026-11-02T20:35:00Z'));
  assert.equal(vietnamDay('2026-11-02T20:35:00Z'), '2026-11-03');
  assert.equal(vietnamDay('2026-11-02T16:59:00Z'), '2026-11-02');
  const item = schedulingItem('session', '2026-11-03T03:35', 90);
  assert.equal(item.startAt, '2026-11-02T20:35:00.000Z');
  assert.equal(item.endAt, '2026-11-02T22:05:00.000Z');
  assert.equal(minTeachingStart(Date.parse('2026-11-02T20:00:00Z')), '2026-11-03T05:05');
  assert.throws(() => schedulingItem('session', '2026-02-30T08:00', 90));
  assert.throws(() => schedulingItem('session', '', 90));
});

test('ongoing remains visible until end time, ended scheduled sessions move out of upcoming', () => {
  const now = Date.parse('2026-11-03T05:00:00Z');
  const sessions = [
    { id: 'past', status: 'Scheduled', startAt: '2026-11-03T03:00:00Z', endAt: '2026-11-03T04:00:00Z' },
    { id: 'ongoing', status: 'Scheduled', startAt: '2026-11-03T04:30:00Z', durationMinutes: 60 },
    { id: 'future', status: 'Scheduled', startAt: '2026-11-03T07:00:00Z', endAt: '2026-11-03T08:00:00Z' },
    { id: 'cancelled', status: 'Cancelled', startAt: '2026-11-03T07:00:00Z' },
    { id: 'completed', status: 'Completed', startAt: '2026-11-03T07:00:00Z' },
  ];
  assert.deepEqual(classifyTeachingSessions(sessions, now).upcoming.map(item => item.id), ['ongoing', 'future']);
  assert.deepEqual(classifyTeachingSessions(sessions, now).past.map(item => item.id), ['past']);
  assert.ok(classifyTeachingSessions(sessions, now + 30 * 60000).past.some(item => item.id === 'ongoing'));
});

test('week navigation crosses month/year boundaries and rejects malformed dates', () => {
  assert.deepEqual(teachingWeek('2027-01-01'), ['2026-12-28', '2026-12-29', '2026-12-30', '2026-12-31', '2027-01-01', '2027-01-02', '2027-01-03']);
  for (const value of ['', 'abc', '2026-99-99', '2026-02-30']) assert.equal(validCalendarDay(value), false);
  assert.equal(validCalendarDay('2028-02-29'), true);
});

test('unscheduled groups preserve distinct contracts and sort next sessions without including closed classes', () => {
  const contracts = ['a', 'b', 'c'].map(id => ({ id, studentName: 'Same name', status: id === 'c' ? 'Completed' : 'Active' }));
  const sessions = [{ enrollmentId: 'a', sessionNumber: 3, status: 'Unscheduled' }, { enrollmentId: 'a', sessionNumber: 1, status: 'Unscheduled' }, { enrollmentId: 'b', sessionNumber: 1, status: 'Unscheduled' }, { enrollmentId: 'c', sessionNumber: 1, status: 'Unscheduled' }];
  const groups = unscheduledGroups(contracts, sessions);
  assert.equal(groups.length, 2);
  assert.deepEqual(groups[0].unscheduledSessions.map(session => session.sessionNumber), [1, 3]);
  assert.equal(groups[1].unscheduledSessions.length, 1);
});

test('return context accepts only the tutor schedule and preserves its complete query', () => {
  const url = '/tutor/schedule?tab=unscheduled&enrollmentId=a&group=a&view=week&date=2026-11-03';
  assert.equal(scheduleReturn({ scheduleReturn: url }), url);
  for (const value of ['https://evil.test', '//evil.test', '/tutor/schedule/other', '/student/schedule']) assert.equal(scheduleReturn({ scheduleReturn: value }), null);
});
