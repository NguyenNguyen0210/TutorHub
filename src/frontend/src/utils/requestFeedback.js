export const REQUEST_FEEDBACK_EVENT = 'tutorhub:request-feedback';
let nextId = 0;

export function isWriteRequest(config) {
  return ['post', 'put', 'patch', 'delete'].includes(String(config?.method || '').toLowerCase());
}

function emit(detail) {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(REQUEST_FEEDBACK_EVENT, { detail }));
}

export function startRequestFeedback(config, userId) {
  if (!isWriteRequest(config) || config._requestFeedback) return;
  config._requestFeedback = { id: ++nextId, startedAt: Date.now(), userId: userId ?? null };
  emit({ ...config._requestFeedback, status: 'pending' });
}

export function finishRequestFeedback(config, error) {
  if (!config?._requestFeedback) return;
  emit({ ...config._requestFeedback, status: error ? 'error' : 'complete', error });
}

export function elapsedSeconds(startedAt, now = Date.now()) {
  return Math.max(0, Math.floor((now - startedAt) / 1000));
}

export function timeoutMessage(config) {
  const seconds = Math.max(1, Math.round((Number(config?.timeout) || 15000) / 1000));
  return isWriteRequest(config)
    ? `Quá thời gian chờ (${seconds} giây). Chưa xác nhận được kết quả. Thao tác có thể vẫn đang được xử lý; hãy kiểm tra trạng thái trước khi gửi lại.`
    : `Máy chủ chưa phản hồi sau ${seconds} giây. Vui lòng thử tải lại.`;
}
