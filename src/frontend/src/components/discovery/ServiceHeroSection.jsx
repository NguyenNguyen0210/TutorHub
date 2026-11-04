import React from 'react';
import PropTypes from 'prop-types';
import Icon from '@/components/ui/Icon';
import ServiceHeroVisual from './ServiceHeroVisual';

const DEFAULT_TAGS = [
  'Luyện thi THPT',
  'IELTS',
  'Tiếng Anh giao tiếp',
  'Toán nâng cao',
  'Lập trình',
];

export default function ServiceHeroSection({
  searchKeyword,
  setSearchKeyword,
  onSearchSubmit,
  popularTags = DEFAULT_TAGS,
  onTagClick,
}) {
  return (
    <section className="relative overflow-hidden border-b border-[color:var(--mkt-line)] bg-gradient-to-br from-blue-50 via-white to-sky-50 py-10 sm:py-14 lg:py-16">
      <div className="pointer-events-none absolute inset-0 opacity-60 [background-image:radial-gradient(#bfdbfe_1px,transparent_1px)] [background-size:22px_22px]" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-32 -top-40 h-[420px] w-[420px] rounded-full bg-blue-200/40 blur-3xl" aria-hidden="true" />

      <div className="page-shell relative">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)] lg:gap-14">
          <div>
            <h1 className="mkt-display max-w-3xl text-[38px] leading-[1.1] tracking-[-0.025em] text-[color:var(--mkt-ink)] sm:text-[48px] lg:text-[54px]">
              Chọn đúng gói học.
              <span className="block text-[color:var(--mkt-cobalt)]">Theo đúng lộ trình của bạn.</span>
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-[color:var(--mkt-body)] sm:text-[17px]">
              So sánh số buổi, thời lượng và học phí trọn gói trước khi đăng ký. Mỗi gói học đều gắn với hồ sơ gia sư minh bạch.
            </p>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                onSearchSubmit(searchKeyword);
              }}
              className="mt-7 flex min-h-16 w-full max-w-[680px] items-center gap-2 rounded-2xl border border-blue-200 bg-white p-1.5 shadow-[0_16px_40px_-20px_rgba(37,99,235,0.45)] transition focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100"
              role="search"
              aria-label="Tìm kiếm gói học"
            >
              <Icon name="search" size="md" className="ml-3 text-blue-600" />
              <input
                type="search"
                value={searchKeyword}
                onChange={(event) => setSearchKeyword(event.target.value)}
                placeholder="Bạn muốn học môn gì hoặc kỹ năng nào?"
                aria-label="Từ khóa tìm kiếm gói học"
                className="h-12 min-w-0 flex-1 bg-transparent px-1 text-base text-slate-900 outline-none placeholder:text-slate-500"
              />
              {searchKeyword && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchKeyword('');
                    onSearchSubmit('');
                  }}
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                  aria-label="Xóa từ khóa"
                >
                  <Icon name="close" size="sm" />
                </button>
              )}
              <button
                type="submit"
                className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
              >
                <span className="hidden sm:inline">Tìm gói học</span>
                <span className="sm:hidden">Tìm</span>
                <Icon name="arrow_forward" size="sm" />
              </button>
            </form>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Tìm nhanh:</span>
              {popularTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onTagClick(tag)}
                  className="inline-flex min-h-10 items-center rounded-full border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="hidden lg:flex items-center justify-center">
            <ServiceHeroVisual />
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
