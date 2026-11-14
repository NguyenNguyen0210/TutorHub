import test from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';
import { sessionReportAction } from '../src/utils/sessionReportAction.js';
import { elapsedSeconds } from '../src/utils/requestFeedback.js';

const storage = () => ({ getItem: () => null, setItem() {}, removeItem() {} });
globalThis.localStorage = storage();
globalThis.sessionStorage = storage();
const { default: api } = await import('../src/services/api.js');
const { useAuthStore } = await import('../src/store/authStore.js');
const events = [];
globalThis.window = { dispatchEvent: event => events.push(event.detail) };

test('write lifecycle reports completion and never exposes submitted credentials', async () => {
  events.length = 0;
  api.defaults.adapter = async config => ({ config, status: 200, headers: {}, data: { success: true, data: { id: 1 } } });
  assert.deepEqual(await api.post('/auth/register', { password: 'secret' }), { id: 1 });
  assert.deepEqual(events.map(e => e.status), ['pending', 'complete']);
  assert.equal(events[0].id, events[1].id);
  assert.equal(JSON.stringify(events).includes('secret'), false);
  events.length = 0;
  await api.get('/catalog');
  assert.equal(events.length, 0);
});

test('timeout preserves uncertainty about committed writes and ends pending feedback', async () => {
  events.length = 0;
  api.defaults.adapter = async config => { throw new axios.AxiosError('timeout', 'ECONNABORTED', config); };
  await assert.rejects(api.post('/bookings', {}), error => {
    assert.equal(error.kind, 'timeout');
    assert.match(error.message, /15/);
    assert.match(error.message, /kiểm tra trạng thái/);
    return true;
  });
  assert.deepEqual(events.map(e => e.status), ['pending', 'error']);
  assert.equal(events[0].id, events[1].id);
});

test('business errors in successful HTTP responses are also visible', async () => {
  events.length = 0;
  api.defaults.adapter = async config => ({ config, status: 200, headers: {}, data: { success: false, message: 'Không đủ số dư' } });
  await assert.rejects(api.post('/payments', {}), /Không đủ số dư/);
  assert.equal(events.at(-1).status, 'error');
});

test('concurrent expired writes keep one pending lifecycle each while sharing a bounded refresh', async () => {
  events.length = 0;
  useAuthStore.getState().login({ id: 'student', role: 'Student' }, { accessToken: 'expired', refreshToken: 'refresh' });
  const original = axios.defaults.adapter;
  let refreshes = 0;
  try {
    axios.defaults.adapter = async config => {
      refreshes++;
      assert.equal(config.timeout, 15000);
      await new Promise(resolve => globalThis.setTimeout(resolve, 10));
      return { config, status: 200, headers: {}, data: { data: { accessToken: 'new', refreshToken: 'rotated' } } };
    };
    api.defaults.adapter = async config => {
      if (config.headers.Authorization !== 'Bearer new') throw new axios.AxiosError('expired', 'ERR_BAD_REQUEST', config, null, { status: 401 });
      return { config, status: 200, headers: {}, data: { success: true, data: {} } };
    };
    await Promise.all([api.post('/wishlist/toggle', {}), api.patch('/profile', {})]);
    assert.equal(refreshes, 1);
    assert.equal(events.filter(e => e.status === 'pending').length, 2);
    assert.equal(events.filter(e => e.status === 'complete').length, 2);
    for (const id of new Set(events.map(e => e.id))) assert.deepEqual(events.filter(e => e.id === id).map(e => e.status), ['pending', 'complete']);
  } finally { axios.defaults.adapter = original; }
});

test('session reporting respects status, deadline, payout and existing reports', () => {
  const now = Date.parse('2026-11-14T10:00:00Z');
  const session = { id: 'lesson-1', status: 'AwaitingPayout', endAt: '2026-11-14T09:00:00Z', gracePeriodEndsAt: '2026-11-14T21:00:00Z' };
  assert.equal(sessionReportAction(session, now).href, '/student/disputes/new?sessionId=lesson-1');
  for (const change of [{ status: 'Scheduled' }, { status: 'Cancelled' }, { endAt: '2026-11-15T09:00:00Z' }, { isPayoutReleased: true }, { gracePeriodEndsAt: '2026-11-14T09:00:00Z' }, { gracePeriodEndsAt: null }]) {
    const action = sessionReportAction({ ...session, ...change }, now);
    assert.equal(action.href, null);
    assert.ok(action.reason);
  }
  assert.equal(sessionReportAction({ ...session, hasIssueReport: true }, now).href, '#session-protection');
  assert.equal(elapsedSeconds(now, now + 3500), 3);
});
