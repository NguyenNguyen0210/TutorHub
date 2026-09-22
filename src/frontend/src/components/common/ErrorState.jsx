import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';
import Icon from '@/components/ui/Icon';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

/**
 * ErrorState — phân biệt network / unauthorized / conflict / notFound / server.
 */
const KIND_ICON = {
  network: 'wifi_off',
  notFound: 'search_off',
  forbidden: 'lock',
  conflict: 'sync_problem',
  throttled: 'speed',
  server: 'error',
  unknown: 'error',
};

export default function ErrorState({
  error,
  title,
  message,
  onRetry,
  backPath,
  backLabel = 'Quay lại',
  className,
}) {
  const status = error?.status ?? 0;
  const kind = error?.kind ?? 'unknown';

  let defaultTitle = 'Đã có lỗi xảy ra';
  let defaultMessage = error?.message || 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.';

  if (kind === 'network' || status === 0) {
    defaultTitle = 'Mất kết nối máy chủ';
    defaultMessage =
      'Không thể kết nối đến hệ thống. Vui lòng kiểm tra lại đường truyền mạng hoặc khởi động API.';
  } else if (kind === 'notFound' || status === 404) {
    defaultTitle = 'Không tìm thấy dữ liệu';
    defaultMessage =
      error?.message || 'Nội dung hoặc tài nguyên bạn tìm kiếm không tồn tại hoặc đã bị xóa.';
  } else if (kind === 'forbidden' || status === 403) {
    defaultTitle = 'Không có quyền truy cập';
    defaultMessage =
      error?.message || 'Bạn không có quyền thực hiện thao tác hoặc xem nội dung này.';
  } else if (kind === 'conflict' || status === 409) {
    defaultTitle = 'Xung đột trạng thái';
    defaultMessage =
      error?.message ||
      'Yêu cầu bị từ chối do trạng thái tài nguyên đã thay đổi. Vui lòng tải lại trang.';
  } else if (kind === 'throttled' || status === 429) {
    defaultTitle = 'Quá nhiều yêu cầu';
    defaultMessage = error?.message || 'Hệ thống đang bận. Vui lòng chờ vài giây trước khi thử lại.';
  }

  const displayTitle = title || defaultTitle;
  const displayMessage = message || defaultMessage;
  const errorDetails =
    Array.isArray(error?.errors) && error.errors.length > 0 ? error.errors : null;
  const traceId = error?.traceId || null;

  return (
    <Card
      padding="lg"
      className={cn(
        'text-center space-y-4 max-w-lg mx-auto bg-danger-subtle border-danger/25',
        className
      )}
    >
      <div
        className="w-16 h-16 mx-auto rounded-brand-lg bg-surface border border-danger/25 flex items-center justify-center text-danger"
        role="img"
        aria-label={displayTitle}
      >
        <Icon name={KIND_ICON[kind] || KIND_ICON.unknown} size="xl" strokeWidth={1.5} />
      </div>

      <div className="space-y-1" role="alert">
        <h3 className="text-headline-3 text-fg">{displayTitle}</h3>
        <p className="text-caption text-fg-secondary leading-relaxed m-0">{displayMessage}</p>
      </div>

      {errorDetails && (
        <ul className="text-left text-caption text-danger-strong bg-surface p-3 rounded-brand-md border border-danger/25 space-y-1 list-disc list-inside">
          {errorDetails.map((err, idx) => (
            <li key={idx}>{err}</li>
          ))}
        </ul>
      )}

      {traceId && (
        <div className="text-[10px] text-fg-muted font-mono">Trace ID: {traceId}</div>
      )}

      <div className="pt-2 flex items-center justify-center gap-3">
        {onRetry && (
          <Button variant="danger" size="md" onClick={onRetry} icon={<Icon name="refresh" size="sm" />}>
            Thử Lại
          </Button>
        )}

        {backPath && (
          <Button as={Link} to={backPath} variant="outline" size="md">
            {backLabel}
          </Button>
        )}
      </div>
    </Card>
  );
}
