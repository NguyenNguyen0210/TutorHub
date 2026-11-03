import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/cn';
import Icon from '@/components/ui/Icon';

const ICON_BY_CATEGORY_NAME = {
  'Toán': 'calculate',
  'Toán học': 'calculate',
  'Ngoại ngữ': 'translate',
  'Khoa học tự nhiên': 'science',
  'Công nghệ': 'terminal',
  'Công nghệ thông tin': 'terminal',
  'Khoa học xã hội': 'auto_stories',
  'Ngữ văn': 'menu_book',
  'Nghệ thuật & Âm nhạc': 'celebration',
  'Kỹ năng học tập': 'psychology',
  'Kỹ năng mềm': 'group',
  'Luyện thi chứng chỉ': 'military_tech',
  'Kinh tế & Tài chính': 'account_balance',
  'Thể thao & Yoga': 'rocket_launch',
};

function getCategoryIcon(name = '') {
  const exactIcon = ICON_BY_CATEGORY_NAME[name];
  if (exactIcon) return exactIcon;
  const matchedName = Object.keys(ICON_BY_CATEGORY_NAME).find((key) =>
    name.toLocaleLowerCase('vi').includes(key.toLocaleLowerCase('vi'))
  );
  return matchedName ? ICON_BY_CATEGORY_NAME[matchedName] : 'category';
}

export default function CategoryFilterBar({ categories = [], selectedCategoryId, onSelectCategory }) {
  const trackRef = React.useRef(null);
  const scrollCategories = (direction) => {
    trackRef.current?.scrollBy({ left: direction * 360, behavior: 'smooth' });
  };

  return (
    <section id="category-filter-bar" className="mkt-category-section" aria-labelledby="category-heading">
      <div className="page-shell py-7 sm:py-8">
        <div className="mb-4 flex items-end justify-between gap-5">
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-[color:var(--mkt-cobalt)]">Khám phá nhanh</p>
            <h2 id="category-heading" className="mkt-display mt-1 text-[24px] leading-[1.25] tracking-[-0.02em] sm:text-[30px]">Bạn muốn chinh phục môn nào?</h2>
          </div>
          <div className="hidden items-center gap-2 sm:flex" aria-label="Cuộn danh mục">
            <button type="button" className="mkt-category-arrow" onClick={() => scrollCategories(-1)} aria-label="Xem danh mục trước">
              <Icon name="arrow_back" size="sm" />
            </button>
            <button type="button" className="mkt-category-arrow" onClick={() => scrollCategories(1)} aria-label="Xem thêm danh mục">
              <Icon name="arrow_forward" size="sm" />
            </button>
          </div>
        </div>

        <div className="mkt-category-track-wrap">
        <div ref={trackRef} className="mkt-category-track" role="group" aria-label="Danh mục bộ môn">
          <button
            id="category-tab-all"
            type="button"
            aria-pressed={!selectedCategoryId}
            onClick={() => onSelectCategory('')}
            className={cn('mkt-category-card', !selectedCategoryId && 'is-active')}
          >
            <span className="mkt-category-icon"><Icon name="category" size="sm" /></span>
            <span>Tất cả</span>
          </button>
          {categories.map((category) => {
            const active = selectedCategoryId === category.id;
            return (
              <button
                key={category.id}
                type="button"
                aria-pressed={active}
                onClick={() => onSelectCategory(active ? '' : category.id)}
                className={cn('mkt-category-card', active && 'is-active')}
              >
                <span className="mkt-category-icon">
                  <Icon name={getCategoryIcon(category.name)} size="sm" />
                </span>
                <span>{category.name.includes('Công nghệ thông tin') ? 'CNTT' : category.name}</span>
              </button>
            );
          })}
        </div>
        </div>
      </div>
    </section>
  );
}

CategoryFilterBar.propTypes = {
  categories: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.string.isRequired, name: PropTypes.string.isRequired })),
  selectedCategoryId: PropTypes.string.isRequired,
  onSelectCategory: PropTypes.func.isRequired,
};
