import React from 'react';

export function CardSkeleton({ count = 1 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-3xl bg-white border border-slate-200/80 p-6 space-y-4 animate-pulse shadow-xs"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-200" />
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-slate-200 rounded-md w-3/4" />
              <div className="h-3 bg-slate-100 rounded-md w-1/2" />
            </div>
          </div>
          <div className="space-y-2 pt-2">
            <div className="h-3 bg-slate-100 rounded-md w-full" />
            <div className="h-3 bg-slate-100 rounded-md w-5/6" />
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <div className="h-4 bg-slate-200 rounded-md w-24" />
            <div className="h-8 bg-slate-200 rounded-xl w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div className="w-full space-y-3 animate-pulse">
      <div className="h-10 bg-slate-700/40 rounded-xl w-full" />
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="h-12 bg-slate-800/40 border border-slate-700/50 rounded-xl flex items-center px-4 gap-4"
        >
          {Array.from({ length: cols }).map((__, c) => (
            <div key={c} className="h-3 bg-slate-700/50 rounded-md flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function StatsSkeleton({ count = 3 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2 animate-pulse"
        >
          <div className="h-3 bg-slate-700 rounded-md w-1/3" />
          <div className="h-8 bg-slate-700 rounded-lg w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-pulse">
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/80 space-y-6">
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <div className="w-28 h-28 rounded-3xl bg-slate-200 shrink-0" />
          <div className="space-y-3 flex-1">
            <div className="h-6 bg-slate-200 rounded-lg w-1/3" />
            <div className="h-4 bg-slate-100 rounded-md w-1/4" />
            <div className="h-3 bg-slate-100 rounded-md w-2/3" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-48 bg-white rounded-3xl border border-slate-200/80" />
          <div className="h-48 bg-white rounded-3xl border border-slate-200/80" />
        </div>
        <div className="h-80 bg-white rounded-3xl border border-slate-200/80" />
      </div>
    </div>
  );
}

export function ListSkeleton({ count = 4 }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-4 rounded-2xl bg-white border border-slate-200 flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-3.5 bg-slate-200 rounded-md w-1/3" />
              <div className="h-3 bg-slate-100 rounded-md w-2/3" />
            </div>
          </div>
          <div className="w-16 h-3 bg-slate-100 rounded-md" />
        </div>
      ))}
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="w-full space-y-6 animate-pulse">
      <div className="h-32 bg-slate-100 rounded-3xl w-full" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-48 bg-slate-100 rounded-2xl" />
        <div className="h-48 bg-slate-100 rounded-2xl" />
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
