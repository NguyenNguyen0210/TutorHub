import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/cn';
import Icon from '@/components/ui/Icon';
import PriceRangeFilter from '@/components/discovery/PriceRangeFilter';

const DEGREE_OPTIONS = [
  { id: 'All', label: 'Tất cả học vị' },
  { id: 'Thạc sĩ', label: 'Thạc sĩ / Tiến sĩ' },
  { id: 'Cử nhân', label: 'Cử nhân chính quy' },
  { id: 'Kỹ sư', label: 'Kỹ sư công nghệ' },
  { id: 'Bác sĩ', label: 'Bác sĩ / Y khoa' },
  { id: 'Sinh viên', label: 'Sinh viên giỏi' },
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
  { id: 'IELTS', label: 'IELTS 7.5 – 8.5+' },
  { id: 'JLPT', label: 'JLPT N1 / N2' },
  { id: 'Chứng chỉ Sư phạm', label: 'Nghiệp vụ Sư phạm' },
  { id: 'CELTA', label: 'CELTA / TESOL' },
  { id: 'Kiện tướng', label: 'Kiện tướng Cờ vua QG' },
];

const PRICE_PRESETS = [
  { label: 'Tất cả', min: 0, max: 5000000 },
  { label: 'Đến 1 triệu', min: 0, max: 1000000 },
  { label: '1 – 2,5 triệu', min: 1000000, max: 2500000 },
  { label: '2,5 – 5 triệu', min: 2500000, max: 5000000 },
];

const PRICE_STEP = 100000;

const RATING_OPTIONS = [
  { val: null, label: 'Tất cả' },
  { val: 4.8, label: 'Từ 4.8' },
  { val: 4.5, label: 'Từ 4.5' },
  { val: 4.0, label: 'Từ 4.0' },
];

const EXPERIENCE_OPTIONS = [
  { id: 'All', label: 'Tất cả' },
  { id: '<1', label: '< 1 năm' },
  { id: '1-2', label: '1 – 2 năm' },
  { id: '3-5', label: '3 – 5 năm' },
  { id: '>=6', label: 'Từ 6 năm' },
];

function FilterSection({ id, icon, title, summary, open, onToggle, children }) {
  return (
    <section className={cn('mkt-filter-section', open && 'is-open')}>
      <button
        type="button"
        className="mkt-filter-section-toggle"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`filter-section-${id}`}
      >
        <span className="mkt-filter-section-icon"><Icon name={icon} size="sm" strokeWidth={1.8} /></span>
        <span className="min-w-0 flex-1 text-left">
          <strong>{title}</strong>
          {summary && <span className="mkt-filter-summary">{summary}</span>}
        </span>
        <Icon name="expand_more" size="sm" className={cn('mkt-filter-chevron', open && 'rotate-180')} />
      </button>
      {open && <div id={`filter-section-${id}`} className="mkt-filter-section-body">{children}</div>}
    </section>
  );
}

FilterSection.propTypes = {
  id: PropTypes.string.isRequired,
  icon: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  summary: PropTypes.string,
  open: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
};

function RadioList({ name, options, value, onChange, searchable = false, query = '', onQueryChange }) {
  return (
    <div>
      {searchable && (
        <div className="mkt-filter-search">
          <Icon name="search" size="xs" />
          <input
            type="search"
            aria-label="Tìm trong danh sách trường"
            placeholder="Tìm tên trường"
            value={query}
            onChange={(event) => onQueryChange?.(event.target.value)}
          />
        </div>
      )}
      <div className={cn('mkt-filter-radio-list', searchable && 'mt-3 max-h-[220px] overflow-y-auto pr-1')}>
        {options.map((option) => {
          const selected = value === option.id;
          return (
            <label key={option.id} className={cn('mkt-filter-option', selected && 'is-selected')}>
              <input type="radio" name={name} checked={selected} onChange={() => onChange?.(option.id)} />
              <span className="mkt-filter-radio" aria-hidden="true" />
              <span className="min-w-0 flex-1">{option.label}</span>
              {selected && <Icon name="check" size="xs" />}
            </label>
          );
        })}
      </div>
    </div>
  );
}

RadioList.propTypes = {
  name: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.string.isRequired, label: PropTypes.string.isRequired })).isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func,
  searchable: PropTypes.bool,
  query: PropTypes.string,
  onQueryChange: PropTypes.func,
};

