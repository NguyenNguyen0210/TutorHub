/**
 * Pure helpers for the service demo video upload.
 *
 * Kept free of service imports so it can be unit-tested with node:test
 * (see test/serviceDemoVideo.test.mjs).
 */

export const DEMO_VIDEO_MAX_BYTES = 100 * 1024 * 1024;
export const DEMO_VIDEO_ACCEPT = 'video/mp4';
export const DEMO_VIDEO_EXTENSION = '.mp4';

/** 1048576 → "1 MB" */
export function formatVideoSize(bytes) {
  const value = Number(bytes) || 0;
  if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))} KB`;
  return `${(value / (1024 * 1024)).toFixed(value >= 10 * 1024 * 1024 ? 0 : 1)} MB`;
}

/**
 * Validate a picked demo video before upload. Returns a Vietnamese error
 * message or null when the file is acceptable.
 */
export function validateServiceDemoVideo(file) {
  if (!file) return null;

  const name = String(file.name || '').toLowerCase();
  if (!name.endsWith(DEMO_VIDEO_EXTENSION)) {
    return 'Chỉ hỗ trợ video định dạng MP4.';
  }

  // Some browsers report an empty type for .mp4 files; only reject a
  // conflicting type, never a missing one.
  if (file.type && file.type !== DEMO_VIDEO_ACCEPT) {
    return 'Tệp đã chọn không phải video MP4 hợp lệ.';
  }

  if (!file.size) {
    return 'Tệp video rỗng. Vui lòng chọn tệp khác.';
  }

  if (file.size > DEMO_VIDEO_MAX_BYTES) {
    return `Video demo tối đa 100 MB. Tệp của bạn nặng ${formatVideoSize(file.size)}.`;
  }

  return null;
}
