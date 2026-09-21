import React from 'react';
import { cn } from '@/lib/cn';

/**
 * Logo — Brand Style Guide v2 logo system.
 *
 * Biến thể:
 *   variant="primary"    → mark + wordmark (mặc định)
 *   variant="horizontal" → mark + wordmark, không khung nền
 *   variant="mark"       → chỉ biểu tượng (favicon/app icon)
 *   variant="wordmark"   → chỉ chữ "TutorHub"
 *   variant="monochrome" → một màu (lọc CSS), dùng `tone="light"|"dark"`
 *
 * Mark là logo chính thức của thương hiệu (mũ tốt nghiệp + T/h + connection
 * node), vector hoá từ file gốc `Desktop/Logo.png` → `public/favicon.svg`.
 * Nền trong suốt nên đặt được trên mọi bề mặt (trắng, navy, ảnh).
 */

function MarkSvg({ size = 40, tone = 'color' }) {
  return (
    <img
      src="/favicon.svg"
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      draggable={false}
      className={cn(
        'select-none',
        tone === 'dark' && 'grayscale brightness-0',
        tone === 'light' && 'grayscale brightness-0 invert'
      )}
    />
  );
}

export default function Logo({
  variant = 'primary',
  size = 40,
  tone = 'color',
  subtitle,
  showSubtitle = false,
  className,
  ...rest
}) {
  const wordmark = (
    <span className="flex flex-col leading-none">
      <span
        className={cn(
          'font-extrabold tracking-tight',
          size >= 44 ? 'text-2xl' : size >= 34 ? 'text-xl' : 'text-lg',
          tone === 'light' ? 'text-white' : 'text-fg'
        )}
      >
        Tutor
        <span className={tone === 'color' ? 'text-brand-primary-600' : ''}>Hub</span>
      </span>
      {showSubtitle && subtitle && (
        <span
          className={cn(
            'text-[10px] font-semibold tracking-wider uppercase mt-1',
            tone === 'light' ? 'text-white/70' : 'text-fg-muted'
          )}
        >
          {subtitle}
        </span>
      )}
    </span>
  );

  if (variant === 'mark') {
    return (
      <span className={cn('inline-flex', className)} {...rest}>
        <MarkSvg size={size} tone={tone} />
      </span>
    );
  }

  if (variant === 'wordmark') {
    return (
      <span className={cn('inline-flex', className)} {...rest}>
        {wordmark}
      </span>
    );
  }

  if (variant === 'monochrome') {
    return (
      <span className={cn('inline-flex items-center gap-2.5', className)} {...rest}>
        <MarkSvg size={size} tone={tone} />
        {wordmark}
      </span>
    );
  }

  return (
    <span className={cn('inline-flex items-center gap-2.5', className)} {...rest}>
      <MarkSvg size={size} tone={tone} />
      {wordmark}
    </span>
  );
}
