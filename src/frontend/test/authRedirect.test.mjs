import test from 'node:test';
import assert from 'node:assert/strict';
import { getAuthReturnUrl, resolveAuthRedirect, safeReturnUrl } from '../src/utils/authRedirect.js';

test('returnUrl accepts local paths with query/hash and rejects external URLs and auth loops', () => {
  assert.equal(safeReturnUrl('/tutors/123?package=456#reviews'), '/tutors/123?package=456#reviews');
  for (const value of ['https://example.com', '//example.com', '/\\example.com', '/auth/login?redirect=/', '/login', '/%61uth/login', '/\n/example.com', null]) {
    assert.equal(safeReturnUrl(value), null);
  }
});

test('all existing context formats retain query/hash, with explicit returnUrl taking priority', () => {
  assert.equal(getAuthReturnUrl({ state: { returnUrl: '/services/1', from: { pathname: '/student/wallet' } }, search: '?redirect=/tutors/2' }), '/services/1');
  assert.equal(getAuthReturnUrl({ state: { from: { pathname: '/student/bookings/1/checkout', search: '?trial=true', hash: '#pay' } } }), '/student/bookings/1/checkout?trial=true#pay');
  assert.equal(getAuthReturnUrl({ search: '?redirect=%2Ftutors%2F2%3Fpackage%3D3%23reviews' }), '/tutors/2?package=3#reviews');
  assert.equal(getAuthReturnUrl({ search: '?returnUrl=%2Fservices%2F1' }), '/services/1');
});

test('return context bypasses enrollment lookup, regardless of contract count', async () => {
  const destination = await resolveAuthRedirect('Student', '/services/1', {
    getEnrollments: () => { throw new Error('must not query'); },
  });
  assert.equal(destination, '/services/1');
});

test('zero contracts discovers tutors, any contract opens the desk, lookup failure preserves desk access', async () => {
  for (const [count, expected] of [[0, '/tutors'], [1, '/student/dashboard'], [12, '/student/dashboard']]) {
    assert.equal(await resolveAuthRedirect('Student', null, {
      getEnrollments: async (params) => {
        assert.deepEqual(params, { pageNumber: 1, pageSize: 1 });
        return { totalCount: count };
      },
    }), expected);
  }
  assert.equal(await resolveAuthRedirect('Student', '//example.com', {
    getEnrollments: async () => { throw new Error('offline'); },
  }), '/student/dashboard');
});

test('admin and tutor default destinations preserve onboarding rules', async () => {
  assert.equal(await resolveAuthRedirect('Admin', null, {}), '/admin/dashboard');
  assert.equal(await resolveAuthRedirect('Tutor', null, { getTutorApplication: async () => null }), '/tutor/application');
  assert.equal(await resolveAuthRedirect('Tutor', null, { getTutorApplication: async () => ({ status: 'Pending' }) }), '/tutor/dashboard');
  assert.equal(await resolveAuthRedirect('Tutor', null, { getTutorApplication: async () => { throw new Error('offline'); } }), '/tutor/dashboard');
});
