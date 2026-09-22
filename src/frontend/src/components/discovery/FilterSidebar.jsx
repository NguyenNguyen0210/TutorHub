import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/cn';
import Icon from '@/components/ui/Icon';
import Card from '@/components/ui/Card';
import { formatVND } from '@/utils/formatters';

export default function FilterSidebar({
  priceRange,
  onPriceRangeChange,
  maxPrice = 5000000,
  teachingMode,
  onTeachingModeChange,
  minRating,
  onMinRatingChange,
  experienceRange,
  onExperienceRangeChange,
  onResetFilters,
  className,
}) {
  const [openSections, setOpenSections] = useState({
    price: true,
    mode: true,
    rating: true,
    experience: true,
  });

  const toggleSection = (section) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const hasActiveFilters =
    priceRange < maxPrice ||
    teachingMode !== 'All' ||
    minRating !== null ||
    experienceRange !== 'All';

  return (
    <aside className={cn('w-full', className)} aria-label="Bộ lọc gia sư">
      <div className="p-5 space-y-5 border border-neutral-200/80 shadow-sm rounded-[20px] bg-white">
        {/* Filter Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-neutral-150">
          <div className="flex items-center gap-2 font-bold text-[15px] text-neutral-900">
            <Icon name="filter_list" size="sm" className="text-[#2563EB]" />
            <span>Bộ lọc tìm kiếm</span>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="text-[12px] font-semibold text-[#2563EB] hover:text-[#1D4ED8] transition-colors cursor-pointer"
            >
              Xóa tất cả
            </button>
          )}
        </div>

        {/* 1. Price Range Section */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => toggleSection('price')}
            className="w-full flex items-center justify-between text-[14px] font-bold text-neutral-900 group cursor-pointer"
          >
            <span>Khoảng học phí</span>
            <Icon
              name="expand_more"
              size="sm"
              className={cn(
                'text-neutral-400 transition-transform duration-200',
                openSections.price ? 'rotate-180' : 'rotate-0'
              )}
            />
          </button>

          {openSections.price && (
            <div className="space-y-2.5 pt-1">
              <div className="flex justify-between items-center text-[12.5px] font-semibold">
                <span className="text-neutral-400 font-mono">0đ</span>
                <span className="text-[#2563EB] font-bold font-mono text-[13px]">
                  {priceRange >= maxPrice ? 'Tất cả mức giá' : `Đến ${formatVND(priceRange)}`}
                </span>
                <span className="text-neutral-400 font-mono">5.000.000đ</span>
              </div>

              <input
                type="range"
                min="0"
                max={maxPrice}
                step="100000"
                value={priceRange}
                onChange={(e) => onPriceRangeChange(Number(e.target.value))}
                className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-[#2563EB]"
                aria-label="Khoảng học phí"
              />
            </div>
          )}
        </div>

        {/* 2. Teaching Mode Section */}
        <div className="space-y-3 pt-3 border-t border-border">
          <button
            type="button"
            onClick={() => toggleSection('mode')}
            className="w-full flex items-center justify-between text-body-reg font-bold text-neutral-900 group cursor-pointer"
          >
            <span>Hình thức học</span>
            <Icon
              name="chevron_right"
              size="sm"
              className={cn(
                'text-neutral-400 transition-transform duration-200',
                openSections.mode ? 'rotate-90' : 'rotate-0'
              )}
            />
          </button>

          {openSections.mode && (
            <div className="space-y-2 pt-1 text-body-reg">
              {[
                { id: 'All', label: 'Tất cả' },
                { id: 'Online', label: 'Online' },
                { id: 'InPerson', label: 'Tại nhà' },
                { id: 'Hybrid', label: 'Cả hai' },
              ].map((option) => (
                <label
                  key={option.id}
                  className="flex items-center gap-3 cursor-pointer select-none text-neutral-700 hover:text-neutral-900 py-1"
                >
                  <input
                    type="checkbox"
                    checked={teachingMode === option.id}
                    onChange={() => onTeachingModeChange(option.id)}
                    className="w-4 h-4 rounded border-neutral-300 text-brand-primary-600 focus:ring-brand-primary-500 cursor-pointer"
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* 3. Minimum Rating Section */}
        <div className="space-y-3 pt-3 border-t border-border">
          <button
            type="button"
            onClick={() => toggleSection('rating')}
            className="w-full flex items-center justify-between text-body-reg font-bold text-neutral-900 group cursor-pointer"
          >
            <span>Đánh giá tối thiểu</span>
            <Icon
              name="chevron_right"
              size="sm"
              className={cn(
                'text-neutral-400 transition-transform duration-200',
                openSections.rating ? 'rotate-90' : 'rotate-0'
              )}
            />
          </button>

          {openSections.rating && (
            <div className="space-y-2 pt-1 text-body-reg">
              {[
                { val: null, label: 'Tất cả' },
                { val: 4.5, label: '4.5 trở lên' },
                { val: 4.0, label: '4.0 trở lên' },
                { val: 3.5, label: '3.5 trở lên' },
              ].map((item) => (
                <label
                  key={item.val ?? 'all'}
                  className="flex items-center gap-3 cursor-pointer select-none text-neutral-700 hover:text-neutral-900 py-1"
                >
                  <input
                    type="checkbox"
                    checked={minRating === item.val}
                    onChange={() => onMinRatingChange(minRating === item.val ? null : item.val)}
                    className="w-4 h-4 rounded border-neutral-300 text-brand-primary-600 focus:ring-brand-primary-500 cursor-pointer"
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* 4. Experience Section */}
        <div className="space-y-3 pt-3 border-t border-border">
          <button
            type="button"
            onClick={() => toggleSection('experience')}
            className="w-full flex items-center justify-between text-body-reg font-bold text-neutral-900 group cursor-pointer"
          >
            <span>Kinh nghiệm giảng dạy</span>
            <Icon
              name="chevron_right"
              size="sm"
              className={cn(
                'text-neutral-400 transition-transform duration-200',
                openSections.experience ? 'rotate-90' : 'rotate-0'
              )}
            />
          </button>

          {openSections.experience && (
            <div className="space-y-2 pt-1 text-body-reg">
              {[
                { id: 'All', label: 'Tất cả' },
                { id: '<1', label: 'Dưới 1 năm' },
                { id: '1-3', label: '1 - 3 năm' },
                { id: '3-5', label: '3 - 5 năm' },
                { id: '>5', label: 'Trên 5 năm' },
              ].map((exp) => (
                <label
                  key={exp.id}
                  className="flex items-center gap-3 cursor-pointer select-none text-neutral-700 hover:text-neutral-900 py-1"
                >
                  <input
                    type="checkbox"
                    checked={experienceRange === exp.id}
                    onChange={() => onExperienceRangeChange(exp.id)}
                    className="w-4 h-4 rounded border-neutral-300 text-brand-primary-600 focus:ring-brand-primary-500 cursor-pointer"
                  />
                  <span>{exp.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

FilterSidebar.propTypes = {
  priceRange: PropTypes.number.isRequired,
  onPriceRangeChange: PropTypes.func.isRequired,
  maxPrice: PropTypes.number,
  teachingMode: PropTypes.string.isRequired,
  onTeachingModeChange: PropTypes.func.isRequired,
  minRating: PropTypes.number,
  onMinRatingChange: PropTypes.func.isRequired,
  experienceRange: PropTypes.string.isRequired,
  onExperienceRangeChange: PropTypes.func.isRequired,
  onResetFilters: PropTypes.func.isRequired,
  className: PropTypes.string,
};
