import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { cn } from '@/lib/cn';
import tutorService from '@/services/tutor.service';
import { CardSkeleton } from '@/components/common/Skeleton';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge, { Tag } from '@/components/ui/Badge';
import Input, { Select, Field } from '@/components/ui/Input';
import Icon from '@/components/ui/Icon';
import Avatar from '@/components/ui/Avatar';
import Callout from '@/components/ui/Callout';
import { Pagination } from '@/components/ui/Table';
import { formatRating } from '@/utils/formatters';
import Money from '@/components/ui/Money';
import { getTeachingModeMeta } from '@/config/enums';

const POPULAR_SEARCH_TAGS = [
  'Toán THPT',
  'IELTS',
  'Lập trình',
  'Vật lý',
  'Ngữ văn',
  'Tiếng Anh',
];

const PRICE_RANGES = [
  { label: 'Tất cả mức giá', min: null, max: null },
  { label: 'Dưới 1.000.000 ₫', min: null, max: 1000000 },
  { label: '1.000.000 – 2.500.000 ₫', min: 1000000, max: 2500000 },
  { label: 'Trên 2.500.000 ₫', min: 2500000, max: null },
];

export default function Marketplace() {
  const [searchParams] = useSearchParams();
  const [tutors, setTutors] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [searchKeyword, setSearchKeyword] = useState(searchParams.get('q') || '');
  const [debouncedKeyword, setDebouncedKeyword] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedPriceRange, setSelectedPriceRange] = useState(0);
  const [teachingMode, setTeachingMode] = useState('All');
  const [minRating, setMinRating] = useState(null);
  const [sortBy, setSortBy] = useState('rating_desc');
  const [pageNumber, setPageNumber] = useState(1);
  const pageSize = 12;

  // Debounce search input to avoid request floods
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(searchKeyword);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchKeyword]);

  useEffect(() => {
    let cancelled = false;
    async function loadCategories() {
      try {
        const list = await tutorService.getCategories();
        if (!cancelled) setCategories(Array.isArray(list) ? list : []);
      } catch (err) {
        console.warn('[Marketplace] Không tải được /categories:', err.message);
      }
    }
    loadCategories();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadTutors() {
      try {
        setLoading(true);
        setError(null);

        const activePrice = PRICE_RANGES[selectedPriceRange];
        const selected = categories.find((category) => category.id === selectedCategory);
        const effectiveSearch =
          debouncedKeyword.trim() || (!selectedSubjectId ? selected?.name : '') || '';

        const page = await tutorService.getTutors({
          subjectId: selectedSubjectId || null,
          minPrice: activePrice.min,
          maxPrice: activePrice.max,
          search: effectiveSearch,
          teachingMode: teachingMode !== 'All' ? teachingMode : null,
          minRating: minRating || null,
          sortBy,
          pageNumber,
          pageSize,
        });

        if (cancelled) return;
        setTutors(Array.isArray(page.items) ? page.items : []);
        setTotalCount(page.totalCount ?? 0);
      } catch (err) {
        if (cancelled) return;
        setTutors([]);
        setTotalCount(0);
        setError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadTutors();
    return () => {
      cancelled = true;
    };
  }, [
    debouncedKeyword,
    selectedCategory,
    selectedSubjectId,
    selectedPriceRange,
    teachingMode,
    minRating,
    sortBy,
    categories,
    reloadToken,
    pageNumber,
  ]);

  const CATEGORY_ICONS = ['auto_stories', 'calculate', 'translate', 'terminal', 'military_tech', 'science'];
  const categoryPills = [
    { id: '', name: 'Tất cả bộ môn', icon: 'auto_stories' },
    ...categories.map((category, index) => ({
      id: category.id,
      name: category.name,
      icon: CATEGORY_ICONS[(index + 1) % CATEGORY_ICONS.length],
    })),
  ];

  const activeCategoryObj = categories.find((c) => c.id === selectedCategory);
  const categorySubjects = activeCategoryObj?.subjects || [];

  const totalPages = Math.ceil(totalCount / pageSize);

  const resetFilters = () => {
    setTeachingMode('All');
    setMinRating(null);
    setSelectedPriceRange(0);
    setSearchKeyword('');
    setDebouncedKeyword('');
    setSelectedCategory('');
    setSelectedSubjectId('');
    setPageNumber(1);
  };

  const activeFilterCount =
    (teachingMode !== 'All' ? 1 : 0) +
    (minRating !== null ? 1 : 0) +
    (selectedCategory ? 1 : 0) +
    (selectedSubjectId ? 1 : 0) +
    (selectedPriceRange > 0 ? 1 : 0) +
    (debouncedKeyword.trim() ? 1 : 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-brand-xl bg-brand-navy-950 px-6 py-10 sm:p-12 text-white shadow-brand-lg">
        <div
          className="absolute -top-24 right-10 w-96 h-96 bg-brand-primary-600/20 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-24 left-10 w-80 h-80 bg-success/15 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        <div className="relative z-10 max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-pill bg-white/10 border border-white/15 backdrop-blur-sm text-caption font-semibold text-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            HỌC TẬP AN TOÀN &amp; ĐẢM BẢO CHẤT LƯỢNG
          </div>

          <h1 className="text-display-hero sm:text-[48px] sm:leading-[1.15] text-white font-bold tracking-tight">
            Tìm gia sư giỏi &amp; khóa học chất lượng cao
          </h1>

          <p className="text-body-reg sm:text-body-lg text-slate-300 leading-relaxed max-w-2xl">
            Học tập an tâm và hiệu quả: kết nối trực tiếp với các gia sư hàng đầu, lộ trình
            cá nhân hóa và thanh toán minh bạch bảo chứng Escrow theo từng buổi học.
          </p>

          <form
            className="pt-2 flex flex-col sm:flex-row gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              setDebouncedKeyword(searchKeyword);
              setPageNumber(1);
            }}
            role="search"
            aria-label="Tìm kiếm gia sư"
          >
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-fg-muted pointer-events-none">
                <Icon name="search" size="md" />
              </span>
              <Input
                type="text"
                value={searchKeyword}
                onChange={(e) => {
                  setSearchKeyword(e.target.value);
                  setPageNumber(1);
                }}
                placeholder="Tìm theo môn học, gia sư, trường ĐH (VD: Toán 12, IELTS 8.0, Bách Khoa)..."
                aria-label="Từ khóa tìm kiếm gia sư"
                className="pl-12 pr-10 h-12 rounded-brand-md bg-white border-white text-fg placeholder:text-fg-muted shadow-brand-md focus:ring-2 focus:ring-brand-primary-400"
              />
              {searchKeyword && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchKeyword('');
                    setDebouncedKeyword('');
                    setPageNumber(1);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-fg-muted hover:text-fg transition-colors cursor-pointer"
                  aria-label="Xóa từ khóa tìm kiếm"
                >
                  <Icon name="close" size="sm" />
                </button>
              )}
            </div>
            <Button type="submit" variant="primary" size="lg" icon={<Icon name="tune" size="sm" />}>
              Tìm kiếm ngay
            </Button>
          </form>

          {/* Quick search tags */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-caption text-slate-300">
            <span className="text-[11px] font-medium text-slate-400">Gợi ý tìm kiếm:</span>
            {POPULAR_SEARCH_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => {
                  setSearchKeyword(tag);
                  setDebouncedKeyword(tag);
                  setSelectedCategory('');
                  setSelectedSubjectId('');
                  setPageNumber(1);
                }}
                className="text-[11px] px-2.5 py-1 rounded-pill bg-white/5 hover:bg-white/15 text-slate-200 transition-colors cursor-pointer border border-white/10"
              >
                {tag}
              </button>
            ))}
          </div>

          <dl className="flex flex-wrap items-center gap-x-8 gap-y-3 pt-4 mt-2 border-t border-white/10">
            {[
              { value: String(totalCount), label: 'gia sư đang giảng dạy' },
              { value: String(categories.length), label: 'lĩnh vực & bộ môn' },
              { value: '100%', label: 'học phí bảo chứng Escrow' },
            ].map((s) => (
              <div key={s.label}>
                <dt className="sr-only">{s.label}</dt>
                <dd className="text-headline-2 text-white tabular-nums m-0 font-bold">{s.value}</dd>
                <dd className="text-[11px] text-slate-400 m-0">{s.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* 3 Value Proposition Bento Cards */}
      <section
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
        aria-label="Cam kết bảo chứng nền tảng"
      >
        {[
          {
            icon: 'hourglass_top',
            tone: 'holding',
            badge: 'BẢO CHỨNG THỜI GIAN',
            title: '1. Giữ chỗ chuẩn xác 15 phút',
            desc: 'Giữ lịch hẹn thuận tiện với đồng hồ đếm ngược server-sync, thanh toán nhanh chóng qua VNPay.',
          },
          {
            icon: 'shield',
            tone: 'success',
            badge: 'ESCROW BẢO VỆ DÒNG TIỀN',
            title: '2. Thanh toán bảo chứng an toàn',
            desc: 'Học phí được bảo chứng trong ví ký quỹ, chỉ giải ngân cho gia sư khi buổi học hoàn thành.',
          },
          {
            icon: 'verified_user',
            tone: 'primary',
            badge: 'ĐỐI SOÁT 2 CHIỀU',
            title: '3. Điểm danh & Trọng tài tranh chấp',
            desc: 'Đối soát điểm danh 2 chiều minh bạch, có cơ chế phân xử tài chính DEC-S8-025 bảo vệ quyền lợi.',
          },
        ].map((s) => (
          <Card
            key={s.title}
            hoverable
            className="p-5 border border-border/80 hover:border-brand-primary-300 hover:shadow-brand-md transition-all duration-200 flex flex-col justify-between"
          >
            <div className="flex items-start gap-3.5">
              <span
                className={cn(
                  'w-11 h-11 rounded-brand-md flex items-center justify-center shrink-0 shadow-brand-sm',
                  s.tone === 'holding' && 'bg-holding-subtle text-holding-strong border border-holding/20',
                  s.tone === 'success' && 'bg-success-subtle text-success-strong border border-success/20',
                  s.tone === 'primary' && 'bg-brand-primary-50 text-brand-primary-600 border border-brand-primary-200'
                )}
              >
                <Icon name={s.icon} size="md" />
              </span>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-fg-muted tracking-wider uppercase block">
                  {s.badge}
                </span>
                <h2 className="text-caption font-bold text-fg tracking-wide">{s.title}</h2>
                <p className="text-[12px] text-fg-secondary leading-relaxed">{s.desc}</p>
              </div>
            </div>
          </Card>
        ))}
      </section>

      {/* Category Pills & Secondary Subject Filter */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none" role="group" aria-label="Lọc theo danh mục">
          {categoryPills.map((pill) => {
            const active = selectedCategory === pill.id;
            return (
              <button
                key={pill.id || 'all'}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setSelectedCategory(pill.id);
                  setSelectedSubjectId('');
                  setPageNumber(1);
                }}
                className={cn(
                  'px-4 py-2.5 rounded-brand-md font-semibold text-body-reg shrink-0 flex items-center gap-2 transition-all cursor-pointer',
                  active
                    ? 'bg-brand-primary-600 text-white shadow-brand-sm ring-2 ring-brand-primary-600/20'
                    : 'bg-surface border border-border text-fg-secondary hover:bg-neutral-50 hover:text-fg'
                )}
              >
                <Icon name={pill.icon} size="sm" />
                {pill.name}
              </button>
            );
          })}
        </div>

        {/* Secondary Subject Chips when Category is selected */}
        {categorySubjects.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pl-1 animate-fade-in">
            <span className="text-[11px] font-bold text-fg-muted uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
              <Icon name="subdirectory_arrow_right" size="xs" />
              Bộ môn:
            </span>
            <button
              type="button"
              onClick={() => {
                setSelectedSubjectId('');
                setPageNumber(1);
              }}
              className={cn(
                'px-3 py-1 rounded-pill text-[12px] font-semibold shrink-0 transition-colors cursor-pointer',
                !selectedSubjectId
                  ? 'bg-brand-primary-100 text-brand-primary-800'
                  : 'bg-neutral-100 text-fg-secondary hover:bg-neutral-200'
              )}
            >
              Tất cả ({activeCategoryObj?.name})
            </button>
            {categorySubjects.map((sub) => (
              <button
                key={sub.id}
                type="button"
                onClick={() => {
                  setSelectedSubjectId(sub.id === selectedSubjectId ? '' : sub.id);
                  setPageNumber(1);
                }}
                className={cn(
                  'px-3 py-1 rounded-pill text-[12px] font-semibold shrink-0 transition-colors cursor-pointer',
                  selectedSubjectId === sub.id
                    ? 'bg-brand-primary-600 text-white shadow-brand-xs'
                    : 'bg-neutral-100 text-fg-secondary hover:bg-neutral-200'
                )}
              >
                {sub.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Filters */}
        <div className="lg:col-span-1">
          <Card padding="md" className="space-y-5 lg:sticky lg:top-24 border border-border/80 shadow-brand-sm">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <span className="font-bold text-body-reg text-fg flex items-center gap-2">
                <Icon name="filter_list" size="sm" className="text-brand-primary-600" />
                Bộ lọc nâng cao
                {activeFilterCount > 0 && (
                  <Badge variant="primary" size="sm">
                    {activeFilterCount}
                  </Badge>
                )}
              </span>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-[11px] text-brand-primary-700 font-semibold hover:underline cursor-pointer"
                >
                  Đặt lại
                </button>
              )}
            </div>

            {/* Price Range Filter */}
            <div className="space-y-2">
              <span
                id="price-filter-label"
                className="text-caption font-semibold text-fg-secondary uppercase tracking-wide block"
              >
                Khoảng học phí
              </span>
              <div
                className="space-y-1"
                role="radiogroup"
                aria-labelledby="price-filter-label"
              >
                {PRICE_RANGES.map((range, idx) => (
                  <button
                    key={range.label}
                    type="button"
                    role="radio"
                    aria-checked={selectedPriceRange === idx}
                    onClick={() => {
                      setSelectedPriceRange(idx);
                      setPageNumber(1);
                    }}
                    className={cn(
                      'w-full text-left px-3 py-2 text-caption font-medium rounded-brand-sm transition-colors cursor-pointer flex items-center justify-between',
                      selectedPriceRange === idx
                        ? 'bg-brand-primary-50 text-brand-primary-700 font-bold border border-brand-primary-200'
                        : 'text-fg-secondary hover:bg-neutral-50 hover:text-fg'
                    )}
                  >
                    <span>{range.label}</span>
                    {selectedPriceRange === idx && (
                      <Icon name="check" size="xs" className="text-brand-primary-600" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Teaching Mode Filter */}
            <div className="space-y-2">
              <span
                id="mode-filter-label"
                className="text-caption font-semibold text-fg-secondary uppercase tracking-wide block"
              >
                Hình thức giảng dạy
              </span>
              <div
                className="grid grid-cols-4 gap-1 p-1 bg-neutral-100 rounded-brand-md"
                role="radiogroup"
                aria-labelledby="mode-filter-label"
              >
                {['All', 'Online', 'Offline', 'Both'].map((m) => (
                  <button
                    key={m}
                    type="button"
                    role="radio"
                    aria-checked={teachingMode === m}
                    onClick={() => {
                      setTeachingMode(m);
                      setPageNumber(1);
                    }}
                    className={cn(
                      'py-2 text-caption font-bold rounded-brand-sm transition-colors cursor-pointer',
                      teachingMode === m
                        ? 'bg-surface text-brand-primary-700 shadow-brand-sm'
                        : 'text-fg-secondary hover:text-fg'
                    )}
                  >
                    {m === 'All' ? 'Tất cả' : m === 'Both' ? 'Cả hai' : m}
                  </button>
                ))}
              </div>
            </div>

            {/* Rating Filter */}
            <div className="space-y-2">
              <span
                id="rating-filter-label"
                className="text-caption font-semibold text-fg-secondary uppercase tracking-wide block"
              >
                Đánh giá tối thiểu
              </span>
              <div
                className="grid grid-cols-4 gap-1 p-1 bg-neutral-100 rounded-brand-md"
                role="radiogroup"
                aria-labelledby="rating-filter-label"
              >
                {[
                  { label: 'Tất cả', value: null },
                  { label: '4.0', value: 4.0 },
                  { label: '4.5', value: 4.5 },
                  { label: '4.8', value: 4.8 },
                ].map((r) => (
                  <button
                    key={r.label}
                    type="button"
                    role="radio"
                    aria-checked={minRating === r.value}
                    onClick={() => {
                      setMinRating(r.value);
                      setPageNumber(1);
                    }}
                    className={cn(
                      'py-1.5 text-caption font-bold rounded-brand-sm transition-colors cursor-pointer flex items-center justify-center gap-1',
                      minRating === r.value
                        ? 'bg-surface text-brand-primary-700 shadow-brand-sm'
                        : 'text-fg-secondary hover:text-fg'
                    )}
                  >
                    <span>{r.label}</span>
                    {r.value && <Icon name="star" size="xs" filled className="text-amber-500" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Sorting Dropdown */}
            <Field label="Ưu tiên sắp xếp" htmlFor="marketplace-sort">
              <Select
                id="marketplace-sort"
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPageNumber(1);
                }}
              >
                <option value="rating_desc">Đánh giá cao nhất (5.0)</option>
                <option value="price_asc">Học phí: Thấp đến cao</option>
                <option value="price_desc">Học phí: Cao đến thấp</option>
                <option value="reviews">Nhiều đánh giá nhất</option>
              </Select>
            </Field>

            <Callout variant="info" title="Gia sư đã thẩm định">
              100% gia sư đều được xác thực bằng cấp cử nhân/thạc sĩ có dấu đỏ trước khi cấp quyền niêm yết.
            </Callout>
          </Card>
        </div>

        {/* Tutor Directory List */}
        <div className="lg:col-span-3 space-y-5">
          <div className="flex items-center justify-between">
            <p className="text-caption font-bold text-fg-muted uppercase tracking-wide">
              {totalCount} gia sư uy tín sẵn sàng
            </p>
            {activeFilterCount > 0 && (
              <span className="text-[12px] text-fg-secondary">
                Đang áp dụng <strong className="text-brand-primary-600">{activeFilterCount}</strong> bộ lọc
              </span>
            )}
          </div>

          {error && !loading && (
            <ErrorState
              error={error}
              title="Không tải được danh sách gia sư"
              onRetry={() => setReloadToken((token) => token + 1)}
            />
          )}

          {loading && <CardSkeleton count={4} />}

          {!loading && !error && tutors.length === 0 && (
            <EmptyState
              icon="person_search"
              title="Không tìm thấy gia sư phù hợp"
              description="Hãy thử từ khóa khác hoặc điều chỉnh lại danh mục, khoảng học phí và hình thức giảng dạy."
              actionLabel="Xem tất cả gia sư"
              onAction={resetFilters}
            />
          )}

          {!loading && !error && tutors.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {tutors.map((tut) => {
                const modeMeta = getTeachingModeMeta(tut.teachingMode);
                const hasRating =
                  Number.isFinite(Number(tut.ratingAvg)) && Number(tut.ratingAvg) > 0;
                return (
                  <Card
                    key={tut.id}
                    padding="none"
                    hoverable
                    className="flex flex-col justify-between overflow-hidden group border border-border/80 hover:border-brand-primary-300 hover:shadow-brand-md transition-all duration-200"
                  >
                    <div className="p-5 space-y-3.5">
                      <div className="flex items-start gap-4">
                        <Link to={`/tutors/${tut.id}`} className="relative shrink-0 block">
                          <Avatar
                            src={tut.avatarUrl}
                            name={tut.fullName}
                            size="lg"
                            className="rounded-brand-md w-16 h-16 text-headline-2 ring-2 ring-transparent group-hover:ring-brand-primary-400 transition-all"
                          />
                          <span
                            className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-success border-2 border-white"
                            title="Trực tuyến"
                          />
                        </Link>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <Link
                              to={`/tutors/${tut.id}`}
                              className="text-headline-3 text-fg font-bold truncate group-hover:text-brand-primary-600 transition-colors"
                            >
                              {tut.fullName}
                            </Link>
                            {tut.isVerified && (
                              <span title="Gia sư đã xác thực bằng cấp">
                                <Icon name="verified" size="sm" className="text-success shrink-0" filled />
                              </span>
                            )}
                          </div>
                          <p className="text-caption font-semibold text-brand-primary-700 line-clamp-1 flex items-center gap-1 mt-0.5">
                            <Icon name="school" size="xs" className="shrink-0 text-brand-primary-500" />
                            {tut.education || 'Gia sư chuyên môn'}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span className="flex items-center text-brand-secondary-600 text-caption font-bold">
                              <Icon name="star" size="sm" filled className="mr-0.5 text-brand-secondary-500" />
                              {hasRating ? formatRating(tut.ratingAvg, 2) : '—'}
                            </span>
                            <span className="text-[11px] text-fg-muted">
                              ({tut.totalReviews} đánh giá)
                            </span>
                            <Badge variant={modeMeta.color} size="sm">
                              {modeMeta.label}
                            </Badge>
                            {tut.experienceYears > 0 && (
                              <Badge variant="neutral" size="sm">
                                {tut.experienceYears} năm KN
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <p className="text-caption text-fg-secondary line-clamp-2 leading-relaxed">
                        {tut.bio || 'Chưa có thông tin giới thiệu chi tiết.'}
                      </p>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {(tut.subjects ?? []).map((subject) => (
                          <Tag key={subject}>{subject}</Tag>
                        ))}
                      </div>
                    </div>

                    <div className="px-5 py-3.5 bg-neutral-50/80 border-t border-border flex items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] text-fg-muted font-bold uppercase tracking-wide block">
                          Gói học từ
                        </span>
                        <div className="text-headline-2 text-success-strong font-bold">
                          {tut.minPrice === null || tut.minPrice === undefined ? (
                            <span className="text-body-reg text-fg-muted font-normal">Liên hệ</span>
                          ) : (
                            <Money value={tut.minPrice} />
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          as={Link}
                          to={`/app/messages?tutorId=${tut.id}`}
                          variant="outline"
                          size="sm"
                          icon={<Icon name="chat" size="sm" />}
                        >
                          Nhắn tin
                        </Button>
                        <Button
                          as={Link}
                          to={`/tutors/${tut.id}`}
                          variant="primary"
                          size="sm"
                          iconRight={<Icon name="arrow_forward" size="sm" />}
                        >
                          Xem hồ sơ
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {!loading && !error && totalPages > 1 && (
            <div className="pt-5 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-caption">
              <span className="text-fg-muted">
                Hiển thị{' '}
                <strong className="text-fg">{(pageNumber - 1) * pageSize + 1}</strong> –{' '}
                <strong className="text-fg">{Math.min(pageNumber * pageSize, totalCount)}</strong>{' '}
                trong <strong className="text-fg">{totalCount}</strong> gia sư
              </span>
              <Pagination
                page={pageNumber}
                totalPages={totalPages}
                onChange={(p) => {
                  setPageNumber(p);
                  window.scrollTo({ top: 380, behavior: 'smooth' });
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
