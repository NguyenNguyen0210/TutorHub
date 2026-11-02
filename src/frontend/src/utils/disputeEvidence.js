export const EVIDENCE_ACCEPT = '.jpg,.jpeg,.png,.webp,.pdf,.txt';
export const EVIDENCE_HINT = 'JPG, PNG, WEBP, PDF hoặc TXT, tối đa 10 MB mỗi tệp.';

export function evidenceValidationMessage(file) {
  if (!file) return 'Vui lòng chọn tệp bằng chứng.';
  if (!/\.(jpe?g|png|webp|pdf|txt)$/i.test(file.name)) return 'Định dạng tệp không được hỗ trợ. ' + EVIDENCE_HINT;
  if (!file.size) return 'Tệp đang trống. Vui lòng chọn tệp khác.';
  if (file.size > 10 * 1024 * 1024) return 'Tệp vượt quá 10 MB. Vui lòng chọn tệp nhỏ hơn.';
  return '';
}

export function evidenceDownloadUrl(value) {
  if (!value) return null;
  try {
    const url = new URL(value, window.location.origin);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
  } catch { return null; }
}
