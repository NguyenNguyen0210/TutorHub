import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import tutorService from '@/services/tutor.service';
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

        const response = await tutorService.getTutors({
          categoryId: selectedCategory || null,
          search: debouncedKeyword.trim() || null,
          minPrice: null,
          maxPrice: priceRange < 5000000 ? priceRange : null,
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
        });

        if (cancelled) return;

        let items = Array.isArray(response?.items) ? response.items : [];

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
    city,
    degreeLevel,
    university,
    certification,
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

  const activeFilters = useMemo(() => {
    const list = [];
    if (degreeLevel !== 'All') {
      list.push({ key: 'degree', label: `Học vị: ${degreeLevel}`, clear: () => setDegreeLevel('All') });
    }
    if (university !== 'All') {
      list.push({ key: 'uni', label: `Trường: ${university}`, clear: () => setUniversity('All') });
    }
    if (certification !== 'All') {
      list.push({ key: 'cert', label: `Chứng chỉ: ${certification}`, clear: () => setCertification('All') });
    }
    if (teachingMode !== 'All') {
      const modeLabel = teachingMode === 'InPerson' ? 'Tại nhà' : (teachingMode === 'Both' ? 'Cả hai' : teachingMode);
      list.push({ key: 'mode', label: `Hình thức: ${modeLabel}`, clear: () => setTeachingMode('All') });
    }
    if (city !== 'All') {
      list.push({ key: 'city', label: `Khu vực: ${city}`, clear: () => setCity('All') });
    }
    if (priceRange < 5000000) {
      list.push({ key: 'price', label: `Học phí ≤ ${formatVND(priceRange)}`, clear: () => setPriceRange(5000000) });
    }
    if (minRating !== null) {
      list.push({ key: 'rating', label: `Đánh giá: ≥ ${minRating}★`, clear: () => setMinRating(null) });
    }
    if (experienceRange !== 'All') {
      const expLabel = experienceRange === '<1' ? '< 1 năm' : `${experienceRange} năm`;
      list.push({ key: 'exp', label: `Kinh nghiệm: ${expLabel}`, clear: () => setExperienceRange('All') });
    }
    if (selectedCategory) {
      const catObj = categories.find((c) => c.id === selectedCategory);
      list.push({
        key: 'category',
        label: `Danh mục: ${catObj?.name || 'Đã chọn'}`,
        clear: () => setSelectedCategory(''),
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
  }, [degreeLevel, university, certification, teachingMode, city, priceRange, minRating, experienceRange, selectedCategory, categories, searchKeyword, setSearchParams]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPageNumber(newPage);
    window.scrollTo({ top: 380, behavior: 'smooth' });
  };

  const handleMessageClick = (tutor) => {
    navigate(`/app/messages?tutorId=${tutor.id}`);
  };

  return (
    <div className="w-full flex-1 bg-[#F8FAFC] pb-12">
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
        totalCount={totalCount}
        topTutors={tutors.slice(0, 3)}
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
          {/* Left Column: Filter Sidebar */}
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
          </div>

          {/* Right Column: Listings & Filters */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Active Filters Bar */}
            {activeFilters.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 p-3 bg-blue-50/70 border border-blue-100/90 rounded-[14px] shadow-xs">
                <div className="flex items-center gap-1.5 text-[12.5px] font-bold text-neutral-700">
                  <Icon name="filter_alt" size="xs" className="text-[#2563EB] w-3.5 h-3.5" />
                  <span>Đang lọc:</span>
                </div>
                {activeFilters.map((af) => (
                  <span
                    key={af.key}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-[#2563EB] text-[12px] font-semibold border border-blue-200/90 shadow-xs hover:border-blue-300 transition-colors"
                  >
                    <span>{af.label}</span>
                    <button
                      type="button"
                      onClick={af.clear}
                      className="hover:text-rose-500 transition-colors font-bold text-[14px] leading-none cursor-pointer -mr-0.5 ml-0.5"
                      title="Gỡ bộ lọc này"
                    >
                      ×
                    </button>
                  </span>
                ))}
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-[12px] font-semibold text-neutral-500 hover:text-rose-600 transition-colors ml-auto cursor-pointer flex items-center gap-1"
                >
                  <Icon name="close" size="xs" className="w-3.5 h-3.5" />
                  <span>Xóa tất cả</span>
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

            {/* Content States */}
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
