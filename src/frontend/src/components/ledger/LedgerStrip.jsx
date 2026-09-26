import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/cn';

/**
 * LedgerStrip — hàng số liệu phẳng, không icon, không nền tone.
 *
 * Operational Ledger (SPEC §4): số là nhân vật chính, nhãn là phụ. Thay thế
 * pattern "4 ô icon-card" của StatCard ở các màn vận hành, vì ở đó người dùng
 * cần đọc số chứ không cần nhận diện trạng thái bằng màu nền.
 *
 * `tone` chỉ dùng cho số liệu *đang chờ tiền* (holding) — không dùng success cho
 * số dư lớn, vì "nhiều tiền" không phải tín hiệu tốt.
 */
export default function LedgerStrip({ figures, className, columns = 4 }) {
  const cols =
    columns === 3
      ? 'sm:grid-cols-3'
      : columns === 2
        ? 'sm:grid-cols-2'
        : 'grid-cols-2 lg:grid-cols-4';

  return (
    <dl className={cn('grid grid-cols-2 gap-3', cols, className)}>
      {figures.map((f) => (
        <div
          key={f.key}
          className="bg-surface border border-border rounded-brand-lg px-4 py-3.5 min-w-0"
        >
          <dd
            className={cn(
              'text-[26px] leading-none font-bold tabular-nums tracking-tight truncate',
              f.tone === 'holding'
                ? 'text-holding-strong'
                : f.tone === 'danger'
                  ? 'text-danger-strong'
                  : f.tone === 'muted'
                    ? 'text-fg-secondary'
                    : 'text-fg'
            )}
          >
            {f.value}
          </dd>
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-fg-muted mt-1.5 truncate">
            {f.label}
          </dt>
          {f.hint && <p className="text-[12px] text-fg-muted mt-0.5 truncate">{f.hint}</p>}
        </div>
      ))}
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

LedgerStrip.defaultProps = {
  className: '',
  columns: 4,
};
