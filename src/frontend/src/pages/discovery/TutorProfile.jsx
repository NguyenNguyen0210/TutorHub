import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Alert, Button, message } from 'antd';
import tutorService from '@/services/tutor.service';
import bookingService from '@/services/booking.service';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import { getTeachingModeMeta, getDayOfWeekLabel } from '@/config/enums';

/**
 * Hồ sơ gia sư công khai.
 *
 * Nguồn dữ liệu thật:
 * - GET /tutors/{id}            → TutorProfileDto (đã có sẵn `subjects` + `services`)
 * - GET /tutors/{id}/reviews    → PagedResult<TutorPublicReviewDto>
 * - GET /tutors/{id}/availability → TutorAvailabilityDto { days } (KHÔNG phải `slots`)
 *
 * TutorProfileDto: { id, userId, fullName, avatarUrl, bio, education, experienceYears,
 *   teachingMode, address, latitude, longitude, ratingAvg, totalReviews,
 *   subjects: [{ id, subjectId, subjectName, categoryId, categoryName, isActive }],
 *   services: [{ id, title, subjectName, totalSessions, sessionDurationMinutes, price,
 *     teachingMode, hasTrialLesson }] }
 *
 * Lưu ý: TutorProfileDto KHÔNG có `isVerified` / `minPrice` (chỉ TutorSummaryDto có) —
 * nên badge "Verified" chỉ hiện khi backend thực sự trả về isVerified = true.
 * Không dùng dữ liệu mẫu trừ khi VITE_USE_MOCK === 'true'.
 */
