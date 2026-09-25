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

const CITY_OPTIONS = [
  { id: 'All', label: 'Tất cả khu vực' },
  { id: 'Hà Nội', label: 'Hà Nội' },
  { id: 'Hồ Chí Minh', label: 'TP. Hồ Chí Minh' },
  { id: 'Đà Nẵng', label: 'Đà Nẵng' },
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
  teachingMode,
  onTeachingModeChange,
  city = 'All',
  onCityChange,
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
    degree: true,
    university: true,
    cert: false,
    price: true,
    mode: true,
    rating: false,
    experience: false,
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

  const showLocationFilter = teachingMode === 'InPerson' || teachingMode === 'Both' || teachingMode === 'Hybrid';

  return (
    <aside className={cn('w-full', className)} aria-label="Bộ lọc gia sư đa chiều">
      <div className="p-5 space-y-4 border border-neutral-200/80 shadow-sm rounded-[20px] bg-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-neutral-100">
          <div className="flex items-center gap-2 font-bold text-[15px] text-neutral-900">
            <Icon name="tune" size="sm" className="text-[#2563EB]" />
            <span>Bộ lọc tìm kiếm</span>
          </div>
        </div>

        {/* 1. Degree Level Section (Học vị & Bằng cấp) */}
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={() => toggleSection('degree')}
            className="w-full flex items-center justify-between text-[13.5px] font-bold text-neutral-900 group cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Icon name="school" size="xs" className="text-neutral-400 group-hover:text-[#2563EB] transition-colors" />
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
            <div className="space-y-1.5 pt-1 text-[13px]">
              {DEGREE_OPTIONS.map((item) => {
                const isSelected = degreeLevel === item.id;
                return (
                  <label
                    key={item.id}
                    className={cn(
                      'flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition-all select-none',
                      isSelected
                        ? 'bg-blue-50/80 text-[#2563EB] font-semibold'
                        : 'text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900'
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="degreeLevel"
                        checked={isSelected}
                        onChange={() => onDegreeLevelChange && onDegreeLevelChange(item.id)}
                        className="w-3.5 h-3.5 text-[#2563EB] border-neutral-300 focus:ring-[#2563EB] cursor-pointer"
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
        <div className="space-y-2.5 pt-3 border-t border-neutral-100">
          <button
            type="button"
            onClick={() => toggleSection('university')}
            className="w-full flex items-center justify-between text-[13.5px] font-bold text-neutral-900 group cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Icon name="account_balance" size="xs" className="text-neutral-400 group-hover:text-[#2563EB] transition-colors" />
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
            <div className="space-y-2 pt-1 text-[13px]">
              {/* Quick search university */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Lọc trường..."
                  value={uniSearch}
                  onChange={(e) => setUniSearch(e.target.value)}
                  className="w-full px-2.5 py-1 text-[12px] bg-neutral-50 border border-neutral-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                />
                {uniSearch && (
                  <button
                    type="button"
                    onClick={() => setUniSearch('')}
                    className="absolute right-2 top-1.5 text-neutral-400 hover:text-neutral-600 text-[11px]"
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
                          ? 'bg-blue-50 text-[#2563EB] font-semibold'
                          : 'text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900'
                      )}
                    >
                      <input
                        type="radio"
                        name="university"
                        checked={isSelected}
                        onChange={() => onUniversityChange && onUniversityChange(item.id)}
                        className="w-3.5 h-3.5 text-[#2563EB] border-neutral-300 focus:ring-[#2563EB] cursor-pointer"
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
        <div className="space-y-2.5 pt-3 border-t border-neutral-100">
          <button
            type="button"
            onClick={() => toggleSection('cert')}
            className="w-full flex items-center justify-between text-[13.5px] font-bold text-neutral-900 group cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Icon name="verified" size="xs" className="text-neutral-400 group-hover:text-[#2563EB] transition-colors" />
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
            <div className="space-y-1 pt-1 text-[13px]">
              {CERTIFICATION_OPTIONS.map((item) => {
                const isSelected = certification === item.id;
                return (
                  <label
                    key={item.id}
                    className={cn(
                      'flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer select-none transition-colors text-[12.5px]',
                      isSelected
                        ? 'bg-blue-50 text-[#2563EB] font-semibold'
                        : 'text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900'
                    )}
                  >
                    <input
                      type="radio"
                      name="certification"
                      checked={isSelected}
                      onChange={() => onCertificationChange && onCertificationChange(item.id)}
                      className="w-3.5 h-3.5 text-[#2563EB] border-neutral-300 focus:ring-[#2563EB] cursor-pointer"
                    />
                    <span>{item.label}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* 4. Teaching Mode & Location */}
        <div className="space-y-2.5 pt-3 border-t border-neutral-100">
          <button
            type="button"
            onClick={() => toggleSection('mode')}
            className="w-full flex items-center justify-between text-[13.5px] font-bold text-neutral-900 group cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Icon name="home_work" size="xs" className="text-neutral-400 group-hover:text-[#2563EB] transition-colors" />
              <span>Hình thức & Địa bàn</span>
            </span>
            <Icon
              name="expand_more"
              size="sm"
              className={cn(
                'text-neutral-400 transition-transform duration-200',
                openSections.mode ? 'rotate-180' : 'rotate-0'
              )}
            />
          </button>

          {openSections.mode && (
            <div className="space-y-2 pt-1 text-[13px]">
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'All', label: 'Tất cả' },
                  { id: 'Online', label: 'Online' },
                  { id: 'InPerson', label: 'Tại nhà' },
                  { id: 'Both', label: 'Cả hai' },
                ].map((option) => {
                  const isSelected = teachingMode === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => onTeachingModeChange(option.id)}
                      className={cn(
                        'py-1.5 px-2 rounded-lg text-[12px] font-medium border text-center transition-all cursor-pointer',
                        isSelected
                          ? 'border-[#2563EB] bg-blue-50 text-[#2563EB] font-semibold shadow-xs'
                          : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300'
                      )}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>

              {/* Cascading Location Filter when InPerson or Both selected */}
              {showLocationFilter && (
                <div className="pt-2 space-y-1.5 animate-fadeIn">
                  <label className="text-[11.5px] font-semibold text-neutral-500 uppercase tracking-wide">
                    Tỉnh / Thành phố:
                  </label>
                  <select
                    value={city}
                    onChange={(e) => onCityChange && onCityChange(e.target.value)}
                    className="w-full text-[12.5px] px-2.5 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2563EB] cursor-pointer"
                  >
                    {CITY_OPTIONS.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 5. Price Range & Presets */}
        <div className="space-y-2.5 pt-3 border-t border-neutral-100">
          <button
            type="button"
            onClick={() => toggleSection('price')}
            className="w-full flex items-center justify-between text-[13.5px] font-bold text-neutral-900 group cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Icon name="payments" size="xs" className="text-neutral-400 group-hover:text-[#2563EB] transition-colors" />
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
            <div className="space-y-3 pt-1">
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
                        'text-[11px] px-2 py-1 rounded-md border transition-colors cursor-pointer',
                        isActive
                          ? 'border-[#2563EB] bg-blue-50 text-[#2563EB] font-semibold'
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
        <div className="space-y-2.5 pt-3 border-t border-neutral-100">
          <button
            type="button"
            onClick={() => toggleSection('rating')}
            className="w-full flex items-center justify-between text-[13.5px] font-bold text-neutral-900 group cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Icon name="star" size="xs" className="text-neutral-400 group-hover:text-amber-500 transition-colors" />
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
            <div className="space-y-3 pt-1 text-[13px]">
              <div>
                <p className="text-[11.5px] font-semibold text-neutral-500 uppercase tracking-wide mb-1.5">
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
                          ? 'bg-amber-50 text-amber-900 font-semibold'
                          : 'text-neutral-700 hover:bg-neutral-50'
                      )}
                    >
                      <input
                        type="radio"
                        name="ratingFilter"
                        checked={minRating === item.val}
                        onChange={() => onMinRatingChange(item.val)}
                        className="w-3.5 h-3.5 text-amber-500 border-neutral-300 focus:ring-amber-500 cursor-pointer"
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-100">
                <p className="text-[11.5px] font-semibold text-neutral-500 uppercase tracking-wide mb-1.5">
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
                        'text-[11.5px] py-1 px-2 rounded-md border text-center transition-colors cursor-pointer',
                        experienceRange === exp.id
                          ? 'border-[#2563EB] bg-blue-50 text-[#2563EB] font-semibold'
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
  teachingMode: PropTypes.string.isRequired,
  onTeachingModeChange: PropTypes.func.isRequired,
  city: PropTypes.string,
  onCityChange: PropTypes.func,
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
