import React from 'react';
import { cn } from '@/lib/cn';

const BAR = 'bg-neutral-200 rounded animate-pulse';

export function CardSkeleton({ count = 1, className }) {
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-brand-lg bg-surface border border-border p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className={cn(BAR, 'w-16 h-16 rounded-brand-md')} />
            <div className="space-y-2 flex-1">
              <div className={cn(BAR, 'h-4 w-3/4')} />
              <div className={cn(BAR, 'h-3 w-1/2')} />
            </div>
          </div>
          <div className="space-y-2 pt-2">
            <div className={cn(BAR, 'h-3 w-full')} />
            <div className={cn(BAR, 'h-3 w-5/6')} />
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div className={cn(BAR, 'h-4 w-24')} />
            <div className={cn(BAR, 'h-8 w-24 rounded-brand-md')} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 5, className }) {
  return (
    <div className={cn('w-full space-y-3', className)}>
      <div className={cn(BAR, 'h-10 rounded-brand-md')} />
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="h-12 bg-surface border border-border rounded-brand-md flex items-center px-4 gap-4"
        >
          {Array.from({ length: cols }).map((__, c) => (
            <div key={c} className={cn(BAR, 'h-3 flex-1')} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function StatsSkeleton({ count = 4, className }) {
  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-5 rounded-brand-lg bg-surface border border-border space-y-3">
          <div className={cn(BAR, 'h-3 w-1/3')} />
          <div className={cn(BAR, 'h-8 w-1/2 rounded-brand-md')} />
        </div>
      ))}
    </div>
  );
}

export function ProfileSkeleton({ className }) {
  return (
    <div className={cn('max-w-5xl mx-auto space-y-8', className)}>
      <div className="p-6 sm:p-8 rounded-brand-xl bg-surface border border-border space-y-6">
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <div className={cn(BAR, 'w-28 h-28 rounded-brand-xl shrink-0')} />
          <div className="space-y-3 flex-1">
            <div className={cn(BAR, 'h-6 w-1/3 rounded-brand-md')} />
            <div className={cn(BAR, 'h-4 w-1/4')} />
            <div className={cn(BAR, 'h-3 w-2/3')} />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className={cn(BAR, 'h-48 rounded-brand-xl')} />
          <div className={cn(BAR, 'h-48 rounded-brand-xl')} />
        </div>
        <div className={cn(BAR, 'h-80 rounded-brand-xl')} />
      </div>
    </div>
  );
}

export function ListSkeleton({ count = 4, className }) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-4 rounded-brand-lg bg-surface border border-border flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3 flex-1">
            <div className={cn(BAR, 'w-10 h-10 rounded-full shrink-0')} />
            <div className="space-y-2 flex-1">
              <div className={cn(BAR, 'h-3.5 w-1/3')} />
              <div className={cn(BAR, 'h-3 w-2/3')} />
            </div>
          </div>
          <div className={cn(BAR, 'w-16 h-3')} />
        </div>
      ))}
    </div>
  );
}

export function DetailSkeleton({ className }) {
  return (
    <div className={cn('w-full space-y-6', className)}>
      <div className={cn(BAR, 'h-32 rounded-brand-xl w-full')} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={cn(BAR, 'h-48 rounded-brand-lg')} />
        <div className={cn(BAR, 'h-48 rounded-brand-lg')} />
      </div>
    </div>
  );
}

export default {
  CardSkeleton,
  TableSkeleton,
  StatsSkeleton,
  ProfileSkeleton,
  ListSkeleton,
  DetailSkeleton,
};
