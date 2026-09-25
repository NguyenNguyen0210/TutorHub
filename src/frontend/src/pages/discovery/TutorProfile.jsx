import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Callout from '@/components/ui/Callout';
import { useToast } from '@/components/ui/Toast';
import tutorService from '@/services/tutor.service';
import bookingService from '@/services/booking.service';
import { useAuthStore } from '@/store/authStore';
import { ProfileSkeleton } from '@/components/common/Skeleton';
import ErrorState from '@/components/common/ErrorState';
import EmptyState from '@/components/common/EmptyState';
import Card, { CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge, { Tag } from '@/components/ui/Badge';
import Icon from '@/components/ui/Icon';
import Avatar from '@/components/ui/Avatar';
import { formatDateTime } from '@/utils/formatters';
import Money from '@/components/ui/Money';
import { getTeachingModeMeta, getDayOfWeekLabel } from '@/config/enums';

/**
 * Hồ sơ gia sư công khai — Chuẩn SaaS Minimal v2.
 *
 * Nguồn dữ liệu:
 * - GET /tutors/{id}            → TutorProfileDto (kèm `subjects` + `services`)
 * - GET /tutors/{id}/reviews    → PagedResult<TutorPublicReviewDto>
 * - GET /tutors/{id}/availability → TutorAvailabilityDto { days }
 *
 * Tuân thủ bất biến & Design System:
 * - DEC-S8-020: Package-based checkout, giữ chỗ 15 phút.
 * - Single source of truth: tokens.css, font Inter, Lucide icons qua Icon.jsx.
 * - Format tiền chuẩn bằng <Money>.
 */
export default function TutorProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { isAuthenticated, role } = useAuthStore();

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
    async function loadProfile() {
      try {
        setLoading(true);
        setError(null);
        setSecondaryWarning(null);

        const [tutorRes, reviewsRes, availabilityRes] = await Promise.allSettled([
          tutorService.getTutorById(id),
          tutorService.getTutorReviews(id),
          tutorService.getTutorAvailability(id),
        ]);

        if (cancelled) return;

        if (tutorRes.status === 'rejected') {
          setError(tutorRes.reason);
          setLoading(false);
          return;
        }

        setTutor(tutorRes.value);

        if (reviewsRes.status === 'fulfilled') {
          setReviews(reviewsRes.value?.items || []);
        } else {
          setSecondaryWarning('Không tải được danh sách đánh giá. Các thông tin khác vẫn hiển thị đầy đủ.');
        }

        if (availabilityRes.status === 'fulfilled') {
          setAvailabilityDays(availabilityRes.value?.days || []);
        } else {
          setSecondaryWarning('Không tải được khung giờ rảnh. Các thông tin khác vẫn hiển thị đầy đủ.');
        }
      } catch (err) {
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [id, reloadToken]);

  const handleBooking = async (service) => {
    if (!isAuthenticated) {
      toast.info('Vui lòng đăng nhập với tài khoản học viên để tiến hành đăng ký giữ chỗ.');
      navigate(`/auth/login?redirect=/tutors/${id}`);
      return;
    }

    if (role === 'Tutor') {
      toast.warning('Bạn đang đăng nhập bằng tài khoản Gia sư. Vui lòng dùng tài khoản Học viên để đặt lịch.');
      return;
    }

    try {
      setBookingLoading(service.id);
      const booking = await bookingService.createBooking(service.id);
      const bookingId = booking?.id;
      if (!bookingId) {
        throw new Error('Backend không trả về mã đơn giữ chỗ (booking.id).');
      }
      toast.success('Đã giữ chỗ thành công 15 phút! Đang chuyển đến cổng thanh toán...');
      navigate(`/student/bookings/${bookingId}/checkout`);
    } catch (err) {
      toast.error(err?.message || 'Không tạo được đơn giữ chỗ. Vui lòng thử lại.');
    } finally {
      setBookingLoading(null);
    }
  };

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (error && !tutor) {
    return (
      <div className="py-16">
        <ErrorState
          error={error}
          title="Không tải được hồ sơ gia sư"
          onRetry={() => setReloadToken((token) => token + 1)}
          backPath="/"
          backLabel="Quay lại danh sách gia sư"
        />
      </div>
    );
  }

  if (!tutor) {
    return (
      <div className="py-16">
        <EmptyState
          icon="person_off"
          title="Không tìm thấy hồ sơ gia sư"
          description="Hồ sơ gia sư này không tồn tại hoặc đã ngừng nhận lịch học."
          actionLabel="Quay lại danh sách gia sư"
          actionPath="/"
        />
      </div>
    );
  }

  const modeMeta = getTeachingModeMeta(tutor.teachingMode);
  const services = Array.isArray(tutor.services) ? tutor.services : [];
  const subjects = Array.isArray(tutor.subjects) ? tutor.subjects : [];
  const ratingValue = Number(tutor.ratingAvg);
  const hasRating = Number.isFinite(ratingValue) && ratingValue > 0;
  const availableDays = availabilityDays.filter(
    (day) => (day.availableSlots ?? []).length > 0,
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Navigation breadcrumb */}
      <nav aria-label="Breadcrumb">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-caption font-semibold text-fg-muted hover:text-brand-primary-700 transition-colors"
        >
          <Icon name="arrow_back" size="sm" />
          Quay lại danh sách gia sư
        </Link>
      </nav>

      {secondaryWarning && (
        <Callout variant="warning" title="Một phần dữ liệu chưa tải được">
          {secondaryWarning}
        </Callout>
      )}

      {/* Hero Profile Banner */}
      <Card padding="none" className="overflow-hidden border border-border/80 shadow-brand-sm">
        {/* Dark Slate Hero Cover with ambient trust badge */}
        <div className="h-32 sm:h-36 bg-gradient-to-r from-brand-navy-950 via-slate-900 to-brand-navy-900 relative flex items-start justify-end p-4 sm:p-6" aria-hidden="true">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(37,99,235,0.25),transparent_60%)]" />
          <div className="relative z-10 flex items-center gap-2 px-3 py-1.5 rounded-pill bg-white/10 backdrop-blur-md border border-white/15 text-white text-[11px] font-semibold tracking-wide">
            <Icon name="shield" size="xs" className="text-emerald-400" filled />
            <span>Học phí bảo chứng 100% Escrow • Giải ngân từng buổi</span>
          </div>
        </div>

        {/* Profile Details Container */}
        <div className="px-6 sm:px-8 pb-6 relative">
          <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-6 -mt-16 sm:-mt-18">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5">
              <div className="relative shrink-0">
                <Avatar
                  src={tutor.avatarUrl}
                  name={tutor.fullName}
                  size="xl"
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-brand-xl border-4 border-white shadow-brand-lg ring-1 ring-border"
                />
                <span
                  className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-success border-2 border-white ring-1 ring-border"
                  title="Gia sư sẵn sàng nhận lớp"
                />
              </div>

              <div className="space-y-2 pb-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-headline-1 sm:text-display-sm text-fg font-bold tracking-tight">
                    {tutor.fullName}
                  </h1>
                  {tutor.isVerified && (
                    <Badge variant="success" size="sm" icon={<Icon name="verified" size="xs" filled />}>
                      Đã thẩm định bằng cấp
                    </Badge>
                  )}
                  <Badge variant={modeMeta.color} size="sm">
                    {modeMeta.label}
                  </Badge>
                </div>

                {tutor.education && (
                  <p className="text-body-reg font-semibold text-brand-primary-700 flex items-center gap-1.5">
                    <Icon name="school" size="sm" className="text-brand-primary-500 shrink-0" />
                    {tutor.education}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-caption text-fg-muted pt-0.5">
                  <span className="flex items-center gap-1 font-bold text-brand-secondary-600 bg-brand-secondary-50 px-2 py-0.5 rounded-brand-sm border border-brand-secondary-200">
                    <Icon name="star" size="xs" filled className="text-brand-secondary-500" />
                    {hasRating ? ratingValue.toFixed(2) : '—'} ({tutor.totalReviews ?? 0} đánh giá)
                  </span>
                  <span className="flex items-center gap-1">
                    <Icon name="history_edu" size="sm" className="text-emerald-600" />
                    {tutor.experienceYears ?? 0} năm giảng dạy
                  </span>
                  {tutor.address && (
                    <span className="flex items-center gap-1">
                      <Icon name="location_on" size="sm" className="text-neutral-400" />
                      {tutor.address}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-emerald-700 font-medium">
                    <Icon name="check_circle" size="xs" className="text-emerald-500" />
                    Phản hồi nhanh trong ngày
                  </span>
                </div>
              </div>
            </div>

            {/* Header action buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
              <Button
                as={Link}
                to={`/app/messages?tutorId=${tutor.id}`}
                variant="outline"
                size="md"
                icon={<Icon name="chat" size="sm" />}
              >
                Nhắn tin trao đổi
              </Button>
              <Button
                as="a"
                href="#packages"
                variant="primary"
                size="md"
                iconRight={<Icon name="arrow_forward" size="sm" />}
              >
                Xem gói học niêm yết
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Main Layout: Content (2 cols) + Sidebar Schedule (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Bio, Guarantee, Packages, Reviews */}
        <div className="lg:col-span-2 space-y-8">
          {/* About & Specialization */}
          <Card padding="lg" className="space-y-4">
            <CardHeader
              title="Giới thiệu & Chuyên môn sư phạm"
              icon={<Icon name="article" size="sm" className="text-brand-primary-600" />}
            />
            <p className="text-body-reg text-fg-secondary leading-relaxed whitespace-pre-line">
              {tutor.bio || 'Chưa có thông tin giới thiệu chi tiết từ gia sư.'}
            </p>

            {subjects.length > 0 && (
              <div className="pt-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-fg-muted block mb-2">
                  Lĩnh vực & Môn học giảng dạy:
                </span>
                <div className="flex flex-wrap gap-2">
                  {subjects.map((subject) => (
                    <Tag key={subject.id ?? subject.subjectId ?? subject.subjectName}>
                      {subject.subjectName}
                    </Tag>
                  ))}
                </div>
              </div>
            )}

            {/* 3-Pillar Security & Trust Banner */}
            <div className="mt-4 p-4 rounded-brand-lg bg-emerald-50/70 border border-emerald-200/80 text-caption space-y-3">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-body-reg">
                <Icon name="shield" size="sm" filled className="text-emerald-600" />
                <span>Bảo chứng chất lượng học tập & tài chính 3 lớp</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="p-2.5 rounded-brand-md bg-white/80 border border-emerald-100 space-y-1">
                  <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <Icon name="hourglass_top" size="xs" className="text-emerald-600" />
                    <span>Giữ chỗ 15 phút</span>
                  </div>
                  <p className="text-[11px] text-emerald-700 leading-snug">
                    Khóa lịch độc quyền theo server-time, đảm bảo slot học không bị trùng lặp.
                  </p>
                </div>
                <div className="p-2.5 rounded-brand-md bg-white/80 border border-emerald-100 space-y-1">
                  <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <Icon name="account_balance_wallet" size="xs" className="text-emerald-600" />
                    <span>Ví bảo chứng Escrow</span>
                  </div>
                  <p className="text-[11px] text-emerald-700 leading-snug">
                    Học phí được giữ an toàn, chỉ giải ngân cho gia sư sau khi từng buổi kết thúc.
                  </p>
                </div>
                <div className="p-2.5 rounded-brand-md bg-white/80 border border-emerald-100 space-y-1">
                  <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <Icon name="done_all" size="xs" className="text-emerald-600" />
                    <span>Đối soát 2 chiều 24h</span>
                  </div>
                  <p className="text-[11px] text-emerald-700 leading-snug">
                    Xác nhận hoàn thành hai chiều minh bạch, có trọng tài giải quyết tranh chấp.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Service Packages List */}
          <section id="packages" className="space-y-4 scroll-mt-24" aria-labelledby="packages-title">
            <div className="flex items-baseline justify-between">
              <div>
                <h2 id="packages-title" className="text-headline-2 text-fg font-bold">
                  Danh mục gói học niêm yết
                </h2>
                <p className="text-caption text-fg-muted mt-0.5">
                  Lựa chọn gói học phù hợp để tiến hành giữ chỗ độc quyền trong 15 phút
                </p>
              </div>
              <Badge variant="primary" size="sm">
                {services.length} gói học
              </Badge>
            </div>

            {services.length === 0 ? (
              <EmptyState
                icon="inventory_2"
                title="Gia sư chưa niêm yết gói học nào"
                description="Bạn có thể gửi tin nhắn để trao đổi lộ trình và thương lượng gói học riêng."
                actionLabel="Nhắn tin với gia sư"
                actionPath={`/app/messages?tutorId=${tutor.id}`}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {services.map((service) => {
                  const totalSessions = Number(service.totalSessions) || 0;
                  const price = Number(service.price);
                  const pricePerSession =
                    Number.isFinite(price) && totalSessions > 0 ? price / totalSessions : null;
                  const serviceModeMeta = getTeachingModeMeta(service.teachingMode);
                  const hasTrial = Boolean(service.hasTrialLesson);

                  return (
                    <Card
                      key={service.id}
                      hoverable
                      className={`relative flex flex-col justify-between overflow-hidden transition-all duration-200 ${
                        hasTrial
                          ? 'border-2 border-brand-primary-400 shadow-brand-md hover:border-brand-primary-600'
                          : 'border border-border hover:border-brand-primary-300 hover:shadow-brand-md'
                      }`}
                    >
                      {/* Top ribbon for trial lesson */}
                      {hasTrial && (
                        <div className="bg-gradient-to-r from-brand-secondary-500 to-amber-500 text-white text-[11px] font-bold px-3 py-1 text-center tracking-wide flex items-center justify-center gap-1.5">
                          <Icon name="star" size="xs" filled />
                          <span>HỖ TRỢ BUỔI HỌC THỬ TRẢI NGHIỆM</span>
                        </div>
                      )}

                      <div className="p-5 space-y-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-bold text-brand-primary-700 uppercase tracking-wide">
                              {service.subjectName}
                            </span>
                            <Badge variant={serviceModeMeta.color} size="sm">
                              {serviceModeMeta.label}
                            </Badge>
                          </div>
                          <Link to={`/services/${service.id}`} className="hover:text-brand-primary-600 transition-colors">
                            <h3 className="text-headline-3 text-fg font-bold leading-snug">
                              {service.title}
                            </h3>
                          </Link>
                        </div>

                        {/* Price Hero Callout */}
                        <div className="p-3.5 rounded-brand-md bg-neutral-50/90 border border-border space-y-1.5">
                          <div className="flex items-baseline justify-between">
                            <span className="text-caption text-fg-muted font-medium">Học phí trọn gói:</span>
                            <div className="text-headline-1 text-success-strong font-bold">
                              <Money value={service.price} />
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-border/70">
                            <span className="text-fg-secondary">Đơn giá chia theo buổi:</span>
                            <span className="font-bold text-brand-primary-700">
                              {pricePerSession === null ? '—' : <Money value={pricePerSession} />} / buổi
                            </span>
                          </div>
                        </div>

                        {/* Value Checklist */}
                        <ul className="space-y-2 text-caption text-fg-secondary">
                          <li className="flex items-start gap-2">
                            <Icon name="check_circle" size="xs" className="text-emerald-500 shrink-0 mt-0.5" />
                            <span>
                              <strong>{totalSessions} buổi học 1 kèm 1</strong> ({service.sessionDurationMinutes} phút / buổi)
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Icon name="check_circle" size="xs" className="text-emerald-500 shrink-0 mt-0.5" />
                            <span>Hình thức: <strong>{serviceModeMeta.label}</strong> linh hoạt</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Icon name="check_circle" size="xs" className="text-emerald-500 shrink-0 mt-0.5" />
                            <span>Giải ngân từng buổi học sau khi học viên xác nhận</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Icon name="check_circle" size="xs" className="text-emerald-500 shrink-0 mt-0.5" />
                            <span>Được hỗ trợ dời lịch học trước 24 giờ</span>
                          </li>
                        </ul>
                      </div>

                      {/* Card Footer with CTA */}
                      <div className="p-5 pt-0 space-y-2.5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <Link
                            to={`/services/${service.id}`}
                            className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-brand-md border border-border text-caption font-semibold text-fg-secondary hover:text-brand-primary-700 hover:border-brand-primary-300 hover:bg-neutral-50 transition-colors text-center"
                          >
                            <span>Chi tiết lộ trình</span>
                            <Icon name="arrow_forward" size="xs" />
                          </Link>
                          <Button
                            variant="primary"
                            size="md"
                            loading={bookingLoading === service.id}
                            onClick={() => handleBooking(service)}
                            icon={
                              bookingLoading !== service.id && (
                                <Icon name="lock_clock" size="sm" />
                              )
                            }
                          >
                            Giữ chỗ ngay
                          </Button>
                        </div>
                        <p className="text-[10px] text-center text-fg-muted">
                          Thanh toán an toàn qua VNPay • Tạm giữ bảo chứng Escrow
                        </p>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>

          {/* Student Reviews Section */}
          <Card padding="lg" className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
              <CardHeader
                title={`Nhận xét & Đánh giá từ học viên (${tutor.totalReviews ?? 0})`}
                icon={<Icon name="star" size="sm" filled className="text-brand-secondary-500" />}
              />
              {hasRating && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center text-brand-secondary-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Icon
                        key={i}
                        name="star"
                        size="sm"
                        filled={i < Math.round(ratingValue)}
                        className={i < Math.round(ratingValue) ? 'text-brand-secondary-500' : 'text-neutral-300'}
                      />
                    ))}
                  </div>
                  <span className="font-bold text-fg text-headline-3">{ratingValue.toFixed(1)}</span>
                  <span className="text-caption text-fg-muted">/ 5.0</span>
                </div>
              )}
            </div>

            {reviews.length === 0 ? (
              <div className="py-6 text-center text-caption text-fg-muted">
                <Icon name="chat" size="md" className="mx-auto text-neutral-300 mb-2" />
                <p>Gia sư chưa có đánh giá nào từ học viên.</p>
              </div>
            ) : (
              <ul className="space-y-4">
                {reviews.map((review) => (
                  <li
                    key={review.id}
                    className="p-4 rounded-brand-md bg-neutral-50/80 border border-border space-y-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={review.studentName} size="md" className="shrink-0" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-body-reg font-bold text-fg">
                              {review.studentName}
                            </span>
                            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-medium border border-emerald-200">
                              Đã hoàn thành khóa học
                            </span>
                          </div>
                          <span className="text-[11px] text-fg-muted">
                            {formatDateTime(review.createdAt, 'DD/MM/YYYY')}
                          </span>
                        </div>
                      </div>

                      <div
                        className="flex items-center gap-0.5"
                        role="img"
                        aria-label={`Đánh giá ${review.rating} trên 5 sao`}
                      >
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Icon
                            key={i}
                            name="star"
                            size="xs"
                            filled={i < Math.round(Number(review.rating) || 0)}
                            className={
                              i < Math.round(Number(review.rating) || 0)
                                ? 'text-brand-secondary-500'
                                : 'text-neutral-300'
                            }
                          />
                        ))}
                      </div>
                    </div>

                    <p className="text-caption text-fg-secondary leading-relaxed pl-1">
                      {review.comment}
                    </p>

                    {review.tutorReply && (
                      <div className="p-3.5 rounded-brand-md bg-white border border-brand-primary-100 text-caption text-fg-secondary ml-4 space-y-1.5 shadow-brand-sm">
                        <div className="flex items-center gap-1.5 text-brand-primary-700 font-bold text-[11px]">
                          <Icon name="support_agent" size="xs" className="text-brand-primary-600" />
                          <span>Phản hồi từ gia sư {tutor.fullName}:</span>
                        </div>
                        <p className="text-fg-secondary leading-relaxed">{review.tutorReply}</p>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* Right 1 Column: Sticky Weekly Schedule Card */}
        <div>
          <div className="lg:sticky lg:top-24 space-y-6">
            <Card padding="lg" className="space-y-4 border border-border/90 shadow-brand-sm">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <CardHeader
                  title="Khung giờ rảnh định kỳ"
                  icon={<Icon name="calendar_month" size="sm" className="text-brand-primary-600" />}
                />
                <span className="text-[10px] font-mono text-fg-muted bg-neutral-100 px-2 py-0.5 rounded">
                  UTC+7
                </span>
              </div>

              <p className="text-caption text-fg-muted leading-relaxed">
                Múi giờ Asia/Ho_Chi_Minh. Các buổi học sẽ được đối soát và xếp lịch tự động dựa theo các slot này.
              </p>

              {availableDays.length === 0 ? (
                <div className="p-4 rounded-brand-md bg-neutral-50 border border-dashed border-border text-center space-y-2 text-caption text-fg-muted">
                  <Icon name="event_available" size="md" className="mx-auto text-neutral-400" />
                  <p>Gia sư chưa cập nhật lịch cố định tuần này.</p>
                  <p className="text-[11px] text-fg-secondary">
                    Bạn có thể nhắn tin trực tiếp để đề xuất khung giờ học linh hoạt theo mong muốn.
                  </p>
                </div>
              ) : (
                <ul className="space-y-3 pt-1">
                  {availableDays.map((day) => (
                    <li
                      key={`${day.date ?? day.dayOfWeekName}`}
                      className="p-3 rounded-brand-md bg-neutral-50/80 border border-border space-y-2 text-caption"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-fg">
                          {getDayOfWeekLabel(day.dayOfWeekName) || day.dayOfWeekName}
                          {day.date ? (
                            <span className="text-fg-muted font-normal text-[11px]"> • {day.date}</span>
                          ) : null}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Sẵn sàng
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {(day.availableSlots ?? []).map((slot, index) => (
                          <span
                            key={`${slot.startTime}-${index}`}
                            className="px-2.5 py-1 rounded-brand-sm bg-white border border-brand-primary-200 font-bold text-brand-primary-700 font-mono text-[11px] shadow-brand-sm inline-flex items-center gap-1"
                          >
                            <Icon name="hourglass_top" size="xs" className="text-brand-primary-500" />
                            {String(slot.startTime ?? '').slice(0, 5)} - {String(slot.endTime ?? '').slice(0, 5)}
                          </span>
                        ))}
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <div className="pt-3 border-t border-border">
                <Button
                  as={Link}
                  to={`/app/messages?tutorId=${tutor.id}`}
                  variant="outline"
                  fullWidth
                  size="md"
                  icon={<Icon name="edit_calendar" size="sm" />}
                >
                  Đề xuất khung giờ riêng
                </Button>
              </div>
            </Card>

            {/* Platform commitment micro card */}
            <div className="p-4 rounded-brand-lg bg-brand-navy-950 text-white space-y-2 shadow-brand-md">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-caption">
                <Icon name="verified" size="xs" filled />
                <span>Quy trình bảo đảm học tập</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                TutorHub bảo vệ toàn vẹn quyền lợi của bạn. Mọi vấn đề về chất lượng hoặc vắng mặt đều được xử lý qua công cụ Trọng tài Dispute Engine.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
