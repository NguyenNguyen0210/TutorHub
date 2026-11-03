import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/cn';

export default function UnreadBadge({ count, label, floating = false, className }) {
  if (!(count > 0)) return null;
  return (
    <span aria-label={`${count} ${label}`} className={cn(
      'inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-brand-primary-600 px-1.5 text-[10px] font-bold leading-none text-white tabular-nums',
      floating ? 'absolute -right-1 -top-1 ring-2 ring-surface' : 'bg-white/15',
      className
    )}>
      {count > 99 ? '99+' : count}
    </span>
  );
}
UnreadBadge.propTypes = { count: PropTypes.number, label: PropTypes.string, floating: PropTypes.bool, className: PropTypes.string };
