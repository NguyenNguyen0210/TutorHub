import test from 'node:test';
import assert from 'node:assert/strict';
import { serviceListingReturn, serviceToForm } from '../src/utils/tutorServiceManagement.js';
import { buildServicePayload, createInitialFormState } from '../src/components/tutor/services/serviceFormUtils.js';

test('service editor returns only to its own listing with filters and scroll key', () => {
  const value = { path: '/tutor/services?status=Draft&search=To%C3%A1n', key: 'listing-key' };
  assert.deepEqual(serviceListingReturn({ serviceReturn: value }), value);
  for (const path of ['https://example.com', '//example.com', '/tutor/services/new', '/student/wallet']) {
    assert.deepEqual(serviceListingReturn({ serviceReturn: { path } }), { path: '/tutor/services' });
  }
  assert.deepEqual(serviceListingReturn(null), { path: '/tutor/services' });
});

test('clearing optional fields in the editor sends explicit empty values for PATCH', () => {
  const payload = buildServicePayload(createInitialFormState(), { mode: 'update' });
  for (const key of ['learningScope', 'expectedOutcome', 'trialLessonUrl', 'shortDescription', 'coverImageUrl']) assert.equal(payload[key], '');
  for (const key of ['tags', 'curriculum', 'targetAudience', 'prerequisites', 'faqs']) assert.deepEqual(payload[key], []);
});

test('editing hydrates real curriculum and preserves terms while omitting every published-only locked field', () => {
  const service = {
    subjectId: 'math', title: 'Course with real content', description: 'A detailed description for the course.',
    totalSessions: 15, sessionDurationMinutes: 90, price: 3450000,
    tags: ['Math', 'THPT'], shortDescription: 'Short description', coverImageUrl: 'https://example.com/course.jpg',
    curriculum: [{ title: 'Lesson one', keyTopics: ['Algebra', 'Practice'], durationMinutes: 90 }],
    targetAudience: ['Grade 12'], prerequisites: ['Algebra'], faqs: [{ question: 'When?', answer: 'By agreement.' }],
  };
  const form = serviceToForm(service);
  const draft = buildServicePayload(form, { mode: 'update' });
  assert.equal(draft.price, service.price);
  assert.equal(draft.totalSessions, service.totalSessions);
  assert.deepEqual(draft.curriculum[0].keyTopics, service.curriculum[0].keyTopics);
  assert.deepEqual(draft.targetAudience, service.targetAudience);
  assert.deepEqual(draft.faqs, service.faqs);
  const published = buildServicePayload(form, { mode: 'update', lockCommercialTerms: true });
  for (const field of ['price', 'totalSessions', 'sessionDurationMinutes', 'shortDescription', 'tags', 'coverImageUrl']) {
    assert.equal(Object.hasOwn(published, field), false, field);
  }
  assert.equal(published.title, service.title);
  assert.deepEqual(published.curriculum, draft.curriculum);
});
