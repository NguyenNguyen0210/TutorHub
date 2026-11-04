import React from 'react';
import { cn } from '@/lib/cn';

const states = {
  Pending: { label: 'Chờ tiếp nhận', color: 'text-holding-strong' },
  Processing: { label: 'Đang xử lý', color: 'text-brand-primary-700' },
  Completed: { label: 'Đã hoàn tất', color: 'text-success-strong' },
  Failed: { label: 'Thất bại', color: 'text-danger-strong' },
};

export function WithdrawalStatus({ status }) {
  const state = states[status] || { label: 'Chưa xác định', color: 'text-fg-secondary' };
  return <span className={cn('inline-flex items-center gap-2 text-[13px] font-medium', state.color)}><span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" aria-hidden="true" />{state.label}</span>;
}
