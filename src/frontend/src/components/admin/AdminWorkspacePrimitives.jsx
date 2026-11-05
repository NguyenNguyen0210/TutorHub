import React from 'react';
import { cn } from '@/lib/cn';
import StatePanel from '@/components/common/StatePanel';
export function AdminKpis({ items }) {
  const colors = { blue: 'bg-brand-primary-50 border-brand-primary-100', mint: 'bg-success-subtle border-success/20', amber: 'bg-holding-subtle border-holding/25', purple: 'bg-insight-subtle border-insight/20' };
  return <section aria-label="Thống kê" className={cn('grid grid-cols-2 gap-3', items.length === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4')}>{items.map(({ label, value, tone = 'blue' }) => <div key={label} className={cn('min-h-[104px] rounded-2xl border p-4', colors[tone])}><h2 className="text-xs font-medium text-fg-secondary">{label}</h2><p className="mt-3 text-3xl font-semibold tabular-nums">{value ?? '—'}</p></div>)}</section>;
}
export function AdminStatus({ label, tone = 'neutral' }) {
  const tones = { neutral: 'text-fg-secondary', amber: 'text-holding-strong', blue: 'text-brand-primary-700', mint: 'text-success-strong', danger: 'text-danger-strong', purple: 'text-insight-strong' };
  return <span className={cn('inline-flex items-center gap-2 text-xs font-medium', tones[tone])}><span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />{label}</span>;
}
export function AdminEmpty({ title, description, icon = 'shield', children }) {
  return <StatePanel title={title} description={description} icon={icon} compact headingAs="h2">{children}</StatePanel>;
}
