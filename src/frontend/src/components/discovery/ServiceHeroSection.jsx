import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import Icon from '@/components/ui/Icon';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Money from '@/components/ui/Money';

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
  sampleServices = [],
}) {
  const visibleSamples = Array.isArray(sampleServices) ? sampleServices.slice(0, 3) : [];
  const showSamples = visibleSamples.length > 0;

  return (
    <section className="relative py-10 sm:py-12 bg-brand-primary-50 border-b border-brand-primary-100">
      <div className="page-shell">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Breadcrumb, Headline, Search, Popular Tags */}
          <div className={`${showSamples ? 'lg:col-span-7' : 'lg:col-span-12 max-w-3xl'} space-y-4`}>
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-[12px] font-medium text-neutral-500" aria-label="Breadcrumb">
              <Link to="/" className="text-neutral-500 hover:text-brand-primary-600 transition-colors">
                Trang chủ
              </Link>
              <span className="text-neutral-300">›</span>
              <span className="text-brand-primary-600 font-semibold">Dịch vụ học tập</span>
            </nav>

            <h1 className="max-w-xl border-l-4 border-brand-primary-600 pl-5 text-[34px] sm:text-[44px] font-bold text-neutral-900 leading-[1.12] tracking-[-0.03em]">
              Gói học rõ lộ trình, minh bạch học phí
            </h1>

            <p className="text-[13.5px] sm:text-[14.5px] text-neutral-600 max-w-xl leading-relaxed">
              Mỗi gói ghi rõ số buổi, giá mỗi buổi và học phí trọn gói —
              kèm buổi học thử để bạn yên tâm bắt đầu.
            </p>

            {/* Floating Search Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onSearchSubmit(searchKeyword);
              }}
              className="relative w-full max-w-[600px] h-16 flex items-center bg-surface p-1.5 rounded-brand-xl border border-neutral-200 shadow-brand-md hover:shadow-brand-lg focus-within:ring-2 focus-within:ring-brand-primary-600/20 focus-within:border-brand-primary-600 transition-all"
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
                placeholder="Tìm gói học hoặc kỹ năng…"
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
                  className="w-11 h-11 mr-1 inline-flex items-center justify-center rounded-brand-md text-neutral-400 hover:text-neutral-600 transition-colors"
                  aria-label="Xóa từ khóa"
                >
                  <Icon name="close" size="xs" />
                </button>
              )}

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="!rounded-brand-lg px-4 h-[3.25rem] text-[13px] font-semibold shrink-0 gap-1.5 shadow-brand-sm"
              >
                <span>Tìm dịch vụ</span>
                <Icon name="arrow_forward" size="xs" />
              </Button>
            </form>

            {/* Popular Tags */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-[12.5px]">
              <span className="font-semibold text-neutral-500">Phổ biến:</span>
              {(popularTags ?? []).map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onTagClick(tag)}
                  className="min-h-9 px-2.5 py-1 rounded-pill bg-white/90 hover:bg-white text-neutral-700 hover:text-brand-primary-600 border border-neutral-200/80 hover:border-brand-primary-600/40 shadow-brand-sm font-medium text-[11.5px] transition-all cursor-pointer"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Real package mini-cards — hidden when no data */}
          {showSamples && (
            <div className="lg:col-span-5">
              <div className="w-full max-w-[460px] mx-auto lg:ml-auto space-y-2.5">
                <h2 className="text-[13px] font-semibold text-neutral-700">
                  Gói học đang được quan tâm
                </h2>
                {visibleSamples.map((service, index) => {
                  const totalSessions = Number(service.totalSessions) || 0;
                  const sessionDuration = Number(service.sessionDurationMinutes) || 0;
                  const price = Number(service.price) || 0;
                  const sessionLabel =
                    totalSessions > 0 && sessionDuration > 0
                      ? `${totalSessions} buổi · ${sessionDuration} phút/buổi`
                      : totalSessions > 0
                        ? `${totalSessions} buổi`
                        : null;
                  return (
                    <Link
                      key={service.id ?? service.title ?? index}
                      to={`/services/${service.id}`}
                      className="group flex items-center justify-between gap-3 bg-surface rounded-brand-lg border border-neutral-200/90 hover:shadow-brand-md hover:border-brand-primary-300 transition-all p-4"
                    >
                      <div className="min-w-0 space-y-1">
                        <span className="inline-block text-[11.5px] font-medium line-clamp-1 text-brand-primary-700">
                          {service.subjectName || service.categoryName || 'Gói học'}
                        </span>
                        <p
                          title={service.title}
                          className="text-[13.5px] font-bold text-neutral-900 group-hover:text-brand-primary-600 transition-colors line-clamp-1 leading-snug"
                        >
                          {service.title}
                        </p>
                        {sessionLabel && (
                          <p className="flex items-center gap-1 text-[12px] text-neutral-500 font-medium">
                            <Icon name="schedule" size="xs" className="text-brand-primary-600" />
                            <span>{sessionLabel}</span>
                          </p>
                        )}
                      </div>
                      <div className="shrink-0 text-right space-y-0.5">
                        {price > 0 && (
                          <>
                            <span className="text-[10.5px] text-neutral-500 font-medium block">
                              Trọn gói
                            </span>
                            <Money
                              value={price}
                              className="text-[15px] font-extrabold text-brand-primary-600"
                            />
                          </>
                        )}
                        <span className="flex items-center justify-end gap-0.5 text-[12px] font-semibold text-neutral-400 group-hover:text-brand-primary-600 transition-colors">
                          <span>Xem gói</span>
                          <Icon name="arrow_forward" size="xs" />
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
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
  sampleServices: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      title: PropTypes.string,
      subjectName: PropTypes.string,
      categoryName: PropTypes.string,
      totalSessions: PropTypes.number,
      sessionDurationMinutes: PropTypes.number,
      price: PropTypes.number,
    }),
  ),
};
