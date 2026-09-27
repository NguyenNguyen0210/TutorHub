import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import tutorService from '@/services/tutor.service';
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

const SORT_OPTIONS = [
  { value: 'priority', label: 'Phù hợp nhất' },
  { value: 'rating_desc', label: 'Đánh giá cao nhất' },
  { value: 'price_asc', label: 'Học phí: Thấp đến cao' },
  { value: 'price_desc', label: 'Học phí: Cao đến thấp' },
  { value: 'newest', label: 'Mới nhất' },
  { value: 'sessions_desc', label: 'Nhiều buổi học nhất' },
];

export default function ServicesMarketplace() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Filter States
  const [searchKeyword, setSearchKeyword] = useState(searchParams.get('q') || '');
  const [debouncedKeyword, setDebouncedKeyword] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('categoryId') || '');
  const [selectedSubject, setSelectedSubject] = useState(searchParams.get('subjectId') || '');
  const [teachingMode, setTeachingMode] = useState('All');
  const [priceRange, setPriceRange] = useState(10000000);
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

  // Debounce search keyword
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(searchKeyword);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchKeyword]);

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

  // Fetch Services from Backend API with Active Filters
  useEffect(() => {
    let cancelled = false;

    async function loadServices() {
      try {
        setLoading(true);
        setError(null);

        const apiSortBy = sortBy === 'priority' ? null : sortBy;

        const result = await tutorService.getPublicServices({
          categoryId: selectedCategory || null,
          subjectId: selectedSubject || null,
          teachingMode,
          maxPrice: priceRange < 10000000 ? priceRange : null,
          minRating,
          search: debouncedKeyword,
          sortBy: apiSortBy,
          pageNumber,
          pageSize,
        });

        if (!cancelled) {
          setServices(result.items || []);
          setTotalCount(result.totalCount || 0);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('[ServicesMarketplace] Lỗi truy vấn dịch vụ học tập:', err);
          setError(err);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadServices();

    return () => {
      cancelled = true;
    };
  }, [
    selectedCategory,
    selectedSubject,
    teachingMode,
    priceRange,
    minRating,
    debouncedKeyword,
    sortBy,
    pageNumber,
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  // Reset all filters
  const handleResetFilters = () => {
    setSearchKeyword('');
    setDebouncedKeyword('');
    setSelectedCategory('');
    setSelectedSubject('');
    setTeachingMode('All');
    setPriceRange(10000000);
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

  // Active filters list for chips bar
  const activeFilters = useMemo(() => {
    const list = [];
    if (selectedCategory) {
      const catObj = categories.find((c) => c.id === selectedCategory);
      list.push({
        key: 'category',
        label: `Danh mục: ${catObj?.name || 'Đã chọn'}`,
        clear: () => {
          setSelectedCategory('');
          setSelectedSubject('');
        },
      });
    }
    if (selectedSubject) {
      const subObj = subjects.find((s) => s.id === selectedSubject);
      list.push({
        key: 'subject',
        label: `Môn: ${subObj?.name || 'Đã chọn'}`,
        clear: () => setSelectedSubject(''),
      });
    }
    if (teachingMode !== 'All') {
      const modeLabel =
        teachingMode === 'InPerson'
          ? 'Tại nhà'
          : teachingMode === 'Both'
          ? 'Cả hai'
          : teachingMode;
      list.push({
        key: 'mode',
        label: `Hình thức: ${modeLabel}`,
        clear: () => setTeachingMode('All'),
      });
    }
    if (priceRange < 10000000) {
      list.push({
        key: 'price',
        label: `Học phí ≤ ${formatVND(priceRange)}`,
        clear: () => setPriceRange(10000000),
      });
    }
    if (minRating !== null) {
      list.push({
        key: 'rating',
        label: `Đánh giá: ≥ ${minRating}★`,
        clear: () => setMinRating(null),
      });
    }
    if (searchKeyword.trim()) {
      list.push({
        key: 'search',
        label: `"${searchKeyword.trim()}"`,
        clear: () => {
          setSearchKeyword('');
          setDebouncedKeyword('');
          setSearchParams({});
        },
      });
    }
    return list;
  }, [
    selectedCategory,
    selectedSubject,
    categories,
    subjects,
    teachingMode,
    priceRange,
    minRating,
    searchKeyword,
    setSearchParams,
  ]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPageNumber(newPage);
    window.scrollTo({ top: 380, behavior: 'smooth' });
  };

  return (
    <div className="w-full flex-1 bg-canvas pb-16">
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
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] gap-7 items-start">
          {/* Left Column: Filter Sidebar */}
          <div className="w-full shrink-0">
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
              teachingMode={teachingMode}
              onTeachingModeChange={(mode) => {
                setTeachingMode(mode);
                setPageNumber(1);
              }}
              priceRange={priceRange}
              onPriceRangeChange={(val) => {
                setPriceRange(val);
                setPageNumber(1);
              }}
              minRating={minRating}
              onMinRatingChange={(r) => {
                setMinRating(r);
                setPageNumber(1);
              }}
            />
          </div>

          {/* Right Column: Active Chips + Count Toolbar + Grid */}
          <div className="flex-1 min-w-0 space-y-5">
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
                      className="hover:text-danger transition-colors font-bold text-[14px] leading-none cursor-pointer -mr-0.5 ml-0.5"
                      title="Gỡ bộ lọc này"
                    >
                      ×
                    </button>
                  </span>
                ))}
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-[12px] font-semibold text-neutral-500 hover:text-danger-strong transition-colors ml-auto cursor-pointer flex items-center gap-1"
                >
                  <Icon name="close" size="xs" className="w-3.5 h-3.5" />
                  <span>Xóa tất cả</span>
                </button>
              </div>
            )}

            {/* Top Toolbar: Counter + Sort Dropdown */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-neutral-200/80 pt-1">
              <div>
                <h2 className="text-[18px] sm:text-[22px] font-bold text-neutral-900 tracking-tight">
                  {loading ? 'Đang tìm kiếm dịch vụ...' : `${totalCount} dịch vụ phù hợp`}
                </h2>
                <p className="text-[12.5px] text-neutral-500 font-medium mt-0.5">
                  Dựa trên các tiêu chí lọc hiện tại
                </p>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <label htmlFor="sort-services" className="text-[13px] font-semibold text-neutral-500 shrink-0">
                  Sắp xếp theo:
                </label>
                <div className="w-[195px]">
                  <Select
                    id="sort-services"
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value);
                      setPageNumber(1);
                    }}
                    className="!h-9 !py-1 text-[13px] font-medium bg-surface border border-neutral-200/90 rounded-lg shadow-sm hover:border-brand-primary-600/50 focus:border-brand-primary-600 focus:ring-2 focus:ring-brand-primary-600/15 cursor-pointer"
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

            {/* Error State */}
            {error && !loading && (
              <ErrorState
                error={error}
                title="Không thể tải danh sách dịch vụ học tập"
                onRetry={handleResetFilters}
              />
            )}

            {/* Loading Skeletons */}
            {loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <CardSkeleton key={idx} />
                ))}
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && services.length === 0 && (
              <EmptyState
                icon="search_off"
                title="Không tìm thấy dịch vụ học tập phù hợp"
                description="Hãy thử nới lỏng các tiêu chí lọc, đổi khoảng giá hoặc tìm kiếm với từ khóa khác."
                actionLabel="Xóa tất cả bộ lọc"
                onAction={handleResetFilters}
              />
            )}

            {/* Services Grid (3 Columns on Desktop) */}
            {!loading && !error && services.length > 0 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {services.map((service) => (
                    <ServiceCard
                      key={service.id}
                      service={service}
                      onDetail={() => {
                        navigate(`/services/${service.id}`);
                      }}
                      onBookNow={() => {
                        navigate(`/services/${service.id}`);
                      }}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="pt-8 flex justify-center">
                    <Pagination
                      pageNumber={pageNumber}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
