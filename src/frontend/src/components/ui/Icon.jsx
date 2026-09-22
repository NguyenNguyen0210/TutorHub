import React from 'react';
import { cn } from '@/lib/cn';
import { resolveIconName } from '@/lib/iconMap';
import { getLucideIcon } from '@/lib/lucideRegistry';

/**
 * Icon — Lucide wrapper chuẩn theo Brand Style Guide v2.
 *
 * Hai cách dùng:
 *   <Icon name="explore" />                 // tên Material Symbols cũ (tự map sang Lucide)
 *   <Icon as={Lucide.Search} />             // component Lucide trực tiếp
 *
 * Grid chuẩn 24px, stroke 2px, đầu nét bo tròn. Scale: sm=16 · md=20 · lg=24 · xl=32.
 */
const SIZE_CLASS = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
};

export default function Icon({
  name,
  as,
  size = 'lg',
  strokeWidth = 2,
  className,
  filled = false,
  label,
  ...rest
}) {
  const LucideIcon = as || getLucideIcon(resolveIconName(name));

  return (
    <LucideIcon
      className={cn('shrink-0', SIZE_CLASS[size] || SIZE_CLASS.lg, className)}
      strokeWidth={filled ? 2.5 : strokeWidth}
      fill={filled ? 'currentColor' : 'none'}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? 'img' : undefined}
      {...rest}
    />
  );
}
