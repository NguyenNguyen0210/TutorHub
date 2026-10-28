import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/cn';

/**
 * StatStrip — Thanh tóm tắt chỉ số và số dư.
 *
 * số liệu là trọng tâm, trực quan, chính xác.
 * Hỗ trợ top indicator theo trạng thái holding / danger.
 */
export default function StatStrip({ figures, className, columns = 4 }) {
  const cols =
    columns === 3
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
              isHolding
                ? 'border-t-2 border-t-holding bg-holding-subtle/30'
                : isDanger
                  ? 'border-t-2 border-t-danger bg-danger-subtle/30'
                  : 'border-t-2 border-t-brand-primary-500/40'
            )}
          >
            <dt className="flex min-h-9 items-start justify-between gap-1 text-caption font-semibold text-fg-secondary mb-1.5 leading-snug">
              <span>{f.label}</span>
              {isHolding && (
                <span
                  className="w-2 h-2 rounded-full bg-holding shrink-0"
                  aria-hidden="true"
                  title="Thời gian chờ / Ký quỹ"
                />
              )}
              {isDanger && (
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
                isHolding
                  ? 'text-holding-strong'
                  : isDanger
                    ? 'text-danger-strong'
                    : isMuted
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
      hint: PropTypes.string,
      tone: PropTypes.oneOf(['default', 'holding', 'danger', 'muted']),
    })
  ).isRequired,
  className: PropTypes.string,
  columns: PropTypes.oneOf([2, 3, 4]),
};
