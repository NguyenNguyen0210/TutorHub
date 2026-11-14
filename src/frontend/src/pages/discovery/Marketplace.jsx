import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import tutorService from '@/services/tutor.service';
import useDiscoveryQueryState, { readDiscoveryQuery } from '@/hooks/useDiscoveryQueryState';
import { ApiError, generateCorrelationId } from '@/services/api';
import MarketplaceCardSkeleton from '@/components/discovery/MarketplaceCardSkeleton';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import { Select } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Table';
import Icon from '@/components/ui/Icon';
import { formatVND } from '@/utils/formatters';
import { getPaginationRange, formatCount } from '@/utils/marketplaceHelpers';
import HeroSection from '@/components/discovery/HeroSection';
import CategoryFilterBar from '@/components/discovery/CategoryFilterBar';
import FilterSidebar from '@/components/discovery/FilterSidebar';
import TutorCard from '@/components/discovery/TutorCard';
import { Drawer } from '@/components/ui/Avatar';
import '@/styles/marketplace.css';

const SORT_OPTIONS = [
  { value: 'priority', label: 'Phù hợp nhất' },
  { value: 'rating_desc', label: 'Đánh giá cao nhất' },
  { value: 'price_asc', label: 'Học phí thấp đến cao' },
  { value: 'price_desc', label: 'Học phí cao đến thấp' },
  { value: 'exp_desc', label: 'Nhiều kinh nghiệm nhất' },
];

const MAX_PRICE = 5000000;
const QUICK_PRICE_CAP = 1000000;
const QUICK_RATING = 4.8;
// Timeout tải danh sách: quá hạn tự abort và chuyển error (không treo vô hạn).
const REQUEST_TIMEOUT_MS = 10000;

