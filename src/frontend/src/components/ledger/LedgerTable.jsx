import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/cn';

/**
 * LedgerTable — vỏ bảng sổ cái có ngữ nghĩa thật.
 *
 * Các bảng cũ dựng bằng `<div>` lồng nhau: mất semantics cho screen reader, và
 * không có cơ chế cố định header khi cuộn dọc. Ở đây dùng `<table>` thật với
 * `scope="col"`, `<caption>` ẩn (bắt buộc cho a11y) và header dán.
 *
 * `align` theo cột để tiền luôn căn phải — đọc số dọc hàng dễ hơn đọc số rải rác.
 */
export default function LedgerTable({ caption, columns, children, className, minWidth = 640 }) {
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full text-caption" style={{ minWidth: `${minWidth}px` }}>
        <caption className="sr-only">{caption}</caption>
        <thead className="sticky top-0 z-10">
          <tr className="bg-neutral-50 border-y border-border">
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                style={col.width ? { width: col.width } : undefined}
                className={cn(
                  'px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-fg-secondary whitespace-nowrap',
                  col.align === 'right' && 'text-right',
                  col.align === 'center' && 'text-center'
                )}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">{children}</tbody>
      </table>
    </div>
  );
}

LedgerTable.propTypes = {
  caption: PropTypes.string.isRequired,
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      align: PropTypes.oneOf(['left', 'right', 'center']),
      width: PropTypes.string,
    })
  ).isRequired,
  children: PropTypes.node,
  className: PropTypes.string,
  minWidth: PropTypes.number,
};

LedgerTable.defaultProps = {
  children: null,
  className: '',
  minWidth: 640,
};
