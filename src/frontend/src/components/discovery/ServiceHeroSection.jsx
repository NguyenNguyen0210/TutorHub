import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import Icon from '@/components/ui/Icon';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function ServiceHeroSection({
  searchKeyword,
  setSearchKeyword,
  onSearchSubmit,
  popularTags = [
    'Luyện thi THPT',
    'IELTS',
    'Tiếng Anh giao tiếp',
    'Toán nâng cao',
    'Lập trình',
    'Kỹ năng mềm',
  ],
  onTagClick,
}) {
  return (
    <section className="relative py-6 sm:py-8 lg:py-9 bg-gradient-to-r from-[#EFF6FF] to-[#ECFEFF] border-b border-sky-100/70">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
          {/* Left Column: Breadcrumb, Headline, Search, Popular Tags */}
          <div className="lg:col-span-7 space-y-3 sm:space-y-3.5">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-[12px] font-medium text-slate-500" aria-label="Breadcrumb">
              <Link to="/" className="text-slate-500 hover:text-[#2563EB] transition-colors">
                Trang chủ
              </Link>
              <span className="text-slate-300">›</span>
              <span className="text-[#2563EB] font-semibold">Dịch vụ học tập</span>
            </nav>

            <h1 className="text-[28px] sm:text-[36px] lg:text-[40px] font-bold text-neutral-900 leading-[1.18] tracking-tight">
              Dịch vụ học tập đa dạng <br />
              cho <span className="text-[#2563EB]">mọi mục tiêu</span>
            </h1>

            <p className="text-[13.5px] sm:text-[14.5px] text-neutral-600 max-w-xl leading-relaxed">
              Khám phá các gói học gia sư, chương trình luyện thi theo lộ trình và nhiều
              dịch vụ học tập chất lượng từ đội ngũ gia sư hàng đầu trên TutorHub.
            </p>

            {/* Floating Search Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onSearchSubmit(searchKeyword);
              }}
              className="relative w-full max-w-[560px] h-[48px] flex items-center bg-white p-1 rounded-full border border-neutral-200/90 shadow-brand-sm hover:shadow-brand-md focus-within:ring-2 focus-within:ring-[#2563EB]/20 focus-within:border-[#2563EB] transition-all"
              role="search"
              aria-label="Tìm kiếm dịch vụ học tập"
            >
              <span className="pl-3.5 pr-2 text-neutral-400 pointer-events-none">
                <Icon name="search" size="md" />
              </span>

              <Input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="Tìm gói học, môn học hoặc kỹ năng…"
                aria-label="Từ khóa tìm kiếm gói học"
                className="flex-1 !border-none !shadow-none !bg-transparent text-[13.5px] placeholder:text-neutral-400 focus:!ring-0 px-1 h-full"
              />

              {searchKeyword && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchKeyword('');
                    onSearchSubmit('');
                  }}
                  className="p-1 mr-1 text-neutral-400 hover:text-neutral-600 transition-colors"
                  aria-label="Xóa từ khóa"
                >
                  <Icon name="close" size="xs" />
                </button>
              )}

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="!rounded-full px-4 h-[38px] text-[13px] font-semibold shrink-0 gap-1.5 shadow-sm"
              >
                <span>Tìm dịch vụ</span>
                <Icon name="arrow_forward" size="xs" />
              </Button>
            </form>

            {/* Popular Tags */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-[12.5px]">
              <span className="font-semibold text-neutral-500">Phổ biến:</span>
              {popularTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onTagClick(tag)}
                  className="px-2.5 py-0.5 rounded-full bg-white/90 hover:bg-white text-neutral-700 hover:text-[#2563EB] border border-neutral-200/80 hover:border-[#2563EB]/40 shadow-2xs font-medium text-[11.5px] transition-all cursor-pointer"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Visual Graphic Banner with Student & Floating Benefit Badges */}
          <div className="lg:col-span-5 relative flex items-center justify-center lg:justify-end">
            <div className="relative w-full max-w-[460px] flex items-center justify-center pt-2 pb-1 select-none">
              {/* Soft ambient backlight */}
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] bg-sky-200/40 rounded-full blur-3xl -z-10 pointer-events-none"
                aria-hidden="true"
              />

              {/* Exact Woman Cutout from /tutors, /login, /register: No Card, No Border */}
              <img
                src="/images/transparent-student-clean.png"
                alt="Học viên TutorHub học tập hiệu quả cùng gia sư"
                className="w-full h-auto max-h-[350px] object-contain select-none pointer-events-none drop-shadow-sm"
                loading="eager"
              />

              {/* Handwritten quote */}
              <div className="absolute top-2 left-1 sm:left-2 bg-white/95 backdrop-blur-xs px-3 py-1 rounded-full border border-blue-100/80 shadow-xs transform -rotate-3 text-[12px] font-bold text-sky-600 tracking-wide z-20">
                ✨ Học hôm nay • Sáng ngày mai
              </div>

              {/* Floating Benefit Badge 1: Top Right - Gói học chất lượng */}
              <div className="absolute top-4 right-0 sm:right-1 bg-white/95 backdrop-blur-md p-2.5 px-3 rounded-2xl shadow-md border border-white/80 flex items-center gap-2 animate-float z-20">
                <div className="w-7 h-7 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0">
                  <Icon name="school" size="sm" />
                </div>
                <div>
                  <p className="text-[11.5px] font-bold text-slate-900 leading-tight">Gói học chất lượng</p>
                  <p className="text-[10px] text-slate-500 font-medium">Được kiểm duyệt kỹ lưỡng</p>
                </div>
              </div>

              {/* Floating Benefit Badge 2: Middle Right - Đa dạng cấp độ */}
              <div
                className="absolute top-1/2 -right-2 sm:-right-4 transform -translate-y-1/2 bg-white/95 backdrop-blur-md p-2.5 px-3 rounded-2xl shadow-md border border-white/80 flex items-center gap-2 animate-float z-20"
                style={{ animationDelay: '1.2s' }}
              >
                <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Icon name="trending_up" size="sm" />
                </div>
                <div>
                  <p className="text-[11.5px] font-bold text-slate-900 leading-tight">Đa dạng cấp độ</p>
                  <p className="text-[10px] text-slate-500 font-medium">Phù hợp mọi mục tiêu</p>
                </div>
              </div>

              {/* Floating Benefit Badge 3: Bottom Left - Học linh hoạt */}
              <div
                className="absolute bottom-2 left-0 sm:left-1 bg-white/95 backdrop-blur-md p-2.5 px-3 rounded-2xl shadow-md border border-white/80 flex items-center gap-2 animate-float z-20"
                style={{ animationDelay: '0.6s' }}
              >
                <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Icon name="groups" size="sm" />
                </div>
                <div>
                  <p className="text-[11.5px] font-bold text-slate-900 leading-tight">Học linh hoạt</p>
                  <p className="text-[10px] text-slate-500 font-medium">Online hoặc tại nhà</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

ServiceHeroSection.propTypes = {
  searchKeyword: PropTypes.string.isRequired,
  setSearchKeyword: PropTypes.func.isRequired,
  onSearchSubmit: PropTypes.func.isRequired,
  popularTags: PropTypes.arrayOf(PropTypes.string),
  onTagClick: PropTypes.func.isRequired,
};
