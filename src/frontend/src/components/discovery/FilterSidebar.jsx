import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/cn';
import Icon from '@/components/ui/Icon';
import DualRangeSlider from '@/components/ui/DualRangeSlider';
import { formatVND } from '@/utils/formatters';

const DEGREE_OPTIONS = [
  { id: 'All', label: 'Tất cả học vị' },
  { id: 'Thạc sĩ', label: 'Thạc sĩ / Tiến sĩ', icon: 'school' },
  { id: 'Cử nhân', label: 'Cử nhân chính quy', icon: 'history_edu' },
  { id: 'Kỹ sư', label: 'Kỹ sư công nghệ', icon: 'code' },
  { id: 'Bác sĩ', label: 'Bác sĩ / Y khoa', icon: 'health_and_safety' },
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
  { label: 'Tất cả', min: 0, max: 5000000 },
  { label: 'Dưới 1 triệu', min: 0, max: 1000000 },
  { label: '1–2,5 triệu', min: 1000000, max: 2500000 },
  { label: '2,5–5 triệu', min: 2500000, max: 5000000 },
];

const RATING_OPTIONS = [
  { val: null, label: 'Tất cả đánh giá' },
  { val: 4.8, label: '4.8 trở lên' },
  { val: 4.5, label: '4.5 trở lên' },
  { val: 4.0, label: '4.0 trở lên' },
];

const EXPERIENCE_OPTIONS = [
  { id: 'All', label: 'Tất cả' },
  { id: '<1', label: 'Dưới 1 năm' },
  { id: '1-2', label: '1–2 năm' },
  { id: '3-5', label: '3–5 năm' },
  { id: '>=6', label: 'Từ 6 năm' },
];

