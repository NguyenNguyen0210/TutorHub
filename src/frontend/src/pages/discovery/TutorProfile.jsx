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

  // Default sample profile matching Stitch screen 3b87c223
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
    trialVideoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    bio: 'Phương pháp tiếp cận trực diện bản chất toán học kết hợp kỹ thuật Casio 30s giải nhanh. Đã kèm hơn 120 học viên đạt điểm 8.6+ trong kỳ thi THPT các năm 2022-2025.',
    packages: [
      {
        id: 'pkg-001',
        name: 'Gói Luyện Thi THPT Toán 10 Buổi Cơ Bản Đến 8+',
        sessionCount: 10,
        durationMinutes: 60,
        totalPrice: 2000000,
        pricePerSession: 200000,
        teachingMode: 'Both',
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
      // Call booking API to create holding lock
      const res = await bookingService.createBooking({
        tutorId: tutor.id,
        servicePackageId: pkg.id,
        totalAmount: pkg.totalPrice,
      });

      const bookingId = res?.data?.id || res?.data?.bookingId || 'BK-2026-9021';
      message.success('Đã giữ chỗ thành công 15 phút! Đang chuyển hướng sang thanh toán...');
      navigate(`/student/bookings/${bookingId}/checkout`);
    } catch (err) {
      // If API not active, navigate with mock ID for prototype
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
      <Link to="/tutors" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-brand-indigo-600 transition-colors">
        <span className="material-symbols-outlined text-base">arrow_back</span>
        Quay lại danh sách gia sư
      </Link>

      {/* Tutor Profile Header Card */}
      <div className="p-8 rounded-3xl bg-white border border-border-light shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <img
            src={tutor.avatarUrl}
            alt={tutor.fullName}
            className="w-28 h-28 rounded-3xl object-cover border-4 border-brand-indigo-50 shadow-md shrink-0"
          />
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{tutor.fullName}</h1>
              {tutor.verified && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-financial-available-bg text-financial-available text-xs font-bold border border-financial-available/30">
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                  Verified Master Tutor
                </span>
              )}
            </div>
            <p className="text-sm font-semibold text-brand-indigo-600">{tutor.title}</p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-text-secondary">
              <span className="flex items-center gap-1 font-bold text-amber-500">
                <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                {tutor.rating.toFixed(2)} ({tutor.reviewCount} đánh giá học viên)
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

        {/* Action button in header */}
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <Link
            to={`/app/messages?tutorId=${tutor.id}`}
            className="px-5 py-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs transition-colors flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">chat</span>
            Thương Lượng Riêng
          </Link>
          <a
            href="#packages"
            className="px-6 py-3 rounded-2xl bg-brand-indigo-600 hover:bg-brand-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">payments</span>
            Xem Gói Dịch Vụ
          </a>
        </div>
      </div>

      {/* Bio & Intro Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Giới thiệu */}
          <div className="p-6 rounded-3xl bg-white border border-border-light shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-brand-indigo-600">article</span>
              Giới Thiệu & Phương Pháp Giảng Dạy
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              {tutor.bio}
            </p>
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-center gap-3">
              <span className="material-symbols-outlined text-financial-available text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                verified_user
              </span>
              <div className="text-xs">
                <span className="font-bold text-emerald-900 block">Cam Kết Bảo Chứng Học Phí</span>
                <span className="text-slate-600">Tiền được giữ an toàn tại TutorHub Escrow, gia sư chỉ nhận tiền từng buổi sau khi học viên xác nhận tham gia.</span>
              </div>
            </div>
          </div>

          {/* Service Packages Cards Section */}
          <div id="packages" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Danh Mục Gói Dịch Vụ Giảng Dạy</h2>
                <p className="text-xs text-text-muted mt-0.5">Lựa chọn gói học phù hợp để bắt đầu quy trình giữ chỗ 15 phút</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tutor.packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`rounded-3xl p-6 flex flex-col justify-between transition-all bg-white border ${
                    pkg.isPopular ? 'border-brand-indigo-500 shadow-md ring-2 ring-brand-indigo-500/20' : 'border-border-light shadow-xs'
                  }`}
                >
                  <div className="space-y-3">
                    {pkg.isPopular && (
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-brand-indigo-100 text-brand-indigo-700 text-[10px] font-extrabold uppercase">
                        Khuyên Dùng Phổ Biến
                      </span>
                    )}
                    <h3 className="text-base font-bold text-slate-900">{pkg.name}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{pkg.description}</p>

                    <div className="pt-2 space-y-1.5 text-xs text-text-secondary border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <span>Số buổi học:</span>
                        <span className="font-bold text-slate-800">{pkg.sessionCount} buổi ({pkg.durationMinutes} phút/buổi)</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Hình thức:</span>
                        <span className="font-bold text-slate-800">{pkg.teachingMode}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Đơn giá buổi học:</span>
                        <span className="font-bold text-brand-indigo-600 font-monospace-num">{formatCurrency(pkg.pricePerSession)} / buổi</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 mt-4 border-t border-border-light space-y-3">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-text-muted">Tổng học phí bảo chứng:</span>
                      <span className="text-xl font-extrabold text-financial-available font-monospace-num">
                        {formatCurrency(pkg.totalPrice)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleBooking(pkg)}
                      disabled={bookingLoading === pkg.id}
                      className="w-full py-3 rounded-2xl bg-brand-indigo-600 hover:bg-brand-indigo-700 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-base">lock_clock</span>
                      {bookingLoading === pkg.id ? 'Đang Khóa Giữ Chỗ...' : 'Đặt Mua Gói Học (Giữ Chỗ 15 Phút)'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reviews Section */}
          <div className="p-6 rounded-3xl bg-white border border-border-light shadow-xs space-y-6">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-500" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              Đánh Giá & Nhận Xét Của Học Viên ({tutor.reviewCount})
            </h3>

            <div className="space-y-4">
              {tutor.reviews.map((rev) => (
                <div key={rev.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-brand-indigo-100 text-brand-indigo-700 font-bold flex items-center justify-center text-xs">
                        {rev.studentName[0]}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">{rev.studentName}</span>
                        <span className="text-[10px] text-text-muted">{rev.date}</span>
                      </div>
                    </div>
                    <div className="flex text-amber-400 text-sm">
                      {'★'.repeat(rev.rating)}
                    </div>
                  </div>
                  <p className="text-xs text-slate-700">{rev.comment}</p>
                  {rev.tutorReply && (
                    <div className="p-3 rounded-xl bg-white border border-indigo-100 text-xs text-slate-600 ml-4 space-y-1">
                      <span className="font-bold text-brand-indigo-600 block text-[11px]">Phản hồi từ gia sư:</span>
                      <p>{rev.tutorReply}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar: Availability Matrix Calendar */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white border border-border-light shadow-xs space-y-4 sticky top-24">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-brand-indigo-600">calendar_month</span>
              Khung Giờ Rảnh Trong Tuần
            </h3>
            <p className="text-xs text-text-muted">
              Lịch dạy định kỳ (Múi giờ Asia/Ho_Chi_Minh). Học viên có thể đăng ký học trong các khung này.
            </p>

            <div className="space-y-2">
              {tutor.scheduleSlots.map((slot, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                >
                  <span className="font-bold text-slate-800">{slot.day}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-brand-indigo-600 font-monospace-num">{slot.time}</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-100">
              <Link
                to={`/app/messages?tutorId=${tutor.id}`}
                className="w-full py-2.5 rounded-xl border border-border-light hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center justify-center gap-2 transition-colors"
              >
                <span className="material-symbols-outlined text-base">edit_calendar</span>
                Đề Xuất Khung Giờ Khác
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
