import React, { useId, useState } from 'react';
import Icon from '@/components/ui/Icon';
import { PROFILE_APPROVAL_LABEL, PROFILE_APPROVAL_EXPLANATION } from '@/content/servicePolicies';

export default function ApprovedProfileBadge() {
  const [open, setOpen] = useState(false);
  const tooltipId = useId();
  return <span className="relative inline-flex align-middle">
    <button type="button" aria-describedby={tooltipId} aria-label={PROFILE_APPROVAL_LABEL}
      onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)} onBlur={() => setOpen(false)} onClick={() => setOpen(true)}
      onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); setOpen(false); } }}
      className="relative z-20 inline-flex h-8 w-8 items-center justify-center rounded-md text-brand-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
      <Icon name="check_circle" size="sm" />
    </button>
    <span id={tooltipId} role="tooltip" className={`pointer-events-none absolute right-0 top-full z-30 mt-2 w-64 max-w-[80vw] rounded-xl border border-border bg-surface p-3 text-caption font-normal leading-relaxed text-fg shadow-brand-md ${open ? 'block' : 'hidden'}`}>
      {PROFILE_APPROVAL_EXPLANATION}
    </span>
  </span>;
}
