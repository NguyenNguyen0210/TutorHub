import React from 'react';
import { Link } from 'react-router-dom';

/**
 * P4: Error state component per DESIGN §5.
 * Distinguishes network vs unauthorized vs conflict vs notFound vs server errors.
 */
export default function ErrorState({
  error,
  title,
  message,
  onRetry,
  backPath,
  backLabel = 'Quay lại',
  className = '',
}) {
  const status = error?.status ?? 0;
  const kind = error?.kind ?? 'unknown';

  let defaultIcon = 'error';
  let defaultTitle = 'Đã có lỗi xảy ra';
  let defaultMessage = error?.message || 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.';

  if (kind === 'network' || status === 0) {
    defaultIcon = 'wifi_off';
    defaultTitle = 'Mất kết nối máy chủ';
    defaultMessage = 'Không thể kết nối đến hệ thống. Vui lòng kiểm tra lại đường truyền mạng hoặc khởi động API.';
  } else if (kind === 'notFound' || status === 404) {
    defaultIcon = 'search_off';
    defaultTitle = 'Không tìm thấy dữ liệu';
    defaultMessage = error?.message || 'Nội dung hoặc tài nguyên bạn tìm kiếm không tồn tại hoặc đã bị xóa.';
  } else if (kind === 'forbidden' || status === 403) {
    defaultIcon = 'lock';
    defaultTitle = 'Không có quyền truy cập';
    defaultMessage = error?.message || 'Bạn không có quyền thực hiện thao tác hoặc xem nội dung này.';
  } else if (kind === 'conflict' || status === 409) {
    defaultIcon = 'sync_problem';
    defaultTitle = 'Xung đột trạng thái';
    defaultMessage = error?.message || 'Yêu cầu bị từ chối do trạng thái tài nguyên đã thay đổi. Vui lòng tải lại trang.';
  } else if (kind === 'throttled' || status === 429) {
    defaultIcon = 'speed';
    defaultTitle = 'Quá nhiều yêu cầu';
    defaultMessage = error?.message || 'Hệ thống đang bận. Vui lòng chờ vài giây trước khi thử lại.';
  }

  const displayTitle = title || defaultTitle;
  const displayMessage = message || defaultMessage;
  const errorDetails = Array.isArray(error?.errors) && error.errors.length > 0 ? error.errors : null;
  const traceId = error?.traceId || null;

  return (
    <div
      className={`p-8 sm:p-10 rounded-3xl bg-rose-50/70 border border-rose-200 text-center space-y-4 max-w-lg mx-auto ${className}`}
      role="alert"
    >
      <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600">
        <span className="material-symbols-outlined text-3xl" aria-hidden="true">
          {defaultIcon}
        </span>
      </div>

      <div className="space-y-1">
        <h3 className="text-base font-extrabold text-rose-950">{displayTitle}</h3>
        <p className="text-xs text-rose-800 leading-relaxed m-0">{displayMessage}</p>
      </div>

      {errorDetails && (
        <ul className="text-left text-xs text-rose-700 bg-white/70 p-3 rounded-xl border border-rose-200 space-y-1 list-disc list-inside">
          {errorDetails.map((err, idx) => (
            <li key={idx}>{err}</li>
          ))}
        </ul>
      )}

      {traceId && (
        <div className="text-[10px] text-slate-400 font-mono">
          Trace ID: {traceId}
        </div>
      )}

      <div className="pt-2 flex items-center justify-center gap-3">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-xs"
          >
            <span className="material-symbols-outlined text-base">refresh</span>
            Thử Lại
          </button>
        )}

        {backPath && (
          <Link
            to={backPath}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-rose-300 text-rose-900 hover:bg-rose-100/60 text-xs font-bold transition-colors"
          >
            {backLabel}
          </Link>
        )}
      </div>
    </div>
  );
}
