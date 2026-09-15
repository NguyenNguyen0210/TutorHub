import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import tutorService from '@/services/tutor.service';
import EscrowVaultSimulator from '@/components/discovery/EscrowVaultSimulator';
import { formatCurrency } from '@/utils/formatters';

export default function Marketplace() {
  const [searchParams] = useSearchParams();
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'All');
  const [teachingMode, setTeachingMode] = useState('All');
  const [sortBy, setSortBy] = useState('rating_desc');

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
      subjects: ['Toán THPT', 'Hình Không Gian Oxyz', 'Luyện Đề 9+'],
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Hero Banner with Ambient Radial Lighting & 3D Escrow Trust Badges */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-navy-950 via-slate-900 to-indigo-950 p-8 sm:p-14 text-white shadow-2xl border border-white/10">
        {/* Soft Ambient Radial Lights */}
        <div className="absolute top-0 right-10 w-96 h-96 bg-brand-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-10 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-extrabold uppercase tracking-wider backdrop-blur-md shadow-xs">
            <span className="material-symbols-outlined text-base animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>
              verified
            </span>
            <span>Bảo Chứng Học Phí Hai Chiều (Dual Escrow Guarantee)</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-[1.15] text-white">
            Khám Phá Gia Sư Tinh Anh Theo Gói Học{' '}
            <span className="text-gradient-emerald">Bảo Chứng Ký Quỹ</span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl font-normal">
            Học phí an tâm tuyệt đối: tiền chỉ giải ngân theo từng buổi học thực tế sau khi cả học viên và gia sư đối soát điểm danh 24 giờ.
          </p>

          {/* Interactive Search Bar in Hero */}
          <div className="pt-3 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl pointer-events-none">
                search
              </span>
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="Tìm theo môn học, gia sư, trường ĐH (VD: Toán 12, IELTS 8.0, Bách Khoa)..."
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-brand-indigo-500 focus:bg-white/15 transition-all text-xs sm:text-sm font-medium shadow-inner"
              />
            </div>
            <button
              type="button"
              className="px-7 py-4 rounded-2xl bg-gradient-to-r from-brand-indigo-600 to-indigo-700 hover:from-brand-indigo-500 hover:to-indigo-600 font-extrabold text-white shadow-lg shadow-brand-indigo-500/30 transition-all sheen-btn flex items-center justify-center gap-2 text-xs sm:text-sm shrink-0"
            >
              <span className="material-symbols-outlined text-lg">tune</span>
              Tìm Kiếm Ngay
            </button>
          </div>

          {/* Trust Floating Metric Pills */}
          <div className="flex flex-wrap items-center gap-3 pt-4 text-xs font-semibold text-slate-300">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
              <span className="material-symbols-outlined text-sm text-financial-available">check_circle</span>
              99.8% Buổi học được giải ngân suôn sẻ
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
              <span className="material-symbols-outlined text-sm text-financial-available">check_circle</span>
              100% Hoàn tiền nếu gia sư vắng mặt
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Dual Escrow Vault Simulator - Core Value Proposition */}
      <EscrowVaultSimulator />

      {/* 3 Steps Escrow Guarantee Indicator with Glass Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl glass-panel-premium card-hover-lift flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center shrink-0 shadow-xs">
            <span className="material-symbols-outlined text-2xl">hourglass_top</span>
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">1. Đặt Giữ Chỗ 15 Phút</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">Khóa độc quyền lịch dạy, tránh trùng lịch</p>
          </div>
        </div>

        <div className="p-5 rounded-3xl glass-panel-premium card-hover-lift flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-financial-available flex items-center justify-center shrink-0 shadow-xs">
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>shield</span>
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">2. Ký Quỹ Bảo Chứng Escrow</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">Học phí giữ an toàn, tự động phân rã N buổi</p>
          </div>
        </div>

        <div className="p-5 rounded-3xl glass-panel-premium card-hover-lift flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-indigo-500/10 border border-brand-indigo-500/20 text-brand-indigo-600 flex items-center justify-center shrink-0 shadow-xs">
            <span className="material-symbols-outlined text-2xl">verified_user</span>
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">3. Điểm Danh 2 Chiều 24H</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">Giải ngân từng buổi sau khi 2 bên xác nhận</p>
          </div>
        </div>
      </div>

      {/* Category Pills Bar */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat.key}
            type="button"
            onClick={() => setSelectedCategory(cat.key)}
            className={`px-4 py-2.5 rounded-2xl font-extrabold text-xs shrink-0 flex items-center gap-2 transition-all duration-200 ${
              selectedCategory === cat.key
                ? 'bg-brand-indigo-600 text-white shadow-md shadow-brand-indigo-500/20'
                : 'bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
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
          <div className="p-6 rounded-3xl glass-panel-premium space-y-6 sticky top-24">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
              <span className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-brand-indigo-600 text-xl">filter_list</span>
                Bộ Lọc Nâng Cao
              </span>
              <button
                type="button"
                onClick={() => {
                  setTeachingMode('All');
                  setSearchKeyword('');
                }}
                className="text-[11px] text-brand-indigo-600 font-bold hover:underline"
              >
                Đặt lại
              </button>
            </div>

            {/* Teaching Mode Filter */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">Hình thức giảng dạy</label>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100/80 rounded-xl">
                {['All', 'Online', 'Both'].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setTeachingMode(m)}
                    className={`py-2 text-xs font-extrabold rounded-lg transition-all ${
                      teachingMode === m ? 'bg-white text-brand-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {m === 'All' ? 'Tất cả' : m === 'Both' ? 'Cả hai' : m}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Filter */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">Ưu tiên sắp xếp</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full text-xs font-bold rounded-xl border border-slate-200 p-3 bg-white text-slate-700 focus:ring-2 focus:ring-brand-indigo-500 focus:border-brand-indigo-500 outline-hidden"
              >
                <option value="rating_desc">Đánh giá cao nhất (★ 5.0)</option>
                <option value="price_asc">Học phí: Thấp đến cao</option>
                <option value="price_desc">Học phí: Cao đến thấp</option>
                <option value="reviews_desc">Nhiều đánh giá nhất</option>
              </select>
            </div>

            {/* Verification Guarantee Callout */}
            <div className="p-4 rounded-2xl bg-indigo-50/70 border border-brand-indigo-100 space-y-1 text-xs">
              <span className="font-extrabold text-brand-indigo-950 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base text-financial-available" style={{ fontVariationSettings: "'FILL' 1" }}>
                  verified
                </span>
                Gia Sư Đã Xác Minh Bằng Cấp
              </span>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                100% gia sư đều được Admin thẩm định bằng cử nhân/thạc sĩ có dấu đỏ trước khi cấp quyền niêm yết.
              </p>
            </div>
          </div>
        </div>

        {/* Right Cards Grid */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
              {tutors.length} Gia Sư Bảo Chứng Uy Tín
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tutors.map((tut) => (
              <div
                key={tut.id}
                className="rounded-3xl glass-panel-premium card-hover-lift overflow-hidden flex flex-col justify-between group"
              >
                <div className="p-6 space-y-4">
                  {/* Tutor Avatar & Header */}
                  <div className="flex items-start gap-4">
                    <div className="relative shrink-0">
                      <img
                        src={tut.avatarUrl}
                        alt={tut.fullName}
                        className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-md group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-financial-available border-2 border-white" title="Trực tuyến"></span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-base font-extrabold text-slate-900 truncate group-hover:text-brand-indigo-600 transition-colors">
                          {tut.fullName}
                        </h3>
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
                      <p className="text-xs font-bold text-brand-indigo-600 line-clamp-1">{tut.university}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="flex items-center text-amber-500 text-xs font-extrabold">
                          <span className="material-symbols-outlined text-sm mr-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                          {tut.rating.toFixed(2)}
                        </span>
                        <span className="text-[11px] text-slate-400">({tut.reviewCount} đánh giá)</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {tut.teachingMode === 'Both' ? 'Online + Offline' : tut.teachingMode}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Headline / Bio */}
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {tut.title || tut.bio}
                  </p>

                  {/* Subject Tags */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {tut.subjects.map((sub, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-brand-indigo-50/80 text-brand-indigo-700 border border-brand-indigo-100/50"
                      >
                        {sub}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Footer Price & CTAs */}
                <div className="p-4 bg-slate-50/80 border-t border-slate-200/60 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Gói Từ</span>
                    <div className="text-base font-extrabold text-financial-available font-monospace-num">
                      {formatCurrency(tut.startingPrice)}
                      <span className="text-[11px] font-normal text-slate-500"> / {tut.sessionsCount} buổi</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/app/messages?tutorId=${tut.id}`}
                      className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-extrabold text-xs transition-colors flex items-center gap-1 shadow-2xs"
                    >
                      <span className="material-symbols-outlined text-base">chat</span>
                      Nhắn tin
                    </Link>
                    <Link
                      to={`/tutors/${tut.id}`}
                      className="px-4 py-2.5 rounded-xl bg-brand-indigo-600 hover:bg-brand-indigo-700 text-white font-extrabold text-xs shadow-md shadow-brand-indigo-500/20 transition-all sheen-btn flex items-center gap-1"
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
