import React from 'react';
import { cn } from '@/lib/cn';

const VARIANT_CLASS = {
  primary:
    'bg-brand-primary-600 text-white hover:bg-brand-primary-700 active:bg-brand-primary-800 shadow-sm disabled:hover:bg-brand-primary-600',
  secondary:
    'bg-brand-secondary-500 text-white hover:bg-brand-secondary-600 active:bg-brand-secondary-700 shadow-sm disabled:hover:bg-brand-secondary-500',
  outline:
    'bg-surface text-fg border border-border hover:bg-neutral-50 hover:border-neutral-300 active:bg-neutral-100',
  ghost: 'bg-transparent text-fg-secondary hover:bg-neutral-100 hover:text-fg active:bg-neutral-200',
  danger:
    'bg-danger text-white hover:bg-danger-strong active:bg-danger-strong shadow-sm disabled:hover:bg-danger',
  // Viền đỏ + chữ đỏ: hành động phá hủy nhưng không phải hành động chính.
  // Cần vì trước đây gọi 'danger-outline' rơi vào fallback primary → nút hủy hiện màu xanh.
  'danger-outline':
    'bg-surface text-danger-strong border border-danger/40 hover:bg-danger-subtle hover:border-danger active:bg-danger-subtle disabled:hover:bg-surface',
  'danger-ghost':
    'bg-transparent text-danger-strong hover:bg-danger-subtle active:bg-danger-subtle disabled:hover:bg-transparent',
  success:
    'bg-success text-white hover:bg-success-strong active:bg-success-strong shadow-sm disabled:hover:bg-success',
};

const SIZE_CLASS = {
  sm: 'h-8 px-3 text-caption gap-1.5 rounded-brand-md',
  md: 'h-10 px-4 text-body-reg gap-2 rounded-brand-md',
  lg: 'h-12 px-6 text-body-lg gap-2 rounded-brand-md',
};

export default function Button({
  as: Component = 'button',
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconRight,
  fullWidth = false,
  className,
  children,
  type,
  ...rest
}) {
  const isDisabled = disabled || loading;
  const isNativeButton = Component === 'button';

  return (
    <Component
      type={isNativeButton ? type || 'button' : undefined}
      disabled={isNativeButton ? isDisabled : undefined}
      aria-disabled={!isNativeButton && isDisabled ? true : undefined}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex items-center justify-center font-semibold transition-colors select-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary-600 focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        fullWidth && 'w-full',
        SIZE_CLASS[size] || SIZE_CLASS.md,
        VARIANT_CLASS[variant] || VARIANT_CLASS.primary,
        className
      )}
      {...rest}
    >
      {loading ? (
        <span
          className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin"
          aria-hidden="true"
        />
      ) : (
        icon
      )}
      {children}
      {iconRight}
    </Component>
  );
}

/**
 * IconButton — nút chỉ có icon. `label` là BẮT BUỘC (a11y: jsx-a11y ở mức error).
 */
export function IconButton({ label, variant = 'ghost', size = 'md', className, icon, ...rest }) {
  const box = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-12 h-12' : 'w-10 h-10';
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex items-center justify-center rounded-brand-md transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary-600 focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        box,
        VARIANT_CLASS[variant] || VARIANT_CLASS.ghost,
        className
      )}
      {...rest}
    >
      {icon}
    </button>
  );
}
