import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/cn';

/**
 * LedgerStrip — hàng số liệu sổ cái tài chính & vận hành hiện đại.
 *
 * Operational Ledger (SPEC §4): số liệu là trọng tâm, trực quan, chính xác.
 * Hỗ trợ top indicator border và subtle gradient tinh tế cho trạng thái holding / danger.
 */
export default function LedgerStrip({ figures, className, columns = 4 }) {
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
              'bg-surface border border-border rounded-brand-lg px-4 py-3.5 sm:px-5 sm:py-4 min-w-0 transition-all duration-200 hover:shadow-brand-sm relative overflow-hidden',
              isHolding
                ? 'border-t-2 border-t-amber-500 bg-gradient-to-b from-amber-50/20 to-transparent'
                : isDanger
                  ? 'border-t-2 border-t-rose-500 bg-gradient-to-b from-rose-50/20 to-transparent'
                  : 'border-t-2 border-t-brand-primary-500/40 hover:border-t-brand-primary-600'
            )}
          >
            <dt className="flex items-center justify-between gap-1 text-[11px] sm:text-[11.5px] font-semibold uppercase tracking-wider text-fg-muted mb-1.5 truncate">
              <span className="truncate">{f.label}</span>
              {isHolding && (
                <span
                  className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0"
                  aria-hidden="true"
                  title="Thời gian chờ / Ký quỹ"
                />
              )}
              {isDanger && (
                <span
                  className="w-2 h-2 rounded-full bg-rose-500 shrink-0"
                  aria-hidden="true"
                  title="Cần xử lý"
                />
              )}
            </dt>

            <dd
              className={cn(
                'text-[24px] sm:text-[28px] leading-tight font-extrabold tabular-nums tracking-tight truncate',
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
              <p className="text-[12px] text-fg-muted mt-1 truncate">
                {f.hint}
              </p>
            )}
          </div>
        );
      })}
    </dl>
  );
}

LedgerStrip.propTypes = {
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
