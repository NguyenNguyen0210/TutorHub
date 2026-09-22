import React from 'react';
import { cn } from '@/lib/cn';

const VARIANT_CLASS = {
  neutral: 'bg-neutral-100 text-fg-secondary border-neutral-200',
  primary: 'bg-brand-primary-50 text-brand-primary-700 border-brand-primary-100',
  secondary: 'bg-brand-secondary-50 text-brand-secondary-700 border-brand-secondary-100',
  success: 'bg-success-subtle text-success-strong border-success/20',
  holding: 'bg-holding-subtle text-holding-strong border-holding/20',
  danger: 'bg-danger-subtle text-danger-strong border-danger/20',
  info: 'bg-info-subtle text-info border-info/20',
};

const LEGACY_COLOR_VARIANT = {
  default: 'neutral',
  success: 'success',
  warning: 'holding',
  error: 'danger',
  processing: 'info',
  blue: 'info',
  green: 'success',
  red: 'danger',
  orange: 'secondary',
  gold: 'secondary',
  purple: 'primary',
};

const SIZE_CLASS = {
  sm: 'px-2 py-0.5 text-[11px]',
  md: 'px-2.5 py-1 text-caption',
};

export default function Badge({
  variant,
  color,
  size = 'md',
  icon,
  dot = false,
  className,
  children,
  ...rest
}) {
  const resolved = variant || LEGACY_COLOR_VARIANT[color] || 'neutral';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-pill border font-semibold whitespace-nowrap',
        SIZE_CLASS[size] || SIZE_CLASS.md,
        VARIANT_CLASS[resolved] || VARIANT_CLASS.neutral,
        className
      )}
      {...rest}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" aria-hidden="true" />}
      {icon}
      {children}
    </span>
  );
}

export function Tag({ className, children, ...rest }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-brand-sm bg-neutral-100 px-2 py-0.5 text-caption font-medium text-fg-secondary',
        className
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