export default function FilterSidebar({
  minPrice: propMinPrice,
  maxPrice: propMaxPrice,
  priceLimit = 5000000,
  priceRange,
  onPriceChange,
  onPriceRangeChange,
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
  footer,
  className,
}) {
  const currentMinPrice = propMinPrice != null ? Number(propMinPrice) : 0;
  const currentMaxPrice = propMaxPrice != null ? Number(propMaxPrice) : Number(priceRange ?? priceLimit);
  const [openSections, setOpenSections] = useState({
    price: true, rating: true, experience: true, degree: false, university: false, cert: false,
  });
  const [uniSearch, setUniSearch] = useState('');

  const toggleSection = (section) => setOpenSections((current) => ({ ...current, [section]: !current[section] }));
  const handleSliderChange = ([min, max]) => {
    if (onPriceChange) onPriceChange({ min, max });
    else onPriceRangeChange?.(max);
  };

  const filteredUniversities = useMemo(() => {
    const term = uniSearch.toLocaleLowerCase('vi').trim();
    if (!term) return UNIVERSITY_OPTIONS;
    return UNIVERSITY_OPTIONS.filter((option) => option.label.toLocaleLowerCase('vi').includes(term));
  }, [uniSearch]);

  const activeCount = useMemo(() => [
    currentMinPrice > 0 || currentMaxPrice < priceLimit,
    minRating != null,
    experienceRange !== 'All',
    degreeLevel !== 'All',
    university !== 'All',
    certification !== 'All',
  ].filter(Boolean).length, [currentMinPrice, currentMaxPrice, priceLimit, minRating, experienceRange, degreeLevel, university, certification]);

  const ratingSummary = minRating != null ? `Từ ${minRating} sao` : null;
  const experienceSummary = EXPERIENCE_OPTIONS.find((option) => option.id === experienceRange)?.label;
  const degreeSummary = degreeLevel !== 'All' ? degreeLevel : null;
  const universitySummary = university !== 'All' ? university : null;
  const certificationSummary = certification !== 'All' ? certification : null;

  return (
    <aside className={cn('w-full', className)} aria-label="Bộ lọc gia sư">
      <div className="filter-panel mkt-filter-panel">
        <header className="mkt-filter-header">
          <div className="flex min-w-0 items-start gap-3">
            <span className="mkt-filter-header-icon">
              <Icon name="tune" size="md" />
              {activeCount > 0 && (
                <span className="mkt-filter-count" aria-label={`${activeCount} bộ lọc đang áp dụng`}>{activeCount}</span>
              )}
            </span>
            <div className="min-w-0">
              <h2>Tinh chỉnh kết quả</h2>
              <p>Chọn điều quan trọng với bạn</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onResetFilters}
            className={cn('mkt-filter-reset', activeCount === 0 && 'invisible')}
            disabled={activeCount === 0}
            aria-label="Đặt lại bộ lọc"
            title="Đặt lại bộ lọc"
          >
            <Icon name="refresh" size="sm" strokeWidth={1.8} />
          </button>
        </header>

        <div className="mkt-filter-sections">
          <FilterSection id="price" icon="payments" title="Ngân sách" open={openSections.price} onToggle={() => toggleSection('price')}>
            <PriceRangeFilter
              min={currentMinPrice}
              max={currentMaxPrice}
              limit={priceLimit}
              step={PRICE_STEP}
              presets={PRICE_PRESETS}
              onChange={handleSliderChange}
              ariaLabelMin="Giá gói học tối thiểu"
              ariaLabelMax="Giá gói học tối đa"
            />
          </FilterSection>

          <FilterSection id="rating" icon="star" title="Đánh giá" summary={ratingSummary} open={openSections.rating} onToggle={() => toggleSection('rating')}>
            <div className="mkt-filter-chip-grid">
              {RATING_OPTIONS.map((option) => {
                const selected = minRating === option.val;
                return (
                  <button key={option.val ?? 'all'} type="button" aria-pressed={selected} onClick={() => onMinRatingChange?.(option.val)}>
                    {option.val != null && <Icon name="star" size="xs" filled className="text-[color:var(--mkt-amber)]" />}{option.label}
                  </button>
                );
              })}
            </div>
          </FilterSection>

          <FilterSection id="experience" icon="work_history" title="Kinh nghiệm" summary={experienceRange !== 'All' ? experienceSummary : null} open={openSections.experience} onToggle={() => toggleSection('experience')}>
            <div className="mkt-filter-chip-grid">
              {EXPERIENCE_OPTIONS.map((option) => (
                <button key={option.id} type="button" aria-pressed={experienceRange === option.id} onClick={() => onExperienceRangeChange?.(option.id)}>{option.label}</button>
              ))}
            </div>
          </FilterSection>

          <FilterSection id="degree" icon="school" title="Học vị" summary={degreeSummary} open={openSections.degree} onToggle={() => toggleSection('degree')}>
            <RadioList name="degreeLevel" options={DEGREE_OPTIONS} value={degreeLevel} onChange={onDegreeLevelChange} />
          </FilterSection>

          <FilterSection id="university" icon="account_balance" title="Trường đại học" summary={universitySummary} open={openSections.university} onToggle={() => toggleSection('university')}>
            <RadioList name="university" options={filteredUniversities} value={university} onChange={onUniversityChange} searchable query={uniSearch} onQueryChange={setUniSearch} />
          </FilterSection>

          <FilterSection id="cert" icon="verified" title="Chứng chỉ" summary={certificationSummary} open={openSections.cert} onToggle={() => toggleSection('cert')}>
            <RadioList name="certification" options={CERTIFICATION_OPTIONS} value={certification} onChange={onCertificationChange} />
          </FilterSection>
        </div>

        {footer && <footer className="mkt-filter-footer">{footer}</footer>}
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
  footer: PropTypes.node,
  className: PropTypes.string,
};
