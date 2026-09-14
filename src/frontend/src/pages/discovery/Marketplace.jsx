import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Input,
  Select,
  Radio,
  Slider,
  Rate,
  Button,
  Pagination,
  Spin,
  Empty,
  Badge,
  Tag,
} from 'antd';
import {
  SearchOutlined,
  FilterOutlined,
  ReloadOutlined,
  SafetyCertificateFilled,
  LockFilled,
  CustomerServiceFilled,
  AppstoreOutlined,
} from '@ant-design/icons';
import TutorCard from '@/components/discovery/TutorCard';
import tutorService from '@/services/tutor.service';
import { formatCurrency } from '@/utils/formatters';

const { Search } = Input;
const { Option } = Select;

export default function Marketplace() {
  const [searchParams, setSearchParams] = useSearchParams();

  // State Dữ liệu
  const [categories, setCategories] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [tutors, setTutors] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // State Bộ Lọc
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(searchParams.get('subjectId') || null);
  const [teachingMode, setTeachingMode] = useState('All');
  const [priceRange, setPriceRange] = useState([100000, 1000000]);
  const [minRating, setMinRating] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [sortBy, setSortBy] = useState('rating_desc');
  const [pageNumber, setPageNumber] = useState(1);
  const pageSize = 6;

  // Load danh mục & môn học ban đầu
  useEffect(() => {
    async function loadMetadata() {
      const [cats, subs] = await Promise.all([
        tutorService.getCategories(),
        tutorService.getSubjects(),
      ]);
      setCategories(cats);
      setSubjects(subs);
    }
    loadMetadata();
  }, []);

  // Fetch danh sách gia sư mỗi khi bộ lọc thay đổi
  useEffect(() => {
    async function fetchTutors() {
      setLoading(true);
      try {
        const res = await tutorService.getTutors({
          subjectId: selectedSubject,
          minPrice: priceRange[0],
          maxPrice: priceRange[1],
          teachingMode: teachingMode !== 'All' ? teachingMode : null,
          minRating,
          search: searchKeyword,
          sortBy,
          pageNumber,
          pageSize,
        });
        setTutors(res.items || []);
        setTotalCount(res.totalCount || 0);
      } catch (err) {
        console.error('Lỗi khi tải danh sách gia sư:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchTutors();
  }, [selectedSubject, teachingMode, priceRange, minRating, searchKeyword, sortBy, pageNumber]);

  // Handler reset bộ lọc
  const handleResetFilters = () => {
    setSelectedCategory(null);
    setSelectedSubject(null);
    setTeachingMode('All');
    setPriceRange([100000, 1000000]);
    setMinRating(null);
    setSearchKeyword('');
    setSortBy('rating_desc');
    setPageNumber(1);
  };

  // Lọc danh sách môn học khi chọn danh mục
  const filteredSubjects = selectedCategory
    ? subjects.filter((s) => s.categoryId === selectedCategory)
    : subjects;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-16">
      {/* 1. HERO ESCROW GUARANTEE BANNER */}
      <div className="relative overflow-hidden bg-gradient-to-r from-brand-navy-950 via-slate-900 to-brand-indigo-950 text-white py-14 px-4 sm:px-6 lg:px-8 border-b border-brand-indigo-900/40">
        <div className="absolute -right-16 -top-16 h-80 w-80 rounded-full bg-brand-indigo-600/15 blur-3xl pointer-events-none"></div>
        <div className="absolute -left-16 -bottom-16 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none"></div>

        <div className="relative mx-auto max-w-7xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-indigo-400/30 bg-brand-indigo-950/60 px-3.5 py-1 text-xs font-semibold text-brand-indigo-300 backdrop-blur-md mb-4 shadow-sm">
            <SafetyCertificateFilled className="text-emerald-400" />
            <span>Sàn Dạy Kèm Bảo Chứng Escrow 2 Chiều Đầu Tiên Tại Việt Nam</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight max-w-3xl">
            Tìm Gia Sư Giỏi & Uy Tín,{' '}
            <span className="bg-gradient-to-r from-brand-indigo-400 to-emerald-400 bg-clip-text text-transparent">
              Học Trước — Giải Ngân Từng Buổi
            </span>
          </h1>

          <p className="mt-3.5 max-w-2xl text-sm sm:text-base text-slate-300 leading-relaxed">
            Tuyệt đối không lo mất học phí. Toàn bộ dòng tiền được khóa an toàn trong ví Escrow TutorHub và chỉ giải ngân từng buổi sau khi học viên hoàn thành buổi học và đối soát điểm danh 24h.
          </p>

          {/* 3 Pillars of Trust */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl">
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 text-lg">
                <SafetyCertificateFilled />
              </div>
              <div>
                <div className="font-bold text-xs text-white">100% Thẩm Định Bằng Cấp</div>
                <div className="text-[11px] text-slate-400">Kiểm duyệt ĐH Sư phạm, Bách Khoa, IELTS 8.0+</div>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-indigo-500/20 text-brand-indigo-400 text-lg">
                <LockFilled />
              </div>
              <div>
                <div className="font-bold text-xs text-white">Bảo Vệ Dòng Tiền Escrow</div>
                <div className="text-[11px] text-slate-400">Giải ngân từng buổi sau điểm danh 24h</div>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 text-lg">
                <CustomerServiceFilled />
              </div>
              <div>
                <div className="font-bold text-xs text-white">Trọng Tài Cân Bằng DEC-S8</div>
                <div className="text-[11px] text-slate-400">Hoàn tiền minh bạch nếu gia sư vắng mặt</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. TOP QUICK SEARCH & CATEGORY PILLS */}
      <div className="sticky top-16 z-20 border-b border-slate-200 bg-white/95 px-4 py-3.5 backdrop-blur-md shadow-xs">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="w-full md:w-96">
            <Input
              prefix={<SearchOutlined className="text-slate-400 mr-1" />}
              placeholder="Tìm theo tên gia sư, trường ĐH, môn học..."
              allowClear
              value={searchKeyword}
              onChange={(e) => {
                setSearchKeyword(e.target.value);
                setPageNumber(1);
              }}
              className="rounded-xl border-slate-300 py-2 text-xs shadow-xs hover:border-brand-indigo-500 focus:border-brand-indigo-500"
            />
          </div>

          {/* Quick Category Chips */}
          <div className="flex w-full md:w-auto items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => {
                setSelectedCategory(null);
                setSelectedSubject(null);
                setPageNumber(1);
              }}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                selectedCategory === null
                  ? 'bg-brand-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tất cả môn học
            </button>
            {categories.slice(0, 5).map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setSelectedSubject(null);
                  setPageNumber(1);
                }}
                className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-brand-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. MAIN CONTENT: SIDEBAR FILTERS & TUTORS GRID */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* LEFT SIDEBAR FILTERS */}
          <div className="lg:col-span-1 space-y-6 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <FilterOutlined className="text-brand-indigo-600" />
                <span>Bộ Lọc Nâng Cao</span>
              </div>
              <Button
                type="text"
                size="small"
                icon={<ReloadOutlined className="text-xs" />}
                onClick={handleResetFilters}
                className="text-xs text-slate-400 hover:text-brand-indigo-600"
              >
                Đặt lại
              </Button>
            </div>

            {/* Filter 1: Môn Học (Subjects) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Môn Học Cụ Thể
              </label>
              <Select
                placeholder="Chọn môn học"
                className="w-full text-xs"
                allowClear
                value={selectedSubject}
                onChange={(val) => {
                  setSelectedSubject(val);
                  setPageNumber(1);
                }}
              >
                {filteredSubjects.map((sub) => (
                  <Option key={sub.id} value={sub.id}>
                    {sub.name}
                  </Option>
                ))}
              </Select>
            </div>

            {/* Filter 2: Hình thức giảng dạy (Teaching Mode) */}
            <div className="border-t border-slate-100 pt-4">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Hình Thức Dạy
              </label>
              <Radio.Group
                value={teachingMode}
                onChange={(e) => {
                  setTeachingMode(e.target.value);
                  setPageNumber(1);
                }}
                className="flex flex-col gap-2 text-xs"
              >
                <Radio value="All">Tất cả hình thức</Radio>
                <Radio value="Online">Chỉ học Trực tuyến (Online)</Radio>
                <Radio value="Offline">Chỉ dạy Tại nhà (Offline)</Radio>
                <Radio value="Both">Cả Online & Tại nhà</Radio>
              </Radio.Group>
            </div>

            {/* Filter 3: Khoảng giá học phí (Price Slider) */}
            <div className="border-t border-slate-100 pt-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Giá Học Phí / Buổi
                </label>
                <span className="text-xs font-semibold text-brand-indigo-600">
                  {formatCurrency(priceRange[0])} - {formatCurrency(priceRange[1])}
                </span>
              </div>
              <Slider
                range
                min={100000}
                max={1000000}
                step={50000}
                value={priceRange}
                onChange={(val) => setPriceRange(val)}
                className="my-2"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>100k</span>
                <span>500k</span>
                <span>1.000k+</span>
              </div>
            </div>

            {/* Filter 4: Đánh giá tối thiểu (Rating) */}
            <div className="border-t border-slate-100 pt-4">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Đánh Giá Tối Thiểu
              </label>
              <Radio.Group
                value={minRating}
                onChange={(e) => {
                  setMinRating(e.target.value);
                  setPageNumber(1);
                }}
                className="flex flex-col gap-2 text-xs"
              >
                <Radio value={null}>Mọi đánh giá</Radio>
                <Radio value={4.8}>
                  <span className="text-amber-500 font-bold">★ 4.8+</span> Xuất sắc
                </Radio>
                <Radio value={4.5}>
                  <span className="text-amber-500 font-bold">★ 4.5+</span> Rất tốt
                </Radio>
                <Radio value={4.0}>
                  <span className="text-amber-500 font-bold">★ 4.0+</span> Tiêu chuẩn
                </Radio>
              </Radio.Group>
            </div>

            {/* Escrow Help Box */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5 text-xs text-emerald-800">
              <div className="font-bold flex items-center gap-1 mb-1">
                <SafetyCertificateFilled className="text-emerald-600" /> Cam Kết Hoàn Tiền 100%
              </div>
              <p className="m-0 text-[11px] leading-relaxed text-emerald-700">
                Nếu gia sư vắng mặt hoặc không đúng chuyên môn cam kết, bạn được trọng tài DEC-S8 hoàn lại 100% tiền buổi học đó ngay lập tức.
              </p>
            </div>
          </div>

          {/* RIGHT COLUMN: TUTORS LIST */}
          <div className="lg:col-span-3 space-y-6">
            {/* Sort & Count Header */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white px-5 py-3.5 shadow-xs">
              <div className="text-xs font-medium text-slate-600">
                Hiển thị <strong className="text-slate-900">{tutors.length}</strong> trên tổng số{' '}
                <strong className="text-brand-indigo-600">{totalCount}</strong> gia sư được bảo chứng
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Sắp xếp theo:</span>
                <Select
                  value={sortBy}
                  onChange={(val) => setSortBy(val)}
                  size="small"
                  className="w-48 text-xs font-medium"
                >
                  <Option value="rating_desc">Đánh giá cao nhất</Option>
                  <Option value="price_asc">Giá học phí: Thấp đến cao</Option>
                  <Option value="price_desc">Giá học phí: Cao đến thấp</Option>
                  <Option value="experience_desc">Nhiều kinh nghiệm nhất</Option>
                </Select>
              </div>
            </div>

            {/* Tutor Cards Grid */}
            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <Spin size="large" tip="Đang tải danh sách gia sư bảo chứng..." />
              </div>
            ) : tutors.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {tutors.map((tutor) => (
                  <TutorCard key={tutor.id} tutor={tutor} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-xs">
                <Empty
                  description={
                    <div>
                      <p className="font-bold text-slate-700 text-sm">
                        Không tìm thấy gia sư phù hợp với bộ lọc
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Hãy thử nới lỏng khoảng giá hoặc chọn tất cả môn học để xem thêm kết quả.
                      </p>
                    </div>
                  }
                >
                  <Button
                    type="primary"
                    className="bg-brand-indigo-600 rounded-xl mt-2"
                    onClick={handleResetFilters}
                  >
                    Xóa Bộ Lọc & Tìm Lại
                  </Button>
                </Empty>
              </div>
            )}

            {/* Pagination */}
            {totalCount > pageSize && (
              <div className="flex justify-center pt-4">
                <Pagination
                  current={pageNumber}
                  pageSize={pageSize}
                  total={totalCount}
                  onChange={(page) => setPageNumber(page)}
                  showSizeChanger={false}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
