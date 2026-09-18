import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';
import Icon from '@/components/ui/Icon';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

/**
 * EmptyState — trạng thái rỗng: hướng hành động, không trang trí thừa.
 */
export default function EmptyState({
  icon = 'inbox',
  title = 'Không có dữ liệu',
  description = 'Chưa có thông tin để hiển thị tại mục này.',
  actionLabel,
  actionPath,
  onAction,
  className,
}) {
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
    </Card>
  );
}
