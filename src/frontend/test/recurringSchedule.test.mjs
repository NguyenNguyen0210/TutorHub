import test from 'node:test';
import assert from 'node:assert/strict';
import { recurringDates, scheduleConflicts } from '../src/utils/recurringSchedule.js';
test('weekly rules create concrete ordered dates without touching any confirmed session', () => {
  assert.deepEqual(recurringDates('2026-11-03', '18:00', [2,5], 4), ['2026-11-03T18:00', '2026-11-06T18:00', '2026-11-10T18:00', '2026-11-13T18:00']);
  assert.deepEqual(recurringDates('2026-11-03', '18:00', [], 4), []);
  assert.deepEqual(recurringDates('2026-11-03', '25:00', [2], 4), []);
});
test('conflict checks catch overlaps within a batch and against confirmed sessions while allowing adjacent times', () => {
  const now = Date.parse('2026-11-01T00:00:00Z');
  const a = { sessionId: 'a', startAt: '2026-11-03T11:00:00Z', endAt: '2026-11-03T12:30:00Z' };
  const b = { sessionId: 'b', startAt: '2026-11-03T12:00:00Z', endAt: '2026-11-03T13:30:00Z' };
  assert.deepEqual(Object.keys(scheduleConflicts([a,b], [], now)).sort(), ['a','b']);
  assert.ok(scheduleConflicts([a], [{ id:'x', status:'Scheduled', startAt:b.startAt, endAt:b.endAt }], now).a);
  assert.deepEqual(scheduleConflicts([a], [{ id:'x', status:'Scheduled', startAt:a.endAt, endAt:b.endAt }], now), {});
  assert.ok(scheduleConflicts([a], [], Date.parse(a.startAt) - 3600000).a);
});

test('drafts from other contracts conflict without blocking adjacent times or the same session', () => {
  const now = Date.parse('2026-11-01T00:00:00Z');
  const first = { sessionId: 'class-a-1', startAt: '2026-11-03T11:00:00Z', endAt: '2026-11-03T12:30:00Z' };
  const other = { sessionId: 'class-b-1', startAt: '2026-11-03T12:00:00Z', endAt: '2026-11-03T13:30:00Z' };
  assert.ok(scheduleConflicts([first], [], now, [other])[first.sessionId]);
  assert.ok(scheduleConflicts([other], [], now, [first])[other.sessionId]);
  assert.deepEqual(scheduleConflicts([first], [], now, [first]), {});
  assert.deepEqual(scheduleConflicts([first], [], now, [{ ...other, startAt: first.endAt }]), {});
});
