import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import tutorService from '@/services/tutor.service';
import { ApiError, generateCorrelationId } from '@/services/api';
import ServiceHeroSection from '@/components/discovery/ServiceHeroSection';
import ServiceFilterSidebar from '@/components/discovery/ServiceFilterSidebar';
import ServiceCard from '@/components/discovery/ServiceCard';
import { CardSkeleton } from '@/components/common/Skeleton';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import { Select } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Table';
import Icon from '@/components/ui/Icon';
import { formatVND } from '@/utils/formatters';
import { Drawer } from '@/components/ui/Avatar';
import '@/styles/marketplace.css';

const SORT_OPTIONS = [
  { value: 'priority', label: 'Phù hợp nhất' },
  { value: 'rating_desc', label: 'Đánh giá cao nhất' },
  { value: 'price_asc', label: 'Học phí: Thấp đến cao' },
  { value: 'price_desc', label: 'Học phí: Cao đến thấp' },
  { value: 'newest', label: 'Mới nhất' },
  { value: 'sessions_desc', label: 'Nhiều buổi học nhất' },
];

const MAX_PRICE = 10000000;
const QUICK_PRICE_CAP = 1000000;
const QUICK_RATING = 4.8;
// Timeout tải danh sách: quá hạn tự abort và chuyển error (không treo vô hạn).
const REQUEST_TIMEOUT_MS = 10000;

