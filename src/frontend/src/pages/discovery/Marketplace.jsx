import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import tutorService from '@/services/tutor.service';
import { formatCurrency } from '@/utils/formatters';

export default function Marketplace() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'All');
  const [teachingMode, setTeachingMode] = useState('All');
  const [selectedRating, setSelectedRating] = useState('All');
  const [sortBy, setSortBy] = useState('rating_desc');

  // Initial rich sample data matching Stitch design exactly
  const initialTutors = [
    {
      id: 'tut-001',
      fullName: 'ThS. Nguyễn Văn An',
      title: 'Chuyên luyện thi THPT QG môn Toán 5 năm kinh nghiệm',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      university: 'Đại Học Sư Phạm Hà Nội',
      degree: 'Cử Nhân Xuất Sắc',
      rating: 4.90,
      reviewCount: 28,
      verified: true,
      subjects: ['Toán THPT', 'Hình Học Không Gian', 'Luyện Đề 9+'],
      teachingMode: 'Both',
      startingPrice: 2000000,
      sessionsCount: 10,
      bio: 'Tốt nghiệp thủ khoa ĐHSP, phương pháp tư duy giải nhanh trắc nghiệm 30s không cần máy tính.',
    },
    {
      id: 'tut-002',
      fullName: 'Trần Thị Bích, M.Ed',
      title: 'Luyện thi IELTS 7.5+ & Tiếng Anh Học Thuật Chuyên Sâu',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
      university: 'Đại Học Ngoại Thương',
      degree: 'IELTS 8.5 Overall',
      rating: 5.00,
      reviewCount: 42,
      verified: true,
      subjects: ['IELTS 6.5+', 'Writing Task 2', 'Speaking VIP'],
      teachingMode: 'Online',
      startingPrice: 6000000,
      sessionsCount: 20,
      bio: 'Chuyên gia sửa bài Writing 1-1 theo tiêu chuẩn chấm thi IDP/BC, cam kết tăng tối thiểu 1.0 band sau khóa.',
    },
    {
      id: 'tut-003',
      fullName: 'Lê Hoàng Nam',
      title: 'Thạc Sĩ CNTT & Luyện Thi Chuyên Lý THPT Chuyên',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
      university: 'Đại Học Bách Khoa Hà Nội',
      degree: 'Kỹ Sư Xuất Sắc',
      rating: 4.85,
      reviewCount: 19,
      verified: true,
      subjects: ['Vật Lý 12', 'Lập Trình C# .NET', 'Điện Xoay Chiều'],
      teachingMode: 'Both',
      startingPrice: 1800000,
      sessionsCount: 8,
      bio: 'Tập trung xây dựng nền tảng bản chất vật lý và tư duy kiến trúc thuật toán cho học sinh giỏi.',
    },
    {
      id: 'tut-004',
      fullName: 'Vũ Minh Trang',
      title: 'Giáo Viên Ngữ Văn Trường Chuyên & Luyện Thi Đại Học',
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80',
      university: 'ĐH Sư Phạm TP.HCM',
      degree: 'Thạc Sĩ Văn Học',
      rating: 4.95,
      reviewCount: 35,
      verified: true,
      subjects: ['Văn Học THPT', 'Nghị Luận Xã Hội', 'Luyện Đề Bộ GD'],
      teachingMode: 'Online',
      startingPrice: 2400000,
      sessionsCount: 12,
      bio: 'Hơn 8 năm kinh nghiệm chấm thi tốt nghiệp, hướng dẫn kỹ năng mở bài gây ấn tượng và triển khai luận điểm sáng tạo.',
    }
  ];

  useEffect(() => {
    async function loadTutors() {
      try {
        setLoading(true);
        const res = await tutorService.getTutors({
          searchTerm: searchKeyword,
          category: selectedCategory !== 'All' ? selectedCategory : undefined,
          teachingMode: teachingMode !== 'All' ? teachingMode : undefined,
          sortBy,
        });
        if (res && res.data && res.data.length > 0) {
          setTutors(res.data);
        } else {
          setTutors(initialTutors);
        }
      } catch (err) {
        setTutors(initialTutors);
      } finally {
        setLoading(false);
      }
    }
    loadTutors();
  }, [searchKeyword, selectedCategory, teachingMode, sortBy]);

  const categories = [
    { key: 'All', label: 'Tất Cả Bộ Môn', icon: 'auto_stories' },
    { key: 'Math', label: 'Toán Học & KHTN', icon: 'calculate' },
    { key: 'Languages', label: 'Ngoại Ngữ & IELTS', icon: 'translate' },
    { key: 'IT', label: 'Công Nghệ Thông Tin', icon: 'terminal' },
    { key: 'Exam', label: 'Luyện Thi THPT QG', icon: 'military_tech' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Hero Banner with Escrow Trust Guarantee */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-indigo-900 via-brand-navy-900 to-slate-950 p-8 sm:p-12 text-white shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-financial-available/20 border border-financial-available/30 text-financial-available text-xs font-bold uppercase tracking-wider">
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
            Bảo Chứng Học Phí 2 Chiều (Dual Escrow)
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
            Tìm Gia Sư Uy Tín Theo Gói Học Bảo Chứng Escrow
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Học phí của bạn được khóa an toàn trong Ví Ký Quỹ và chỉ giải ngân cho gia sư sau khi cả 2 bên xác nhận điểm danh từng buổi học. Trọng tài bảo vệ học viên 24/7.
          </p>

          {/* Search Input in Hero */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl pointer-events-none">
                search
              </span>
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="Nhập môn học, gia sư, trường ĐH (VD: Toán 12, IELTS, Bách Khoa)..."
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-brand-indigo-500 focus:bg-white/20 transition-all text-sm"
              />
            </div>
            <button
              type="button"
              className="px-6 py-3.5 rounded-2xl bg-brand-indigo-500 hover:bg-brand-indigo-600 font-bold text-white shadow-md transition-all flex items-center justify-center gap-2 text-sm"
            >
              <span className="material-symbols-outlined text-lg">tune</span>
              Tìm Kiếm Ngay
            </button>
          </div>
        </div>

        {/* Decorative Background Ring */}
        <div className="absolute right-0 top-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-brand-indigo-500/10 blur-3xl pointer-events-none"></div>
      </div>

      {/* 3 Steps Escrow Guarantee Indicator */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-border-light shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-xl">hourglass_top</span>
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">1. Đặt Giữ Chỗ 15 Phút</h4>
            <p className="text-[11px] text-text-muted">Khóa học phí tạm thời, không sợ trùng lịch</p>
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-border-light shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-xl">shield</span>
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">2. Ký Quỹ Bảo Chứng Escrow</h4>
            <p className="text-[11px] text-text-muted">Học phí an toàn, phân rã N buổi học</p>
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-border-light shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-xl">verified_user</span>
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">3. Điểm Danh 2 Chiều 24H</h4>
            <p className="text-[11px] text-text-muted">Giải ngân từng buổi sau khi 2 bên xác nhận</p>
          </div>
        </div>
      </div>

      {/* Category Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat.key}
            type="button"
            onClick={() => setSelectedCategory(cat.key)}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs shrink-0 flex items-center gap-2 transition-all ${
              selectedCategory === cat.key
                ? 'bg-brand-indigo-600 text-white shadow-xs'
                : 'bg-white border border-border-light text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className="material-symbols-outlined text-base">{cat.icon}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Main Layout: Filters Sidebar + Tutor Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Filter Sidebar */}
        <div className="space-y-6 lg:col-span-1">
          <div className="p-6 rounded-2xl bg-white border border-border-light shadow-xs space-y-5 sticky top-24">
            <div className="flex items-center justify-between pb-3 border-b border-border-light">
              <span className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <span className="material-symbols-outlined text-brand-indigo-600 text-lg">filter_list</span>
                Bộ Lọc Nâng Cao
              </span>
              <button
                type="button"
                onClick={() => {
                  setTeachingMode('All');
                  setSelectedRating('All');
                  setSearchKeyword('');
                }}
                className="text-[11px] text-brand-indigo-600 font-bold hover:underline"
              >
                Đặt lại
              </button>
            </div>

            {/* Teaching Mode Filter */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">Hình thức học tập</label>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl">
                {['All', 'Online', 'Both'].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setTeachingMode(m)}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                      teachingMode === m ? 'bg-white text-brand-indigo-600 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    {m === 'All' ? 'Tất cả' : m === 'Both' ? 'Cả hai' : m}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Filter */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">Sắp xếp theo</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full text-xs font-semibold rounded-xl border border-border-light p-2.5 bg-white text-slate-700 focus:ring-2 focus:ring-brand-indigo-500"
              >
                <option value="rating_desc">Đánh giá cao nhất (★ 5.0)</option>
                <option value="price_asc">Học phí: Thấp đến cao</option>
                <option value="price_desc">Học phí: Cao đến thấp</option>
                <option value="reviews_desc">Nhiều đánh giá nhất</option>
              </select>
            </div>

            {/* Verification Guarantee Callout */}
            <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100 space-y-1 text-xs">
              <span className="font-bold text-brand-indigo-900 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm text-financial-available" style={{ fontVariationSettings: "'FILL' 1" }}>
                  verified
                </span>
                Gia Sư Đã Kiểm Duyệt
              </span>
              <p className="text-[11px] text-slate-600 leading-normal">
                100% gia sư đều được Admin xác minh văn bằng đại học, chứng chỉ sư phạm và dữ liệu căn cước công dân.
              </p>
            </div>
          </div>
        </div>

        {/* Right Cards Grid */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Hiển thị {tutors.length} gia sư bảo chứng chất lượng cao
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tutors.map((tut) => (
              <div
                key={tut.id}
                className="rounded-3xl bg-white border border-border-light shadow-xs hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col justify-between group"
              >
                <div className="p-6 space-y-4">
                  {/* Tutor Avatar & Header */}
                  <div className="flex items-start gap-4">
                    <img
                      src={tut.avatarUrl}
                      alt={tut.fullName}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-brand-indigo-100 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-base font-bold text-slate-900 truncate">{tut.fullName}</h3>
                        {tut.verified && (
                          <span
                            className="material-symbols-outlined text-financial-available text-lg shrink-0"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                            title="Gia Sư Đã Xác Thực Bằng Cấp"
                          >
                            verified
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-brand-indigo-600 line-clamp-1">{tut.university}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="flex items-center text-amber-500 text-xs font-bold">
                          <span className="material-symbols-outlined text-sm mr-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                          {tut.rating.toFixed(2)}
                        </span>
                        <span className="text-[11px] text-text-muted">({tut.reviewCount} đánh giá)</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {tut.teachingMode === 'Both' ? 'Online + Offline' : tut.teachingMode}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Tutor Headline / Bio */}
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {tut.title || tut.bio}
                  </p>

                  {/* Subject Tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {tut.subjects.map((sub, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-brand-indigo-50 text-brand-indigo-700 border border-brand-indigo-100/50"
                      >
                        {sub}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Footer Price & CTAs */}
                <div className="p-4 bg-slate-50 border-t border-border-light flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] text-text-muted font-bold block uppercase tracking-wider">Từ Gói Dịch Vụ</span>
                    <div className="text-base font-extrabold text-financial-available font-monospace-num">
                      {formatCurrency(tut.startingPrice)}
                      <span className="text-[11px] font-normal text-text-muted"> / {tut.sessionsCount} buổi</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/app/messages?tutorId=${tut.id}`}
                      className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-base">chat</span>
                      Nhắn tin
                    </Link>
                    <Link
                      to={`/tutors/${tut.id}`}
                      className="px-4 py-2 rounded-xl bg-brand-indigo-600 hover:bg-brand-indigo-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1"
                    >
                      Xem Hồ Sơ
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
