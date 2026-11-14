import test, { beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';
import { URL } from 'node:url';
import { setTimeout } from 'node:timers';

function storage() {
  const values = new Map();
  return { getItem: k => values.get(k) ?? null, setItem: (k, v) => values.set(k, String(v)), removeItem: k => values.delete(k) };
}
globalThis.localStorage = storage();
globalThis.sessionStorage = storage();
const { wishlistService } = await import('../src/services/wishlistService.js');
const { default: api } = await import('../src/services/api.js');
const { useAuthStore } = await import('../src/store/authStore.js');
const originalAdapter = api.defaults.adapter;
const originalAxiosAdapter = axios.defaults.adapter;
const user = { id: 'student-1', role: 'Student' };
const tutorId = '3fa85f64-5717-4562-b3fc-2c963f66afa6';
const response = (config, data, status = 200, message = 'OK') => ({
  config, status, statusText: String(status), headers: {}, data: { success: status < 400, data, message },
});
beforeEach(() => {
  globalThis.localStorage = storage();
  globalThis.sessionStorage = storage();
  useAuthStore.getState().login(user, { accessToken: 'expired-token', refreshToken: 'refresh-1' });
});
afterEach(() => {
  api.defaults.adapter = originalAdapter;
  axios.defaults.adapter = originalAxiosAdapter;
});

test('wishlist uses the authenticated shared API, correct URLs, and one envelope unwrap', async () => {
  const calls = [];
  api.defaults.adapter = async config => {
    assert.equal(config.headers.Authorization, 'Bearer expired-token');
    assert.ok(config.headers['X-Correlation-ID']);
    assert.equal(new URL(api.getUri(config)).pathname.startsWith('/api/v1/wishlist'), true);
    calls.push({ url: config.url, params: config.params, body: config.data && JSON.parse(config.data) });
    if (config.url.endsWith('/ids')) return response(config, { tutorIds: [tutorId], serviceIds: [] });
    if (config.method === 'post') return response(config, { isFavorited: true });
    return response(config, { items: [{ tutorProfileId: tutorId }], totalCount: 1 });
  };
  assert.deepEqual(await wishlistService.getWishlistIds(), { tutorIds: [tutorId], serviceIds: [] });
  assert.equal((await wishlistService.getWishlistItems('Tutor', 2, 5)).totalCount, 1);
  assert.deepEqual(await wishlistService.toggleWishlist('Tutor', tutorId), { isFavorited: true });
  assert.deepEqual(calls.map(c => c.url), ['/wishlist/ids', '/wishlist', '/wishlist/toggle']);
  assert.deepEqual(calls[1].params, { type: 'Tutor', page: 2, pageSize: 5 });
  assert.deepEqual(calls[2].body, { itemType: 'Tutor', itemId: tutorId });
});

for (const rememberMe of [true, false]) {
  test(`expired wishlist requests share one refresh and persist rotated tokens (rememberMe=${rememberMe})`, async () => {
    useAuthStore.getState().login(user, { accessToken: 'expired-token', refreshToken: 'refresh-1' }, rememberMe);
    let refreshCalls = 0;
    let saves = 0;
    axios.defaults.adapter = async config => {
      assert.equal(new URL(config.url).pathname, '/api/v1/auth/refresh');
      assert.deepEqual(JSON.parse(config.data), { refreshToken: 'refresh-1' });
      refreshCalls++;
      await new Promise(resolve => setTimeout(resolve, 10));
      return response(config, { accessToken: 'new-token', refreshToken: 'refresh-2' });
    };
    api.defaults.adapter = async config => {
      if (config.headers.Authorization !== 'Bearer new-token') {
        throw new axios.AxiosError('Expired', 'ERR_BAD_REQUEST', config, null, response(config, null, 401));
      }
      if (config.method === 'post') { saves++; return response(config, { isFavorited: true }); }
      return response(config, { tutorIds: [tutorId], serviceIds: [] });
    };
    const [saved, ids] = await Promise.all([wishlistService.toggleWishlist('Tutor', tutorId), wishlistService.getWishlistIds()]);
    assert.equal(saved.isFavorited, true);
    assert.deepEqual(ids.tutorIds, [tutorId]);
    assert.equal(refreshCalls, 1);
    assert.equal(saves, 1);
    assert.equal(useAuthStore.getState().accessToken, 'new-token');
    const selected = rememberMe ? globalThis.localStorage : globalThis.sessionStorage;
    const other = rememberMe ? globalThis.sessionStorage : globalThis.localStorage;
    assert.equal(selected.getItem('tutorhub_refresh_token'), 'refresh-2');
    assert.equal(other.getItem('tutorhub_token'), null);
  });
}

test('a rejected save preserves the backend error without refreshing on 400', async () => {
  let refreshCalls = 0;
  axios.defaults.adapter = async () => { refreshCalls++; throw new Error('Unexpected refresh'); };
  api.defaults.adapter = async config => {
    throw new axios.AxiosError('Bad request', 'ERR_BAD_REQUEST', config, null, response(config, null, 400, 'Cannot save your own profile.'));
  };
  await assert.rejects(wishlistService.toggleWishlist('Tutor', tutorId), error => {
    assert.equal(error.status, 400);
    assert.equal(error.message, 'Cannot save your own profile.');
    return true;
  });
  assert.equal(refreshCalls, 0);
});

test('an unsuccessful API envelope is not treated as a saved tutor', async () => {
  api.defaults.adapter = async config => ({ ...response(config, null), data: { success: false, message: 'Save rejected' } });
  await assert.rejects(wishlistService.toggleWishlist('Tutor', tutorId), /Save rejected/);
});
