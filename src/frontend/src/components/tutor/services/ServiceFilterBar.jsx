import React from 'react';
import PropTypes from 'prop-types';
import Input, { Select } from '@/components/ui/Input';
import Icon from '@/components/ui/Icon';

export const SERVICE_STATUS_OPTIONS = [
  { value: 'All', label: 'Tất cả trạng thái' },
  { value: 'Published', label: 'Đã xuất bản' },
  { value: 'Draft', label: 'Bản nháp' },
  { value: 'Unpublished', label: 'Đã ẩn' },
];

/**
 * ServiceFilterBar — tìm kiếm + lọc môn học + lọc trạng thái.
 * Mobile xếp chồng full-width.
 */
export default function ServiceFilterBar({
  search,
  onSearchChange,
  subjects,
  subjectId,
  onSubjectIdChange,
  status,
  onStatusChange,
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_200px_200px] gap-3">
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
      <Select
        aria-label="Lọc theo môn học"
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
      <Select
        aria-label="Lọc theo trạng thái"
        value={status}
        onChange={(e) => onStatusChange(e.target.value)}
      >
        {SERVICE_STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Select>
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
};
