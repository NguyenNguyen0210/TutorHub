import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import Icon from '@/components/ui/Icon';
import Input from '@/components/ui/Input';

const POPULAR_TAGS = [
  { label: 'Toán', query: 'Toán' },
  { label: 'IELTS', query: 'IELTS' },
  { label: 'Lập trình', query: 'Lập trình' },
  { label: 'Vật lý', query: 'Vật lý' },
];

const TRUST_STEPS = [
  {
    icon: 'verified_user',
    title: 'Chọn gia sư đã xác minh',
    body: 'Học vấn, chứng chỉ và đánh giá thật.',
  },
  {
    icon: 'event_available',
    title: 'Đặt lịch và giữ chỗ 15 phút',
    body: 'Chọn buổi học phù hợp với lịch của bạn.',
  },
  {
    icon: 'payments',
    title: 'Học xong, tiền mới giải ngân',
    body: 'TutorHub giữ học phí đến khi buổi học hoàn tất.',
  },
];

export default function HeroSection({
  searchKeyword,
  setSearchKeyword,
  onSearchSubmit,
  totalCount,
}) {
  const count = Number(totalCount);
  const countLabel =
    Number.isFinite(count) && count > 0
      ? `${new Intl.NumberFormat('vi-VN').format(count)} hồ sơ`
      : null;

  const handleTagClick = (query) => {
    setSearchKeyword(query);
    onSearchSubmit(query);
  };

  return (
    <section className="border-b border-[color:var(--mkt-line)] bg-[color:var(--mkt-canvas)]">
      <div className="page-shell">
        <div className="grid gap-10 py-10 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.75fr)] lg:items-start lg:gap-11 lg:py-11">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-px w-6 bg-[color:var(--mkt-cobalt)]" aria-hidden="true" />
              <span className="mkt-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[color:var(--mkt-muted)]">
                Gia sư đã xác minh{countLabel ? ` · ${countLabel}` : ''}
              </span>
            </div>

            <h1 className="mkt-display mt-4 max-w-[580px] text-[29px] leading-[1.12] tracking-[-0.045em] text-[color:var(--mkt-ink)] sm:text-[38px] lg:text-[44px] lg:leading-[1.1]">
              Tìm người dạy đúng điều{' '}
              <span className="mkt-highlight">bạn cần học.</span>
            </h1>

            <p className="mt-4 max-w-[560px] text-[13px] leading-relaxed text-[color:var(--mkt-body)] sm:text-[14px]">
              Hồ sơ rõ ràng, lịch học linh hoạt và học phí được giữ an toàn cho đến khi
              buổi học hoàn tất.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                onSearchSubmit(searchKeyword);
              }}
              className="mt-7 flex min-h-[48px] w-full max-w-[660px] items-center rounded-[10px] border border-[color:var(--mkt-line)] bg-white p-1 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition focus-within:border-[color:var(--mkt-cobalt)] focus-within:ring-2 focus-within:ring-[color:var(--mkt-cobalt)]/15"
              role="search"
              aria-label="Tìm kiếm gia sư"
            >
              <span className="pointer-events-none pl-3.5 pr-2 text-[color:var(--mkt-muted)]">
                <Icon name="search" size="md" strokeWidth={1.7} />
              </span>

              <Input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="Tìm môn học hoặc gia sư…"
                aria-label="Từ khóa tìm kiếm gia sư"
                className="h-full !w-auto min-w-0 flex-1 !border-none !bg-transparent px-1 text-[14px] !shadow-none placeholder:text-[color:var(--mkt-muted)] focus:!ring-0"
              />

              {searchKeyword && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchKeyword('');
                    onSearchSubmit('');
                  }}
                  className="mr-1 inline-flex h-10 w-10 items-center justify-center rounded-[8px] text-[color:var(--mkt-muted)] transition-colors hover:bg-[color:var(--mkt-canvas)] hover:text-[color:var(--mkt-ink)]"
                  aria-label="Xóa từ khóa tìm kiếm"
                >
                  <Icon name="close" size="sm" strokeWidth={1.7} />
                </button>
              )}

              <button
                type="submit"
                className="inline-flex h-10 min-h-10 shrink-0 items-center justify-center gap-1.5 rounded-[8px] bg-[color:var(--mkt-cobalt)] px-3 text-[12px] font-bold text-white transition-colors hover:bg-[color:var(--mkt-cobalt-hover)] sm:h-11 sm:min-h-11 sm:min-w-[128px] sm:px-5"
                aria-label="Tìm gia sư"
              >
                <span className="hidden sm:inline">Tìm gia sư</span>
                <Icon name="arrow_forward" size="xs" strokeWidth={1.7} />
              </button>
            </form>

            <div className="mt-3 hidden flex-wrap items-center gap-2 sm:flex">
              <span className="text-[10.5px] font-medium text-[color:var(--mkt-muted)]">
                Phổ biến:
              </span>
              {POPULAR_TAGS.map((tag) => (
                <button
                  key={tag.label}
                  type="button"
                  onClick={() => handleTagClick(tag.query)}
                  className="inline-flex min-h-8 items-center rounded-full border border-[color:var(--mkt-line)] bg-white px-3 py-1 text-[10.5px] font-semibold text-[color:var(--mkt-body)] transition-colors hover:border-[color:var(--mkt-cobalt-100)] hover:text-[color:var(--mkt-cobalt)]"
                >
                  {tag.label}
                </button>
              ))}
            </div>
          </div>

          <aside className="hidden lg:block">
            <div className="rounded-[14px] border border-[color:var(--mkt-line)] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] bg-[color:var(--mkt-cobalt-50)] text-[color:var(--mkt-cobalt)]">
                  <Icon name="shield" size="sm" strokeWidth={1.7} />
                </span>
                <div>
                  <h2 className="mkt-display text-[13.5px] font-extrabold tracking-[-0.02em] text-[color:var(--mkt-ink)]">
                    Học an toàn từ buổi đầu tiên
                  </h2>
                  <p className="mt-1 text-[10.5px] leading-relaxed text-[color:var(--mkt-body)]">
                    Ba bước, mỗi bước đều có bằng chứng.
                  </p>
                </div>
              </div>

              <div className="mt-4">
                {TRUST_STEPS.map((step, index) => (
                  <div key={step.title} className="relative flex gap-3 pb-4 last:pb-0">
                    {index < TRUST_STEPS.length - 1 && (
                      <span
                        className="absolute left-[9px] top-5 h-[calc(100%-8px)] w-px bg-[color:var(--mkt-line)]"
                        aria-hidden="true"
                      />
                    )}
                    <span className="relative z-10 mt-0.5 flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full border border-[color:var(--mkt-cobalt-100)] bg-[color:var(--mkt-cobalt-50)] text-[color:var(--mkt-cobalt)]">
                      <Icon name={step.icon} size="xs" strokeWidth={1.7} className="h-3 w-3" />
                    </span>
                    <div>
                      <p className="text-[12px] font-bold leading-snug text-[color:var(--mkt-ink)]">
                        {step.title}
                      </p>
                      <p className="mt-0.5 text-[10.5px] leading-relaxed text-[color:var(--mkt-body)]">
                        {step.body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <Link
                to="/how-it-works"
                className="mt-4 inline-flex items-center gap-1.5 border-t border-[color:var(--mkt-line)] pt-3 text-[11px] font-semibold text-[color:var(--mkt-cobalt)] hover:underline"
              >
                Tìm hiểu cách bảo chứng
                <Icon name="arrow_forward" size="xs" strokeWidth={1.7} />
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

HeroSection.propTypes = {
  searchKeyword: PropTypes.string.isRequired,
  setSearchKeyword: PropTypes.func.isRequired,
  onSearchSubmit: PropTypes.func.isRequired,
  totalCount: PropTypes.number,
};