export default function TutorProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tutor, setTutor] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [availabilityDays, setAvailabilityDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [secondaryWarning, setSecondaryWarning] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchTutor() {
      try {
        setLoading(true);
        setError(null);
        setSecondaryWarning(null);

        const [profileResult, reviewsResult, availabilityResult] = await Promise.allSettled([
          tutorService.getTutorById(id),
          tutorService.getTutorReviews(id, 1, 10),
          tutorService.getTutorAvailability(id),
        ]);

        if (cancelled) return;

        if (profileResult.status === 'rejected') {
          throw profileResult.reason;
        }

        setTutor(profileResult.value);
        setReviews(reviewsResult.status === 'fulfilled' ? reviewsResult.value.items : []);
        setAvailabilityDays(
          availabilityResult.status === 'fulfilled' ? availabilityResult.value : [],
        );

        // Phần phụ (đánh giá / lịch rảnh) lỗi thì cảnh báo, không chặn cả trang.
        const secondaryFailure = [reviewsResult, availabilityResult].find(
          (result) => result.status === 'rejected',
        );
        if (secondaryFailure) {
          setSecondaryWarning(
            secondaryFailure.reason?.message || 'Không tải được một phần dữ liệu của gia sư.',
          );
        }
      } catch (err) {
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchTutor();
    return () => {
      cancelled = true;
    };
  }, [id, reloadToken]);

  const handleBooking = async (service) => {
    try {
      setBookingLoading(service.id);
      // POST /bookings nhận SCALAR serviceId (Guid) — không phải object.
      const booking = await bookingService.createBooking(service.id);
      const bookingId = booking?.id;
      if (!bookingId) {
        throw new Error('Backend không trả về mã đơn giữ chỗ (booking.id).');
      }
      message.success('Đã giữ chỗ thành công 15 phút! Đang chuyển hướng...');
      navigate(`/student/bookings/${bookingId}/checkout`);
    } catch (err) {
      message.error(err?.message || 'Không tạo được đơn giữ chỗ. Vui lòng thử lại.');
    } finally {
      setBookingLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="h-56 rounded-3xl bg-slate-100/80 animate-pulse" aria-hidden="true" />
        <div className="h-72 rounded-3xl bg-slate-100/80 animate-pulse" aria-hidden="true" />
      </div>
    );
  }

  if (error && !tutor) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <Alert
          type="error"
          showIcon
          message="Không tải được hồ sơ gia sư"
          description={
            <div className="space-y-1 text-xs">
              <p className="m-0">{error.message || 'Lỗi không xác định'}</p>
              {error.traceId && (
                <p className="m-0 font-mono text-[11px] text-slate-500">
                  Mã đối chiếu (traceId): {error.traceId}
                </p>
              )}
            </div>
          }
          action={
            <Button size="small" onClick={() => setReloadToken((token) => token + 1)}>
              Thử lại
            </Button>
          }
          className="rounded-2xl"
        />
        <Link to="/tutors" className="inline-block mt-4 text-xs font-bold text-brand-indigo-600 hover:underline">
          ← Quay lại danh sách gia sư
        </Link>
      </div>
    );
  }

  if (!tutor) return null;

  const modeMeta = getTeachingModeMeta(tutor.teachingMode);
  const services = Array.isArray(tutor.services) ? tutor.services : [];
  const subjects = Array.isArray(tutor.subjects) ? tutor.subjects : [];
  const ratingValue = Number(tutor.ratingAvg);
  const hasRating = Number.isFinite(ratingValue) && ratingValue > 0;
  const availableDays = availabilityDays.filter(
    (day) => (day.availableSlots ?? []).length > 0,
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Back button */}
      <Link to="/tutors" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-brand-indigo-600 transition-colors">
        <span className="material-symbols-outlined text-base">arrow_back</span>
        Quay lại danh sách gia sư
      </Link>

      {secondaryWarning && (
        <Alert
          type="warning"
          showIcon
          message="Một phần dữ liệu chưa tải được"
          description={<span className="text-xs">{secondaryWarning}</span>}
          className="rounded-2xl"
        />
      )}

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
                  {tutor.isVerified === true && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-financial-available text-xs font-extrabold border border-emerald-200 shadow-2xs">
                      <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                      Verified Master Tutor
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-brand-indigo-50 text-brand-indigo-700 text-xs font-extrabold border border-brand-indigo-100">
                    {modeMeta.label}
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-bold text-brand-indigo-600">{tutor.education}</p>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                  <span className="flex items-center gap-1 font-extrabold text-amber-500">
                    <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    {hasRating ? ratingValue.toFixed(2) : '—'} ({tutor.totalReviews ?? 0} nhận xét)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-base text-emerald-500">history_edu</span>
                    {tutor.experienceYears ?? 0} năm kinh nghiệm
                  </span>
                  {tutor.address && (
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-base text-slate-400">location_on</span>
                      {tutor.address}
                    </span>
                  )}
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
              Giới Thiệu & Chuyên Môn
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              {tutor.bio}
            </p>

            {/* Subjects thật từ TutorProfileDto.Subjects */}
            {subjects.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {subjects.map((subject) => (
                  <span
                    key={subject.id ?? subject.subjectId ?? subject.subjectName}
                    className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-brand-indigo-50/80 text-brand-indigo-700 border border-brand-indigo-100/50"
                  >
                    {subject.subjectName}
                  </span>
                ))}
              </div>
            )}

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

            {services.length === 0 ? (
              <div className="p-10 rounded-3xl glass-panel-premium text-center space-y-2">
                <span className="material-symbols-outlined text-4xl text-slate-300">inventory_2</span>
                <p className="text-sm font-extrabold text-slate-700">Gia sư chưa niêm yết gói học nào</p>
                <p className="text-xs text-slate-500">Hãy nhắn tin để thương lượng gói học riêng.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {services.map((service) => {
                  const totalSessions = Number(service.totalSessions) || 0;
                  const price = Number(service.price);
                  // ServiceSummaryDto không có giá/buổi ⇒ suy ra từ giá gói / số buổi.
                  const pricePerSession =
                    Number.isFinite(price) && totalSessions > 0 ? price / totalSessions : null;
                  const serviceModeMeta = getTeachingModeMeta(service.teachingMode);
                  return (
                    <div
                      key={service.id}
                      className={`rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 card-hover-lift ${
                        service.hasTrialLesson
                          ? 'glass-panel-premium border-2 border-brand-indigo-500 glow-indigo relative'
                          : 'glass-panel-premium border border-slate-200/80'
                      }`}
                    >
                      {service.hasTrialLesson && (
                        <div className="absolute -top-3.5 right-6 px-3 py-1 rounded-full bg-gradient-to-r from-brand-indigo-600 to-indigo-700 text-white text-[10px] font-extrabold uppercase shadow-sm tracking-wider">
                          Có Buổi Học Thử
                        </div>
                      )}

                      <div className="space-y-4">
                        <h3 className="text-base font-extrabold text-slate-900 leading-snug">{service.title}</h3>
                        <p className="text-xs font-bold text-brand-indigo-600">{service.subjectName}</p>

                        <div className="pt-3 space-y-2 text-xs text-slate-600 border-t border-slate-100">
                          <div className="flex items-center justify-between">
                            <span>Số buổi cấp phát:</span>
                            <span className="font-extrabold text-slate-900">
                              {totalSessions} buổi ({service.sessionDurationMinutes}p/buổi)
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Hình thức học:</span>
                            <span className="font-extrabold text-slate-900">{serviceModeMeta.label}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Đơn giá từng buổi:</span>
                            <span className="font-extrabold text-brand-indigo-600 font-monospace-num">
                              {pricePerSession === null ? '—' : `${formatCurrency(pricePerSession)} / buổi`}
                            </span>
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
                            {formatCurrency(service.price)}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleBooking(service)}
                          disabled={bookingLoading === service.id}
                          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-brand-indigo-600 to-indigo-700 hover:from-brand-indigo-500 hover:to-indigo-600 text-white font-extrabold text-xs shadow-md shadow-brand-indigo-500/25 transition-all sheen-btn flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined text-base">lock_clock</span>
                          {bookingLoading === service.id ? 'Đang Khóa Giữ Chỗ...' : 'Đặt gói & Khóa ký quỹ 15 phút'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Student Reviews Section */}
          <div className="p-6 sm:p-8 rounded-3xl glass-panel-premium space-y-6">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-500" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              Nhận Xét & Đánh Giá Thực Tế Từ Học Viên ({tutor.totalReviews ?? 0})
            </h3>

            {reviews.length === 0 ? (
              <p className="text-xs text-slate-500">Gia sư chưa có nhận xét nào.</p>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/70 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-brand-indigo-100 text-brand-indigo-700 font-extrabold flex items-center justify-center text-xs">
                          {(review.studentName || '?').charAt(0)}
                        </div>
                        <div>
                          <span className="text-xs font-extrabold text-slate-900 block">{review.studentName}</span>
                          <span className="text-[10px] text-slate-400">
                            {formatDateTime(review.createdAt, 'DD/MM/YYYY')}
                          </span>
                        </div>
                      </div>
                      <div className="flex text-amber-400 text-sm">
                        {'★'.repeat(Math.max(0, Math.round(Number(review.rating) || 0)))}
                      </div>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">{review.comment}</p>
                    {review.tutorReply && (
                      <div className="p-3.5 rounded-xl bg-white border border-brand-indigo-100 text-xs text-slate-600 ml-3 space-y-1">
                        <span className="font-extrabold text-brand-indigo-600 block text-[11px]">Phản hồi từ gia sư:</span>
                        <p>{review.tutorReply}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
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

            {availableDays.length === 0 ? (
              <p className="text-xs text-slate-500 pt-1">
                Gia sư chưa mở khung giờ rảnh trong khoảng thời gian tới.
              </p>
            ) : (
              <div className="space-y-2.5 pt-1">
                {availableDays.map((day) => (
                  <div
                    key={`${day.date ?? day.dayOfWeekName}`}
                    className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-800">
                        {getDayOfWeekLabel(day.dayOfWeekName) || day.dayOfWeekName}
                        {day.date ? <span className="text-slate-400 font-medium"> • {day.date}</span> : null}
                      </span>
                      <span className="w-2 h-2 rounded-full bg-financial-available animate-pulse"></span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(day.availableSlots ?? []).map((slot, index) => (
                        <span
                          key={`${slot.startTime}-${index}`}
                          className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 font-extrabold text-brand-indigo-600 font-monospace-num text-[11px]"
                        >
                          {String(slot.startTime ?? '').slice(0, 5)} - {String(slot.endTime ?? '').slice(0, 5)}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

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
