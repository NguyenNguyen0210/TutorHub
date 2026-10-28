import React from 'react';
import PropTypes from 'prop-types';
import Input, { Select, Field } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';

/**
 * ServiceFilterBar — tìm kiếm + lọc môn học + xóa bộ lọc.
 * Trạng thái dùng Tabs làm nguồn duy nhất để tránh hai filter mâu thuẫn.
 */
export default function ServiceFilterBar({
  search,
  onSearchChange,
  subjects,
  subjectId,
  onSubjectIdChange,
  onClear = undefined,
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_220px_auto] gap-3 sm:items-end">
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
      <Button
        variant="outline"
        onClick={onClear}
        disabled={!search && subjectId === 'All'}
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
  onClear: PropTypes.func,
};

