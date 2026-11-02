import test from 'node:test';
import assert from 'node:assert/strict';
import { buildApplicationPayload, createInitialFormData, mergeRejectedApplication } from '../src/components/tutor/application/applicationFormUtils.js';

test('new applications do not prefill invented qualifications or achievements', () => {
  const form = createInitialFormData({ fullName: 'Applicant', email: 'applicant@test.local' });
  for (const key of ['university', 'major', 'certifications', 'achievements', 'methodology']) {
    assert.equal(form[key], '');
  }
  assert.deepEqual(form.degreeFiles, []);
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
