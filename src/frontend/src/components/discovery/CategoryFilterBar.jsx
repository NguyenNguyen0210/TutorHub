import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/cn';
import Icon from '@/components/ui/Icon';

const ICON_BY_CATEGORY_NAME = {
  'Toán học': 'calculate',
  'Ngoại ngữ': 'translate',
  'Khoa học tự nhiên': 'science',
  'Công nghệ thông tin': 'terminal',
  'Khoa học xã hội': 'auto_stories',
  'Nghệ thuật & Âm nhạc': 'celebration',
  'Kỹ năng mềm': 'group',
  'Luyện thi chứng chỉ': 'military_tech',
  'Kinh tế & Tài chính': 'account_balance',
  'Thể thao & Yoga': 'rocket_launch',
};

export default function CategoryFilterBar({
  categories = [],
  selectedCategoryId,
  onSelectCategory,
}) {
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const dropdownRef = React.useRef(null);

  // Close dropdown on outside click
  React.useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Normalize and prioritize categories per user specification:
  // Tất cả môn học, CNTT, Khoa học tự nhiên, Khoa học xã hội, Kinh tế & Tài chính, Kỹ năng mềm, Khác ▾
  const { mainCategories, otherCategories, activeOtherCategory } = React.useMemo(() => {
    const list = Array.isArray(categories) ? [...categories] : [];

    // Priority ordering rules
    const priorityKeywords = [
      'Công nghệ thông tin',
      'Khoa học tự nhiên',
      'Khoa học xã hội',
      'Kinh tế & Tài chính',
      'Kỹ năng mềm',
      'Ngoại ngữ',
    ];

    const mains = [];
    const others = [];

    list.forEach((cat) => {
      const isPriority = priorityKeywords.some((pk) =>
        cat.name.toLowerCase().includes(pk.toLowerCase())
      );
      if (isPriority && mains.length < 6) {
        // Label display abbreviation if applicable
        const displayName = cat.name.includes('Công nghệ thông tin') ? 'CNTT' : cat.name;
        mains.push({ ...cat, displayName, icon: ICON_BY_CATEGORY_NAME[cat.name] || 'auto_stories' });
      } else {
        others.push({ ...cat, displayName: cat.name, icon: ICON_BY_CATEGORY_NAME[cat.name] || 'category' });
      }
    });

    const activeOther = others.find((c) => c.id === selectedCategoryId);

    return { mainCategories: mains, otherCategories: others, activeOtherCategory: activeOther };
  }, [categories, selectedCategoryId]);

  return (
    <div className="w-full bg-surface border-b border-neutral-200/80 shadow-brand-sm z-30">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-2.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          role="tablist"
          aria-label="Danh mục bộ môn"
        >
          {/* 1. All categories tab */}
          <button
            type="button"
            role="tab"
            aria-selected={!selectedCategoryId}
            onClick={() => {
              onSelectCategory('');
              setDropdownOpen(false);
            }}
            className={cn(
              'flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-[13.5px] font-medium shrink-0 transition-all cursor-pointer whitespace-nowrap',
              !selectedCategoryId
                ? 'bg-brand-primary-600 text-white shadow-sm font-semibold'
                : 'bg-transparent text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
            )}
          >
            <Icon name="auto_stories" size="xs" className={!selectedCategoryId ? 'text-white' : 'text-neutral-500'} />
            <span>Tất cả môn học</span>
          </button>

          {/* 2. Main 6 Categories */}
          {mainCategories.map((cat) => {
            const isActive = selectedCategoryId === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => {
                  onSelectCategory(isActive ? '' : cat.id);
                  setDropdownOpen(false);
                }}
                className={cn(
                  'flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-[13.5px] font-medium shrink-0 transition-all cursor-pointer whitespace-nowrap',
                  isActive
                    ? 'bg-brand-primary-600 text-white shadow-sm font-semibold'
                    : 'bg-transparent text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                )}
              >
                <Icon name={cat.icon} size="xs" className={isActive ? 'text-white' : 'text-neutral-500'} />
                <span>{cat.displayName}</span>
              </button>
            );
          })}

          {/* 3. Dropdown "Khác ▾" if more categories exist */}
          {otherCategories.length > 0 && (
            <div className="relative shrink-0" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13.5px] font-medium transition-all cursor-pointer whitespace-nowrap',
                  activeOtherCategory
                    ? 'bg-brand-primary-600 text-white shadow-sm font-semibold'
                    : 'bg-transparent text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                )}
                aria-haspopup="true"
                aria-expanded={dropdownOpen}
              >
                <span>{activeOtherCategory ? activeOtherCategory.name : 'Khác'}</span>
                <Icon
                  name="expand_more"
                  size="xs"
                  className={cn(
                    'transition-transform duration-150',
                    activeOtherCategory ? 'text-white' : 'text-neutral-500',
                    dropdownOpen && 'rotate-180'
                  )}
                />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-52 bg-surface rounded-xl shadow-brand-lg border border-neutral-200/80 py-1.5 z-50 animate-fadeIn">
                  {otherCategories.map((cat) => {
                    const isSelected = selectedCategoryId === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          onSelectCategory(cat.id);
                          setDropdownOpen(false);
                        }}
                        className={cn(
                          'w-full text-left px-3.5 py-2 text-[13px] font-medium flex items-center justify-between hover:bg-neutral-50 transition-colors cursor-pointer',
                          isSelected ? 'text-brand-primary-600 bg-brand-primary-50/60 font-semibold' : 'text-neutral-700'
                        )}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Icon name={cat.icon} size="xs" className={isSelected ? 'text-brand-primary-600' : 'text-neutral-400'} />
                          <span className="truncate">{cat.name}</span>
                        </div>
                        {isSelected && <Icon name="check" size="xs" className="text-brand-primary-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

CategoryFilterBar.propTypes = {
  categories: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    })
  ),
  selectedCategoryId: PropTypes.string.isRequired,
  onSelectCategory: PropTypes.func.isRequired,
};
