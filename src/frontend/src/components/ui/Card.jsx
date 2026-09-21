import React from 'react';
import { cn } from '@/lib/cn';

const CARD_PADDING = {
  none: 'p-0',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
};

/**
 * Card — bề mặt nội dung chuẩn: nền trắng, viền mảnh, radius lớn, bóng rất nhẹ.
 */
export default function Card({
  as: Component = 'div',
  padding = 'md',
  hoverable = false,
  className,
  children,
  ...rest
}) {
  return (
    <Component
      className={cn(
        'bg-surface border border-border rounded-brand-lg shadow-brand-sm',
        CARD_PADDING[padding] ?? CARD_PADDING.md,
        hoverable && 'transition-all hover:shadow-brand-md hover:border-brand-primary-200',
        className
      )}
      {...rest}
    >
      {children}
    </Component>
  );
}

export function CardHeader({ className, title, subtitle, action, icon, children, ...rest }) {
  return (
    <div className={cn('flex items-start justify-between gap-4 mb-4', className)} {...rest}>
      <div className="flex items-start gap-3 min-w-0">
        {icon && (
          <div className="w-10 h-10 rounded-brand-md bg-brand-primary-50 text-brand-primary-600 flex items-center justify-center shrink-0">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          {title && <h3 className="text-headline-3 text-fg truncate">{title}</h3>}
          {subtitle && <p className="text-caption text-fg-muted mt-0.5">{subtitle}</p>}
          {children}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CardBody({ className, children, ...rest }) {
  return (
    <div className={cn('text-body-reg text-fg-secondary', className)} {...rest}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...rest }) {
  return (
    <div
      className={cn('mt-4 pt-4 border-t border-border flex items-center gap-3', className)}
      {...rest}
    >
      {children}
    </div>
  );
}
