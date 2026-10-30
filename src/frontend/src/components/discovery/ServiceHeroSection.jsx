import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import Icon from '@/components/ui/Icon';
import Money from '@/components/ui/Money';

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
  sampleServices = [],
}) {
  const visibleSamples = Array.isArray(sampleServices) ? sampleServices.slice(0, 2) : [];

  return (
    <section className="relative overflow-hidden border-b border-[color:var(--mkt-line)] bg-gradient-to-br from-blue-50 via-white to-sky-50 py-10 sm:py-14 lg:py-16">
      <div className="pointer-events-none absolute inset-0 opacity-60 [background-image:radial-gradient(#bfdbfe_1px,transparent_1px)] [background-size:22px_22px]" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-32 -top-40 h-[420px] w-[420px] rounded-full bg-blue-200/40 blur-3xl" aria-hidden="true" />

      <div className="page-shell relative">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)] lg:gap-14">
          <div>
            <div className="inline-flex min-h-9 items-center gap-2 rounded-full border border-blue-200 bg-white/90 px-3.5 text-xs font-bold uppercase tracking-[0.05em] text-blue-700 shadow-sm">
              <Icon name="verified" size="sm" />
              Gói học rõ ràng · Gia sư đã xác minh
            </div>

            <h1 className="mkt-display mt-5 max-w-3xl text-[38px] leading-[1.1] tracking-[-0.025em] text-[color:var(--mkt-ink)] sm:text-[48px] lg:text-[54px]">
              Chọn đúng gói học.
              <span className="block text-[color:var(--mkt-cobalt)]">Theo đúng lộ trình của bạn.</span>
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-[color:var(--mkt-body)] sm:text-[17px]">
              So sánh số buổi, thời lượng và học phí trọn gói trước khi đăng ký. Mỗi dịch vụ đều gắn với hồ sơ gia sư minh bạch.
            </p>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                onSearchSubmit(searchKeyword);
              }}
              className="mt-7 flex min-h-16 w-full max-w-[680px] items-center gap-2 rounded-2xl border border-blue-200 bg-white p-1.5 shadow-[0_16px_40px_-20px_rgba(37,99,235,0.45)] transition focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100"
              role="search"
              aria-label="Tìm kiếm dịch vụ học tập"
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
                <span className="hidden sm:inline">Tìm dịch vụ</span>
                <span className="sm:hidden">Tìm</span>
                <Icon name="arrow_forward" size="sm" />
              </button>
            </form>

            <div className="mt-4 flex flex-wrap items-center gap-2" aria-label="Từ khóa phổ biến">
              <span className="mr-1 text-sm font-semibold text-slate-600">Tìm nhanh:</span>
              {(popularTags ?? []).map((tag) => (
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

          <div className="relative hidden lg:block">
            <div className="rounded-[28px] border border-blue-200 bg-white/90 p-6 shadow-[0_24px_70px_-34px_rgba(30,64,175,0.45)] backdrop-blur-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.08em] text-blue-600">Khám phá theo nhu cầu</p>
                  <h2 className="mt-2 text-xl font-bold tracking-[-0.02em] text-slate-950">Gói học đang được quan tâm</h2>
                </div>
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
                  <Icon name="auto_stories" size="md" />
                </span>
              </div>

              <div className="mt-5 space-y-3">
                {visibleSamples.length > 0 ? visibleSamples.map((service) => {
                  const sessions = Number(service.totalSessions) || 0;
                  const duration = Number(service.sessionDurationMinutes) || 0;
                  const price = Number(service.price) || 0;
                  return (
                    <Link
                      key={service.id}
                      to={`/services/${service.id}`}
                      className="group flex min-h-[96px] items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md motion-reduce:transform-none"
                    >
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-blue-600">{service.subjectName || service.categoryName || 'Gói học'}</span>
                        <p className="mt-1 line-clamp-1 text-[15px] font-bold text-slate-950 group-hover:text-blue-700">{service.title}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          {sessions > 0 ? `${sessions} buổi` : 'Lộ trình linh hoạt'}
                          {duration > 0 ? ` · ${duration} phút/buổi` : ''}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="block text-xs text-slate-500">Trọn gói</span>
                        {price > 0 ? <Money value={price} className="mt-1 block text-base font-extrabold text-slate-950" /> : <span className="font-bold text-slate-950">Liên hệ</span>}
                        <span className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-blue-600">Xem gói <Icon name="arrow_forward" size="xs" /></span>
                      </div>
                    </Link>
                  );
                }) : (
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      ['calendar_month', 'Lộ trình', 'Rõ số buổi'],
                      ['schedule', 'Thời lượng', 'Theo từng buổi'],
                      ['payments', 'Học phí', 'Minh bạch'],
                    ].map(([icon, label, value]) => (
                      <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center">
                        <Icon name={icon} size="md" className="mx-auto text-blue-600" />
                        <span className="mt-2 block text-xs font-bold text-slate-950">{label}</span>
                        <span className="mt-1 block text-[11px] text-slate-500">{value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3 border-t border-slate-200 pt-5 text-center">
                <div><strong className="block text-base text-slate-950">100%</strong><span className="text-xs text-slate-500">hồ sơ xác minh</span></div>
                <div><strong className="block text-base text-slate-950">Rõ ràng</strong><span className="text-xs text-slate-500">lộ trình học</span></div>
                <div><strong className="block text-base text-slate-950">An toàn</strong><span className="text-xs text-slate-500">thanh toán</span></div>
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
  sampleServices: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    title: PropTypes.string,
    subjectName: PropTypes.string,
    categoryName: PropTypes.string,
    totalSessions: PropTypes.number,
    sessionDurationMinutes: PropTypes.number,
    price: PropTypes.number,
  })),
};
