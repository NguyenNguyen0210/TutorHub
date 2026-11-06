import test from 'node:test';
import assert from 'node:assert/strict';
import { notificationDestination } from '../src/utils/workspaceActivity.js';

// Mỗi deep link dưới đây là một giá trị NotificationRouteRegistry (backend) có thể phát ra.
// Test này giữ cho registry và router không lệch nhau.
test('registry deep links resolve to real routes for the matching role', () => {
  const id = '11111111-1111-1111-1111-111111111111';

  assert.equal(notificationDestination(`/enrollments/${id}`, 'Tutor'), `/tutor/enrollments/${id}`);
  assert.equal(notificationDestination(`/enrollments/${id}`, 'Student'), `/student/enrollments/${id}`);
  assert.equal(notificationDestination(`/sessions/${id}`, 'Tutor'), `/tutor/sessions/${id}`);
  assert.equal(notificationDestination(`/sessions/${id}`, 'Student'), `/student/sessions/${id}`);
  assert.equal(notificationDestination(`/conversations/${id}`, 'Student'), `/app/messages?conversationId=${id}`);
  assert.equal(notificationDestination(`/admin/disputes/${id}`, 'Admin'), `/admin/disputes/${id}`);
  assert.equal(notificationDestination(`/admin/disputes/${id}`, 'Student'), `/app/disputes/${id}`);
  assert.equal(notificationDestination(`/admin/tutor-applications/${id}`, 'Admin'), `/admin/tutor-applications?applicationId=${id}`);
  assert.equal(notificationDestination(`/admin/withdrawals/${id}`, 'Admin'), `/admin/withdrawals?withdrawalId=${id}`);
  assert.equal(notificationDestination(`/admin/reports/${id}`, 'Admin'), `/admin/trust-reports/${id}`);
  assert.equal(notificationDestination(`/admin/trust-reports/${id}`, 'Admin'), `/admin/trust-reports/${id}`);
  assert.equal(notificationDestination('/wallet/withdrawals', 'Tutor'), '/tutor/wallet?tab=withdrawals');
});

test('admin top-up review opens the wallet console on the matching record', () => {
  const id = '22222222-2222-2222-2222-222222222222';
  const link = `/admin/student-wallets?tab=topups&recordId=${id}`;
  assert.equal(notificationDestination(link, 'Admin'), link);
  // Non-admins must never be sent into the admin console.
  assert.equal(notificationDestination(link, 'Student'), null);
});

test('retired or unknown destinations are dropped instead of producing a 404', () => {
  assert.equal(notificationDestination('/admin/student-topups', 'Admin'), null);
  assert.equal(notificationDestination('/tutor/reviews', 'Tutor'), null);
  assert.equal(notificationDestination('/wallet/transactions/abc', 'Tutor'), null);
  assert.equal(notificationDestination('/admin/anything', 'Admin'), null);
});

test('only same-site absolute paths are accepted', () => {
  assert.equal(notificationDestination('https://evil.example/enrollments/1', 'Tutor'), null);
  assert.equal(notificationDestination('//evil.example/enrollments/1', 'Tutor'), null);
  assert.equal(notificationDestination('/enrollments/1\r\nSet-Cookie: x', 'Tutor'), null);
  assert.equal(notificationDestination('enrollments/1', 'Tutor'), null);
  assert.equal(notificationDestination('', 'Tutor'), null);
  assert.equal(notificationDestination(null, 'Tutor'), null);
});
