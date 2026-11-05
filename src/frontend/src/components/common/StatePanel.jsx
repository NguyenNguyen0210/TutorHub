import React from 'react';
import { cn } from '@/lib/cn';
import Icon from '@/components/ui/Icon';

/** Shared recovery surface, using TutorHub's book motif and existing tokens. */
export default function StatePanel({ title, description, icon = 'menu_book', code, headingAs: Heading = 'h3', alert = false, compact = false, actions, children, className }) {
  return (
    <div className={cn('mx-auto w-full max-w-2xl rounded-2xl border border-border bg-surface px-5 py-8 text-center sm:px-8 sm:py-10', compact && 'border-0 bg-transparent px-4 py-8 sm:py-8', className)}>
      <div aria-hidden="true" className={cn('relative mx-auto mb-6 flex h-28 w-40 items-center justify-center', compact && 'mb-4 h-20 w-28')}>
        <svg viewBox="0 0 160 112" fill="none" className="absolute inset-0 h-full w-full text-primary">
          <path d="M12 94h136" className="stroke-border" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M27 24h43c6 0 10 3 10 8v61c-4-5-9-7-15-7H27V24Zm106 0H90c-6 0-10 3-10 8v61c4-5 9-7 15-7h38V24Z" className="fill-primary-subtle stroke-brand-primary-200" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M39 39h23m-23 9h17m43-9h22m-22 9h15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity=".35" />
        </svg>
        <span className={cn('relative mt-4 flex h-14 min-w-14 items-center justify-center rounded-2xl border border-border bg-surface px-3 text-primary', compact && 'h-11 min-w-11 rounded-xl px-2')}>
          {code ? <span className="text-2xl font-bold tracking-tight">{code}</span> : <Icon name={icon} size={compact ? 'lg' : 'xl'} strokeWidth={1.5} />}
        </span>
      </div>
      <div role={alert ? 'alert' : undefined} className="mx-auto max-w-lg space-y-3">
        <Heading className={cn('m-0 text-xl font-semibold leading-snug tracking-tight text-fg sm:text-2xl', compact && 'text-base sm:text-lg')}>{title}</Heading>
        {description && <p className="m-0 text-sm leading-6 text-fg-secondary">{description}</p>}
      </div>
      {children && <div className="mt-5">{children}</div>}
      {actions && <div className="mt-6 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center">{actions}</div>}
    </div>
  );
}
