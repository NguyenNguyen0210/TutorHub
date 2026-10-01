import React from 'react';
import PropTypes from 'prop-types';
import Avatar from '@/components/ui/Avatar';
import Icon from '@/components/ui/Icon';
import Input from '@/components/ui/Input';

export default function HeroSection({
  searchKeyword,
  setSearchKeyword,
  onSearchSubmit,
  popularTags = [],
  onTagClick,
  totalCount = 55,
  topTutors = [],
}) {
  const visibleTutors = Array.isArray(topTutors) ? topTutors.slice(0, 5) : [];
  const showProof = totalCount > 0 || visibleTutors.length > 0;

  return (
    <section className="bg-canvas border-b border-border py-7 sm:py-8 lg:py-10">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center space-y-4 sm:space-y-5">
          <h1 className="text-[32px] sm:text-[42px] lg:text-[48px] font-bold text-neutral-900 leading-[1.12] tracking-tight">
            Tìm gia sư phù hợp <br />
            <span className="text-brand-primary-600">cho mục tiêu của bạn</span>
          </h1>

          <p className="text-[14px] sm:text-[15px] text-neutral-600 max-w-xl mx-auto leading-relaxed">
            Kết nối với những gia sư chất lượng, học tập hiệu quả hơn mỗi ngày.
            Gia sư xác thực · Thanh toán được bảo chứng.
          </p>

          {/* Floating Search Bar: 52px height, 580px max-width, 130px button */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSearchSubmit(searchKeyword);
            }}
            className="relative w-full max-w-[580px] mx-auto h-14 flex items-center text-left bg-surface p-1.5 rounded-full border border-neutral-200/90 shadow-brand-sm hover:shadow-brand-md focus-within:ring-2 focus-within:ring-brand-primary-600/20 focus-within:border-brand-primary-600 transition-all"
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
              placeholder="Tìm môn học, gia sư hoặc trường…"
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
                className="p-1 mr-1 text-neutral-400 hover:text-neutral-700 transition-colors rounded-full cursor-pointer"
                aria-label="Xóa từ khóa tìm kiếm"
              >
                <Icon name="close" size="sm" />
              </button>
            )}

            <button
              type="submit"
              className="h-11 px-3.5 sm:px-5 rounded-full bg-brand-primary-600 hover:bg-brand-primary-700 active:scale-[0.98] text-white text-[13px] sm:text-[14px] font-semibold flex items-center justify-center gap-1.5 shrink-0 transition-all cursor-pointer shadow-sm min-w-[105px] sm:min-w-[128px]"
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
                className="px-3 py-1 rounded-full bg-white/80 border border-neutral-200/60 text-neutral-600 hover:text-neutral-900 hover:bg-white text-[12px] font-medium transition-colors cursor-pointer"
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Real tutor proof: overlapping avatars + real count from props */}
          {showProof && (
            <div className="flex items-center justify-center gap-2.5 pt-1">
              {visibleTutors.length > 0 ? (
                <div className="flex -space-x-2">
                  {visibleTutors.map((tutor, idx) => (
                    <Avatar
                      key={tutor.id || idx}
                      src={tutor.avatarUrl}
                      name={tutor.fullName}
                      size="sm"
                      title={tutor.fullName}
                      className="ring-2 ring-surface"
                    />
                  ))}
                </div>
              ) : (
                <span className="text-brand-primary-600">
                  <Icon name="verified" size="sm" />
                </span>
              )}
              <p className="text-[13px] text-neutral-600">
                {totalCount > 0 ? (
                  <>
                    <strong className="font-bold text-neutral-900">{`${totalCount}+ gia sư`}</strong>
                    {' đã xác thực'}
                  </>
                ) : (
                  'Gia sư đã xác thực'
                )}
              </p>
            </div>
          )}
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
  totalCount: PropTypes.number,
  topTutors: PropTypes.arrayOf(PropTypes.object),
};
