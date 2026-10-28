import test from 'node:test';
import assert from 'node:assert/strict';
import { getSavedRememberMe, persistLogin } from '../src/store/authPersistence.js';

function storage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
}

for (const rememberMe of [true, false]) {
  test(`refresh persists tokens in the original storage when rememberMe=${rememberMe}`, () => {
    globalThis.localStorage = storage();
    globalThis.sessionStorage = storage();
    const user = { id: 'student', role: 'Student' };

    persistLogin(user, { accessToken: 'first', refreshToken: 'refresh-1' }, rememberMe);
    assert.equal(getSavedRememberMe(), rememberMe);

    persistLogin(user, { accessToken: 'second', refreshToken: 'refresh-2' }, getSavedRememberMe());
    const selected = rememberMe ? globalThis.localStorage : globalThis.sessionStorage;
    const other = rememberMe ? globalThis.sessionStorage : globalThis.localStorage;
    assert.equal(selected.getItem('tutorhub_token'), 'second');
    assert.equal(selected.getItem('tutorhub_refresh_token'), 'refresh-2');
    assert.equal(other.getItem('tutorhub_token'), null);
    assert.equal(other.getItem('tutorhub_refresh_token'), null);
  });
}
