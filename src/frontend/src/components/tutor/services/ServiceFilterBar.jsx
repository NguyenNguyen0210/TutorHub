import React from 'react';
import PropTypes from 'prop-types';
import Input, { Select, Field } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';

export const SERVICE_STATUS_OPTIONS = [
  { value: 'All', label: 'Tất cả trạng thái' },
  { value: 'Published', label: 'Đã xuất bản' },
  { value: 'Draft', label: 'Bản nháp' },
  { value: 'Paused', label: 'Tạm dừng' },
  { value: 'Unpublished', label: 'Đã gỡ xuất bản' },
];

/**
 * ServiceFilterBar — tìm kiếm + lọc môn học + lọc trạng thái + xóa bộ lọc.
 * Mobile xếp chồng full-width, nút "Bộ lọc" nằm dưới cùng full-width.
 */
export default function ServiceFilterBar({
  search,
  onSearchChange,
  subjects,
  subjectId,
  onSubjectIdChange,
  status,
  onStatusChange,
  onClear = undefined,
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_200px_200px_auto] gap-3 sm:items-end">
      <div className="relative">
        <span aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted pointer-events-none">
          <Icon name="search" size="sm" />
        </span>
        <Input
          type="search"
          placeholder="Tìm theo tên dịch vụ, môn học..."
          aria-label="Tìm kiếm gói dịch vụ"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      <Field label="Môn học" htmlFor="service-filter-subject">
        <Select
          id="service-filter-subject"
          value={subjectId}
          onChange={(e) => onSubjectIdChange(e.target.value)}
        >
          <option value="All">Tất cả môn học</option>
          {subjects.map((sub) => (
            <option key={sub.id} value={sub.id}>
              {sub.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Trạng thái" htmlFor="service-filter-status">
        <Select
          id="service-filter-status"
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
        >
          {SERVICE_STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      </Field>
      <Button
        variant="outline"
        onClick={onClear}
        icon={<Icon name="filter_list" size="sm" />}
        className="w-full sm:w-auto whitespace-nowrap"
        aria-label="Xóa bộ lọc tìm kiếm"
      >
        Xóa lọc
      </Button>
    </div>
  );
}

ServiceFilterBar.propTypes = {
  search: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  subjects: PropTypes.arrayOf(
    PropTypes.shape({ id: PropTypes.string, name: PropTypes.string })
  ).isRequired,
  subjectId: PropTypes.string.isRequired,
  onSubjectIdChange: PropTypes.func.isRequired,
  status: PropTypes.string.isRequired,
  onStatusChange: PropTypes.func.isRequired,
  onClear: PropTypes.func,
};

