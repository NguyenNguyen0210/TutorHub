import React from 'react';
import PropTypes from 'prop-types';
import Icon from '@/components/ui/Icon';

const POPULAR_TAGS = ['Toán', 'IELTS', 'Lập trình', 'Vật lý'];

export default function HeroSection({ searchKeyword, setSearchKeyword, onSearchSubmit }) {
  const submitSearch = (value) => {
    const nextValue = value.trim();
    setSearchKeyword(nextValue);
    onSearchSubmit(nextValue);
  };

  return (
    <section className="mkt-hero" aria-labelledby="marketplace-heading">
      <div className="page-shell relative z-10">
        <div className="grid items-center gap-10 py-10 lg:min-h-[450px] lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,.95fr)] lg:gap-14 lg:py-8">
          <div className="max-w-[720px]">
            <h1 id="marketplace-heading" className="mkt-display text-[38px] leading-[1.1] tracking-[-0.025em] text-[color:var(--mkt-ink)] sm:text-[48px] lg:text-[54px]">
              Đúng người dạy.
              <span className="block text-[color:var(--mkt-cobalt)]">Đúng cách bạn học.</span>
            </h1>

            <p className="mt-6 max-w-[600px] text-[15px] leading-7 text-[color:var(--mkt-body)] sm:text-[17px]">
              Tìm gia sư đã được duyệt hồ sơ, so sánh thông tin và bắt đầu hành trình học tập theo nhịp riêng của bạn.
            </p>

            <form
              className="mkt-search mt-8"
              role="search"
              aria-label="Tìm kiếm gia sư"
              onSubmit={(event) => {
                event.preventDefault();
                submitSearch(searchKeyword);
              }}
            >
              <Icon name="search" size="md" strokeWidth={1.8} className="mkt-search-icon" />
              <label htmlFor="marketplace-search" className="sr-only">Môn học hoặc tên gia sư</label>
              <input
                id="marketplace-search"
                type="search"
                value={searchKeyword}
                onChange={(event) => setSearchKeyword(event.target.value)}
                placeholder="Bạn muốn học gì hôm nay?"
                className="mkt-search-input"
              />
              <button type="submit" className="mkt-search-button">
                <span>Tìm gia sư</span>
                <Icon name="arrow_forward" size="sm" strokeWidth={1.9} />
              </button>
            </form>

            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              <span className="text-[12px] font-semibold text-[color:var(--mkt-muted)]">Tìm nhiều:</span>
              {POPULAR_TAGS.map((tag) => (
                <button key={tag} type="button" onClick={() => submitSearch(tag)} className="mkt-popular-link">
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="mkt-hero-visual hidden lg:block">
            <img
              src="/images/transparent-student-clean.png"
              alt="Học viên đang học trực tuyến cùng TutorHub"
              width="1200"
              height="896"
              className="mkt-hero-image"
              loading="eager"
            />
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
};
