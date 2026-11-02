import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { URL } from 'node:url';
import { Buffer } from 'node:buffer';
import { getDetailedSyllabus } from '../src/components/service-detail/syllabusHelper.js';

const source = await readFile(new URL('../src/services/tutor.service.js', import.meta.url), 'utf8');
const { normalizeTutorReview, normalizeTutorProfile, normalizeServiceSummary } = await import(
  'data:text/javascript;base64,' + Buffer.from(source.replace("import { api } from './api';", 'const api = {};')).toString('base64')
);

test('reviews preserve programming feedback and replies exactly as submitted', () => {
  const review = { comment: 'Learning code and React', tutorReply: 'Keep practising code!', rating: 4 };
  const normalized = normalizeTutorReview(review);
  assert.equal(normalized.comment, review.comment);
  assert.equal(normalized.tutorReply, review.tutorReply);
  assert.equal(normalized.rating, 4);
});

test('profiles consume approved credentials without persisting presentation metadata', () => {
  const empty = normalizeTutorProfile({ education: 'IELTS 8.5 FTU' });
  assert.deepEqual(empty.credentials, []);
  assert.deepEqual(empty.reviews, []);
  const credentials = [{ id: 'degree', title: 'Submitted degree', isApproved: true }];
  const populated = normalizeTutorProfile({ credentials, ratingDistribution: [0, 0, 0, 1, 4] });
  assert.deepEqual(populated.credentials, credentials);
  assert.equal('isDemo' in populated, false);
  assert.equal('publicContent' in populated, false);
  assert.deepEqual(populated.ratingDistribution, [0, 0, 0, 1, 4]);
  assert.equal(normalizeServiceSummary({ expectedOutcome: 'Stored outcome' }).expectedOutcome, 'Stored outcome');
});

test('syllabus uses stored lessons and package duration without inventing a math course', () => {
  assert.deepEqual(getDetailedSyllabus([], 60), []);
  const [lesson] = getDetailedSyllabus([{ title: 'Literature', sessionIndex: 1 }], 60);
  assert.equal(lesson.title, 'Literature');
  assert.equal(lesson.durationMinutes, 60);
  assert.equal(lesson.description, '');
  assert.deepEqual(lesson.keyTopics, []);
});
