import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/cn';
import Icon from '@/components/ui/Icon';
import { formatVND } from '@/utils/formatters';

const DEGREE_OPTIONS = [
  { id: 'All', label: 'Tất cả học vị' },
  { id: 'Thạc sĩ', label: 'Thạc sĩ / Tiến sĩ', icon: 'school' },
  { id: 'Cử nhân', label: 'Cử nhân chính quy', icon: 'history_edu' },
  { id: 'Kỹ sư', label: 'Kỹ sư công nghệ', icon: 'code' },
  { id: 'Bác sĩ', label: 'Bác sĩ / Y khoa', icon: 'medical_services' },
  { id: 'Sinh viên', label: 'Sinh viên giỏi', icon: 'person' },
];

const UNIVERSITY_OPTIONS = [
  { id: 'All', label: 'Tất cả trường' },
  { id: 'ĐH Sư Phạm', label: 'ĐH Sư Phạm (HN / TP.HCM)' },
  { id: 'ĐH Bách Khoa', label: 'ĐH Bách Khoa (HN / TP.HCM)' },
  { id: 'ĐH Ngoại Thương', label: 'ĐH Ngoại Thương' },
  { id: 'ĐH Khoa học Tự nhiên', label: 'ĐH Khoa học Tự nhiên' },
  { id: 'ĐH Kinh tế', label: 'ĐH Kinh tế (NEU / UEH)' },
  { id: 'ĐH Y', label: 'ĐH Y Hà Nội / TP.HCM' },
  { id: 'ĐH Quốc tế', label: 'ĐH Quốc tế (RMIT / Úc)' },
];

const CERTIFICATION_OPTIONS = [
  { id: 'All', label: 'Tất cả chứng chỉ' },
  { id: 'IELTS', label: 'IELTS 7.5 - 8.5+' },
  { id: 'JLPT', label: 'JLPT N1 / N2' },
  { id: 'Chứng chỉ Sư phạm', label: 'Nghiệp vụ Sư phạm' },
  { id: 'CELTA', label: 'CELTA / TESOL' },
  { id: 'Kiện tướng', label: 'Kiện tướng Cờ vua QG' },
];

const PRICE_PRESETS = [
  { label: 'Tất cả', max: 5000000 },
  { label: '< 1 triệu', max: 1000000 },
  { label: '1 - 2.5 triệu', max: 2500000 },
  { label: 'Đến 5 triệu', max: 5000000 },
];

