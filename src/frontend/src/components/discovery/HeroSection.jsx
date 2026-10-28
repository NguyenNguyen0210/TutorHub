import React from 'react';
import PropTypes from 'prop-types';
import Icon from '@/components/ui/Icon';
import Input from '@/components/ui/Input';

export default function HeroSection({
  searchKeyword,
  setSearchKeyword,
  onSearchSubmit
}) {

  return (
    <section className="relative overflow-hidden border-b border-brand-primary-100 bg-brand-primary-50 py-7 sm:py-9">
      <div className="page-shell relative">
        <div className="mx-auto max-w-5xl space-y-4 text-center">
          <h1 className="text-[30px] font-bold leading-tight tracking-[-0.025em] text-neutral-900 sm:text-[38px]">
            Tìm gia sư phù hợp với bạn
          </h1>

          <p className="mx-auto max-w-2xl text-[14px] leading-relaxed text-neutral-600 sm:text-[16px]">
            Tìm theo môn học, mục tiêu và ngân sách. Hồ sơ rõ ràng, thanh toán được bảo chứng.
          </p>

          {/* Floating Search Bar: 52px height, 580px max-width, 130px button */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSearchSubmit(searchKeyword);
            }}
            className="relative mx-auto flex min-h-[60px] w-full min-w-0 max-w-3xl items-center rounded-brand-lg border border-neutral-200 bg-surface p-1 text-left shadow-brand-sm focus-within:border-brand-primary-600 focus-within:ring-2 focus-within:ring-brand-primary-600/20"
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
              className="h-full !w-auto min-w-0 flex-1 !border-none !bg-transparent px-1 text-[15px] !shadow-none placeholder:text-neutral-400 focus:!ring-0"
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
              className="flex size-[50px] shrink-0 items-center justify-center gap-1.5 rounded-brand-md bg-primary px-3 text-[13px] font-semibold text-white shadow-brand-sm transition-all hover:bg-primary-hover active:scale-[0.98] sm:h-[50px] sm:w-auto sm:min-w-[128px] sm:px-5 sm:text-[14px]"
              aria-label="Tìm gia sư"
            >
              <span className="hidden sm:inline">Tìm gia sư</span>
              <Icon name="arrow_forward" size="xs" />
            </button>
          </form>

        </div>
      </div>
    </section>
  );
}

HeroSection.propTypes = {
  searchKeyword: PropTypes.string.isRequired,
  setSearchKeyword: PropTypes.func.isRequired,
  onSearchSubmit: PropTypes.func.isRequired,
};
