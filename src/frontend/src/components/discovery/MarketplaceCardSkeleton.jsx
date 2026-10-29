import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/cn';

const BAR = 'rounded bg-neutral-200/80 animate-pulse';

export default function MarketplaceCardSkeleton({ count = 6 }) {
  return (
    <div
      role="status"
      aria-label="Đang tải danh sách gia sư..."
      className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
    >
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          aria-hidden="true"
          className="mkt-card flex h-full flex-col p-4 pl-5 sm:p-5 sm:pl-6"
        >
          <div className="flex items-start gap-3">
            <div className={cn(BAR, 'h-[42px] w-[42px] shrink-0 rounded-full sm:h-12 sm:w-12')} />
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
          <div className="mt-auto flex items-center justify-between border-t border-[color:var(--mkt-line)] pt-3">
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