export default function Marketplace() {
  const [searchParams, setSearchParams] = useSearchParams();

  const initialQuery = readDiscoveryQuery(searchParams, 'tutors');

  // Filter States
  const [searchKeyword, setSearchKeyword] = useState(initialQuery.q);
  const [debouncedKeyword, setDebouncedKeyword] = useState(initialQuery.q);
  const [selectedCategory, setSelectedCategory] = useState(initialQuery.categoryId);
  const [minPrice, setMinPrice] = useState(initialQuery.minPrice);
  const [maxPrice, setMaxPrice] = useState(initialQuery.maxPrice);
  const [degreeLevel, setDegreeLevel] = useState(initialQuery.degree);
  const [university, setUniversity] = useState(initialQuery.university);
  const [certification, setCertification] = useState(initialQuery.certification);
  const [minRating, setMinRating] = useState(initialQuery.minRating);
  const [experienceRange, setExperienceRange] = useState(initialQuery.experience);
  const [sortBy, setSortBy] = useState(initialQuery.sort);
  const [pageNumber, setPageNumber] = useState(initialQuery.page);
  const pageSize = 12;

  // Real Data States from Backend API
  const [tutors, setTutors] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Tăng mỗi lần bấm "Thử Lại" để kích hoạt refetch kể cả khi đang ở trang 1.
  const [retryKey, setRetryKey] = useState(0);
  const handleRetry = () => setRetryKey((k) => k + 1);

  const resultsRef = useRef(null);

  // Drawer bộ lọc mobile (< lg): sidebar chỉ mount một nơi để không trùng id label.
  const [filterOpen, setFilterOpen] = useState(false);
  const [isMobileFilters, setIsMobileFilters] = useState(
    () =>
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(max-width: 1023.98px)').matches
  );

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;
    const mq = window.matchMedia('(max-width: 1023.98px)');
    const onChange = (e) => setIsMobileFilters(e.matches);
    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    }
    mq.addListener(onChange);
    return () => mq.removeListener(onChange);
  }, []);

  useEffect(() => {
    if (!isMobileFilters) setFilterOpen(false);
  }, [isMobileFilters]);

  // Debounce search keyword
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(searchKeyword);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchKeyword]);

  // Debounce khoảng giá: kéo slider không bắn request mỗi bước, chỉ gọi API khi ngừng kéo.
  const [debouncedMinPrice, setDebouncedMinPrice] = useState(initialQuery.minPrice);
  const [debouncedMaxPrice, setDebouncedMaxPrice] = useState(initialQuery.maxPrice);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedMinPrice(minPrice);
      setDebouncedMaxPrice(maxPrice);
    }, 300);
    return () => clearTimeout(timer);
  }, [minPrice, maxPrice]);


  useDiscoveryQueryState({
    searchParams, setSearchParams, kind: 'tutors',
    values: { q: debouncedKeyword, categoryId: selectedCategory, minPrice: debouncedMinPrice, maxPrice: debouncedMaxPrice, minRating, sort: sortBy, page: pageNumber, degree: degreeLevel, university, certification, experience: experienceRange },
    setters: {
      q: value => { setSearchKeyword(value); setDebouncedKeyword(value); },
      categoryId: setSelectedCategory,
      minPrice: value => { setMinPrice(value); setDebouncedMinPrice(value); },
      maxPrice: value => { setMaxPrice(value); setDebouncedMaxPrice(value); },
      minRating: setMinRating, sort: setSortBy, page: setPageNumber, degree: setDegreeLevel, university: setUniversity, certification: setCertification, experience: setExperienceRange,
    },
  });

  // Query Categories directly from API
  useEffect(() => {
    let cancelled = false;
    async function loadCategories() {
      try {
        const list = await tutorService.getCategories();
        if (!cancelled && Array.isArray(list)) {
          setCategories(list);
        }
      } catch (err) {
        console.error('[Marketplace] Lỗi truy vấn categories:', err);
      }
    }
    loadCategories();
    return () => {
      cancelled = true;
    };
  }, []);

  // Query Tutors directly from Backend API with real parameters.
  // Timeout 10s: quá hạn abort request và chuyển error (không treo vô hạn).
  // Cleanup abort + clearTimeout nên không setState sau unmount.
  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    let cancelled = false;

    async function loadTutors() {
      try {
        setLoading(true);
        setError(null);

        const apiSortBy = sortBy === 'priority' ? null : sortBy;

        const minExp =
          experienceRange === '1-2'
            ? 1
            : experienceRange === '3-5'
            ? 3
            : experienceRange === '>=6'
            ? 6
            : null;

        const maxExp =
          experienceRange === '<1'
            ? 0
            : experienceRange === '1-2'
            ? 2
            : experienceRange === '3-5'
            ? 5
            : null;

        const response = await tutorService.getTutors(
          {
            categoryId: selectedCategory || null,
            search: debouncedKeyword.trim() || null,
            minPrice: debouncedMinPrice > 0 ? debouncedMinPrice : null,
            maxPrice: debouncedMaxPrice < MAX_PRICE ? debouncedMaxPrice : null,
            degreeLevel: degreeLevel !== 'All' ? degreeLevel : null,
            university: university !== 'All' ? university : null,
            certification: certification !== 'All' ? certification : null,
            minRating: minRating || null,
            minExperience: minExp,
            maxExperience: maxExp,
            sortBy: apiSortBy,
            pageNumber,
            pageSize,
          },
          { signal: controller.signal }
        );

        if (cancelled || controller.signal.aborted) return;
        clearTimeout(timeoutId);

        let items = Array.isArray(response?.items) ? response.items : [];

        setTutors(items);
        setTotalCount(response?.totalCount ?? items.length);
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        clearTimeout(timeoutId);
        if (controller.signal.aborted) {
          const correlationId = generateCorrelationId();
          const timeoutErr = new ApiError(
            'Yêu cầu quá thời gian (10 giây). Vui lòng kiểm tra kết nối mạng và bấm Thử Lại.',
            { status: 0, kind: 'network' }
          );
          timeoutErr.traceId = correlationId;
          console.error('[Marketplace] Timeout tải tutors (10s):', {
            correlationId,
            error: err,
          });
          setTutors([]);
          setTotalCount(0);
          setError(timeoutErr);
          setLoading(false);
          return;
        }
        console.error('[Marketplace] Lỗi truy vấn tutors:', {
          correlationId: err?.traceId ?? null,
          error: err,
        });
        setTutors([]);
        setTotalCount(0);
        setError(err);
        setLoading(false);
      }
    }

    loadTutors();
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [
    debouncedKeyword,
    selectedCategory,
    debouncedMinPrice,
    debouncedMaxPrice,
    degreeLevel,
    university,
    certification,
    minRating,
    experienceRange,
    sortBy,
    pageNumber,
    retryKey,
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const pageRange = getPaginationRange(pageNumber, pageSize, totalCount);

  const handleResetFilters = () => {
    setSearchKeyword('');
    setDebouncedKeyword('');
    setSelectedCategory('');
    setMinPrice(0);
    setMaxPrice(MAX_PRICE);
    setDebouncedMinPrice(0);
    setDebouncedMaxPrice(MAX_PRICE);
    setDegreeLevel('All');
    setUniversity('All');
    setCertification('All');
    setMinRating(null);
    setExperienceRange('All');
    setSortBy('priority');
    setPageNumber(1);
  };

  // Xóa 1 chip lọc + quay về trang 1 (tránh kẹt trang sâu sau khi nới lọc).
  const clearAndResetPage = (fn) => () => {
    fn();
    setPageNumber(1);
  };

  const activeFilters = useMemo(() => {
    const list = [];
    if (degreeLevel !== 'All') {
      list.push({ key: 'degree', label: `Học vị: ${degreeLevel}`, clear: clearAndResetPage(() => setDegreeLevel('All')) });
    }
    if (university !== 'All') {
      list.push({ key: 'uni', label: `Trường: ${university}`, clear: clearAndResetPage(() => setUniversity('All')) });
    }
    if (certification !== 'All') {
      list.push({ key: 'cert', label: `Chứng chỉ: ${certification}`, clear: clearAndResetPage(() => setCertification('All')) });
    }
    if (minPrice > 0 || maxPrice < MAX_PRICE) {
      if (minPrice > 0 && maxPrice < MAX_PRICE) {
        list.push({
          key: 'price',
          label: `Học phí: ${formatVND(minPrice)} - ${formatVND(maxPrice)}`,
          clear: clearAndResetPage(() => {
            setMinPrice(0);
            setMaxPrice(MAX_PRICE);
          }),
        });
      } else if (minPrice > 0) {
        list.push({
          key: 'price',
          label: `Học phí: từ ${formatVND(minPrice)}`,
          clear: clearAndResetPage(() => setMinPrice(0)),
        });
      } else {
        list.push({
          key: 'price',
          label: `Học phí: đến ${formatVND(maxPrice)}`,
          clear: clearAndResetPage(() => setMaxPrice(MAX_PRICE)),
        });
      }
    }
    if (minRating !== null) {
      list.push({ key: 'rating', label: `Đánh giá: ≥ ${minRating}★`, clear: clearAndResetPage(() => setMinRating(null)) });
    }
    if (experienceRange !== 'All') {
      const expLabel =
        experienceRange === '<1'
          ? 'Dưới 1 năm'
          : experienceRange === '1-2'
          ? '1–2 năm'
          : experienceRange === '3-5'
          ? '3–5 năm'
          : 'Từ 6 năm';
      list.push({ key: 'exp', label: `Kinh nghiệm: ${expLabel}`, clear: clearAndResetPage(() => setExperienceRange('All')) });
    }
    if (selectedCategory) {
      const catObj = categories.find((c) => c.id === selectedCategory);
      list.push({
        key: 'category',
        label: `Danh mục: ${catObj?.name || 'Đã chọn'}`,
        clear: clearAndResetPage(() => setSelectedCategory('')),
      });
    }
    if (searchKeyword.trim()) {
      list.push({
        key: 'search',
        label: `"${searchKeyword.trim()}"`,
        clear: clearAndResetPage(() => {
          setSearchKeyword('');
          setDebouncedKeyword('');
        }),
      });
    }
    return list;
  }, [degreeLevel, university, certification, minPrice, maxPrice, minRating, experienceRange, selectedCategory, categories, searchKeyword]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPageNumber(newPage);
    const reduceMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const behavior = reduceMotion ? 'auto' : 'smooth';
    if (resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior, block: 'start' });
    } else if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior });
    }
  };

  const handleExploreCategories = () => {
    setSearchKeyword('');
    setDebouncedKeyword('');
    setSelectedCategory('');
    setPageNumber(1);
    const reduceMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document
      .getElementById('category-filter-bar')
      ?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    document.getElementById('category-tab-all')?.focus({ preventScroll: true });
  };

  // Sidebar dùng chung cho cột trái desktop và drawer mobile.
  const renderFilterSidebar = (extraProps = {}) => (
    <FilterSidebar
      minPrice={minPrice}
      maxPrice={maxPrice}
      priceLimit={MAX_PRICE}
      onPriceChange={({ min, max }) => {
        setMinPrice(min);
        setMaxPrice(max);
        setPageNumber(1);
      }}
      degreeLevel={degreeLevel}
      onDegreeLevelChange={(deg) => {
        setDegreeLevel(deg);
        setPageNumber(1);
      }}
      university={university}
      onUniversityChange={(uni) => {
        setUniversity(uni);
        setPageNumber(1);
      }}
      certification={certification}
      onCertificationChange={(cert) => {
        setCertification(cert);
        setPageNumber(1);
      }}
      minRating={minRating}
      onMinRatingChange={(r) => {
        setMinRating(r);
        setPageNumber(1);
      }}
      experienceRange={experienceRange}
      onExperienceRangeChange={(exp) => {
        setExperienceRange(exp);
        setPageNumber(1);
      }}
      onResetFilters={handleResetFilters}
      {...extraProps}
    />
  );

  return (
    <div data-discovery-loading={loading ? 'true' : 'false'} className="marketplace-v2 w-full flex-1 pb-12">
      {/* 1. Hero Section */}
      <HeroSection
        searchKeyword={searchKeyword}
        setSearchKeyword={setSearchKeyword}
        onSearchSubmit={(val) => {
          setDebouncedKeyword(val);
          setPageNumber(1);
        }}
      />

      {/* 2. Category Navigation Bar */}
      <CategoryFilterBar
        categories={categories}
        selectedCategoryId={selectedCategory}
        onSelectCategory={(id) => {
          setSelectedCategory(id);
          setPageNumber(1);
        }}
      />

      {/* 3. Main Discovery Workspace */}
      <main className="page-shell pt-9 sm:pt-12">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[304px_minmax(0,1fr)] lg:gap-10">
          {/* Left Column: Filter Sidebar (desktop; mobile dùng drawer) */}
          {!isMobileFilters && (
            <div className="z-20 w-full lg:sticky lg:top-[88px]">
              {renderFilterSidebar()}
            </div>
          )}

          {/* Right Column: Listings & Filters */}
          <div className="min-w-0 flex-1 space-y-4">
            {/* Mobile sticky toolbar: filter + sort */}
            <div className="sticky top-[72px] z-30 -mx-4 mb-3 flex items-center justify-between gap-3 border-b border-[color:var(--mkt-line)] bg-[color:var(--mkt-canvas)]/95 px-4 py-2.5 backdrop-blur-sm lg:hidden">
              <button
                type="button"
                onClick={() => setFilterOpen(true)}
                aria-haspopup="dialog"
                className="inline-flex min-h-11 items-center gap-2 rounded-[8px] border border-[color:var(--mkt-line)] bg-white px-3.5 text-[12px] font-bold text-[color:var(--mkt-ink)] shadow-sm transition-colors hover:border-[color:var(--mkt-cobalt-100)]"
              >
                <Icon
                  name="tune"
                  size="sm"
                  strokeWidth={1.7}
                  className="text-[color:var(--mkt-cobalt)]"
                />
                <span>Bộ lọc</span>
                {activeFilters.length > 0 && (
                  <span
                    role="status"
                    aria-label={`${activeFilters.length} bộ lọc đang áp dụng`}
                    className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-[color:var(--mkt-cobalt)] px-1.5 text-[12px] font-bold text-white"
                  >
                    {activeFilters.length}
                  </span>
                )}
              </button>

              <div className="w-[148px] shrink-0">
                <Select
                  id="sort-tutors-mobile"
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setPageNumber(1);
                  }}
                  aria-label="Sắp xếp gia sư"
                  className="min-h-11 !rounded-[10px] !border-[color:var(--mkt-line)] !bg-white !py-1.5 !text-[13px] font-semibold"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            {/* Active Filters Bar (desktop only) */}
            {activeFilters.length > 0 && (
              <div className="hidden flex-wrap items-center gap-2 rounded-[10px] border border-[color:var(--mkt-line)] bg-white p-3 lg:flex">
                <div className="flex items-center gap-1.5 text-[12px] font-bold text-[color:var(--mkt-ink)]">
                  <Icon
                    name="filter_alt"
                    size="xs"
                    strokeWidth={1.7}
                    className="h-3.5 w-3.5 text-[color:var(--mkt-cobalt)]"
                  />
                  <span>Đang lọc:</span>
                </div>

                {activeFilters.map((af) => (
                  <span
                    key={af.key}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--mkt-line)] bg-[color:var(--mkt-canvas)] px-3 py-1.5 text-[12px] font-semibold text-[color:var(--mkt-body)]"
                  >
                    <span>{af.label}</span>
                    <button
                      type="button"
                      onClick={af.clear}
                      aria-label={`Xóa bộ lọc ${af.label}`}
                      className="-my-3 -mr-3 ml-0.5 inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-[13px] font-bold leading-none text-[color:var(--mkt-muted)] transition-colors hover:text-[color:var(--mkt-danger)]"
                      title="Gỡ bộ lọc này"
                    >
                      ×
                    </button>
                  </span>
                ))}

                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="ml-auto inline-flex min-h-11 items-center gap-1 px-2 text-[12px] font-semibold text-[color:var(--mkt-muted)] transition-colors hover:text-[color:var(--mkt-danger)]"
                >
                  <Icon name="close" size="xs" strokeWidth={1.7} className="h-3.5 w-3.5" />
                  <span>Xóa bộ lọc</span>
                </button>
              </div>
            )}

            {/* Top Toolbar: Count + Sort Dropdown */}
            <div
              ref={resultsRef}
              className="flex scroll-mt-[88px] flex-row items-center justify-between gap-3 border-b border-[color:var(--mkt-line)] pb-3 pt-1"
            >
              <div>
                <h2
                  className="mkt-display text-[22px] font-extrabold leading-[1.25] tracking-[-0.02em] text-[color:var(--mkt-ink)] sm:text-[26px]"
                  aria-live="polite"
                >
                  {loading
                    ? 'Đang tìm kiếm gia sư...'
                    : error || totalCount === 0
                      ? 'Danh sách gia sư'
                      : `${formatCount(totalCount)} gia sư phù hợp`}
                </h2>
                {searchKeyword.trim() ? (
                  <p className="mt-1 text-[12px] text-[color:var(--mkt-body)]">
                    Kết quả tìm kiếm cho &ldquo;{searchKeyword.trim()}&rdquo;
                  </p>
                ) : (
                  <p className="mt-1 hidden text-[12px] text-[color:var(--mkt-body)] sm:block">
                    Kết nối trực tiếp với gia sư hàng đầu được kiểm duyệt.
                  </p>
                )}
              </div>

              <div className="hidden shrink-0 items-center gap-2 lg:flex">
                <label
                  htmlFor="sort-tutors"
                  className="text-[12px] font-semibold text-[color:var(--mkt-body)]"
                >
                  Sắp xếp:
                </label>
                <div className="w-52">
                  <Select
                    id="sort-tutors"
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value);
                      setPageNumber(1);
                    }}
                    className="min-h-11 !rounded-[10px] !border-[color:var(--mkt-line)] !bg-white !py-1.5 !text-[13px] font-semibold"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            </div>

            {/* Quick filter chips — two-way synced with sidebar */}
            <div
              className="flex max-w-full flex-nowrap items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] sm:flex-wrap sm:overflow-visible sm:pb-0 [&::-webkit-scrollbar]:hidden"
              role="group"
              aria-label="Bộ lọc nhanh"
            >
              <span className="shrink-0 text-[12px] font-semibold text-[color:var(--mkt-body)]">
                Lọc nhanh:
              </span>

              <button
                type="button"
                aria-pressed={maxPrice <= QUICK_PRICE_CAP && minPrice === 0}
                onClick={() => {
                  if (maxPrice <= QUICK_PRICE_CAP && minPrice === 0) {
                    setMinPrice(0);
                    setMaxPrice(MAX_PRICE);
                  } else {
                    setMinPrice(0);
                    setMaxPrice(QUICK_PRICE_CAP);
                  }
                  setPageNumber(1);
                }}
                className="mkt-chip"
              >
                <Icon name="payments" size="xs" strokeWidth={1.7} className="h-3.5 w-3.5" />
                <span>Đến 1 triệu</span>
              </button>

              <button
                type="button"
                aria-pressed={minRating === QUICK_RATING}
                onClick={() => {
                  setMinRating(minRating === QUICK_RATING ? null : QUICK_RATING);
                  setPageNumber(1);
                }}
                className="mkt-chip"
              >
                <Icon name="star" size="xs" strokeWidth={1.7} className="h-3.5 w-3.5" />
                <span>Đánh giá từ 4.8</span>
              </button>

              <button
                type="button"
                aria-pressed={experienceRange === '3-5'}
                onClick={() => {
                  setExperienceRange(experienceRange === '3-5' ? 'All' : '3-5');
                  setPageNumber(1);
                }}
                className="mkt-chip"
              >
                <Icon name="work_history" size="xs" strokeWidth={1.7} className="h-3.5 w-3.5" />
                <span>3–5 năm</span>
              </button>
            </div>

            {/* Content States */}
            {loading ? (
              <MarketplaceCardSkeleton count={6} />
            ) : error ? (
              <ErrorState
                error={error}
                title="Không thể tải danh sách gia sư"
                message={error.message}
                onRetry={handleRetry}
                backPath="/"
                backLabel="Về trang chủ"
                className="!max-w-xl !border-[color:var(--mkt-line)] !bg-white"
              />
            ) : tutors.length === 0 ? (
              <EmptyState
                icon="person_search"
                title={activeFilters.length ? 'Không tìm thấy gia sư phù hợp' : 'Chưa có gia sư để hiển thị'}
                description={activeFilters.length ? 'Thử đổi từ khóa, mở rộng khoảng học phí hoặc gỡ bớt bộ lọc để xem thêm lựa chọn.' : 'Các hồ sơ gia sư sẽ xuất hiện tại đây khi được duyệt. Bạn có thể quay lại sau hoặc tìm hiểu cách học trên TutorHub.'}
                filters={activeFilters}
                actionLabel={activeFilters.length ? 'Xóa bộ lọc' : 'Tìm hiểu cách hoạt động'}
                actionPath={activeFilters.length ? undefined : '/how-it-works'}
                onAction={handleResetFilters}
                secondaryActionLabel={activeFilters.length ? 'Khám phá danh mục' : undefined}
                onSecondaryAction={handleExploreCategories}
                className="!max-w-xl !border-[color:var(--mkt-line)] !bg-white"
              />
            ) : (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {tutors.map((tutor) => (
                  <TutorCard key={tutor.id} tutor={tutor} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div className="flex flex-col items-center justify-between gap-3 border-t border-[color:var(--mkt-line)] pt-5 sm:flex-row">
                <p className="text-[12px] text-[color:var(--mkt-body)]">
                  Hiển thị {formatCount(pageRange.start)}–{formatCount(pageRange.end)} trong{' '}
                  {formatCount(totalCount)} gia sư
                </p>
                <div className="mkt-pagination">
                  <Pagination
                    page={pageNumber}
                    totalPages={totalPages}
                    onChange={handlePageChange}
                    onPageChange={handlePageChange}
                    className="!mt-0"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile filter drawer: trượt từ trái, Áp dụng đóng, Xóa reset */}
        <Drawer
          open={filterOpen && isMobileFilters}
          onClose={() => setFilterOpen(false)}
          side="left"
          title="Bộ lọc tìm kiếm"
          widthClass="w-[320px]"
          panelClassName="marketplace-v2 mkt-drawer-panel"
          footer={
            <>
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex h-11 flex-1 items-center justify-center rounded-[8px] border border-[color:var(--mkt-line)] bg-white px-4 text-[12px] font-bold text-[color:var(--mkt-body)] transition-colors hover:border-[color:var(--mkt-cobalt-100)]"
              >
                Xóa
              </button>
              <button
                type="button"
                onClick={() => setFilterOpen(false)}
                className="inline-flex h-11 flex-1 items-center justify-center rounded-[8px] bg-[color:var(--mkt-cobalt)] px-4 text-[12px] font-bold text-white transition-colors hover:bg-[color:var(--mkt-cobalt-hover)]"
              >
                <span>{loading ? 'Đang tìm...' : `Xem ${formatCount(totalCount)} gia sư`}</span>
              </button>
            </>
          }
        >
          <div className="space-y-3">
            {activeFilters.length > 0 && (
              <div className="rounded-[10px] border border-[color:var(--mkt-cobalt-100)] bg-[color:var(--mkt-cobalt-50)] p-3">
                <p className="text-[12px] font-bold text-[color:var(--mkt-ink)]">
                  Đang lọc ({activeFilters.length}):
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {activeFilters.map((af) => (
                    <span
                      key={af.key}
                      className="inline-flex items-center gap-1 rounded-full border border-[color:var(--mkt-cobalt-100)] bg-white px-2.5 py-1.5 text-[12px] font-semibold text-[color:var(--mkt-cobalt)]"
                    >
                      <span>{af.label}</span>
                      <button
                        type="button"
                        onClick={af.clear}
                        aria-label={`Xóa bộ lọc ${af.label}`}
                        className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[12px] leading-none hover:bg-[color:var(--mkt-cobalt-50)]"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
            {renderFilterSidebar()}
          </div>
        </Drawer>
      </main>
    </div>
  );
}
