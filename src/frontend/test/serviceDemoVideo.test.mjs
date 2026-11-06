import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEMO_VIDEO_MAX_BYTES,
  formatVideoSize,
  validateServiceDemoVideo,
} from '../src/utils/serviceDemoVideo.js';

test('demo video accepts only MP4 files within 100 MB', () => {
  assert.equal(validateServiceDemoVideo(null), null);
  assert.equal(validateServiceDemoVideo({ name: 'demo.mp4', type: 'video/mp4', size: 12 * 1024 * 1024 }), null);
  // Browsers sometimes omit the MIME type for .mp4 files.
  assert.equal(validateServiceDemoVideo({ name: 'DEMO.MP4', type: '', size: 1024 }), null);

  assert.match(validateServiceDemoVideo({ name: 'demo.mov', type: 'video/quicktime', size: 1024 }), /MP4/);
  assert.match(validateServiceDemoVideo({ name: 'demo.mp4', type: 'video/webm', size: 1024 }), /MP4/);
  assert.match(validateServiceDemoVideo({ name: 'demo.mp4', type: 'video/mp4', size: 0 }), /rỗng/);
  assert.match(
    validateServiceDemoVideo({ name: 'demo.mp4', type: 'video/mp4', size: DEMO_VIDEO_MAX_BYTES + 1 }),
    /tối đa 100 MB/,
  );
});

test('file sizes are formatted for the picker hint', () => {
  assert.equal(formatVideoSize(900 * 1024), '900 KB');
  assert.equal(formatVideoSize(5 * 1024 * 1024), '5.0 MB');
  assert.equal(formatVideoSize(24 * 1024 * 1024), '24 MB');
});