export default function ServicesMarketplace() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Filter States
  const [searchKeyword, setSearchKeyword] = useState(searchParams.get('q') || '');
  const [debouncedKeyword, setDebouncedKeyword] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('categoryId') || '');
  const [selectedSubject, setSelectedSubject] = useState(searchParams.get('subjectId') || '');
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(MAX_PRICE);
  const [debouncedMinPrice, setDebouncedMinPrice] = useState(0);
  const [debouncedMaxPrice, setDebouncedMaxPrice] = useState(MAX_PRICE);
  const [minRating, setMinRating] = useState(null);
  const [sortBy, setSortBy] = useState('priority');
  const [pageNumber, setPageNumber] = useState(1);
  const pageSize = 12;

  // Real Data States from Backend API
  const [services, setServices] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [categories, setCategories] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Tăng mỗi lần bấm "Thử Lại" để kích hoạt refetch kể cả khi filter không đổi.
  const [retryKey, setRetryKey] = useState(0);
  const handleRetry = () => setRetryKey((k) => k + 1);
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
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedMinPrice(minPrice);
      setDebouncedMaxPrice(maxPrice);
    }, 300);
    return () => clearTimeout(timer);
  }, [minPrice, maxPrice]);

  // Load Categories & Subjects on Mount
  useEffect(() => {
    let cancelled = false;
    async function loadMeta() {
      try {
        const [cats, subs] = await Promise.all([
          tutorService.getCategories(),
          tutorService.getSubjects(),
        ]);
        if (!cancelled) {
          if (Array.isArray(cats)) setCategories(cats);
          if (Array.isArray(subs)) setSubjects(subs);
        }
      } catch (err) {
        console.error('[ServicesMarketplace] Lỗi tải categories/subjects:', err);
      }
    }
    loadMeta();
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch Services from Backend API with Active Filters.
  // Timeout 10s: quá hạn abort request và chuyển error (không treo vô hạn).
  // Cleanup abort + clearTimeout nên không setState sau unmount.
  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    let cancelled = false;

    async function loadServices() {
      try {
        setLoading(true);
        setError(null);

        const apiSortBy = sortBy === 'priority' ? null : sortBy;

        const result = await tutorService.getPublicServices(
          {
            categoryId: selectedCategory || null,
            subjectId: selectedSubject || null,
            minPrice: debouncedMinPrice > 0 ? debouncedMinPrice : null,
            maxPrice: debouncedMaxPrice < MAX_PRICE ? debouncedMaxPrice : null,
            minRating,
            search: debouncedKeyword,
            sortBy: apiSortBy,
            pageNumber,
            pageSize,
          },
          { signal: controller.signal }
        );

        if (cancelled || controller.signal.aborted) return;
        clearTimeout(timeoutId);
        setServices(result.items || []);
        setTotalCount(result.totalCount || 0);
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
          console.error('[ServicesMarketplace] Timeout tải dịch vụ (10s):', {
            correlationId,
            error: err,
          });
          setServices([]);
          setTotalCount(0);
          setError(timeoutErr);
          setLoading(false);
          return;
        }
        console.error('[ServicesMarketplace] Lỗi truy vấn dịch vụ học tập:', {
          correlationId: err?.traceId ?? null,
          error: err,
        });
        setServices([]);
        setTotalCount(0);
        setError(err);
        setLoading(false);
      }
    }

    loadServices();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [
    selectedCategory,
    selectedSubject,
    debouncedMinPrice,
    debouncedMaxPrice,
    minRating,
    debouncedKeyword,
    sortBy,
    pageNumber,
    retryKey,
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  // Reset all filters
  const handleResetFilters = () => {
    setSearchKeyword('');
    setDebouncedKeyword('');
    setSelectedCategory('');
    setSelectedSubject('');
    setMinPrice(0);
    setMaxPrice(MAX_PRICE);
    setDebouncedMinPrice(0);
    setDebouncedMaxPrice(MAX_PRICE);
    setMinRating(null);
    setSortBy('priority');
    setPageNumber(1);
    setSearchParams({});
  };

  // Popular Tag click in Hero
  const handleTagClick = (tag) => {
    setSearchKeyword(tag);
    setDebouncedKeyword(tag);
    setPageNumber(1);
  };

  // Xóa 1 chip lọc + quay về trang 1 (tránh kẹt trang sâu sau khi nới lọc).
  const clearAndResetPage = (fn) => () => {
    fn();
    setPageNumber(1);
  };

  // Active filters list for chips bar
  const activeFilters = useMemo(() => {
    const list = [];
    if (selectedCategory) {
      const catObj = categories.find((c) => c.id === selectedCategory);
      list.push({
        key: 'category',
        label: `Danh mục: ${catObj?.name || 'Đã chọn'}`,
        clear: clearAndResetPage(() => {
          setSelectedCategory('');
          setSelectedSubject('');
        }),
      });
    }
    if (selectedSubject) {
      const subObj = subjects.find((s) => s.id === selectedSubject);
      list.push({
        key: 'subject',
        label: `Môn: ${subObj?.name || 'Đã chọn'}`,
        clear: clearAndResetPage(() => setSelectedSubject('')),
      });
    }
    if (minPrice > 0 || maxPrice < MAX_PRICE) {
      if (minPrice > 0 && maxPrice < MAX_PRICE) {
        list.push({
          key: 'price',
          label: `Học phí: ${formatVND(minPrice)} – ${formatVND(maxPrice)}`,
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
      list.push({
        key: 'rating',
        label: `Đánh giá: ≥ ${minRating}★`,
        clear: clearAndResetPage(() => setMinRating(null)),
      });
    }
    if (searchKeyword.trim()) {
      list.push({
        key: 'search',
        label: `"${searchKeyword.trim()}"`,
        clear: clearAndResetPage(() => {
          setSearchKeyword('');
          setDebouncedKeyword('');
          setSearchParams({});
        }),
      });
    }
    return list;
  }, [
    selectedCategory,
    selectedSubject,
    categories,
    subjects,
    minPrice,
    maxPrice,
    minRating,
    searchKeyword,
    setSearchParams,
  ]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPageNumber(newPage);
    window.scrollTo({ top: 380, behavior: 'smooth' });
  };

  // Sidebar dùng chung cho cột trái desktop và drawer mobile (chỉ mount một nơi).
  const filterSidebar = (
    <ServiceFilterSidebar
      categories={categories}
      subjects={subjects}
      selectedCategoryId={selectedCategory}
      onSelectCategory={(id) => {
        setSelectedCategory(id);
        setPageNumber(1);
      }}
      selectedSubjectId={selectedSubject}
      onSelectSubject={(id) => {
        setSelectedSubject(id);
        setPageNumber(1);
      }}
      minPrice={minPrice}
      maxPrice={maxPrice}
      priceLimit={MAX_PRICE}
      onPriceChange={({ min, max }) => {
        setMinPrice(min);
        setMaxPrice(max);
        setPageNumber(1);
      }}
      minRating={minRating}
      onMinRatingChange={(r) => {
        setMinRating(r);
        setPageNumber(1);
      }}
      activeCount={activeFilters.length}
      onReset={handleResetFilters}
      sticky={!isMobileFilters}
    />
  );

  return (
    <div className="marketplace-v2 w-full flex-1 bg-[color:var(--mkt-canvas)] pb-4 sm:pb-6">
      {/* 1. Hero Section */}
      <ServiceHeroSection
        searchKeyword={searchKeyword}
        setSearchKeyword={setSearchKeyword}
        onSearchSubmit={(val) => {
          setDebouncedKeyword(val);
          setPageNumber(1);
        }}
        onTagClick={handleTagClick}
      />

      {/* 2. Main Discovery Container: 2 Columns */}
      <div className="page-shell pt-8 sm:pt-10">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[288px_minmax(0,1fr)] lg:gap-9">
          {/* Left Column: Filter Sidebar (desktop; mobile dùng drawer) */}
          {!isMobileFilters && (
            <div className="w-full shrink-0">
              {filterSidebar}
            </div>
          )}

          {/* Right Column: Active Chips + Count Toolbar + Grid */}
          <div className="min-w-0 flex-1 space-y-5">
            {/* Mobile filter trigger: mở drawer từ trái, badge đếm filter active */}
            <div className="sticky top-[72px] z-30 -mx-4 flex items-center justify-between border-b border-[color:var(--mkt-line)] bg-[color:var(--mkt-canvas)]/95 px-4 py-2.5 backdrop-blur-sm lg:hidden">
              <button
                type="button"
                onClick={() => setFilterOpen(true)}
                aria-haspopup="dialog"
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[color:var(--mkt-line)] bg-white px-4 text-sm font-bold text-[color:var(--mkt-ink)] shadow-sm transition active:scale-[0.98]"
              >
                <Icon name="tune" size="sm" className="text-[color:var(--mkt-cobalt)]" />
                <span>Bộ lọc</span>
                {activeFilters.length > 0 && (
                  <span
                    role="status"
                    aria-label={`${activeFilters.length} bộ lọc đang áp dụng`}
                    className="inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-[color:var(--mkt-cobalt)] px-1 text-[11px] font-bold text-white"
                  >
                    {activeFilters.length}
                  </span>
                )}
              </button>
              {activeFilters.length > 0 && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex min-h-10 items-center gap-1 text-xs font-semibold text-slate-600 transition-colors hover:text-rose-600"
                >
                  <Icon name="close" size="xs" className="h-3.5 w-3.5" />
                  <span>Xóa lọc ({activeFilters.length})</span>
                </button>
              )}
            </div>

            {/* Active Filters Bar */}
            {activeFilters.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50/80 p-3 shadow-sm">
                <div className="flex items-center gap-1.5 text-sm font-bold text-slate-700">
                  <Icon name="filter_alt" size="xs" className="h-3.5 w-3.5 text-blue-600" />
                  <span>Đang lọc:</span>
                </div>
                {activeFilters.map((af) => (
                  <span
                    key={af.key}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-blue-200 bg-white py-1 pl-3 pr-1 text-xs font-bold text-blue-700 shadow-sm transition-colors hover:border-blue-400"
                  >
                    <span>{af.label}</span>
                    <button
                      type="button"
                      onClick={af.clear}
                      aria-label={`Xóa bộ lọc ${af.label}`}
                      className="ml-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold leading-none transition-colors hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      title="Gỡ bộ lọc này"
                    >
                      ×
                    </button>
                  </span>
                ))}
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="ml-auto flex min-h-10 items-center gap-1 rounded-lg px-2 text-xs font-bold text-slate-600 transition-colors hover:bg-white hover:text-rose-600"
                >
                  <Icon name="close" size="xs" className="w-3.5 h-3.5" />
                  <span>Xóa bộ lọc</span>
                </button>
              </div>
            )}

            {/* Top Toolbar: Counter + Sort Dropdown */}
            <div className="flex flex-col gap-4 border-b border-[color:var(--mkt-line)] pb-4 pt-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-[0.08em] text-blue-600">Danh sách dịch vụ</span>
                <h2 className="mt-1 text-[22px] font-bold tracking-[-0.02em] text-[color:var(--mkt-ink)] sm:text-[26px]">
                  {loading
                    ? 'Đang tìm kiếm dịch vụ...'
                    : totalCount === 0
                      ? 'Không tìm thấy dịch vụ phù hợp'
                      : `${totalCount} dịch vụ phù hợp`}
                </h2>
                <p className="mt-1 text-sm font-medium text-[color:var(--mkt-body)]">
                  So sánh lộ trình, gia sư và học phí trọn gói.
                </p>
              </div>

              <div className="flex items-center gap-2 self-stretch sm:self-auto">
                <label htmlFor="sort-services" className="shrink-0 text-sm font-semibold text-slate-600">
                  Sắp xếp:
                </label>
                <div className="min-w-0 flex-1 sm:w-[210px] sm:flex-none">
                  <Select
                    id="sort-services"
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value);
                      setPageNumber(1);
                    }}
                    className="min-h-11 cursor-pointer rounded-xl border border-slate-200 bg-white !py-1 text-sm font-semibold shadow-sm hover:border-blue-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
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
            <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Bộ lọc nhanh">
              <span className="mr-1 text-sm font-semibold text-slate-600">Lọc nhanh:</span>
              <button
                type="button"
                aria-pressed={minPrice === 0 && maxPrice <= QUICK_PRICE_CAP}
                onClick={() => {
                  if (minPrice === 0 && maxPrice <= QUICK_PRICE_CAP) {
                    setMinPrice(0);
                    setMaxPrice(MAX_PRICE);
                  } else {
                    setMinPrice(0);
                    setMaxPrice(QUICK_PRICE_CAP);
                  }
                  setPageNumber(1);
                }}
                className={`inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 text-sm font-bold transition-colors ${
                  minPrice === 0 && maxPrice <= QUICK_PRICE_CAP
                    ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700'
                }`}
              >
                <Icon name="payments" size="xs" className="w-3.5 h-3.5" />
                <span>Dưới 1 triệu</span>
              </button>
              <button
                type="button"
                aria-pressed={minRating === QUICK_RATING}
                onClick={() => {
                  setMinRating(minRating === QUICK_RATING ? null : QUICK_RATING);
                  setPageNumber(1);
                }}
                className={`inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 text-sm font-bold transition-colors ${
                  minRating === QUICK_RATING
                    ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700'
                }`}
              >
                <Icon name="star" size="xs" className="w-3.5 h-3.5" />
                <span>4.8+ xuất sắc</span>
              </button>
            </div>

            {/* Error State */}
            {error && !loading && (
              <ErrorState
                error={error}
                title="Không thể tải danh sách dịch vụ học tập"
                message={error.message}
                onRetry={handleRetry}
                backPath="/"
                backLabel="Về trang chủ"
              />
            )}

            {/* Loading Skeletons (2 Columns đồng bộ với Tutor Grid) */}
            {loading && <CardSkeleton count={6} className="gap-5 md:!grid-cols-2 lg:!grid-cols-2" label="Đang tải danh sách dịch vụ..." />}

            {/* Empty State */}
            {!loading && !error && services.length === 0 && (
              <EmptyState
                icon="search_off"
                title="Không tìm thấy dịch vụ học tập phù hợp"
                description="Bộ lọc hiện tại quá hẹp. Hãy thử nới khoảng giá, đổi danh mục/môn học, tìm từ khóa khác, hoặc gỡ bớt từng bộ lọc bên dưới."
                filters={activeFilters}
                onClearAll={handleResetFilters}
              />
            )}

            {/* Services Grid (2 Columns, đồng bộ với Tutor Grid) */}
            {!loading && !error && services.length > 0 && (
              <>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  {services.map((service) => (
                    <ServiceCard
                      key={service.id}
                      service={service}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center pt-8">
                    <Pagination
                      page={pageNumber}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Mobile filter drawer: trượt từ trái, Áp dụng đóng, Xóa reset */}
        <Drawer
          open={filterOpen && isMobileFilters}
          onClose={() => setFilterOpen(false)}
          side="left"
          title="Bộ lọc tìm kiếm"
          widthClass="w-[340px] max-w-[92vw]"
          panelClassName="marketplace-v2"
          footer={
            <>
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition active:scale-[0.98]"
              >
                Xóa
              </button>
              <button
                type="button"
                onClick={() => setFilterOpen(false)}
                className="inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-bold text-white shadow-sm transition active:scale-[0.98]"
              >
                Áp dụng
                {activeFilters.length > 0 ? ` (${activeFilters.length})` : ''}
              </button>
            </>
          }
        >
          {filterSidebar}
        </Drawer>
      </div>
    </div>
  );
}
