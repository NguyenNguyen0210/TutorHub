import React from 'react';
import { cn } from '@/lib/cn';
import Icon from '@/components/ui/Icon';
import { TRANSACTION_TYPES, transactionStatus } from '@/utils/adminTransactions';

const ICON_TONES = {
  blue: 'bg-brand-primary-50 text-brand-primary-600', success: 'bg-success-subtle text-success-strong',
  holding: 'bg-holding-subtle text-holding-strong', insight: 'bg-insight-subtle text-insight-strong',
  neutral: 'bg-neutral-100 text-fg-secondary',
};
const STATUS_TONES = {
  blue: 'text-brand-primary-700', success: 'text-success-strong', holding: 'text-holding-strong',
  danger: 'text-danger-strong', neutral: 'text-fg-secondary',
};

export function TransactionIcon({ type }) {
  const item = TRANSACTION_TYPES[type] || { icon: 'receipt_long', tone: 'neutral' };
  return <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', ICON_TONES[item.tone])}><Icon name={item.icon} size="sm" /></span>;
}

export function TransactionStatus({ item }) {
  const status = transactionStatus(item);
  return <span className={cn('inline-flex items-center gap-2 text-[13px] font-medium leading-5', STATUS_TONES[status.tone])}><span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />{status.label}</span>;
}
