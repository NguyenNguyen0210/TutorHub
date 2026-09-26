import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/cn';
import Icon from '@/components/ui/Icon';
import Avatar from '@/components/ui/Avatar';
import { IconButton } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/StatCard';
import { formatDateTime } from '@/utils/formatters';
import StateBadge from '@/components/ledger/StateBadge';

/**
 * Bảng danh sách hồ sơ gia sư + thanh phân trang (Operational Ledger — SPEC §4.2).
 *
 * Vì sao KHÔNG dùng `LedgerTable`: kit khai báo `columns[].label` là `string`
 * (xem `components/ledger/LedgerTable.jsx`), còn cột đầu của bảng này chứa ô
 * chọn "select all" — một control, không phải nhãn văn bản. Bảng giữ nguyên
 * `<table>` thật (scope="col" cho screen reader) nhưng ăn đúng màu của kit:
 * `bg-neutral-50` cho header, `divide-border`, chữ `fg-*`.
 */
const CHECKBOX_CLASS =
  'w-4 h-4 rounded border-neutral-300 text-brand-primary-600 accent-brand-primary-600 cursor-pointer';

export default function ApplicationTable({
  rows,
  loading,
  selectedId,
  checkedIds,
  totalFiltered,
  currentPage,
  totalPages,
  onToggleRow,
  onToggleCheckbox,
  onToggleSelectAll,
  onPageChange,
}) {
  const allOnPageChecked = rows.length > 0 && checkedIds.length === rows.length;

  return (
    <div className="bg-surface rounded-2xl border border-border shadow-brand-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-border bg-neutral-50/70 text-fg-secondary font-semibold text-[12px]">
              <th scope="col" className="py-3 px-3.5 w-10 text-center">
                <input
                  type="checkbox"
                  aria-label="Chọn tất cả hồ sơ trên trang"
                  checked={allOnPageChecked}
                  onChange={onToggleSelectAll}
                  className={CHECKBOX_CLASS}
                />
              </th>
              <th scope="col" className="py-3 px-3.5">Ứng viên</th>
              <th scope="col" className="py-3 px-3.5">Chuyên môn</th>
              <th scope="col" className="py-3 px-3.5">Trình độ học vấn</th>
              <th scope="col" className="py-3 px-3.5 whitespace-nowrap">Ngày nộp</th>
              <th scope="col" className="py-3 px-3.5 text-center">Trạng thái</th>
              <th scope="col" className="py-3 px-3.5 text-center w-24">Thao tác</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-14 text-center text-fg-muted">
                  <div className="flex flex-col items-center justify-center gap-2.5">
                    <Spinner size="lg" className="mx-auto" />
                    <span className="text-xs font-medium text-fg-secondary">
                      Đang tải danh sách hồ sơ gia sư từ hệ thống...
                    </span>
                  </div>
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-fg-muted">
                  <Icon name="search" size="lg" className="mx-auto mb-2 text-neutral-300" />
                  Không tìm thấy hồ sơ gia sư nào phù hợp.
                </td>
              </tr>
            ) : (
              rows.map((app) => {
                const isSelected = selectedId === app.id;
                const isChecked = checkedIds.includes(app.id);

                return (
                  <tr
                    key={app.id}
                    onClick={() => onToggleRow(app)}
                    className={cn(
                      'transition-colors cursor-pointer group',
                      isSelected
                        ? 'bg-brand-primary-50/60 hover:bg-brand-primary-50/80'
                        : 'hover:bg-neutral-50/80'
                    )}
                  >
                    {/* Checkbox */}
                    <td
                      className="py-3.5 px-3.5 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        aria-label={`Chọn hồ sơ của ${app.userFullName}`}
                        checked={isChecked}
                        onChange={(e) => onToggleCheckbox(app.id, e)}
                        className={CHECKBOX_CLASS}
                      />
                    </td>

                    {/* Candidate info */}
                    <td className="py-3.5 px-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={app.userAvatarUrl}
                          name={app.userFullName}
                          size="md"
                          className="w-10 h-10 shrink-0 border border-border"
                        />
                        <div className="min-w-0">
                          <span className="font-bold text-fg block truncate leading-snug">
                            {app.userFullName}
                          </span>
                          <span className="text-[12px] text-fg-muted block truncate">
                            {app.userEmail}
                          </span>
                          <span className="text-[11.5px] text-fg-muted block truncate">
                            {app.userPhone}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Subject & Sub-specialization */}
                    <td className="py-3.5 px-3.5">
                      <span className="font-semibold text-fg block leading-tight">
                        {app.subject}
                      </span>
                      <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[11px] font-medium bg-neutral-100 text-fg-secondary">
                        {app.subjectSub}
                      </span>
                    </td>

                    {/* Education */}
                    <td className="py-3.5 px-3.5 text-fg-secondary">
                      <span className="font-medium block leading-snug">{app.education}</span>
                    </td>

                    {/* Submitted date */}
                    <td className="py-3.5 px-3.5 text-fg-secondary whitespace-nowrap font-mono text-[12px]">
                      {app.submittedAt
                        ? formatDateTime(app.submittedAt, 'DD/MM/YYYY HH:mm')
                        : '—'}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-3.5 text-center whitespace-nowrap">
                      <StateBadge status={app.status} domain="application" />
                    </td>

                    {/* Actions */}
                    <td
                      className="py-3.5 px-3.5 text-center whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onToggleRow(app)}
                          className="px-2.5 py-1 rounded-lg border border-brand-primary-200 bg-surface hover:bg-brand-primary-50 text-brand-primary-700 font-semibold text-[12px] transition-colors cursor-pointer"
                        >
                          Xem
                        </button>
                        <IconButton
                          label="Thao tác nhanh"
                          size="sm"
                          onClick={() => onToggleRow(app)}
                          icon={<Icon name="more_vert" size="sm" />}
                          className="w-7 h-7 text-fg-muted hover:text-fg hover:bg-neutral-100"
                        />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination bar */}
      <div className="p-3.5 sm:p-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-[13px] text-fg-secondary">
        <span>
          Hiển thị 1 - {rows.length} trong {totalFiltered} hồ sơ
        </span>

        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Trang trước"
            disabled={currentPage === 1}
            onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
            className="w-8 h-8 rounded-lg border border-border hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-fg-secondary transition-colors cursor-pointer"
          >
            <Icon name="chevron_left" size="xs" />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
            <button
              key={pg}
              type="button"
              aria-label={`Trang ${pg}`}
              aria-current={currentPage === pg ? 'page' : undefined}
              onClick={() => onPageChange(pg)}
              className={cn(
                'w-8 h-8 rounded-lg font-semibold text-xs transition-colors cursor-pointer',
                currentPage === pg
                  ? 'bg-brand-primary-600 text-white shadow-brand-sm'
                  : 'border border-border hover:bg-neutral-50 text-fg'
              )}
            >
              {pg}
            </button>
          ))}

          <button
            type="button"
            aria-label="Trang sau"
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
            className="w-8 h-8 rounded-lg border border-border hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-fg-secondary transition-colors cursor-pointer"
          >
            <Icon name="chevron_right" size="xs" />
          </button>
        </div>
      </div>
    </div>
  );
}

ApplicationTable.propTypes = {
  rows: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  selectedId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  checkedIds: PropTypes.array,
  totalFiltered: PropTypes.number,
  currentPage: PropTypes.number,
  totalPages: PropTypes.number,
  onToggleRow: PropTypes.func.isRequired,
  onToggleCheckbox: PropTypes.func.isRequired,
  onToggleSelectAll: PropTypes.func.isRequired,
  onPageChange: PropTypes.func.isRequired,
};
