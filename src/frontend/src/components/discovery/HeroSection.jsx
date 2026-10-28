import React from 'react';
import PropTypes from 'prop-types';
import Icon from '@/components/ui/Icon';
import Input from '@/components/ui/Input';

export default function HeroSection({
  searchKeyword,
  setSearchKeyword,
  onSearchSubmit,
  popularTags = [],
  onTagClick
}) {

  return (
    <section className="relative overflow-hidden border-b border-brand-primary-100 bg-brand-primary-50 py-10 sm:py-12 lg:py-16">
      <div className="absolute inset-y-0 left-0 hidden w-1/3 border-r border-brand-primary-100/70 lg:block" aria-hidden="true" />
      <div className="page-shell relative">
        <div className="max-w-3xl mx-auto text-center space-y-5 sm:space-y-6">
          <div className="inline-flex items-center gap-2 rounded-pill border border-brand-primary-200 bg-surface/80 px-3 py-1.5 text-caption font-semibold text-brand-primary-700 shadow-brand-sm">
            <Icon name="timeline" size="xs" />
            Học đúng người · Tiến đúng mục tiêu
          </div>

          <h1 className="text-[34px] sm:text-[46px] lg:text-[56px] font-bold text-neutral-900 leading-[1.08] tracking-[-0.035em]">
            Tìm gia sư phù hợp <br />
            <span className="text-brand-primary-600">cho mục tiêu của bạn</span>
          </h1>

          <p className="text-[15px] sm:text-[17px] text-neutral-600 max-w-2xl mx-auto leading-relaxed">
            Chọn gia sư đã xác thực, theo dõi tiến độ từng buổi và thanh toán qua
            cơ chế bảo chứng minh bạch.
          </p>

          {/* Floating Search Bar: 52px height, 580px max-width, 130px button */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSearchSubmit(searchKeyword);
            }}
            className="relative w-full max-w-[640px] mx-auto h-16 flex items-center text-left bg-surface p-1.5 rounded-brand-xl border border-neutral-200 shadow-brand-md hover:shadow-brand-lg focus-within:ring-2 focus-within:ring-brand-primary-600/20 focus-within:border-brand-primary-600 transition-all"
            role="search"
            aria-label="Tìm kiếm gia sư"
          >
            <span className="pl-4 pr-2 text-neutral-400 pointer-events-none">
              <Icon name="search" size="md" />
            </span>

            <Input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="Tìm môn học hoặc gia sư…"
              aria-label="Từ khóa tìm kiếm gia sư"
              className="flex-1 !border-none !shadow-none !bg-transparent text-[14px] placeholder:text-neutral-400 focus:!ring-0 px-1 h-full"
            />

            {searchKeyword && (
              <button
                type="button"
                onClick={() => {
                  setSearchKeyword('');
                  onSearchSubmit('');
                }}
              className="w-11 h-11 mr-1 inline-flex items-center justify-center text-neutral-400 hover:text-neutral-700 transition-colors rounded-brand-md cursor-pointer"
                aria-label="Xóa từ khóa tìm kiếm"
              >
                <Icon name="close" size="sm" />
              </button>
            )}

            <button
              type="submit"
              className="h-[3.25rem] px-3.5 sm:px-5 rounded-brand-lg bg-primary hover:bg-primary-hover active:scale-[0.98] text-white text-[13px] sm:text-[14px] font-semibold flex items-center justify-center gap-1.5 shrink-0 transition-all cursor-pointer shadow-brand-sm min-w-[105px] sm:min-w-[128px]"
            >
              <span>Tìm gia sư</span>
              <Icon name="arrow_forward" size="xs" />
            </button>
          </form>

          {/* Popular Search Tags: Softened border */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-0.5 text-caption text-neutral-600">
            <span className="text-[12px] font-semibold text-neutral-500 mr-0.5">Phổ biến:</span>
            {popularTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => onTagClick(tag)}
                className="min-h-9 px-3 py-1 rounded-pill bg-white/90 hover:bg-white text-neutral-700 hover:text-brand-primary-600 border border-neutral-200/80 hover:border-brand-primary-600/40 shadow-brand-sm text-[12px] font-medium transition-all cursor-pointer"
              >
                {tag}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 border-t border-brand-primary-200/70 pt-5 text-left sm:text-center">
            {[
              ['verified_user', 'Hồ sơ được xác thực'],
              ['timeline', 'Tiến độ từng buổi'],
              ['shield', 'Thanh toán bảo chứng'],
            ].map(([icon, label]) => (
              <div key={label} className="flex items-center justify-center gap-2 text-[13px] font-medium text-neutral-700">
                <Icon name={icon} size="sm" className="text-brand-primary-600" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

HeroSection.propTypes = {
  searchKeyword: PropTypes.string.isRequired,
  setSearchKeyword: PropTypes.func.isRequired,
  onSearchSubmit: PropTypes.func.isRequired,
  popularTags: PropTypes.arrayOf(PropTypes.string),
  onTagClick: PropTypes.func.isRequired,
};
