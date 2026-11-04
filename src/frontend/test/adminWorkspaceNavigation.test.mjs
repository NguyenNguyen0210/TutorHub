import test from 'node:test';
import assert from 'node:assert/strict';
import { URL } from 'node:url';
import { adminWorkspaceDestination } from '../src/utils/adminWorkspaceNavigation.js';

test('application deep links preserve record, filters and pagination in the new people tab', () => {
  const result = new URL(adminWorkspaceDestination('/admin/tutor-applications', '?applicationId=abc&status=Pending&page=2'), 'https://local.test');
  assert.equal(result.pathname, '/admin/users');
  assert.equal(result.searchParams.get('tab'), 'applications');
  assert.equal(result.searchParams.get('applicationId'), 'abc');
  assert.equal(result.searchParams.get('page'), '2');
  assert.equal(result.searchParams.get('status'), 'Pending');
});
test('student withdrawal links preserve the student scope and normalize legacy identifiers', () => {
  for (const [path, search] of [['/admin/student-wallets', '?tab=withdrawals&recordId=abc&status=Pending'], ['/admin/student-withdrawals', '?withdrawalId=abc&status=Pending']]) {
    const result = new URL(adminWorkspaceDestination(path, search), 'https://local.test');
    assert.equal(result.pathname, '/admin/withdrawals');
    assert.equal(result.searchParams.get('audience'), 'student');
    assert.equal(result.searchParams.get('recordId'), 'abc');
    assert.equal(result.searchParams.get('status'), 'Pending');
    assert.equal(result.searchParams.has('tab'), false);
  }
  assert.equal(adminWorkspaceDestination('/admin/student-wallets', '?tab=topups'), null);
});
