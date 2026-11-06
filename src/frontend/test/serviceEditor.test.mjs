import test from 'node:test';
import assert from 'node:assert/strict';
import { trialLessonMedia, validImageLink } from '../src/utils/trialLessonMedia.js';
import { validateServiceEditor } from '../src/utils/serviceEditor.js';
import { serviceToForm } from '../src/utils/tutorServiceManagement.js';

const service = { title: 'A complete package', description: 'A complete course description for students.', totalSessions: 15, sessionDurationMinutes: 90, price: 3450000, status: 'Published', trialLessonUrl: 'https://meet.google.com/abc-defg-hij' };

test('trial media recognizes real providers without embedding meeting links or lookalike hosts', () => {
  assert.equal(trialLessonMedia('https://youtu.be/abcdefghijk?t=10').embed, 'https://www.youtube-nocookie.com/embed/abcdefghijk');
  assert.equal(trialLessonMedia('https://vimeo.com/12345').embed, 'https://player.vimeo.com/video/12345');
  assert.equal(trialLessonMedia('https://example.com/video.mp4?token=ok').direct, true);
  assert.equal(trialLessonMedia(service.trialLessonUrl).kind, 'meeting');
  assert.equal(trialLessonMedia('https://youtube.com.evil.example/watch?v=abcdefghijk').kind, 'link');
  assert.equal(trialLessonMedia('javascript:alert(1)'), null);
  assert.equal(validImageLink('data:image/png;base64,abc'), false);
});

test('legacy trial links stay read-only while the uploaded demo video is validated instead', () => {
  const form = serviceToForm(service);
  assert.equal(validateServiceEditor(form, service), null);
  // The old external link is no longer editable, so changing it cannot block a save.
  assert.equal(validateServiceEditor({ ...form, trialLessonUrl: 'https://meet.google.com/new-link' }, service), null);

  const videoError = (file) => validateServiceEditor({ ...form, trialVideoFile: file }, service);
  assert.equal(videoError({ name: 'clip.mov', type: 'video/quicktime', size: 1024 }).fieldId, 'service-demo-video');
  assert.equal(videoError({ name: 'clip.mp4', type: 'video/mp4', size: 101 * 1024 * 1024 }).fieldId, 'service-demo-video');
  assert.equal(videoError({ name: 'clip.mp4', type: 'video/mp4', size: 12 * 1024 * 1024 }), null);
});

test('validation targets collapsed lesson and FAQ fields and enforces actual curriculum constraints', () => {
  const form = serviceToForm(service);
  form.sessions = Array.from({ length: 8 }, (_, index) => ({ title: `Lesson ${index + 1}`, description: '', durationMinutes: '', keyTopicsText: '' }));
  form.sessions[7].title = '';
  assert.equal(validateServiceEditor(form, service).fieldId, 'service-session-7-title');
  form.sessions[7].title = 'Lesson eight';
  form.sessions[7].durationMinutes = 15;
  assert.equal(validateServiceEditor(form, service).fieldId, 'service-session-7-duration');
  form.sessions[7].durationMinutes = 90;
  form.faqs = [{ question: 'Question', answer: '' }];
  assert.equal(validateServiceEditor(form, service).fieldId, 'service-faq-0-a');
});
