import { mediaService } from '@/services/media.service';

/** Keep uploads deferred until save and reuse them when saving the package fails. */
export async function resolveServiceCover(form, cache) {
  if (!form.coverImageFile) return form.coverImageUrl || '';
  if (cache.current?.file !== form.coverImageFile) {
    let url;
    try { url = await mediaService.uploadServiceCover(form.coverImageFile); }
    catch { throw new Error('Chưa thể tải ảnh bìa. Vui lòng kiểm tra ảnh và thử lại.'); }
    cache.current = { file: form.coverImageFile, url };
  }
  return cache.current.url;
}
