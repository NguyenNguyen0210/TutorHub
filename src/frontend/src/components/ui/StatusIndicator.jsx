import React from 'react';
import { cn } from '@/lib/cn';
import Icon from './Icon';

const TONES = {
  success: 'text-success-strong', info: 'text-primary', primary: 'text-primary',
  neutral: 'text-fg-secondary', holding: 'text-holding-strong', danger: 'text-danger-strong',
};

/** Quiet status text; reserve filled badges for states requiring attention. */
export default function StatusIndicator({ children, variant = 'neutral', icon, dot = false, size = 'sm', className, ...rest }) {
  return <span className={cn('inline-flex items-center gap-1.5 font-medium', size === 'md' ? 'text-body-reg' : 'text-caption', TONES[variant] || TONES.neutral, className)} {...rest}>
    {icon ? <Icon name={icon} size="sm" /> : dot && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" aria-hidden="true" />}
    <span>{children}</span>
  </span>;
}
