import { mediaService } from '@/services/media.service';

/**
 * Keep the video upload deferred until the package is saved, and reuse the
 * already-uploaded URL when saving again after a failure (so a 60 MB upload
 * never happens twice).
 *
 * Returns the playback URL to persist, or '' when the tutor removed the video.
 */
export async function resolveServiceDemoVideo(form, cache, onProgress) {
  if (!form.trialVideoFile) return form.trialVideoUrl || '';

  if (cache.current?.file !== form.trialVideoFile) {
    let url;
    try {
      url = await mediaService.uploadServiceDemoVideo(form.trialVideoFile, onProgress);
    } catch {
      throw new Error('Chưa thể tải video demo. Kiểm tra kết nối và thử lại — video chưa được lưu.');
    }
    cache.current = { file: form.trialVideoFile, url };
  }

  return cache.current.url;
}
