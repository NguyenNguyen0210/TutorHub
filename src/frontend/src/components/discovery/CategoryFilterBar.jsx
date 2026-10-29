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

  React.useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { mainCategories, otherCategories, activeOtherCategory } = React.useMemo(() => {
    const list = Array.isArray(categories) ? [...categories] : [];
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
        const displayName = cat.name.includes('Công nghệ thông tin') ? 'CNTT' : cat.name;
        mains.push({ ...cat, displayName, icon: ICON_BY_CATEGORY_NAME[cat.name] || 'auto_stories' });
      } else {
        others.push({ ...cat, displayName: cat.name, icon: ICON_BY_CATEGORY_NAME[cat.name] || 'category' });
      }
    });

    const activeOther = others.find((c) => c.id === selectedCategoryId);
    return { mainCategories: mains, otherCategories: others, activeOtherCategory: activeOther };
  }, [categories, selectedCategoryId]);

  const tabClass = (active) =>
    cn(
      'inline-flex min-h-[46px] shrink-0 items-center gap-2 border-b-2 px-2.5 text-[12.5px] font-semibold transition-colors',
      active
        ? 'border-[color:var(--mkt-cobalt)] text-[color:var(--mkt-cobalt)]'
        : 'border-transparent text-[color:var(--mkt-body)] hover:text-[color:var(--mkt-ink)]'
    );

  return (
    <div
      id="category-filter-bar"
      className="z-30 w-full border-y border-[color:var(--mkt-line)] bg-white"
    >
      <div className="page-shell">
        <div
          className="flex items-center gap-1 overflow-x-auto py-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          role="group"
          aria-label="Danh mục bộ môn"
        >
          <button
            type="button"
            id="category-tab-all"
            aria-pressed={!selectedCategoryId}
            onClick={() => {
              onSelectCategory('');
              setDropdownOpen(false);
            }}
            className={tabClass(!selectedCategoryId)}
          >
            <Icon
              name="auto_stories"
              size="xs"
              strokeWidth={1.7}
              className={
                !selectedCategoryId
                  ? 'text-[color:var(--mkt-cobalt)]'
                  : 'text-[color:var(--mkt-muted)]'
              }
            />
            <span>Tất cả môn học</span>
          </button>

          {mainCategories.map((cat) => {
            const isActive = selectedCategoryId === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => {
                  onSelectCategory(isActive ? '' : cat.id);
                  setDropdownOpen(false);
                }}
                className={tabClass(isActive)}
              >
                <Icon
                  name={cat.icon}
                  size="xs"
                  strokeWidth={1.7}
                  className={
                    isActive ? 'text-[color:var(--mkt-cobalt)]' : 'text-[color:var(--mkt-muted)]'
                  }
                />
                <span>{cat.displayName}</span>
              </button>
            );
          })}

          {otherCategories.length > 0 && (
            <div className="relative shrink-0" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen((open) => !open)}
                className={cn(
                  'inline-flex min-h-[46px] shrink-0 items-center gap-1.5 border-b-2 px-2.5 text-[12.5px] font-semibold transition-colors',
                  activeOtherCategory
                    ? 'border-[color:var(--mkt-cobalt)] text-[color:var(--mkt-cobalt)]'
                    : 'border-transparent text-[color:var(--mkt-body)] hover:text-[color:var(--mkt-ink)]'
                )}
                aria-haspopup="true"
                aria-expanded={dropdownOpen}
              >
                <span>{activeOtherCategory ? activeOtherCategory.name : 'Khác'}</span>
                <Icon
                  name="expand_more"
                  size="xs"
                  strokeWidth={1.7}
                  className={cn(
                    'transition-transform duration-150',
                    activeOtherCategory
                      ? 'text-[color:var(--mkt-cobalt)]'
                      : 'text-[color:var(--mkt-muted)]',
                    dropdownOpen && 'rotate-180'
                  )}
                />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-full z-50 mt-1.5 w-56 rounded-[10px] border border-[color:var(--mkt-line)] bg-white py-1.5 shadow-lg animate-fadeIn">
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
                          'flex w-full items-center justify-between px-3.5 py-2 text-left text-[12px] font-medium transition-colors hover:bg-[color:var(--mkt-canvas)]',
                          isSelected
                            ? 'bg-[color:var(--mkt-cobalt-50)] font-semibold text-[color:var(--mkt-cobalt)]'
                            : 'text-[color:var(--mkt-body)]'
                        )}
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <Icon
                            name={cat.icon}
                            size="xs"
                            strokeWidth={1.7}
                            className={
                              isSelected
                                ? 'text-[color:var(--mkt-cobalt)]'
                                : 'text-[color:var(--mkt-muted)]'
                            }
                          />
                          <span className="truncate">{cat.name}</span>
                        </div>
                        {isSelected && (
                          <Icon
                            name="check"
                            size="xs"
                            strokeWidth={1.7}
                            className="shrink-0 text-[color:var(--mkt-cobalt)]"
                          />
                        )}
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
