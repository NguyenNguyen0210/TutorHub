import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';
import Icon from '@/components/ui/Icon';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

/**
 * EmptyState — trạng thái rỗng: hướng hành động, không trang trí thừa.
 *
 * `filters` (tùy chọn): mảng { key, label, clear } — render gợi ý kèm nút xóa
 * từng filter, dùng cho các trang discovery khi kết quả rỗng do lọc quá hẹp.
 */
export default function EmptyState({
  icon = 'inbox',
  title = 'Không có dữ liệu',
  description = 'Chưa có thông tin để hiển thị tại mục này.',
  actionLabel,
  actionPath,
  onAction,
  filters = [],
  onClearAll,
  clearAllLabel = 'Xóa toàn bộ bộ lọc',
  className,
}) {
  const hasFilterActions = Array.isArray(filters) && filters.length > 0;
  return (
    <Card
      padding="lg"
      className={cn('text-center space-y-4 max-w-lg mx-auto', className)}
    >
      <div className="w-16 h-16 mx-auto rounded-brand-lg bg-brand-primary-50 border border-brand-primary-100 flex items-center justify-center text-brand-primary-600">
        <Icon name={icon} size="xl" strokeWidth={1.5} />
      </div>

      <div className="space-y-1">
        <h3 className="text-headline-3 text-fg">{title}</h3>
        <p className="text-caption text-fg-muted leading-relaxed m-0">{description}</p>
      </div>

      {hasFilterActions && (
        <div className="pt-1">
          <p className="text-caption font-semibold text-fg-secondary m-0 pb-2">
            Bộ lọc đang dùng — bấm để gỡ từng cái:
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {filters.map((filter) => (
              <span
                key={filter.key}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface text-brand-primary-600 text-[12px] font-semibold border border-brand-primary-200/90 shadow-sm"
              >
                <span>{filter.label}</span>
                <button
                  type="button"
                  onClick={filter.clear}
                  aria-label={`Xóa bộ lọc ${filter.label}`}
                  title="Gỡ bộ lọc này"
                  className="hover:text-danger transition-colors font-bold text-[14px] leading-none cursor-pointer -mr-0.5 ml-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary-600 focus-visible:ring-offset-2 rounded-full"
                >
                  <Icon name="close" size="xs" className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {(actionLabel && (actionPath || onAction)) && (
        <div className="pt-2">
          {actionPath ? (
            <Button as={Link} to={actionPath} variant="primary" size="md">
              {actionLabel}
            </Button>
          ) : (
            <Button variant="primary" size="md" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
        </div>
      )}

      {onClearAll && hasFilterActions && (
        <div className="pt-1">
          <button
            type="button"
            onClick={onClearAll}
            className="text-[12px] font-semibold text-fg-secondary hover:text-danger-strong transition-colors cursor-pointer underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary-600 focus-visible:ring-offset-2 rounded-sm"
          >
            {clearAllLabel}
          </button>
        </div>
      )}
    </Card>
  );
}
