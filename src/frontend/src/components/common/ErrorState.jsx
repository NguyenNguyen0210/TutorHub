import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';
import Icon from '@/components/ui/Icon';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { userFacingError } from '@/utils/userFacingError';

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
  showTechnicalDetails = false,
}) {
  const status = error?.status ?? 0;
  const kind = error?.kind ?? 'unknown';

  let defaultTitle = 'Đã có lỗi xảy ra';
  let defaultMessage = 'Tạm thời chưa tải được nội dung. Vui lòng thử lại sau.';

  if (kind === 'network' || status === 0) {
    defaultTitle = 'Không thể kết nối';
    defaultMessage =
      'Vui lòng kiểm tra kết nối mạng rồi thử lại.';
  } else if (kind === 'notFound' || status === 404) {
    defaultTitle = 'Không tìm thấy nội dung';
    defaultMessage =
      'Vui lòng kiểm tra liên kết hoặc quay lại trang trước.';
  } else if (status === 401) {
    defaultTitle = 'Cần đăng nhập';
    defaultMessage = 'Vui lòng đăng nhập để tiếp tục.';
  } else if (kind === 'forbidden' || status === 403) {
    defaultTitle = 'Không có quyền truy cập';
    defaultMessage =
      'Tài khoản hiện tại không có quyền xem nội dung này.';
  } else if (kind === 'conflict' || status === 409) {
    defaultTitle = 'Chưa thể hoàn tất thao tác';
    defaultMessage =
      'Vui lòng tải lại thông tin, kiểm tra rồi thử lại.';
  } else if (kind === 'throttled' || status === 429) {
    defaultTitle = 'Vui lòng chờ một chút';
    defaultMessage = 'Chưa thể tiếp tục lúc này. Vui lòng chờ một chút rồi thử lại.';
  }

  const displayTitle = title || defaultTitle;
  const displayMessage = userFacingError(message || error, defaultMessage);
  const errorDetails =
    showTechnicalDetails && Array.isArray(error?.errors) && error.errors.length > 0 ? error.errors : null;
  const traceId = showTechnicalDetails ? error?.traceId : null;

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
            <li key={idx}>{userFacingError(err, 'Vui lòng kiểm tra thông tin và thử lại.')}</li>
          ))}
        </ul>
      )}

      {traceId && (
        <details className="text-left text-caption text-fg-muted">
          <summary className="cursor-pointer">Thông tin hỗ trợ</summary>
          <p className="mt-2 break-all">Mã hỗ trợ: <span className="font-mono">{traceId}</span></p>
        </details>
      )}

      <div className="pt-2 flex items-center justify-center gap-3">
        {onRetry && (
          <Button variant="danger" size="md" onClick={onRetry} icon={<Icon name="refresh" size="sm" />}>
            Thử lại
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
