import React from 'react';
import { cn } from '@/lib/cn';
import Icon from './Icon';

/**
 * Table — bảng dữ liệu nhẹ, dùng markup ngữ nghĩa (`table`/`thead`/`tbody`).
 * `columns`: [{ key, header, align?, className?, render? }]
 * `rows`: mảng dữ liệu; `rowKey` trả về key duy nhất.
 */
export default function Table({
  columns = [],
  rows = [],
  rowKey = (row, i) => row?.id ?? i,
  loading = false,
  emptyLabel = 'Không có dữ liệu',
  onRowClick,
  className,
}) {
  return (
    <div className={cn('w-full overflow-x-auto rounded-brand-lg border border-border', className)}>
      <table className="w-full min-w-[640px] border-collapse text-left">
        <thead>
          <tr className="bg-neutral-50 border-b border-border">
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={cn(
                  'px-4 py-3 text-caption font-semibold text-fg-secondary uppercase tracking-wide whitespace-nowrap',
                  col.align === 'right' && 'text-right',
                  col.align === 'center' && 'text-center',
                  col.className
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading &&
            Array.from({ length: 5 }).map((_, r) => (
              <tr key={`sk-${r}`} className="border-b border-border last:border-0">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3.5">
                    <div className="h-3.5 rounded bg-neutral-200 animate-pulse" />
                  </td>
                ))}
              </tr>
            ))}

          {!loading && rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center">
                <span className="block mb-2 text-fg-muted">
                  <Icon name="inbox" size="xl" strokeWidth={1.5} className="mx-auto" />
                </span>
                <p className="text-body-reg text-fg-muted">{emptyLabel}</p>
              </td>
            </tr>
          )}

          {!loading &&
            rows.map((row, i) => (
              <tr
                key={rowKey(row, i)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  'border-b border-border last:border-0 transition-colors',
                  onRowClick && 'cursor-pointer hover:bg-neutral-50'
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      'px-4 py-3.5 text-body-reg text-fg-secondary align-middle',
                      col.align === 'right' && 'text-right',
                      col.align === 'center' && 'text-center'
                    )}
                  >
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}

export function Pagination({ page, totalPages, onChange, onPageChange, className }) {
  const handleChange = onPageChange || onChange;
  if (!totalPages || totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1
  );

  return (
    <nav
      aria-label="Phân trang"
      className={cn('flex items-center justify-center gap-1.5 mt-4', className)}
    >
      <button
        type="button"
        aria-label="Trang trước"
        disabled={page <= 1}
        onClick={() => handleChange?.(page - 1)}
        className="w-9 h-9 rounded-brand-md border border-border flex items-center justify-center text-fg-secondary hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <Icon name="chevron_left" size="sm" />
      </button>

      {pages.map((p, idx) => {
        const prev = pages[idx - 1];
        const gap = prev && p - prev > 1;
        return (
          <React.Fragment key={p}>
            {gap && <span className="px-1 text-fg-muted">…</span>}
            <button
              type="button"
              aria-label={`Trang ${p}`}
              aria-current={p === page ? 'page' : undefined}
              onClick={() => handleChange?.(p)}
              className={cn(
                'w-9 h-9 rounded-brand-md text-body-reg font-semibold transition-colors',
                p === page
                  ? 'bg-brand-primary-600 text-white'
                  : 'border border-border text-fg-secondary hover:bg-neutral-50'
              )}
            >
              {p}
            </button>
          </React.Fragment>
        );
      })}

      <button
        type="button"
        aria-label="Trang sau"
        disabled={page >= totalPages}
        onClick={() => handleChange?.(page + 1)}
        className="w-9 h-9 rounded-brand-md border border-border flex items-center justify-center text-fg-secondary hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <Icon name="chevron_right" size="sm" />
      </button>
    </nav>
  );
}
