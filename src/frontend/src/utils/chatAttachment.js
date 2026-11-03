export const CHAT_FILE_ACCEPT = '.jpg,.jpeg,.png,.webp,.gif,.pdf,.txt';
export function validateChatFile(file) {
  if (!file || file.size <= 0) return 'Tệp không có nội dung.';
  if (file.size > 10 * 1024 * 1024) return 'Vui lòng chọn tệp không quá 10 MB.';
  if (!/\.(jpe?g|png|webp|gif|pdf|txt)$/i.test(file.name)) return 'Chỉ hỗ trợ JPG, PNG, WEBP, GIF, PDF và TXT.';
  return null;
}

export function chatAttachmentPayload(raw) {
  if (!raw?.storageKey) throw new Error('Chưa tải được tệp đính kèm.');
  return { attachmentKey: raw.storageKey, attachmentName: raw.fileName,
    attachmentContentType: raw.contentType, attachmentSize: raw.size };
}

export function saveDownloadedFile(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || 'tep-dinh-kem';
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
