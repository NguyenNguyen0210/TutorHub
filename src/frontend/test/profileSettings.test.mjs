import test from 'node:test';
import assert from 'node:assert/strict';
import { profilePayload, profileValues, validateProfile, validateAvatar, squareCrop, AVATAR_MAX_BYTES } from '../src/utils/profileSettings.js';

test('clearing optional profile fields sends null and leaves login email out of update', () => {
  assert.deepEqual(profilePayload(profileValues({ fullName: '  Thảo Vy  ', email: 'student@test.local', phone: '', avatarUrl: '' })), { fullName: 'Thảo Vy', phone: null, avatarUrl: null });
});

test('profile validation matches Vietnamese mobile formats and rejects unsafe avatar URLs', () => {
  for (const phone of ['0912345678', '+84 912 345 678', '84912345678', '']) {
    assert.deepEqual(validateProfile(profileValues({ fullName: 'Thảo Vy', phone })), {});
  }
  const errors = validateProfile(profileValues({ fullName: 'V', phone: '123', avatarUrl: 'javascript:alert(1)' }));
  assert.deepEqual(Object.keys(errors), ['fullName', 'phone', 'avatarUrl']);
});

test('tutor PATCH explicitly clears optional fields instead of omitting them with null', () => {
  assert.deepEqual(profilePayload(profileValues({ fullName: 'Gia sư' }), true), { fullName: 'Gia sư', phone: '', avatarUrl: '', bio: '', education: '', experienceYears: 0 });
});

test('avatar rejects documents, empty files and oversized images before upload', () => {
  assert.ok(validateAvatar({ type: 'application/pdf', size: 100 }));
  assert.ok(validateAvatar({ type: 'image/png', size: 0 }));
  assert.ok(validateAvatar({ type: 'image/png', size: AVATAR_MAX_BYTES + 1 }));
  for (const type of ['image/jpeg', 'image/png', 'image/webp']) assert.equal(validateAvatar({ type, size: AVATAR_MAX_BYTES }), '');
});

test('square crop stays within landscape and portrait images while zooming and panning', () => {
  for (const [width, height] of [[1200, 800], [800, 1200]]) for (const zoom of [1, 2, 3]) for (const position of [0, 50, 100]) {
    const crop = squareCrop(width, height, zoom, position, position);
    assert.ok(crop.side > 0 && crop.x >= 0 && crop.y >= 0);
    assert.ok(crop.x + crop.side <= width && crop.y + crop.side <= height);
  }
});
