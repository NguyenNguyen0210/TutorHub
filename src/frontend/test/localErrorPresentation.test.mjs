import test from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';

const storage = () => ({ getItem: () => null, setItem() {}, removeItem() {} });
globalThis.localStorage = storage();
globalThis.sessionStorage = storage();
const events = [];
globalThis.window = { dispatchEvent: event => events.push(event.detail) };
const { default: api, ApiError } = await import('../src/services/api.js');
const { default: user } = await import('../src/services/user.service.js');
const { default: wallet } = await import('../src/services/wallet.service.js');
const { default: student } = await import('../src/services/studentWallet.service.js');
const { default: payment } = await import('../src/services/payment.service.js');
const { default: tutor } = await import('../src/services/tutor.service.js');
const { default: session } = await import('../src/services/session.service.js');
const { default: report } = await import('../src/services/report.service.js');
const { default: dispute } = await import('../src/services/dispute.service.js');
const { default: chat } = await import('../src/services/chat.service.js');
const { externalAuthService: external } = await import('../src/services/externalAuth.service.js');
const { default: forgot } = await import('../src/services/forgotPassword.service.js');
const { mediaService: media } = await import('../src/services/media.service.js');
const { default: admin } = await import('../src/services/admin.service.js');
const file = new globalThis.File(['fixture'], 'fixture.png', { type: 'image/png' });
const idempotencyKey = 'audit-request-key';

const operations = [
  ['student profile', () => user.updateMyProfile({ fullName: 'Student' })],
  ['tutor profile', () => user.updateMyTutorProfile({ fullName: 'Tutor' })],
  ['change password', () => user.changePassword('current', 'next')],
  ['payout account', () => wallet.updatePayoutAccount({ bankName: 'Bank' })],
  ['tutor withdrawal', () => wallet.createWithdrawal({ amount: 50000 }, idempotencyKey), true],
  ['student withdrawal', () => student.requestWithdrawal({ amount: 50000 }, idempotencyKey), true],
  ['checkout top-up', () => student.createVnPayTopUp({ amount: 10000 }, idempotencyKey), true],
  ['wallet payment', () => student.payBookingFromWallet('booking', idempotencyKey), true],
  ['VNPAY payment', () => payment.createVnPayUrl('booking', idempotencyKey), true],
  ['edit service', () => tutor.updateService('service', { title: 'Course' })],
  ['teaching subjects', () => tutor.updateMySubjects([])],
  ['review reply', () => tutor.replyReview('review', 'Reply')],
  ['learning record', () => session.createLearningRecord('session', 'Content')],
  ['schedule single', () => session.scheduleSession('session', '2026-11-20T08:00:00Z', '2026-11-20T09:00:00Z')],
  ['schedule batch', () => session.scheduleSessionsBatch([])],
  ['booking report', () => report.create('booking', 'Report details')],
  ['user report', () => report.reportUser('user', 'Report details')],
  ['review report', () => report.reportReview('review', 'Report details')],
  ['dispute response', () => dispute.submitResponse('dispute', { submissionId: idempotencyKey, content: 'Response' })],
  ['dispute evidence', () => dispute.uploadEvidence('dispute', file, 'response')],
  ['open conversation', () => chat.getOrCreateConversation('user')],
  ['send message', () => chat.sendMessage('conversation', 'Hello')],
  ['chat attachment', () => chat.uploadAttachment('conversation', file)],
  ['OAuth callback', () => external.completeGoogleCallback('code', 'state')],
  ['reset email', () => forgot.requestResetOtp('audit@example.test')],
  ['avatar upload', () => media.uploadAvatar(file)],
  ['cover upload', () => media.uploadServiceCover(file)],
  ['video upload', () => media.uploadServiceDemoVideo(file)],
  ['certificate upload', () => media.uploadCertificate(file)],
  ['moderate review', () => admin.removeReview('review', 'Reason')],
  ['moderate service', () => admin.forceUnpublishService('service', 'Reason')],
  ['cancel contract', () => admin.cancelEnrollment('contract', 'Reason')],
  ['refund settlement', () => admin.settleRefund('refund', { outcome: 'Succeeded' })],
  ['create category', () => admin.saveCatalog('categories', null, { name: 'Category' })],
  ['edit category', () => admin.saveCatalog('categories', 'category', { name: 'Category' })],
  ['delete category', () => admin.deleteCatalog('categories', 'category')],
  ['restore category', () => admin.restoreCatalog('categories', 'category')],
  ['resolve trust report', () => admin.resolveTrustReport('report', { resolution: 'Resolved' })],
  ['allocation preview', () => admin.previewDisputeAllocation('dispute', { decision: 'TutorWinsReleaseEarning' })],
  ['dispute verdict', () => admin.applyDisputeVerdict('dispute', { decision: 'TutorWinsReleaseEarning' }, idempotencyKey), true],
];

for (const [name, invoke, hasIdempotency] of operations) {
  test(`${name}: caller retains the failure and exclusively presents it`, async () => {
    events.length = 0;
    let sent;
    api.defaults.adapter = async config => {
      sent = config;
      throw new axios.AxiosError('Request failed', 'ERR_BAD_RESPONSE', config, null, {
        status: 503, data: { message: 'Request could not be completed', traceId: 'audit-trace' },
      });
    };
    await assert.rejects(invoke(), error => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.status, 503);
      assert.equal(error.traceId, 'audit-trace');
      return true;
    });
    assert.deepEqual(events.map(event => event.status), ['pending', 'error']);
    assert.ok(events.every(event => event.errorPresentation === 'local'));
    if (hasIdempotency) assert.equal(sent.headers['Idempotency-Key'], idempotencyKey);
  });
}
