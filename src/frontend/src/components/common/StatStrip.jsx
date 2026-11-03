import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/cn';
import Icon from '@/components/ui/Icon';

/**
 * StatStrip — Thanh tóm tắt chỉ số và số dư.
 *
 * số liệu là trọng tâm, trực quan, chính xác.
 * Hỗ trợ top indicator theo trạng thái holding / danger.
 */
export default function StatStrip({ figures, className, columns = 4, appearance = 'default' }) {
  const soft = appearance === 'soft';
  const cols =
    soft && columns === 3
      ? 'grid-cols-1 md:grid-cols-3'
      : columns === 3
        ? 'sm:grid-cols-3'
        : columns === 2
          ? 'sm:grid-cols-2'
          : 'grid-cols-2 lg:grid-cols-4';

  return (
    <dl className={cn('grid grid-cols-2 gap-3 sm:gap-4', cols, className)}>
      {figures.map((f) => {
        const isHolding = f.tone === 'holding';
        const isDanger = f.tone === 'danger';
        const isMuted = f.tone === 'muted';

        return (
          <div
            key={f.key}
            className={cn(
              'bg-surface border border-border rounded-brand-lg px-4 py-3.5 sm:px-5 sm:py-4 min-w-0 relative overflow-hidden flex flex-col',
              soft ? 'rounded-2xl shadow-[var(--learning-card-shadow)]' : isHolding
                ? 'border-t-2 border-t-holding bg-holding-subtle/30'
                : isDanger
                  ? 'border-t-2 border-t-danger bg-danger-subtle/30'
                  : 'border-t-2 border-t-brand-primary-500/40'
            )}
          >
            <dt className="flex min-h-9 items-start justify-between gap-1 text-caption font-semibold text-fg-secondary mb-1.5 leading-snug">
              <span>{f.label}</span>
              {soft && f.icon && <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', isHolding ? 'bg-holding-subtle text-holding-strong' : isDanger ? 'bg-danger-subtle text-danger-strong' : f.tone === 'success' ? 'bg-success-subtle text-success-strong' : 'bg-brand-primary-50 text-brand-primary-600')}><Icon name={f.icon} size="sm" /></span>}
              {!soft && isHolding && (
                <span
                  className="w-2 h-2 rounded-full bg-holding shrink-0"
                  aria-hidden="true"
                  title="Thời gian chờ / Ký quỹ"
                />
              )}
              {!soft && isDanger && (
                <span
                  className="w-2 h-2 rounded-full bg-danger shrink-0"
                  aria-hidden="true"
                  title="Cần xử lý"
                />
              )}
            </dt>

            <dd
              className={cn(
                'text-[20px] sm:text-[28px] leading-tight font-extrabold tabular-nums tracking-tight whitespace-nowrap',
                soft && 'sm:text-[20px] xl:text-[28px]',
                isHolding
                  ? 'text-holding-strong'
                  : isDanger
                    ? 'text-danger-strong'
                    : soft && f.tone === 'success' ? 'text-success-strong' : isMuted
                      ? 'text-fg-secondary'
                      : 'text-fg'
              )}
            >
              {f.value}
            </dd>

            {f.hint && (
              <p className="text-[12px] text-fg-muted mt-1 leading-snug">
                {f.hint}
              </p>
            )}
          </div>
        );
      })}
    </dl>
  );
}

StatStrip.propTypes = {
  figures: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      value: PropTypes.node.isRequired,
      hint: PropTypes.node,
      icon: PropTypes.string,
      tone: PropTypes.oneOf(['default', 'holding', 'danger', 'muted', 'success']),
    })
  ).isRequired,
  className: PropTypes.string,
  columns: PropTypes.oneOf([2, 3, 4]),
  appearance: PropTypes.oneOf(['default', 'soft']),
};
