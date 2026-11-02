import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/cn';

const BAR = 'rounded bg-neutral-200/80 motion-safe:animate-pulse';

export default function MarketplaceCardSkeleton({ count = 6 }) {
  return (
    <div
      role="status"
      aria-label="Đang tải danh sách gia sư..."
      className="grid grid-cols-1 gap-6 md:grid-cols-2"
    >
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          aria-hidden="true"
          className="flex min-h-[340px] h-full flex-col rounded-2xl border border-border bg-surface p-5 sm:p-6"
        >
          <div className="flex items-start gap-3">
            <div className={cn(BAR, 'h-14 w-14 shrink-0 rounded-full')} />
            <div className="flex-1 space-y-2">
              <div className={cn(BAR, 'h-3.5 w-2/3')} />
              <div className={cn(BAR, 'h-2.5 w-1/2')} />
              <div className={cn(BAR, 'h-2.5 w-1/3')} />
            </div>
          </div>
          <div className="mt-3 space-y-2">
            <div className={cn(BAR, 'h-2.5 w-4/5')} />
            <div className={cn(BAR, 'h-2.5 w-3/5')} />
          </div>
          <div className="mt-auto flex items-center justify-between border-t border-border pt-4">
            <div className={cn(BAR, 'h-3 w-20')} />
            <div className={cn(BAR, 'h-9 w-24 rounded-[8px]')} />
          </div>
        </div>
      ))}
    </div>
  );
}

MarketplaceCardSkeleton.propTypes = {
  count: PropTypes.number,
};
