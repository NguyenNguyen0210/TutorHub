import React from 'react';
import { cn } from '@/lib/cn';
import Icon from './Icon';

const TONE_CLASS = {
  neutral: 'text-fg',
  primary: 'text-brand-primary-600',
  success: 'text-success-strong',
  holding: 'text-holding-strong',
  danger: 'text-danger-strong',
  info: 'text-info',
};

const ICON_BG = {
  neutral: 'bg-neutral-100 text-fg-secondary',
  primary: 'bg-brand-primary-50 text-brand-primary-600',
  success: 'bg-success-subtle text-success-strong',
  holding: 'bg-holding-subtle text-holding-strong',
  danger: 'bg-danger-subtle text-danger-strong',
  info: 'bg-info-subtle text-info',
};

/**
 * StatCard — thẻ chỉ số tài chính/KPI.
 * `value` nên được truyền đã format sẵn (formatCurrency hoặc node <Money/>).
 * Mặc định dùng Inter + tabular-nums cho số; `mono` chỉ dùng cho mã/ID.
 */
export default function StatCard({
  label,
  value,
  hint,
  icon,
  tone = 'neutral',
  mono = true,
  action,
  className,
  ...rest
}) {
  return (
    <div
      className={cn(
        'bg-surface border border-border rounded-brand-lg shadow-brand-sm p-5 flex flex-col gap-3',
        className
      )}
      {...rest}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-caption font-semibold text-fg-muted uppercase tracking-wide">
          {label}
        </span>
        {icon && (
          <span
            className={cn(
              'w-9 h-9 rounded-brand-md flex items-center justify-center shrink-0',
              ICON_BG[tone] || ICON_BG.neutral
            )}
          >
            {icon}
          </span>
        )}
      </div>
      <div>
        <p
          className={cn(
            'text-headline-1 leading-tight tabular-nums tracking-tight',
            mono && 'font-mono',
            TONE_CLASS[tone] || TONE_CLASS.neutral
          )}
        >
          {value}
        </p>
        {hint && <p className="text-caption text-fg-muted mt-1">{hint}</p>}
      </div>
      {action && <div className="mt-auto">{action}</div>}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions, breadcrumb, className, ...rest }) {
  return (
    <div
      className={cn('flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6', className)}
      {...rest}
    >
      <div className="min-w-0">
        {breadcrumb && <div className="mb-1.5 text-caption text-fg-muted">{breadcrumb}</div>}
        <h1 className="text-headline-1 text-fg">{title}</h1>
        {subtitle && <p className="text-body-reg text-fg-secondary mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
    </div>
  );
}

export function EmptyState({ icon = 'inbox', title, description, action, className, ...rest }) {
  return (
    <div
      className={cn('flex flex-col items-center justify-center text-center py-16 px-6', className)}
      {...rest}
    >
      <span className="w-16 h-16 rounded-brand-lg bg-neutral-100 text-fg-muted flex items-center justify-center mb-4">
        <Icon name={icon} size="xl" strokeWidth={1.5} />
      </span>
      <h3 className="text-headline-3 text-fg">{title}</h3>
      {description && <p className="text-body-reg text-fg-muted mt-1.5 max-w-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Spinner({ size = 'md', className, label = 'Đang tải' }) {
  const box = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-8 h-8' : 'w-6 h-6';
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        'inline-block rounded-full border-2 border-brand-primary-600 border-t-transparent animate-spin',
        box,
        className
      )}
    />
  );
}
