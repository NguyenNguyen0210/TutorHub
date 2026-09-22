import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import tutorService from '@/services/tutor.service';
import { CardSkeleton } from '@/components/common/Skeleton';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import { Select } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Table';
import HeroSection from '@/components/discovery/HeroSection';
import CategoryFilterBar from '@/components/discovery/CategoryFilterBar';
import FilterSidebar from '@/components/discovery/FilterSidebar';
import TutorCard from '@/components/discovery/TutorCard';

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

export default function Marketplace() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Filter States
  const [searchKeyword, setSearchKeyword] = useState(searchParams.get('q') || '');
  const [debouncedKeyword, setDebouncedKeyword] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [priceRange, setPriceRange] = useState(5000000);
  const [teachingMode, setTeachingMode] = useState('All');
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

  // Query Tutors directly from Backend API with real parameters
  useEffect(() => {
    let cancelled = false;

    async function loadTutors() {
      try {
        setLoading(true);
        setError(null);

        const apiSortBy =
          sortBy === 'priority'
            ? null
            : sortBy;

        const response = await tutorService.getTutors({
          categoryId: selectedCategory || null,
          search: debouncedKeyword.trim() || null,
          minPrice: null,
          maxPrice: priceRange < 5000000 ? priceRange : null,
          teachingMode: teachingMode !== 'All' ? teachingMode : null,
          minRating: minRating || null,
          sortBy: apiSortBy,
          pageNumber,
          pageSize,
        });

        if (cancelled) return;

        let items = Array.isArray(response?.items) ? response.items : [];

        // Client-side filter for experienceRange if backend doesn't have minExperience param
        if (experienceRange !== 'All') {
          items = items.filter((t) => {
            const exp = Number(t.experienceYears ?? t.yearsOfExperience ?? 0);
            if (experienceRange === '<1') return exp < 1;
            if (experienceRange === '1-3') return exp >= 1 && exp <= 3;
            if (experienceRange === '3-5') return exp >= 3 && exp <= 5;
            if (experienceRange === '>5') return exp > 5;
            return true;
          });
        }

        setTutors(items);
        setTotalCount(response?.totalCount ?? items.length);
      } catch (err) {
        if (cancelled) return;
        console.error('[Marketplace] Lỗi truy vấn tutors:', err);
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
    priceRange,
    teachingMode,
    minRating,
    experienceRange,
    sortBy,
    pageNumber,
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
    setPriceRange(5000000);
    setTeachingMode('All');
    setMinRating(null);
    setExperienceRange('All');
    setSortBy('priority');
    setPageNumber(1);
    setSearchParams({});
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPageNumber(newPage);
    window.scrollTo({ top: 380, behavior: 'smooth' });
  };

  const handleMessageClick = (tutor) => {
    navigate(`/app/messages?tutorId=${tutor.id}`);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      {/* 1. Hero Section: #EFF6FF -> #ECFEFF with unified woman visual */}
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
        totalCount={totalCount}
        topTutors={tutors.slice(0, 3)}
      />

      {/* 2. Real Category Navigation Bar: #FFFFFF */}
      <CategoryFilterBar
        categories={categories}
        selectedCategoryId={selectedCategory}
        onSelectCategory={(id) => {
          setSelectedCategory(id);
          setPageNumber(1);
        }}
      />

      {/* 3. Main Discovery Workspace: #F8FAFC */}
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] gap-7 items-start">
          {/* Left Column: Filter Sidebar (sticky top 88px, width 260px) */}
          <div className="w-full lg:sticky lg:top-[88px] z-20">
            <FilterSidebar
              priceRange={priceRange}
              onPriceRangeChange={(val) => {
                setPriceRange(val);
                setPageNumber(1);
              }}
              maxPrice={5000000}
              teachingMode={teachingMode}
              onTeachingModeChange={(mode) => {
                setTeachingMode(mode);
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
          </div>

          {/* Right Column: Real Tutor Listings & Controls */}
          <div className="flex-1 min-w-0 space-y-6">
            {/* Top Toolbar: Count + Sort Dropdown */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-neutral-200/80">
              <h2 className="text-[20px] sm:text-[24px] font-bold text-neutral-900 tracking-tight">
                {loading ? 'Đang tìm kiếm gia sư...' : `${totalCount} gia sư phù hợp`}
              </h2>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <label htmlFor="sort-tutors" className="text-[13px] font-semibold text-neutral-500 shrink-0">
                  Sắp xếp theo:
                </label>
                <div className="w-52">
                  <Select
                    id="sort-tutors"
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value);
                      setPageNumber(1);
                    }}
                    className="!py-1.5 !text-[13px] font-medium bg-white border-neutral-200/80"
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

            {/* Content States: Loading, Error, Empty, or Real Cards Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <CardSkeleton key={idx} />
                ))}
              </div>
            ) : error ? (
              <ErrorState
                title="Không thể tải danh sách gia sư"
                message="Không thể kết nối tới máy chủ backend. Vui lòng kiểm tra kết nối API và thử lại."
                onRetry={() => setPageNumber(1)}
              />
            ) : tutors.length === 0 ? (
              <EmptyState
                icon="person_search"
                title="Không tìm thấy gia sư phù hợp"
                message="Hãy thử điều chỉnh lại mức học phí, chọn danh mục khác hoặc xóa bớt bộ lọc để tìm kiếm rộng hơn."
                action={{
                  label: 'Xóa toàn bộ bộ lọc',
                  onClick: handleResetFilters,
                }}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
                {tutors.map((tutor) => (
                  <TutorCard
                    key={tutor.id}
                    tutor={tutor}
                    onMessageClick={handleMessageClick}
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
      </main>
    </div>
  );
}
