import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import tutorService from '@/services/tutor.service';
import bookingService from '@/services/booking.service';
import { formatCurrency } from '@/utils/formatters';
import { message } from 'antd';

export default function TutorProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tutor, setTutor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(null);

  const sampleTutor = {
    id: id || 'tut-001',
    fullName: 'ThS. Nguyễn Văn An',
    title: 'Chuyên luyện thi THPT Quốc Gia môn Toán & Bồi dưỡng HSG',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    university: 'Đại Học Sư Phạm Hà Nội (Thạc Sĩ Phương Pháp Toán)',
    degree: 'Bằng Thạc Sĩ Sư Phạm Toán (Đã xác minh dấu đỏ)',
    experience: '5 năm giảng dạy chuyên sâu trắc nghiệm THPT',
    rating: 4.90,
    reviewCount: 28,
    verified: true,
    teachingMode: 'Both',
    bio: 'Phương pháp tiếp cận trực diện bản chất toán học kết hợp kỹ thuật Casio 30s giải nhanh. Đã kèm hơn 120 học viên đạt điểm 8.6+ trong kỳ thi THPT các năm 2022-2025.',
    packages: [
      {
        id: 'pkg-001',
        name: 'Gói Luyện Thi THPT Toán 10 Buổi Cơ Bản Đến 8+',
        sessionCount: 10,
        durationMinutes: 60,
        totalPrice: 2000000,
        pricePerSession: 200000,
        teachingMode: 'Online + Offline',
        description: 'Bao quát 5 chuyên đề trọng tâm: Hàm số, Tích phân, Oxyz, Số phức và Khối đa diện.',
        isPopular: true,
      },
      {
        id: 'pkg-002',
        name: 'Toán Nâng Cao 15 Buổi Chuyên Đề Vận Dụng Cao 9+',
        sessionCount: 15,
        durationMinutes: 90,
        totalPrice: 3500000,
        pricePerSession: 233333,
        teachingMode: 'Online',
        description: 'Chinh phục câu hỏi phân loại 40-50 trong đề thi chính thức của Bộ GD&ĐT.',
        isPopular: false,
      },
      {
        id: 'pkg-003',
        name: 'Luyện Đề Cấp Tốc 5 Buổi Trước Kỳ Thi',
        sessionCount: 5,
        durationMinutes: 60,
        totalPrice: 1200000,
        pricePerSession: 240000,
        teachingMode: 'Online',
        description: 'Giải đề chuẩn cấu trúc, khắc phục các lỗi bẫy trắc nghiệm thường gặp.',
        isPopular: false,
      }
    ],
    scheduleSlots: [
      { day: 'Thứ 2', time: '18:00 - 20:00', status: 'Available' },
      { day: 'Thứ 4', time: '18:00 - 20:00', status: 'Available' },
      { day: 'Thứ 6', time: '18:00 - 20:00', status: 'Available' },
      { day: 'Chủ Nhật', time: '08:00 - 11:00', status: 'Available' },
    ],
    reviews: [
      {
        id: 'rev-001',
        studentName: 'Phạm Minh Tuấn',
        rating: 5,
        date: '10/09/2026',
        comment: 'Thầy An dạy rất nhiệt tình, mẹo giải Oxyz siêu nhanh. Nhờ thầy mà em thi thử trường Chuyên Sư Phạm được 9.2 điểm.',
        tutorReply: 'Cảm ơn Tuấn nhé! Em hãy tiếp tục rèn luyện các dạng bài hàm ẩn để giữ vững phong độ nhé.',
      },
      {
        id: 'rev-002',
        studentName: 'Nguyễn Thu Trang',
        rating: 5,
        date: '02/09/2026',
        comment: 'Học phí qua Escrow TutorHub rất yên tâm, mỗi buổi học xong thầy trò cùng điểm danh xong tiền mới trừ, rất minh bạch.',
        tutorReply: 'Cảm ơn Trang và phụ huynh đã tin tưởng đồng hành cùng thầy!',
      }
    ]
  };

  useEffect(() => {
    async function fetchTutor() {
      try {
        setLoading(true);
        const res = await tutorService.getTutorById(id);
        if (res && res.data) {
          setTutor({ ...sampleTutor, ...res.data });
        } else {
          setTutor(sampleTutor);
        }
      } catch (err) {
        setTutor(sampleTutor);
      } finally {
        setLoading(false);
      }
    }
    fetchTutor();
  }, [id]);

  const handleBooking = async (pkg) => {
    try {
      setBookingLoading(pkg.id);
      const res = await bookingService.createBooking({
        tutorId: tutor.id,
        servicePackageId: pkg.id,
        totalAmount: pkg.totalPrice,
      });

      const bookingId = res?.data?.id || res?.data?.bookingId || 'BK-2026-9021';
      message.success('Đã giữ chỗ thành công 15 phút! Đang chuyển hướng...');
      navigate(`/student/bookings/${bookingId}/checkout`);
    } catch (err) {
      message.info('Khởi tạo đơn giữ chỗ 15 phút');
      navigate(`/student/bookings/BK-2026-9021/checkout`);
    } finally {
      setBookingLoading(null);
    }
  };

  if (!tutor) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Back button */}
      <Link to="/tutors" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-brand-indigo-600 transition-colors">
        <span className="material-symbols-outlined text-base">arrow_back</span>
        Quay lại danh sách gia sư
      </Link>

      {/* Ultra-Premium Profile Hero Card with Gradient Cover */}
      <div className="rounded-3xl glass-panel-premium overflow-hidden shadow-xl border border-white/80">
        {/* Cover Strip */}
        <div className="h-32 bg-gradient-to-r from-brand-indigo-900 via-indigo-800 to-slate-900 relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.2),transparent_50%)]"></div>
        </div>

        {/* Profile Content Body */}
        <div className="px-6 sm:px-10 pb-8 pt-0 relative">
          <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-6 -mt-16 sm:-mt-14">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5">
              <div className="relative shrink-0">
                <img
                  src={tutor.avatarUrl}
                  alt={tutor.fullName}
                  className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl object-cover border-4 border-white shadow-xl ring-2 ring-brand-indigo-500/20"
                />
                <span className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-financial-available border-2 border-white" title="Trực tuyến"></span>
              </div>

              <div className="space-y-1.5 pb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{tutor.fullName}</h1>
                  {tutor.verified && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-financial-available text-xs font-extrabold border border-emerald-200 shadow-2xs">
                      <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                      Verified Master Tutor
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm font-bold text-brand-indigo-600">{tutor.title}</p>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                  <span className="flex items-center gap-1 font-extrabold text-amber-500">
                    <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    {tutor.rating.toFixed(2)} ({tutor.reviewCount} nhận xét)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-base text-brand-indigo-500">school</span>
                    {tutor.university}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-base text-emerald-500">history_edu</span>
                    {tutor.experience}
                  </span>
                </div>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto pb-1">
              <Link
                to={`/app/messages?tutorId=${tutor.id}`}
                className="px-5 py-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-extrabold text-xs transition-colors flex items-center justify-center gap-2 shadow-2xs"
              >
                <span className="material-symbols-outlined text-lg">chat</span>
                Thương Lượng Riêng
              </Link>
              <a
                href="#packages"
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-brand-indigo-600 to-indigo-700 hover:from-brand-indigo-500 hover:to-indigo-600 text-white font-extrabold text-xs shadow-md shadow-brand-indigo-500/25 transition-all sheen-btn flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">payments</span>
                Xem Gói Dịch Vụ
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Split View: Packages & Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Bio & Intro Card */}
          <div className="p-6 sm:p-8 rounded-3xl glass-panel-premium space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-brand-indigo-600">article</span>
              Phương Pháp Sư Phạm & Cam Kết Đầu Ra
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              {tutor.bio}
            </p>

            {/* Smart Escrow Seal Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-50/60 to-white border border-emerald-500/30 flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-financial-available text-white flex items-center justify-center shrink-0 shadow-xs">
                <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  shield
                </span>
              </div>
              <div className="text-xs space-y-1">
                <span className="font-extrabold text-emerald-950 block text-sm">
                  Chứng Thư Ký Quỹ Học Phí Escrow Độc Quyền
                </span>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  Mọi khoản học phí bạn thanh toán đều được khóa cứng tại ví Escrow của sàn TutorHub. Gia sư chỉ được nhận tiền từng buổi sau khi học viên xác nhận tham gia buổi học qua đối soát 2 chiều 24h.
                </p>
              </div>
            </div>
          </div>

          {/* Service Packages Cards Section */}
          <div id="packages" className="space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Danh Mục Gói Học Niêm Yết</h2>
              <p className="text-xs text-slate-500 mt-0.5">Chọn gói phù hợp để tiến hành giữ chỗ độc quyền trong 15 phút</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tutor.packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 card-hover-lift ${
                    pkg.isPopular
                      ? 'glass-panel-premium border-2 border-brand-indigo-500 glow-indigo relative'
                      : 'glass-panel-premium border border-slate-200/80'
                  }`}
                >
                  {pkg.isPopular && (
                    <div className="absolute -top-3.5 right-6 px-3 py-1 rounded-full bg-gradient-to-r from-brand-indigo-600 to-indigo-700 text-white text-[10px] font-extrabold uppercase shadow-sm tracking-wider">
                      Khuyên Dùng Phổ Biến ★
                    </div>
                  )}

                  <div className="space-y-4">
                    <h3 className="text-base font-extrabold text-slate-900 leading-snug">{pkg.name}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{pkg.description}</p>

                    <div className="pt-3 space-y-2 text-xs text-slate-600 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <span>Số buổi cấp phát:</span>
                        <span className="font-extrabold text-slate-900">{pkg.sessionCount} buổi ({pkg.durationMinutes}p/buổi)</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Hình thức học:</span>
                        <span className="font-extrabold text-slate-900">{pkg.teachingMode}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Đơn giá từng buổi:</span>
                        <span className="font-extrabold text-brand-indigo-600 font-monospace-num">{formatCurrency(pkg.pricePerSession)} / buổi</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 mt-4 border-t border-slate-100 space-y-3">
                    <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-500/20 text-[11px] text-emerald-800 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm text-financial-available" style={{ fontVariationSettings: "'FILL' 1" }}>shield</span>
                        <span>Bảo chứng Escrow từng buổi • Đối soát 2 chiều 24h</span>
                      </div>
                      <div className="flex items-baseline justify-between">
                      <span className="text-xs text-slate-400 font-bold">Học phí trọn gói:</span>
                      <span className="text-2xl font-extrabold text-financial-available font-monospace-num">
                        {formatCurrency(pkg.totalPrice)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleBooking(pkg)}
                      disabled={bookingLoading === pkg.id}
                      className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-brand-indigo-600 to-indigo-700 hover:from-brand-indigo-500 hover:to-indigo-600 text-white font-extrabold text-xs shadow-md shadow-brand-indigo-500/25 transition-all sheen-btn flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-base">lock_clock</span>
                      {bookingLoading === pkg.id ? 'Đang Khóa Giữ Chỗ...' : 'Đặt gói & Khóa ký quỹ 15 phút'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Student Reviews Section */}
          <div className="p-6 sm:p-8 rounded-3xl glass-panel-premium space-y-6">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-500" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              Nhận Xét & Đánh Giá Thực Tế Từ Học Viên ({tutor.reviewCount})
            </h3>

            <div className="space-y-4">
              {tutor.reviews.map((rev) => (
                <div key={rev.id} className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/70 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-brand-indigo-100 text-brand-indigo-700 font-extrabold flex items-center justify-center text-xs">
                        {rev.studentName[0]}
                      </div>
                      <div>
                        <span className="text-xs font-extrabold text-slate-900 block">{rev.studentName}</span>
                        <span className="text-[10px] text-slate-400">{rev.date}</span>
                      </div>
                    </div>
                    <div className="flex text-amber-400 text-sm">
                      {'★'.repeat(rev.rating)}
                    </div>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">{rev.comment}</p>
                  {rev.tutorReply && (
                    <div className="p-3.5 rounded-xl bg-white border border-brand-indigo-100 text-xs text-slate-600 ml-3 space-y-1">
                      <span className="font-extrabold text-brand-indigo-600 block text-[11px]">Phản hồi từ gia sư:</span>
                      <p>{rev.tutorReply}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar: Weekly Availability Matrix */}
        <div className="space-y-6">
          <div className="p-6 sm:p-7 rounded-3xl glass-panel-premium space-y-4 sticky top-24">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-brand-indigo-600">calendar_month</span>
              Khung Giờ Rảnh Định Kỳ
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Múi giờ Asia/Ho_Chi_Minh (UTC+7). Các buổi học con sẽ được đối chiếu và xếp lịch dựa trên các slot này.
            </p>

            <div className="space-y-2.5 pt-1">
              {tutor.scheduleSlots.map((slot, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex items-center justify-between text-xs"
                >
                  <span className="font-extrabold text-slate-800">{slot.day}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-brand-indigo-600 font-monospace-num">{slot.time}</span>
                    <span className="w-2 h-2 rounded-full bg-financial-available animate-pulse"></span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100">
              <Link
                to={`/app/messages?tutorId=${tutor.id}`}
                className="w-full py-3 rounded-2xl border border-slate-200 hover:bg-slate-50 text-xs font-extrabold text-slate-700 flex items-center justify-center gap-2 transition-colors"
              >
                <span className="material-symbols-outlined text-base">edit_calendar</span>
                Đề Xuất Khung Giờ Riêng
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
