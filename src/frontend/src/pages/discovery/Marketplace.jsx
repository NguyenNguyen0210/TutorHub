import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import tutorService from '@/services/tutor.service';
import { ApiError, generateCorrelationId } from '@/services/api';
import { CardSkeleton } from '@/components/common/Skeleton';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import { Select } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Table';
import Icon from '@/components/ui/Icon';
import { cn } from '@/lib/cn';
import { formatVND } from '@/utils/formatters';
import HeroSection from '@/components/discovery/HeroSection';
import CategoryFilterBar from '@/components/discovery/CategoryFilterBar';
import FilterSidebar from '@/components/discovery/FilterSidebar';
import TutorCard from '@/components/discovery/TutorCard';
import { Drawer } from '@/components/ui/Avatar';

const POPULAR_SEARCH_TAGS = [
  'Toán THPT',
  'IELTS',
  'Lập trình',
  'Vật lý',
  'Ngữ văn',
  'Tiếng Anh',
];

const SORT_OPTIONS = [
  { value: 'priority', label: 'Ưu tiên phù hợp' },
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

  // Filter States
  const [searchKeyword, setSearchKeyword] = useState(searchParams.get('q') || '');
  const [debouncedKeyword, setDebouncedKeyword] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [priceRange, setPriceRange] = useState(MAX_PRICE);
  const [teachingMode, setTeachingMode] = useState('All');
  const [city, setCity] = useState('All');
  const [degreeLevel, setDegreeLevel] = useState('All');
  const [university, setUniversity] = useState('All');
  const [certification, setCertification] = useState('All');
  const [minRating, setMinRating] = useState(null);
  const [experienceRange, setExperienceRange] = useState('All');
  const [sortBy, setSortBy] = useState('priority');
  const [pageNumber, setPageNumber] = useState(1);
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
          experienceRange === '1-3'
            ? 1
            : experienceRange === '3-5'
            ? 3
            : experienceRange === '>5'
            ? 5
            : null;

        const maxExp =
          experienceRange === '<1'
            ? 1
            : experienceRange === '1-3'
            ? 3
            : experienceRange === '3-5'
            ? 5
            : null;

        const response = await tutorService.getTutors(
          {
            categoryId: selectedCategory || null,
            search: debouncedKeyword.trim() || null,
            minPrice: null,
            maxPrice: priceRange < MAX_PRICE ? priceRange : null,
            teachingMode: teachingMode !== 'All' ? teachingMode : null,
            city: city !== 'All' ? city : null,
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
    priceRange,
    teachingMode,
    city,
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

  const handleTagClick = (tag) => {
    setSearchKeyword(tag);
    setDebouncedKeyword(tag);
    setPageNumber(1);
    setSearchParams({ q: tag });
  };

  const handleResetFilters = () => {
    setSearchKeyword('');
    setDebouncedKeyword('');
    setSelectedCategory('');
    setPriceRange(MAX_PRICE);
    setTeachingMode('All');
    setCity('All');
    setDegreeLevel('All');
    setUniversity('All');
    setCertification('All');
    setMinRating(null);
    setExperienceRange('All');
    setSortBy('priority');
    setPageNumber(1);
    setSearchParams({});
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
    if (teachingMode !== 'All') {
      const modeLabel = teachingMode === 'InPerson' ? 'Tại nhà' : (teachingMode === 'Both' ? 'Cả hai' : teachingMode);
      list.push({ key: 'mode', label: `Hình thức: ${modeLabel}`, clear: clearAndResetPage(() => setTeachingMode('All')) });
    }
    if (city !== 'All') {
      list.push({ key: 'city', label: `Khu vực: ${city}`, clear: clearAndResetPage(() => setCity('All')) });
    }
    if (priceRange < MAX_PRICE) {
      list.push({ key: 'price', label: `Học phí ≤ ${formatVND(priceRange)}`, clear: clearAndResetPage(() => setPriceRange(MAX_PRICE)) });
    }
    if (minRating !== null) {
      list.push({ key: 'rating', label: `Đánh giá: ≥ ${minRating}★`, clear: clearAndResetPage(() => setMinRating(null)) });
    }
    if (experienceRange !== 'All') {
      const expLabel = experienceRange === '<1' ? '< 1 năm' : `${experienceRange} năm`;
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
          setSearchParams({});
        }),
      });
    }
    return list;
  }, [degreeLevel, university, certification, teachingMode, city, priceRange, minRating, experienceRange, selectedCategory, categories, searchKeyword, setSearchParams]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPageNumber(newPage);
    window.scrollTo({ top: 380, behavior: 'smooth' });
  };

  // Sidebar dùng chung cho cột trái desktop và drawer mobile (chỉ mount một nơi).
  const filterSidebar = (
    <FilterSidebar
      priceRange={priceRange}
      onPriceRangeChange={(val) => {
        setPriceRange(val);
        setPageNumber(1);
      }}
      maxPrice={MAX_PRICE}
      teachingMode={teachingMode}
      onTeachingModeChange={(mode) => {
        setTeachingMode(mode);
        setPageNumber(1);
      }}
      city={city}
      onCityChange={(c) => {
        setCity(c);
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
    />
  );

  return (
    <div className="w-full flex-1 bg-canvas pb-12">
      {/* 1. Hero Section */}
      <HeroSection
        searchKeyword={searchKeyword}
        setSearchKeyword={setSearchKeyword}
        onSearchSubmit={(val) => {
          setDebouncedKeyword(val);
          setPageNumber(1);
          if (val) setSearchParams({ q: val });
          else setSearchParams({});
        }}
        popularTags={POPULAR_SEARCH_TAGS}
        onTagClick={handleTagClick}
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
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-7 items-start">
          {/* Left Column: Filter Sidebar (desktop; mobile dùng drawer) */}
          {!isMobileFilters && (
            <div className="w-full lg:sticky lg:top-[88px] z-20">
              {filterSidebar}
            </div>
          )}

          {/* Right Column: Listings & Filters */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Mobile filter trigger: mở drawer từ trái, badge đếm filter active */}
            <div className="lg:hidden">
              <button
                type="button"
                onClick={() => setFilterOpen(true)}
                aria-haspopup="dialog"
                className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-brand-md border border-border bg-surface text-body-reg font-semibold text-fg shadow-sm active:scale-[0.98] transition-all"
              >
                <Icon name="tune" size="sm" className="text-brand-primary-600" />
                <span>Bộ lọc</span>
                {activeFilters.length > 0 && (
                  <span
                    role="status"
                    aria-label={`${activeFilters.length} bộ lọc đang áp dụng`}
                    className="min-w-[22px] h-[22px] px-1 rounded-full bg-brand-primary-600 text-white text-[11px] font-bold inline-flex items-center justify-center"
                  >
                    {activeFilters.length}
                  </span>
                )}
              </button>
            </div>

            {/* Active Filters Bar */}
            {activeFilters.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 p-3 bg-brand-primary-50/70 border border-brand-primary-100/90 rounded-[14px] shadow-sm">
                <div className="flex items-center gap-1.5 text-[12.5px] font-bold text-neutral-700">
                  <Icon name="filter_alt" size="xs" className="text-brand-primary-600 w-3.5 h-3.5" />
                  <span>Đang lọc:</span>
                </div>
                {activeFilters.map((af) => (
                  <span
                    key={af.key}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface text-brand-primary-600 text-[12px] font-semibold border border-brand-primary-200/90 shadow-sm hover:border-brand-primary-300 transition-colors"
                  >
                    <span>{af.label}</span>
                    <button
                      type="button"
                      onClick={af.clear}
                      aria-label={`Xóa bộ lọc ${af.label}`}
                      className="hover:text-danger transition-colors font-bold text-[14px] leading-none cursor-pointer ml-0.5 -mr-3 -my-3 min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary-600"
                      title="Gỡ bộ lọc này"
                    >
                      ×
                    </button>
                  </span>
                ))}
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-[12px] font-semibold text-neutral-500 hover:text-danger-strong transition-colors ml-auto cursor-pointer flex items-center gap-1 min-h-[44px] px-2"
                >
                  <Icon name="close" size="xs" className="w-3.5 h-3.5" />
                  <span>Xóa bộ lọc</span>
                </button>
              </div>
            )}

            {/* Top Toolbar: Count + Sort Dropdown */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-neutral-200/80 pt-1">
              <h2 className="text-[18px] sm:text-[22px] font-bold text-neutral-900 tracking-tight">
                {loading ? 'Đang tìm kiếm gia sư...' : `${totalCount} gia sư phù hợp`}
              </h2>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <label htmlFor="sort-tutors" className="text-[13px] font-semibold text-neutral-500 shrink-0">
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
                    className="!py-1.5 min-h-[44px] !text-[13px] font-medium bg-surface border-neutral-200/80"
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
              <span className="text-[12.5px] font-semibold text-neutral-500">Lọc nhanh:</span>
              <button
                type="button"
                aria-pressed={teachingMode === 'Online'}
                onClick={() => {
                  setTeachingMode(teachingMode === 'Online' ? 'All' : 'Online');
                  setPageNumber(1);
                }}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[44px] rounded-full text-[12.5px] font-semibold border transition-colors cursor-pointer',
                  teachingMode === 'Online'
                    ? 'border-brand-primary-600 bg-brand-primary-600 text-white shadow-sm'
                    : 'border-neutral-200 bg-surface text-neutral-600 hover:border-brand-primary-600/50 hover:text-brand-primary-600'
                )}
              >
                <Icon name="devices" size="xs" className="w-3.5 h-3.5" />
                <span>Online</span>
              </button>
              <button
                type="button"
                aria-pressed={priceRange <= QUICK_PRICE_CAP}
                onClick={() => {
                  setPriceRange(priceRange <= QUICK_PRICE_CAP ? MAX_PRICE : QUICK_PRICE_CAP);
                  setPageNumber(1);
                }}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[44px] rounded-full text-[12.5px] font-semibold border transition-colors cursor-pointer',
                  priceRange <= QUICK_PRICE_CAP
                    ? 'border-brand-primary-600 bg-brand-primary-600 text-white shadow-sm'
                    : 'border-neutral-200 bg-surface text-neutral-600 hover:border-brand-primary-600/50 hover:text-brand-primary-600'
                )}
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
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[44px] rounded-full text-[12.5px] font-semibold border transition-colors cursor-pointer',
                  minRating === QUICK_RATING
                    ? 'border-brand-primary-600 bg-brand-primary-600 text-white shadow-sm'
                    : 'border-neutral-200 bg-surface text-neutral-600 hover:border-brand-primary-600/50 hover:text-brand-primary-600'
                )}
              >
                <Icon name="star" size="xs" className="w-3.5 h-3.5" />
                <span>4.8+ xuất sắc</span>
              </button>
            </div>

            {/* Content States */}
            {loading ? (
              <CardSkeleton count={6} className="gap-4 sm:gap-5" />
            ) : error ? (
              <ErrorState
                error={error}
                title="Không thể tải danh sách gia sư"
                message={error.message}
                onRetry={handleRetry}
                backPath="/"
                backLabel="Về trang chủ"
              />
            ) : tutors.length === 0 ? (
              <EmptyState
                icon="person_search"
                title="Không tìm thấy gia sư phù hợp"
                description="Bộ lọc hiện tại quá hẹp. Hãy thử nới khoảng học phí, chọn danh mục khác, hoặc gỡ bớt từng bộ lọc bên dưới để tìm kiếm rộng hơn."
                filters={activeFilters}
                onClearAll={handleResetFilters}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
                {tutors.map((tutor) => (
                  <TutorCard
                    key={tutor.id}
                    tutor={tutor}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div className="pt-6 flex justify-center">
                <Pagination
                  page={pageNumber}
                  totalPages={totalPages}
                  onChange={handlePageChange}
                  onPageChange={handlePageChange}
                />
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
          footer={
            <>
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex-1 inline-flex items-center justify-center h-11 px-4 rounded-brand-md border border-border bg-surface text-body-reg font-semibold text-fg-secondary active:scale-[0.98] transition-all"
              >
                Xóa
              </button>
              <button
                type="button"
                onClick={() => setFilterOpen(false)}
                className="flex-1 inline-flex items-center justify-center h-11 px-4 rounded-brand-md bg-brand-primary-600 text-white text-body-reg font-semibold shadow-sm active:scale-[0.98] transition-all"
              >
                Áp dụng
                {activeFilters.length > 0 ? ` (${activeFilters.length})` : ''}
              </button>
            </>
          }
        >
          {filterSidebar}
        </Drawer>
      </main>
    </div>
  );
}
