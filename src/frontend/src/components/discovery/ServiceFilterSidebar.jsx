import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Icon from '@/components/ui/Icon';
import PriceRangeFilter from '@/components/discovery/PriceRangeFilter';

const PRICE_STEP = 100000;

const RATING_OPTIONS = [
  { value: null, label: 'Tất cả đánh giá' },
  { value: 4.8, label: 'Từ 4.8 sao trở lên' },
  { value: 4.5, label: 'Từ 4.5 sao trở lên' },
  { value: 4.0, label: 'Từ 4.0 sao trở lên' },
];

const buildPricePresets = (limit) => [
  { label: 'Tất cả', min: 0, max: limit },
  { label: 'Dưới 1 triệu', min: 0, max: 1000000 },
  { label: '1 – 2 triệu', min: 1000000, max: 2000000 },
  { label: 'Trên 2 triệu', min: 2000000, max: limit },
];

export default function ServiceFilterSidebar({
  categories = [],
  subjects = [],
  selectedCategoryId,
  onSelectCategory,
  selectedSubjectId,
  onSelectSubject,
  minPrice = 0,
  maxPrice = 10000000,
  priceLimit = 10000000,
  onPriceChange,
  minRating,
  onMinRatingChange,
  activeCount = 0,
  onReset,
  sticky = true,
  className = '',
}) {
  const [openSections, setOpenSections] = useState({ category: true, subject: true, price: true, rating: false });
  const availableSubjects = selectedCategoryId
    ? subjects.filter((subject) => subject.categoryId === selectedCategoryId)
    : subjects;
  const toggle = (section) => setOpenSections((current) => ({ ...current, [section]: !current[section] }));
  const handlePriceChange = (val) => {
    if (!onPriceChange) return;
    if (Array.isArray(val)) {
      onPriceChange({ min: val[0], max: val[1] });
    } else {
      onPriceChange(val);
    }
  };

  return (
    <aside className={`w-full ${className}`} aria-label="Bộ lọc gói học">
      <div className={`filter-panel overflow-hidden rounded-[20px] border border-[color:var(--mkt-line)] bg-white shadow-[0_14px_38px_-22px_rgba(15,23,42,0.25)] ${sticky ? 'sticky top-[88px]' : ''}`}>
        <div className="border-b border-blue-100 bg-blue-50/80 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-base font-bold text-slate-950">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
                  <Icon name="tune" size="sm" />
                </span>
                Bộ lọc gói học
                {activeCount > 0 && (
                  <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-blue-600 px-2 py-0.5 text-xs font-bold text-white" aria-label={`${activeCount} bộ lọc đang áp dụng`}>
                    {activeCount}
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm leading-5 text-slate-600">Thu hẹp kết quả theo nhu cầu học.</p>
            </div>
            {onReset && (
              <button
                type="button"
                onClick={onReset}
                disabled={activeCount === 0}
                className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 ${
                  activeCount === 0 ? 'invisible pointer-events-none' : ''
                }`}
                aria-label="Đặt lại bộ lọc"
                title="Đặt lại bộ lọc"
              >
                <Icon name="refresh" size="sm" />
              </button>
            )}
          </div>
        </div>

        <FilterSection title="Danh mục gói học" icon="category" section="category" open={openSections.category} onToggle={toggle}>
          <RadioOption
            name="service-category"
            checked={!selectedCategoryId}
            onChange={() => { onSelectCategory(''); onSelectSubject(''); }}
            label="Tất cả danh mục"
          />
          {categories.map((category) => (
            <RadioOption
              key={category.id}
              name="service-category"
              checked={selectedCategoryId === category.id}
              onChange={() => { onSelectCategory(category.id); onSelectSubject(''); }}
              label={category.name}
            />
          ))}
        </FilterSection>

        {availableSubjects.length > 0 && (
          <FilterSection title="Môn học / Kỹ năng" icon="menu_book" section="subject" open={openSections.subject} onToggle={toggle}>
            <div className="max-h-[240px] space-y-1 overflow-y-auto pr-1">
              <RadioOption name="service-subject" checked={!selectedSubjectId} onChange={() => onSelectSubject('')} label="Tất cả môn học" />
              {availableSubjects.map((subject) => (
                <RadioOption
                  key={subject.id}
                  name="service-subject"
                  checked={selectedSubjectId === subject.id}
                  onChange={() => onSelectSubject(subject.id)}
                  label={subject.name}
                />
              ))}
            </div>
          </FilterSection>
        )}

        <FilterSection title="Học phí trọn gói" icon="payments" section="price" open={openSections.price} onToggle={toggle}>
          <div>
            <PriceRangeFilter
              min={minPrice}
              max={maxPrice}
              limit={priceLimit}
              step={PRICE_STEP}
              presets={buildPricePresets(priceLimit)}
              onChange={handlePriceChange}
              ariaLabelMin="Giá dịch vụ tối thiểu"
              ariaLabelMax="Giá dịch vụ tối đa"
              ariaLabelMinInput="Nhập giá dịch vụ tối thiểu"
              ariaLabelMaxInput="Nhập giá dịch vụ tối đa"
            />
          </div>
        </FilterSection>

        <FilterSection title="Đánh giá gia sư" icon="star" section="rating" open={openSections.rating} onToggle={toggle}>
          {RATING_OPTIONS.map((option) => (
            <RadioOption
              key={String(option.value)}
              name="service-rating"
              checked={minRating === option.value}
              onChange={() => onMinRatingChange(option.value)}
              label={option.label}
            />
          ))}
        </FilterSection>
      </div>
    </aside>
  );
}

function FilterSection({ title, icon, section, open, onToggle, children }) {
  const contentId = `service-filter-${section}`;
  return (
    <div className="border-t border-slate-200 px-4 py-3.5 first:border-t-0">
      <button
        type="button"
        onClick={() => onToggle(section)}
        aria-expanded={open}
        aria-controls={contentId}
        className="flex min-h-11 w-full items-center justify-between gap-3 rounded-lg text-left text-sm font-bold text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <span className="flex items-center gap-2"><Icon name={icon} size="sm" className="text-blue-600" />{title}</span>
        <Icon name="expand_more" size="sm" className={`text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div id={contentId} className="mt-2 space-y-1">{children}</div>}
    </div>
  );
}

function RadioOption({ name, checked, onChange, label }) {
  return (
    <label className={`flex min-h-10 cursor-pointer items-center gap-2.5 rounded-lg px-2.5 text-sm transition ${checked ? 'bg-blue-50 font-bold text-blue-700' : 'font-medium text-slate-700 hover:bg-slate-50'}`}>
      <input type="radio" name={name} checked={checked} onChange={onChange} className="h-4 w-4 cursor-pointer border-slate-300 text-blue-600 focus:ring-blue-500" />
      <span className="line-clamp-2">{label}</span>
    </label>
  );
}

FilterSection.propTypes = {
  title: PropTypes.string.isRequired,
  icon: PropTypes.string.isRequired,
  section: PropTypes.string.isRequired,
  open: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
};

RadioOption.propTypes = {
  name: PropTypes.string.isRequired,
  checked: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
};

ServiceFilterSidebar.propTypes = {
  categories: PropTypes.array,
  subjects: PropTypes.array,
  selectedCategoryId: PropTypes.string,
  onSelectCategory: PropTypes.func.isRequired,
  selectedSubjectId: PropTypes.string,
  onSelectSubject: PropTypes.func.isRequired,
  minPrice: PropTypes.number,
  maxPrice: PropTypes.number,
  priceLimit: PropTypes.number,
  onPriceChange: PropTypes.func.isRequired,
  minRating: PropTypes.number,
  onMinRatingChange: PropTypes.func.isRequired,
  activeCount: PropTypes.number,
  onReset: PropTypes.func,
  sticky: PropTypes.bool,
  className: PropTypes.string,
};
