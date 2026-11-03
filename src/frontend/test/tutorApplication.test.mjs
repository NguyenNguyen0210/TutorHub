import test from 'node:test';
import assert from 'node:assert/strict';
import { avatarFileError, buildApplicationPayload, createInitialFormData, mergeRejectedApplication } from '../src/components/tutor/application/applicationFormUtils.js';
import { LEARNING_FAQS } from '../src/content/learningFaqs.js';
import { BECOME_TUTOR_TESTIMONIALS } from '../src/content/becomeTutorTestimonials.js';

test('new applications do not prefill invented qualifications or achievements', () => {
  const form = createInitialFormData({ fullName: 'Applicant', email: 'applicant@test.local' });
  for (const key of ['university', 'major', 'certifications', 'achievements', 'methodology']) {
    assert.equal(form[key], '');
  }
  assert.deepEqual(form.degreeFiles, []);
  assert.equal('dob' in form, false);
  assert.equal('gender' in form, false);
});

test('application avatar selection matches the accepted formats and upload limit', () => {
  assert.equal(avatarFileError({ type: 'image/png', size: 1024 }), null);
  assert.ok(avatarFileError({ type: 'image/svg+xml', size: 1024 }));
  assert.ok(avatarFileError({ type: 'image/jpeg', size: 5 * 1024 * 1024 + 1 }));
});

test('submission preserves independent education fields and uploaded media IDs', () => {
  const form = { ...createInitialFormData({}), university: 'Example University', major: 'Physics',
    bio: 'My introduction', certifications: 'Submitted certificate', methodology: 'My method',
    achievements: 'My results', subjects: ['Physics'], grades: ['THPT'], experienceYears: 4 };
  const payload = buildApplicationPayload(form, ['owned-media-id']);
  assert.equal(payload.university, form.university);
  assert.equal(payload.certifications, form.certifications);
  assert.equal(payload.bio, form.bio);
  assert.equal(payload.methodology, form.methodology);
  assert.deepEqual(payload.documentIds, ['owned-media-id']);
  const restored = mergeRejectedApplication(createInitialFormData({}), {
    ...payload, documentsJson: JSON.stringify([{ mediaId: 'owned-media-id', title: 'Degree.pdf', format: 'application/pdf' }]),
  });
  assert.equal(restored.university, form.university);
  assert.equal(restored.degreeFiles[0].mediaId, 'owned-media-id');
});

test('shared policy FAQs and marketing content are available without a backend request', () => {
  assert.equal(LEARNING_FAQS.length, 3);
  assert.equal(BECOME_TUTOR_TESTIMONIALS.length, 4);
  assert.ok(LEARNING_FAQS.every(f => f.question && f.answer));
  assert.ok(BECOME_TUTOR_TESTIMONIALS.every(t => t.quote && t.name));
});