export default function FilterSidebar({
  minPrice: propMinPrice,
  maxPrice: propMaxPrice,
  priceLimit = 5000000,
  priceRange, // Backwards compatibility for single max price prop
  onPriceChange,
  onPriceRangeChange, // Backwards compatibility callback
  degreeLevel = 'All',
  onDegreeLevelChange,
  university = 'All',
  onUniversityChange,
  certification = 'All',
  onCertificationChange,
  minRating,
  onMinRatingChange,
  experienceRange = 'All',
  onExperienceRangeChange,
  onResetFilters,
  className,
}) {
  // Normalize min/max prices
  const currentMinPrice = propMinPrice != null ? Number(propMinPrice) : 0;
  const currentMaxPrice =
    propMaxPrice != null
      ? Number(propMaxPrice)
      : priceRange != null
      ? Number(priceRange)
      : priceLimit;

  const [openSections, setOpenSections] = useState({
    price: true,
    rating: true,
    experience: true,
    degree: false,
    university: false,
    cert: false,
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

  const handleSliderChange = ([newMin, newMax]) => {
    if (onPriceChange) {
      onPriceChange({ min: newMin, max: newMax });
    } else if (onPriceRangeChange) {
      onPriceRangeChange(newMax);
    }
  };

  // Tính số lượng bộ lọc đang được kích hoạt
  const activeCount = useMemo(() => {
    let count = 0;
    if (currentMinPrice > 0 || currentMaxPrice < priceLimit) count += 1;
    if (minRating !== null && minRating !== undefined) count += 1;
    if (experienceRange && experienceRange !== 'All') count += 1;
    if (degreeLevel && degreeLevel !== 'All') count += 1;
    if (university && university !== 'All') count += 1;
    if (certification && certification !== 'All') count += 1;
    return count;
  }, [currentMinPrice, currentMaxPrice, priceLimit, minRating, experienceRange, degreeLevel, university, certification]);

  return (
    <aside className={cn('w-full', className)} aria-label="Bộ lọc gia sư đa chiều">
      <div className="filter-panel flex flex-col gap-4 rounded-brand-lg border border-border bg-surface p-4 sm:p-5 shadow-brand-sm">
        {/* Header: gọn gàng 1 dòng không bao giờ xuống hàng */}
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-brand-md bg-brand-primary-50 text-brand-primary-700">
              <Icon name="tune" size="xs" />
            </span>
            <span className="font-bold text-[15px] text-neutral-900">Bộ lọc</span>
            {activeCount > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-primary-600 px-1.5 text-[11px] font-bold text-white">
                {activeCount}
              </span>
            )}
          </div>
          {activeCount > 0 && (
            <button
              type="button"
              onClick={onResetFilters}
              className="text-[12.5px] font-semibold text-neutral-500 transition-colors hover:text-danger cursor-pointer py-1 px-1.5 rounded-md hover:bg-neutral-50"
            >
              Đặt lại
            </button>
          )}
        </div>

        {/* 1. Giá gói học (Dual-thumb Range Slider) */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => toggleSection('price')}
            aria-expanded={openSections.price}
            aria-controls="filter-section-price"
            className="flex w-full cursor-pointer items-center justify-between text-[13.5px] font-bold text-neutral-900 group"
          >
            <span className="flex items-center gap-1.5">
              <Icon
                name="payments"
                size="xs"
                className="text-neutral-400 transition-colors group-hover:text-brand-primary-600"
              />
              <span>Giá gói học</span>
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
              {/* Hiển thị giá min và max rõ ràng dạng 2 ô */}
              <div className="grid grid-cols-2 gap-2 text-left">
                <div className="rounded-brand-md border border-neutral-200/90 bg-neutral-50/70 p-2">
                  <span className="block text-[11px] font-medium text-neutral-500">Từ</span>
                  <span className="block font-mono text-[13px] font-bold text-neutral-900 truncate">
                    {formatVND(currentMinPrice)}
                  </span>
                </div>
                <div className="rounded-brand-md border border-neutral-200/90 bg-neutral-50/70 p-2">
                  <span className="block text-[11px] font-medium text-neutral-500">Đến</span>
                  <span className="block font-mono text-[13px] font-bold text-brand-primary-700 truncate">
                    {currentMaxPrice >= priceLimit ? '5.000.000 ₫' : formatVND(currentMaxPrice)}
                  </span>
                </div>
              </div>

              {/* Thanh trượt kéo 2 đầu */}
              <DualRangeSlider
                min={0}
                max={priceLimit}
                step={100000}
                value={[currentMinPrice, currentMaxPrice]}
                onChange={handleSliderChange}
                ariaLabelMin="Giá gói học tối thiểu"
                ariaLabelMax="Giá gói học tối đa"
              />

              {/* Nút Preset chọn khoảng giá nhanh: chỉ highlight khi khớp chính xác */}
              <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                {PRICE_PRESETS.map((p, idx) => {
                  const isExactMatch =
                    currentMinPrice === p.min &&
                    (p.max === priceLimit
                      ? currentMaxPrice >= priceLimit
                      : currentMaxPrice === p.max);

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSliderChange([p.min, p.max])}
                      className={cn(
                        'min-h-[36px] rounded-brand-md border px-2 py-1 text-[12px] transition-all font-medium text-center',
                        isExactMatch
                          ? 'border-brand-primary-600 bg-brand-primary-50 text-brand-primary-700 font-semibold shadow-xs'
                          : 'border-neutral-200 bg-surface text-neutral-600 hover:border-neutral-300 hover:text-neutral-900'
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

        {/* 2. Đánh giá (Rating) */}
        <div className="space-y-2.5 border-t border-neutral-100/80 pt-3">
          <button
            type="button"
            onClick={() => toggleSection('rating')}
            aria-expanded={openSections.rating}
            aria-controls="filter-section-rating"
            className="flex w-full cursor-pointer items-center justify-between text-[13.5px] font-bold text-neutral-900 group"
          >
            <span className="flex items-center gap-1.5">
              <Icon
                name="star"
                size="xs"
                className="text-neutral-400 transition-colors group-hover:text-brand-secondary-500"
              />
              <span>Đánh giá</span>
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
            <div id="filter-section-rating" className="space-y-1 pt-1 text-[13px]">
              {RATING_OPTIONS.map((item) => {
                const isSelected = minRating === item.val;
                return (
                  <label
                    key={item.val ?? 'all'}
                    className={cn(
                      'flex items-center gap-2.5 px-2.5 py-1.5 rounded-brand-md cursor-pointer select-none transition-colors text-[13px]',
                      isSelected
                        ? 'bg-brand-primary-50 text-brand-primary-700 font-semibold'
                        : 'text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900'
                    )}
                  >
                    <input
                      type="radio"
                      name="ratingFilter"
                      checked={isSelected}
                      onChange={() => onMinRatingChange?.(item.val)}
                      className="w-4 h-4 text-brand-primary-600 border-neutral-300 focus:ring-brand-primary-600 cursor-pointer"
                    />
                    <span className="flex items-center gap-1.5">
                      {item.val !== null && (
                        <Icon name="star" size="xs" filled className="text-brand-secondary-500 h-3.5 w-3.5" />
                      )}
                      <span>{item.val !== null ? `${item.val} trở lên` : 'Tất cả đánh giá'}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* 3. Kinh nghiệm giảng dạy (Experience) - Các khoảng ranh giới chuẩn xác */}
        <div className="space-y-2.5 border-t border-neutral-100/80 pt-3">
          <button
            type="button"
            onClick={() => toggleSection('experience')}
            aria-expanded={openSections.experience}
            aria-controls="filter-section-experience"
            className="flex w-full cursor-pointer items-center justify-between text-[13.5px] font-bold text-neutral-900 group"
          >
            <span className="flex items-center gap-1.5">
              <Icon
                name="work_history"
                size="xs"
                className="text-neutral-400 transition-colors group-hover:text-brand-primary-600"
              />
              <span>Kinh nghiệm giảng dạy</span>
            </span>
            <Icon
              name="expand_more"
              size="sm"
              className={cn(
                'text-neutral-400 transition-transform duration-200',
                openSections.experience ? 'rotate-180' : 'rotate-0'
              )}
            />
          </button>

          {openSections.experience && (
            <div id="filter-section-experience" className="space-y-1 pt-1 text-[13px]">
              {EXPERIENCE_OPTIONS.map((exp) => {
                const isSelected = experienceRange === exp.id;
                return (
                  <label
                    key={exp.id}
                    className={cn(
                      'flex items-center gap-2.5 px-2.5 py-1.5 rounded-brand-md cursor-pointer select-none transition-colors text-[13px]',
                      isSelected
                        ? 'bg-brand-primary-50 text-brand-primary-700 font-semibold'
                        : 'text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900'
                    )}
                  >
                    <input
                      type="radio"
                      name="experienceRange"
                      checked={isSelected}
                      onChange={() => onExperienceRangeChange?.(exp.id)}
                      className="w-4 h-4 text-brand-primary-600 border-neutral-300 focus:ring-brand-primary-600 cursor-pointer"
                    />
                    <span>{exp.label}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* 4. Bằng cấp & Học vị (Degree) */}
        <div className="space-y-2.5 border-t border-neutral-100/80 pt-3">
          <button
            type="button"
            onClick={() => toggleSection('degree')}
            aria-expanded={openSections.degree}
            aria-controls="filter-section-degree"
            className="flex w-full cursor-pointer items-center justify-between text-[13.5px] font-bold text-neutral-900 group"
          >
            <span className="flex items-center gap-1.5">
              <Icon
                name="school"
                size="xs"
                className="text-neutral-400 transition-colors group-hover:text-brand-primary-600"
              />
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
            <div id="filter-section-degree" className="space-y-1 pt-1 text-[13px]">
              {DEGREE_OPTIONS.map((item) => {
                const isSelected = degreeLevel === item.id;
                return (
                  <label
                    key={item.id}
                    className={cn(
                      'flex items-center justify-between px-2.5 py-1.5 rounded-brand-md cursor-pointer transition-all select-none text-[12.5px]',
                      isSelected
                        ? 'bg-brand-primary-50 text-brand-primary-700 font-semibold border border-brand-primary-200/80'
                        : 'text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 border border-transparent'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="degreeLevel"
                        checked={isSelected}
                        onChange={() => onDegreeLevelChange?.(item.id)}
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

        {/* 5. Trường đại học (University) */}
        <div className="space-y-2.5 border-t border-neutral-100/80 pt-3">
          <button
            type="button"
            onClick={() => toggleSection('university')}
            aria-expanded={openSections.university}
            aria-controls="filter-section-university"
            className="flex w-full cursor-pointer items-center justify-between text-[13.5px] font-bold text-neutral-900 group"
          >
            <span className="flex items-center gap-1.5">
              <Icon
                name="account_balance"
                size="xs"
                className="text-neutral-400 transition-colors group-hover:text-brand-primary-600"
              />
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
              {/* Ô tìm kiếm trường nhanh */}
              <div className="relative">
                <input
                  type="text"
                  aria-label="Lọc trường đại học"
                  placeholder="Tìm tên trường..."
                  value={uniSearch}
                  onChange={(e) => setUniSearch(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-[12px] bg-neutral-50 border border-neutral-200 rounded-brand-md focus:bg-surface focus:outline-none focus:ring-1 focus:ring-brand-primary-600"
                />
                {uniSearch && (
                  <button
                    type="button"
                    onClick={() => setUniSearch('')}
                    className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-600"
                    aria-label="Xóa từ khóa lọc trường đại học"
                  >
                    <Icon name="close" size="xs" className="w-3 h-3" />
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
                        'flex items-center gap-2 px-2.5 py-1.5 rounded-brand-md cursor-pointer select-none transition-colors text-[12.5px]',
                        isSelected
                          ? 'bg-brand-primary-50 text-brand-primary-700 font-semibold border border-brand-primary-200/80'
                          : 'text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 border border-transparent'
                      )}
                    >
                      <input
                        type="radio"
                        name="university"
                        checked={isSelected}
                        onChange={() => onUniversityChange?.(item.id)}
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

        {/* 6. Chứng chỉ nổi bật (Certifications) */}
        <div className="space-y-2.5 border-t border-neutral-100/80 pt-3">
          <button
            type="button"
            onClick={() => toggleSection('cert')}
            aria-expanded={openSections.cert}
            aria-controls="filter-section-cert"
            className="flex w-full cursor-pointer items-center justify-between text-[13.5px] font-bold text-neutral-900 group"
          >
            <span className="flex items-center gap-1.5">
              <Icon
                name="verified"
                size="xs"
                className="text-neutral-400 transition-colors group-hover:text-brand-primary-600"
              />
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
                      'flex items-center gap-2 px-2.5 py-1.5 rounded-brand-md cursor-pointer select-none transition-colors text-[12.5px]',
                      isSelected
                        ? 'bg-brand-primary-50 text-brand-primary-700 font-semibold border border-brand-primary-200/80'
                        : 'text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 border border-transparent'
                    )}
                  >
                    <input
                      type="radio"
                      name="certification"
                      checked={isSelected}
                      onChange={() => onCertificationChange?.(item.id)}
                      className="w-3.5 h-3.5 text-brand-primary-600 border-neutral-300 focus:ring-brand-primary-600 cursor-pointer"
                    />
                    <span>{item.label}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

FilterSidebar.propTypes = {
  minPrice: PropTypes.number,
  maxPrice: PropTypes.number,
  priceLimit: PropTypes.number,
  priceRange: PropTypes.number,
  onPriceChange: PropTypes.func,
  onPriceRangeChange: PropTypes.func,
  degreeLevel: PropTypes.string,
  onDegreeLevelChange: PropTypes.func,
  university: PropTypes.string,
  onUniversityChange: PropTypes.func,
  certification: PropTypes.string,
  onCertificationChange: PropTypes.func,
  minRating: PropTypes.number,
  onMinRatingChange: PropTypes.func,
  experienceRange: PropTypes.string,
  onExperienceRangeChange: PropTypes.func,
  onResetFilters: PropTypes.func,
  className: PropTypes.string,
};
