import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Icon from '@/components/ui/Icon';
import { formatVND } from '@/utils/formatters';

const TEACHING_MODES = [
  { value: 'All', label: 'Tất cả hình thức' },
  { value: 'Online', label: 'Online' },
  { value: 'InPerson', label: 'Tại nhà' },
  { value: 'Both', label: 'Online hoặc tại nhà' },
];

const RATING_OPTIONS = [
  { value: null, label: 'Tất cả đánh giá' },
  { value: 4.8, label: 'Từ 4.8★ trở lên' },
  { value: 4.5, label: 'Từ 4.5★ trở lên' },
  { value: 4.0, label: 'Từ 4.0★ trở lên' },
];

export default function ServiceFilterSidebar({
  categories = [],
  subjects = [],
  selectedCategoryId,
  onSelectCategory,
  selectedSubjectId,
  onSelectSubject,
  teachingMode,
  onTeachingModeChange,
  priceRange,
  onPriceRangeChange,
  maxPrice = 10000000,
  minRating,
  onMinRatingChange,
  className = '',
}) {
  const [openSections, setOpenSections] = useState({
    category: true,
    subject: true,
    mode: true,
    price: true,
    rating: true,
  });

  const toggleSection = (section) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Filter subjects belonging to selected category if any
  const availableSubjects = selectedCategoryId
    ? subjects.filter((s) => s.categoryId === selectedCategoryId)
    : subjects;

  return (
    <aside className={`w-full ${className}`} aria-label="Bộ lọc dịch vụ học tập">
      <div className="p-4 sm:p-5 space-y-4 border border-neutral-200/90 shadow-sm rounded-2xl bg-surface sticky top-[84px]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <div className="flex items-center gap-2 font-bold text-[14.5px] text-neutral-900">
            <Icon name="tune" size="sm" className="text-brand-primary-600" />
            <span>Bộ lọc tìm kiếm</span>
          </div>
        </div>

        {/* 1. Category Section (Danh mục dịch vụ) */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => toggleSection('category')}
            className="w-full flex items-center justify-between text-[13px] font-bold text-neutral-900 group cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Icon name="category" size="xs" className="text-neutral-400 group-hover:text-brand-primary-600 transition-colors" />
              <span>Danh mục dịch vụ</span>
            </span>
            <Icon
              name="expand_more"
              size="sm"
              className={`text-neutral-400 transition-transform duration-200 ${
                openSections.category ? 'rotate-180' : 'rotate-0'
              }`}
            />
          </button>

          {openSections.category && (
            <div className="pt-0.5 space-y-1">
              <label
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-[12.5px] font-medium transition-colors cursor-pointer ${
                  !selectedCategoryId ? 'bg-brand-primary-50 text-brand-primary-600 font-bold' : 'text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                <input
                  type="radio"
                  name="service-category"
                  checked={!selectedCategoryId}
                  onChange={() => {
                    onSelectCategory('');
                    onSelectSubject('');
                  }}
                  className="w-3.5 h-3.5 text-brand-primary-600 focus:ring-brand-primary-600 border-neutral-300 cursor-pointer"
                />
                <span>Tất cả danh mục</span>
              </label>

              {categories.map((cat) => (
                <label
                  key={cat.id}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-[12.5px] font-medium transition-colors cursor-pointer ${
                    selectedCategoryId === cat.id
                      ? 'bg-brand-primary-50 text-brand-primary-600 font-bold'
                      : 'text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="service-category"
                    checked={selectedCategoryId === cat.id}
                    onChange={() => {
                      onSelectCategory(cat.id);
                      onSelectSubject('');
                    }}
                    className="w-3.5 h-3.5 text-brand-primary-600 focus:ring-brand-primary-600 border-neutral-300 cursor-pointer"
                  />
                  <span className="line-clamp-1">{cat.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* 2. Subject Section (Môn học) */}
        {availableSubjects.length > 0 && (
          <div className="pt-3 border-t border-neutral-100 space-y-2">
            <button
              type="button"
              onClick={() => toggleSection('subject')}
              className="w-full flex items-center justify-between text-[13px] font-bold text-neutral-900 group cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <Icon name="menu_book" size="xs" className="text-neutral-400 group-hover:text-brand-primary-600 transition-colors" />
                <span>Môn học / Kỹ năng</span>
              </span>
              <Icon
                name="expand_more"
                size="sm"
                className={`text-neutral-400 transition-transform duration-200 ${
                  openSections.subject ? 'rotate-180' : 'rotate-0'
                }`}
              />
            </button>

            {openSections.subject && (
              <div className="pt-0.5 space-y-1 max-h-[220px] overflow-y-auto pr-0.5">
                <label
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-[12.5px] font-medium transition-colors cursor-pointer ${
                    !selectedSubjectId ? 'bg-brand-primary-50 text-brand-primary-600 font-bold' : 'text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="service-subject"
                    checked={!selectedSubjectId}
                    onChange={() => onSelectSubject('')}
                    className="w-3.5 h-3.5 text-brand-primary-600 focus:ring-brand-primary-600 border-neutral-300 cursor-pointer"
                  />
                  <span>Tất cả môn học</span>
                </label>

                {availableSubjects.map((sub) => (
                  <label
                    key={sub.id}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-[12.5px] font-medium transition-colors cursor-pointer ${
                      selectedSubjectId === sub.id
                        ? 'bg-brand-primary-50 text-brand-primary-600 font-bold'
                        : 'text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="service-subject"
                      checked={selectedSubjectId === sub.id}
                      onChange={() => onSelectSubject(sub.id)}
                      className="w-3.5 h-3.5 text-brand-primary-600 focus:ring-brand-primary-600 border-neutral-300 cursor-pointer"
                    />
                    <span className="line-clamp-1">{sub.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 3. Teaching Mode Section (Hình thức học) */}
        <div className="pt-3 border-t border-neutral-100 space-y-2">
          <button
            type="button"
            onClick={() => toggleSection('mode')}
            className="w-full flex items-center justify-between text-[13px] font-bold text-neutral-900 group cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Icon name="devices" size="xs" className="text-neutral-400 group-hover:text-brand-primary-600 transition-colors" />
              <span>Hình thức học</span>
            </span>
            <Icon
              name="expand_more"
              size="sm"
              className={`text-neutral-400 transition-transform duration-200 ${
                openSections.mode ? 'rotate-180' : 'rotate-0'
              }`}
            />
          </button>

          {openSections.mode && (
            <div className="pt-0.5 space-y-1">
              {TEACHING_MODES.map((m) => (
                <label
                  key={m.value}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-[12.5px] font-medium transition-colors cursor-pointer ${
                    teachingMode === m.value
                      ? 'bg-brand-primary-50 text-brand-primary-600 font-bold'
                      : 'text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="service-mode"
                    checked={teachingMode === m.value}
                    onChange={() => onTeachingModeChange(m.value)}
                    className="w-3.5 h-3.5 text-brand-primary-600 focus:ring-brand-primary-600 border-neutral-300 cursor-pointer"
                  />
                  <span>{m.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* 4. Price Range Section (Mức giá trọn gói) */}
        <div className="pt-3 border-t border-neutral-100 space-y-2.5">
          <button
            type="button"
            onClick={() => toggleSection('price')}
            className="w-full flex items-center justify-between text-[13px] font-bold text-neutral-900 group cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Icon name="payments" size="xs" className="text-neutral-400 group-hover:text-brand-primary-600 transition-colors" />
              <span>Khoảng giá</span>
            </span>
            <Icon
              name="expand_more"
              size="sm"
              className={`text-neutral-400 transition-transform duration-200 ${
                openSections.price ? 'rotate-180' : 'rotate-0'
              }`}
            />
          </button>

          {openSections.price && (
            <div className="pt-0.5 space-y-2.5">
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-neutral-500 font-medium">Học phí tối đa:</span>
                <span className="font-extrabold text-brand-primary-600">{formatVND(priceRange)}</span>
              </div>

              <input
                type="range"
                min="500000"
                max={maxPrice}
                step="500000"
                value={priceRange}
                onChange={(e) => onPriceRangeChange(Number(e.target.value))}
                className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-brand-primary-600"
                aria-label="Thanh kéo chọn mức giá học phí"
              />

              <div className="flex items-center justify-between text-[11px] text-neutral-400 font-semibold">
                <span>0 đ</span>
                <span>{formatVND(maxPrice)}</span>
              </div>
            </div>
          )}
        </div>

        {/* 5. Rating Section (Đánh giá gia sư) */}
        <div className="pt-3 border-t border-neutral-100 space-y-2">
          <button
            type="button"
            onClick={() => toggleSection('rating')}
            className="w-full flex items-center justify-between text-[13px] font-bold text-neutral-900 group cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Icon name="star" size="xs" className="text-neutral-400 group-hover:text-brand-primary-600 transition-colors" />
              <span>Đánh giá gia sư</span>
            </span>
            <Icon
              name="expand_more"
              size="sm"
              className={`text-neutral-400 transition-transform duration-200 ${
                openSections.rating ? 'rotate-180' : 'rotate-0'
              }`}
            />
          </button>

          {openSections.rating && (
            <div className="pt-0.5 space-y-1">
              {RATING_OPTIONS.map((opt) => (
                <label
                  key={String(opt.value)}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-[12.5px] font-medium transition-colors cursor-pointer ${
                    minRating === opt.value
                      ? 'bg-brand-primary-50 text-brand-primary-600 font-bold'
                      : 'text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="service-rating"
                    checked={minRating === opt.value}
                    onChange={() => onMinRatingChange(opt.value)}
                    className="w-3.5 h-3.5 text-brand-primary-600 focus:ring-brand-primary-600 border-neutral-300 cursor-pointer"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

ServiceFilterSidebar.propTypes = {
  categories: PropTypes.array,
  subjects: PropTypes.array,
  selectedCategoryId: PropTypes.string,
  onSelectCategory: PropTypes.func.isRequired,
  selectedSubjectId: PropTypes.string,
  onSelectSubject: PropTypes.func.isRequired,
  teachingMode: PropTypes.string.isRequired,
  onTeachingModeChange: PropTypes.func.isRequired,
  priceRange: PropTypes.number.isRequired,
  onPriceRangeChange: PropTypes.func.isRequired,
  maxPrice: PropTypes.number,
  minRating: PropTypes.number,
  onMinRatingChange: PropTypes.func.isRequired,
  className: PropTypes.string,
};
