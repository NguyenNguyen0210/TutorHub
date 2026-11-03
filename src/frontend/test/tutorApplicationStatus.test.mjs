import test from 'node:test';
import assert from 'node:assert/strict';
import { applicationManagementAction, accountStatusLabel } from '../src/utils/tutorApplicationStatus.js';
import { getNavForRole } from '../src/components/layout/navConfig.js';

test('first-package CTA requires a confirmed empty list rather than a failed lookup', () => {
  assert.equal(applicationManagementAction([]).path, '/tutor/services/new');
  for (const value of [null, undefined, [{ id: 'existing-service' }]]) assert.equal(applicationManagementAction(value).path, '/tutor/services');
  assert.equal(accountStatusLabel('Active'), 'Đang hoạt động');
  assert.equal(accountStatusLabel(undefined), null);
});

test('approved tutors find their teaching profile through the account menu while pending/rejected stay in navigation', () => {
  const application = status => getNavForRole('Tutor', true, status).find(item => item.path === '/tutor/application');
  assert.equal(application('Approved'), undefined);
  assert.ok(application('Pending'));
  assert.equal(application('Rejected').attention, true);
  assert.ok(application(undefined));
  assert.equal(getNavForRole('Student', true, 'Approved').some(item => item.path === '/tutor/application'), false);
});