export default function FilterSidebar({
  priceRange,
  onPriceRangeChange,
  maxPrice = 5000000,
  degreeLevel = 'All',
  onDegreeLevelChange,
  university = 'All',
  onUniversityChange,
  certification = 'All',
  onCertificationChange,
  minRating,
  onMinRatingChange,
  experienceRange,
  onExperienceRangeChange,
  onResetFilters,
  className,
}) {
  const [openSections, setOpenSections] = useState({
    degree: false,
    university: false,
    cert: false,
    price: true,
    rating: false,
  });

  const [uniSearch, setUniSearch] = useState('');

  const toggleSection = (section) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const filteredUniversities = useMemo(() => {
    if (!uniSearch.trim()) return UNIVERSITY_OPTIONS;
    const term = uniSearch.toLowerCase().trim();
    return UNIVERSITY_OPTIONS.filter((u) => u.label.toLowerCase().includes(term));
  }, [uniSearch]);

  return (
    <aside className={cn('w-full', className)} aria-label="Bộ lọc gia sư đa chiều">
      <div className="filter-panel flex flex-col gap-4 rounded-brand-lg border border-border bg-surface p-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3.5">
          <div className="flex items-center gap-2 font-bold text-[15px] text-neutral-900">
            <Icon name="tune" size="sm" className="text-brand-primary-600" />
            <span>Bộ lọc tìm kiếm</span>
          </div>
          <button
            type="button"
            onClick={onResetFilters}
            className="min-h-11 rounded-brand-md px-2 text-[13px] font-semibold text-brand-primary-700 hover:bg-brand-primary-50"
          >
            Xóa tất cả
          </button>
        </div>

        {/* Thông tin bổ sung: đặt sau các nhu cầu tìm kiếm chính. */}
        <div className="order-5 space-y-2.5 border-t border-neutral-100 pt-3">
          <button
            type="button"
            onClick={() => toggleSection('degree')}
            aria-expanded={openSections.degree}
            aria-controls="filter-section-degree"
            className="w-full flex items-center justify-between text-[13.5px] font-bold text-neutral-900 group cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Icon name="school" size="xs" className="text-neutral-400 group-hover:text-brand-primary-600 transition-colors" />
              <span>Bằng cấp & Học vị</span>
            </span>
            <Icon
              name="expand_more"
              size="sm"
              className={cn(
                'text-neutral-400 transition-transform duration-200',
                openSections.degree ? 'rotate-180' : 'rotate-0'
              )}
            />
          </button>

          {openSections.degree && (
            <div id="filter-section-degree" className="space-y-1.5 pt-1 text-[13px]">
              {DEGREE_OPTIONS.map((item) => {
                const isSelected = degreeLevel === item.id;
                return (
                  <label
                    key={item.id}
                    htmlFor={`degree-${item.id}`}
                    className={cn(
                      'flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition-all select-none',
                      isSelected
                        ? 'bg-brand-primary-50/80 text-brand-primary-600 font-semibold'
                        : 'text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900'
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        id={`degree-${item.id}`}
                        name="degreeLevel"
                        checked={isSelected}
                        onChange={() => onDegreeLevelChange && onDegreeLevelChange(item.id)}
                        className="w-3.5 h-3.5 text-brand-primary-600 border-neutral-300 focus:ring-brand-primary-600 cursor-pointer"
                      />
                      <span>{item.label}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* 2. University Section (Trường đại học đào tạo) */}
        <div className="order-6 space-y-2.5 border-t border-neutral-100 pt-3">
          <button
            type="button"
            onClick={() => toggleSection('university')}
            aria-expanded={openSections.university}
            aria-controls="filter-section-university"
            className="w-full flex items-center justify-between text-[13.5px] font-bold text-neutral-900 group cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Icon name="account_balance" size="xs" className="text-neutral-400 group-hover:text-brand-primary-600 transition-colors" />
              <span>Trường đại học</span>
            </span>
            <Icon
              name="expand_more"
              size="sm"
              className={cn(
                'text-neutral-400 transition-transform duration-200',
                openSections.university ? 'rotate-180' : 'rotate-0'
              )}
            />
          </button>

          {openSections.university && (
            <div id="filter-section-university" className="space-y-2 pt-1 text-[13px]">
              {/* Quick search university */}
              <div className="relative">
                <input
                  type="text"
                  aria-label="Lọc trường đại học"
                  placeholder="Lọc trường..."
                  value={uniSearch}
                  onChange={(e) => setUniSearch(e.target.value)}
                  className="w-full px-2.5 py-1 text-[12px] bg-neutral-50 border border-neutral-200 rounded-md focus:bg-surface focus:outline-none focus:ring-1 focus:ring-brand-primary-600"
                />
                {uniSearch && (
                  <button
                    type="button"
                    onClick={() => setUniSearch('')}
                    className="absolute right-0 top-1/2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-brand-md text-neutral-400 hover:text-neutral-600"
                    aria-label="Xóa từ khóa lọc trường đại học"
                  >
                    ×
                  </button>
                )}
              </div>

              <div className="space-y-1 max-h-[170px] overflow-y-auto pr-1">
                {filteredUniversities.map((item) => {
                  const isSelected = university === item.id;
                  return (
                    <label
                      key={item.id}
                      className={cn(
                        'flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer select-none transition-colors text-[12.5px]',
                        isSelected
                          ? 'bg-brand-primary-50 text-brand-primary-600 font-semibold'
                          : 'text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900'
                      )}
                    >
                      <input
                        type="radio"
                        name="university"
                        checked={isSelected}
                        onChange={() => onUniversityChange && onUniversityChange(item.id)}
                        className="w-3.5 h-3.5 text-brand-primary-600 border-neutral-300 focus:ring-brand-primary-600 cursor-pointer"
                      />
                      <span className="truncate">{item.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 3. Certifications Section (Chứng chỉ chuyên môn) */}
        <div className="order-7 space-y-2.5 border-t border-neutral-100 pt-3">
          <button
            type="button"
            onClick={() => toggleSection('cert')}
            aria-expanded={openSections.cert}
            aria-controls="filter-section-cert"
            className="w-full flex items-center justify-between text-[13.5px] font-bold text-neutral-900 group cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Icon name="verified" size="xs" className="text-neutral-400 group-hover:text-brand-primary-600 transition-colors" />
              <span>Chứng chỉ nổi bật</span>
            </span>
            <Icon
              name="expand_more"
              size="sm"
              className={cn(
                'text-neutral-400 transition-transform duration-200',
                openSections.cert ? 'rotate-180' : 'rotate-0'
              )}
            />
          </button>

          {openSections.cert && (
            <div id="filter-section-cert" className="space-y-1 pt-1 text-[13px]">
              {CERTIFICATION_OPTIONS.map((item) => {
                const isSelected = certification === item.id;
                return (
                  <label
                    key={item.id}
                    className={cn(
                      'flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer select-none transition-colors text-[12.5px]',
                      isSelected
                        ? 'bg-brand-primary-50 text-brand-primary-600 font-semibold'
                        : 'text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900'
                    )}
                  >
                    <input
                      type="radio"
                      name="certification"
                      checked={isSelected}
                      onChange={() => onCertificationChange && onCertificationChange(item.id)}
                      className="w-3.5 h-3.5 text-brand-primary-600 border-neutral-300 focus:ring-brand-primary-600 cursor-pointer"
                    />
                    <span>{item.label}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* 5. Price Range & Presets */}
        <div className="order-1 space-y-2.5 border-t border-neutral-100 pt-3">
          <button
            type="button"
            onClick={() => toggleSection('price')}
            aria-expanded={openSections.price}
            aria-controls="filter-section-price"
            className="w-full flex items-center justify-between text-[13.5px] font-bold text-neutral-900 group cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Icon name="payments" size="xs" className="text-neutral-400 group-hover:text-brand-primary-600 transition-colors" />
              <span>Khoảng học phí</span>
            </span>
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
            <div id="filter-section-price" className="space-y-3 pt-1">
              <div className="flex justify-between items-center text-[12.5px] font-semibold">
                <span className="text-neutral-400 font-mono">0đ</span>
                <span className="text-brand-primary-600 font-bold font-mono text-[13px]">
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
                className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-brand-primary-600"
                aria-label="Khoảng học phí"
              />

              {/* Price Presets */}
              <div className="flex flex-wrap gap-1 pt-0.5">
                {PRICE_PRESETS.map((p, idx) => {
                  const isActive = priceRange === p.max;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => onPriceRangeChange(p.max)}
                      className={cn(
                    'min-h-11 rounded-md border px-2 py-1 text-[12px] transition-colors',
                        isActive
                          ? 'border-brand-primary-600 bg-brand-primary-50 text-brand-primary-600 font-semibold'
                          : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
                      )}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 6. Minimum Rating & Experience */}
        <div className="order-3 space-y-2.5 border-t border-neutral-100 pt-3">
          <button
            type="button"
            onClick={() => toggleSection('rating')}
            aria-expanded={openSections.rating}
            aria-controls="filter-section-rating"
            className="w-full flex items-center justify-between text-[13.5px] font-bold text-neutral-900 group cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Icon name="star" size="xs" className="text-neutral-400 group-hover:text-brand-secondary-500 transition-colors" />
              <span>Đánh giá & Kinh nghiệm</span>
            </span>
            <Icon
              name="expand_more"
              size="sm"
              className={cn(
                'text-neutral-400 transition-transform duration-200',
                openSections.rating ? 'rotate-180' : 'rotate-0'
              )}
            />
          </button>

          {openSections.rating && (
            <div id="filter-section-rating" className="space-y-3 pt-1 text-[13px]">
              <div>
                <p className="mb-1.5 text-[12px] font-semibold text-neutral-600">
                  Đánh giá sao:
                </p>
                <div className="space-y-1">
                  {[
                    { val: null, label: 'Tất cả đánh giá' },
                    { val: 4.8, label: '★ 4.8 trở lên (Xuất sắc)' },
                    { val: 4.5, label: '★ 4.5 trở lên (Rất tốt)' },
                    { val: 4.0, label: '★ 4.0 trở lên' },
                  ].map((item) => (
                    <label
                      key={item.val ?? 'all'}
                      className={cn(
                        'flex items-center gap-2 px-2 py-1 rounded-md cursor-pointer select-none text-[12.5px] transition-colors',
                        minRating === item.val
                          ? 'bg-brand-secondary-50 text-brand-secondary-700 font-semibold'
                          : 'text-neutral-700 hover:bg-neutral-50'
                      )}
                    >
                      <input
                        type="radio"
                        name="ratingFilter"
                        checked={minRating === item.val}
                        onChange={() => onMinRatingChange(item.val)}
                        className="w-3.5 h-3.5 text-brand-secondary-500 border-neutral-300 focus:ring-brand-secondary-500 cursor-pointer"
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-100">
                <p className="mb-1.5 text-[12px] font-semibold text-neutral-600">
                  Số năm kinh nghiệm:
                </p>
                <div className="grid grid-cols-2 gap-1">
                  {[
                    { id: 'All', label: 'Tất cả' },
                    { id: '<1', label: '< 1 năm' },
                    { id: '1-3', label: '1 - 3 năm' },
                    { id: '3-5', label: '3 - 5 năm' },
                    { id: '>5', label: '> 5 năm' },
                  ].map((exp) => (
                    <button
                      key={exp.id}
                      type="button"
                      onClick={() => onExperienceRangeChange(exp.id)}
                      className={cn(
                        'min-h-11 rounded-md border px-2 py-1 text-center text-[12px] transition-colors',
                        experienceRange === exp.id
                          ? 'border-brand-primary-600 bg-brand-primary-50 text-brand-primary-600 font-semibold'
                          : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
                      )}
                    >
                      {exp.label}
                    </button>
                  ))}
                </div>
              </div>
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
  degreeLevel: PropTypes.string,
  onDegreeLevelChange: PropTypes.func,
  university: PropTypes.string,
  onUniversityChange: PropTypes.func,
  certification: PropTypes.string,
  onCertificationChange: PropTypes.func,
  minRating: PropTypes.number,
  onMinRatingChange: PropTypes.func.isRequired,
  experienceRange: PropTypes.string.isRequired,
  onExperienceRangeChange: PropTypes.func.isRequired,
  onResetFilters: PropTypes.func,
  className: PropTypes.string,
};
