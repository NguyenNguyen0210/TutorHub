import React from 'react';
import { cn } from '@/lib/cn';
import Icon from './Icon';

const VARIANT_CLASS = {
  info: 'bg-info-subtle border-info/25 text-info',
  success: 'bg-success-subtle border-success/25 text-success-strong',
  warning: 'bg-holding-subtle border-holding/25 text-holding-strong',
  danger: 'bg-danger-subtle border-danger/25 text-danger-strong',
  neutral: 'bg-neutral-50 border-border text-fg-secondary',
};

const VARIANT_ICON = {
  info: 'info',
  success: 'check_circle',
  warning: 'warning',
  danger: 'error',
  neutral: 'info',
};

/**
 * Callout — thay thế AntD `<Alert>`. Khối thông báo ngữ nghĩa có icon + tiêu đề tùy chọn.
 */
export default function Callout({
  variant = 'info',
  title,
  icon,
  action,
  className,
  children,
  ...rest
}) {
  return (
    <div
      role={variant === 'danger' || variant === 'warning' ? 'alert' : 'status'}
      className={cn(
        'flex items-start gap-3 rounded-brand-md border px-4 py-3',
        VARIANT_CLASS[variant] || VARIANT_CLASS.info,
        className
      )}
      {...rest}
    >
      <span className="mt-0.5">
        {icon || <Icon name={VARIANT_ICON[variant] || 'info'} size="md" />}
      </span>
      <div className="flex-1 min-w-0">
        {title && <p className="text-body-reg font-semibold">{title}</p>}
        {children && (
          <div className={cn('text-caption', title ? 'mt-0.5 opacity-90' : 'text-body-reg')}>
            {children}
          </div>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function Progress({ value = 0, variant = 'primary', className, label }) {
  const pct = Math.max(0, Math.min(100, value));
  const bar = {
    primary: 'bg-brand-primary-600',
    success: 'bg-success',
    holding: 'bg-holding',
    danger: 'bg-danger',
  }[variant] || 'bg-brand-primary-600';

  return (
    <div className={cn('w-full', className)}>
      <div
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        className="h-2 w-full overflow-hidden rounded-pill bg-neutral-200"
      >
        <div
          className={cn('h-full rounded-pill transition-all duration-500', bar)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
