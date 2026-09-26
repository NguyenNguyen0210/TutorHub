import React from 'react';
import PropTypes from 'prop-types';
import Avatar from '@/components/ui/Avatar';
import Icon from '@/components/ui/Icon';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function HeroSection({
  searchKeyword,
  setSearchKeyword,
  onSearchSubmit,
  popularTags = [],
  onTagClick,
  totalCount = 55,
  topTutors = [],
}) {
  return (
    <section className="relative overflow-hidden py-7 sm:py-8 lg:py-10 bg-brand-primary-50 border-b border-brand-primary-100">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Headline, Search, Popular Tags */}
          <div className="lg:col-span-7 space-y-4 sm:space-y-5">
            <h1 className="text-[32px] sm:text-[42px] lg:text-[48px] font-bold text-neutral-900 leading-[1.12] tracking-tight">
              Tìm gia sư phù hợp <br />
              <span className="text-brand-primary-600">cho mục tiêu của bạn</span>
            </h1>

            <p className="text-[14px] sm:text-[15px] text-neutral-600 max-w-xl leading-relaxed">
              Kết nối với những gia sư chất lượng, học tập hiệu quả hơn và chạm tới tương lai
              tươi sáng cùng TutorHub.
            </p>

            {/* Floating Search Bar: 52px height, 580px max-width, 130px button */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onSearchSubmit(searchKeyword);
              }}
              className="relative w-full max-w-[580px] h-[52px] flex items-center bg-surface p-1.5 rounded-full border border-neutral-200/90 shadow-brand-sm hover:shadow-brand-md focus-within:ring-2 focus-within:ring-brand-primary-600/20 focus-within:border-brand-primary-600 transition-all"
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
                className="h-[40px] px-4 sm:px-5 rounded-full bg-brand-primary-600 hover:bg-brand-primary-700 active:bg-brand-primary-800 text-white text-[13.5px] sm:text-[14px] font-semibold flex items-center justify-center gap-1.5 shrink-0 transition-colors cursor-pointer shadow-sm"
                style={{ minWidth: '128px' }}
              >
                <span>Tìm gia sư</span>
                <Icon name="arrow_forward" size="xs" />
              </button>
            </form>

            {/* Popular Search Tags: Softened border */}
            <div className="flex flex-wrap items-center gap-2 pt-0.5 text-caption text-neutral-600">
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
          </div>

          {/* Right Column: Hero Visual with that exact woman from /register and /login */}
          <div className="lg:col-span-5 relative flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[480px] flex items-center justify-center pt-2 pb-1 select-none">
              {/* Soft ambient backlight */}
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] bg-brand-primary-200/40 rounded-full blur-3xl -z-10 pointer-events-none"
                aria-hidden="true"
              />

              {/* Exact Woman Illustration from Register & Login */}
              <img
                src="/images/transparent-student-clean.png"
                alt="Học viên TutorHub học tập hiệu quả cùng gia sư"
                className="w-full h-auto object-contain select-none pointer-events-none drop-shadow-sm"
                loading="eager"
              />

              {/* Floating Badge 1: Top-Right (Hơn 10.000+ học viên) */}
              <div
                className="absolute top-4 sm:top-5 right-1 sm:right-2 bg-white/95 backdrop-blur-md p-2.5 sm:p-3 rounded-[16px] sm:rounded-[18px] shadow-glass border border-white/80 max-w-[140px] sm:max-w-[155px] text-left z-20 animate-float"
                style={{ animationDuration: '5s' }}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-brand-primary-50 text-brand-primary-600 flex items-center justify-center">
                    <Icon name="history_edu" size="sm" />
                  </div>
                  <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-brand-primary-50 text-brand-primary-600 flex items-center justify-center text-[9px] sm:text-[10px] font-bold">
                    ↗
                  </div>
                </div>
                <p className="text-[12px] sm:text-[13px] font-bold text-fg leading-tight mt-1">
                  Hơn 10.000+
                </p>
                <p className="text-[9.5px] sm:text-[10.5px] text-neutral-500 leading-snug mt-0.5">
                  học viên đã tìm được gia sư
                </p>
              </div>

              {/* Floating Badge 2: Bottom-Left (Live Avatars & Total Tutors Count) */}
              <a
                href="#tutors-grid"
                className="absolute bottom-4 sm:bottom-6 left-1 sm:left-2 bg-white/95 backdrop-blur-md p-2 sm:p-2.5 sm:px-3 rounded-xl sm:rounded-2xl shadow-brand-lg border border-white/80 flex items-center gap-2 sm:gap-2.5 z-20 group hover:shadow-lg transition-all animate-float cursor-pointer"
                style={{ animationDuration: '4.5s', animationDelay: '0.8s' }}
                title="Xem danh sách 55+ gia sư chất lượng"
              >
                <div className="flex -space-x-2 overflow-hidden py-0.5 pl-0.5">
                  {topTutors && topTutors.length > 0 ? (
                    topTutors.slice(0, 3).map((tutor, idx) => (
                      <Avatar
              key={tutor.id || idx}
              src={tutor.avatarUrl}
              name={tutor.fullName}
              size="sm"
              title={tutor.fullName}
              className="inline-block h-7 w-7 sm:h-8 sm:w-8 ring-2 ring-white shrink-0"
            />
                    ))
                  ) : (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-brand-primary-100 text-brand-primary-600 font-bold text-xs flex items-center justify-center">
                      55+
                    </div>
                  )}
                </div>

                <div className="leading-tight text-left pr-0.5">
                  <p className="text-[12px] sm:text-[12.5px] font-bold text-fg group-hover:text-brand-primary-600 transition-colors">
                    {totalCount > 0 ? `${totalCount}+ gia sư chất lượng` : '55+ gia sư chất lượng'}
                  </p>
                  <p className="text-[10px] sm:text-[10.5px] text-neutral-500 mt-0.5">Đã được xác thực</p>
                </div>

                <span className="w-5 h-5 rounded-full bg-neutral-100 text-neutral-400 flex items-center justify-center group-hover:bg-brand-primary-50 group-hover:text-brand-primary-600 transition-colors shrink-0">
                  <Icon name="chevron_right" size="xs" />
                </span>
              </a>
            </div>
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
  totalCount: PropTypes.number,
  topTutors: PropTypes.arrayOf(PropTypes.object),
};
