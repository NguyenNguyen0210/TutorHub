import React from 'react';
import { Link } from 'react-router-dom';
import Icon from '@/components/ui/Icon';
import Button from '@/components/ui/Button';
import StatePanel from './StatePanel';

/**
 * EmptyState — trạng thái rỗng: hướng hành động, không trang trí thừa.
 *
 * `filters` (tùy chọn): mảng { key, label, clear } — render gợi ý kèm nút xóa
 * từng filter, dùng cho các trang discovery khi kết quả rỗng do lọc quá hẹp.
 */
export default function EmptyState({
  icon = 'inbox',
  title = 'Chưa có nội dung tại đây',
  description = 'Chưa có thông tin để hiển thị tại mục này.',
  actionLabel,
  actionPath,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  filters = [],
  onClearAll,
  clearAllLabel = 'Xóa toàn bộ bộ lọc',
  className,
}) {
  const hasFilterActions = Array.isArray(filters) && filters.length > 0;
  return (
    <StatePanel
      title={title}
      description={description}
      icon={icon}
      className={className}
    >
      {hasFilterActions && (
        <div className="pt-1">
          <p className="text-caption font-semibold text-fg-secondary m-0 pb-2">
            Bạn có thể gỡ bớt bộ lọc:
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {filters.map((filter) => (
              <span
                key={filter.key}
                className="inline-flex max-w-full items-center gap-1 rounded-xl border border-border bg-muted pl-3 text-xs font-medium text-fg-secondary"
              >
                <span className="min-w-0 break-words text-left">{filter.label}</span>
                <button
                  type="button"
                  onClick={filter.clear}
                  aria-label={`Xóa bộ lọc ${filter.label}`}
                  title="Gỡ bộ lọc này"
                  className="inline-flex min-h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl text-fg-secondary transition-colors hover:bg-neutral-200 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Icon name="close" size="xs" className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {(actionLabel || secondaryActionLabel) && (
        <div className="flex flex-col items-center justify-center gap-2 pt-2 sm:flex-row">
          {actionLabel && (actionPath || onAction) && (
            actionPath ? (
              <Button as={Link} to={actionPath} variant="primary" size="md" className="w-full sm:w-auto">
                {actionLabel}
              </Button>
            ) : (
              <Button variant="primary" size="md" onClick={onAction} className="w-full sm:w-auto">
                {actionLabel}
              </Button>
            )
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <Button
              variant="outline"
              size="md"
              onClick={onSecondaryAction}
              className="w-full sm:w-auto"
            >
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      )}

      {onClearAll && hasFilterActions && (
        <div className="pt-1">
          <button
            type="button"
            onClick={onClearAll}
            className="text-[12px] font-semibold text-fg-secondary hover:text-danger-strong transition-colors cursor-pointer underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary-600 focus-visible:ring-offset-2 rounded-sm min-h-[44px] px-3 inline-flex items-center justify-center"
          >
            {clearAllLabel}
          </button>
        </div>
      )}
    </StatePanel>
  );
}
