import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import Callout from '@/components/ui/Callout';
import Icon from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';
import tutorService from '@/services/tutor.service';
import bookingService from '@/services/booking.service';
import { useAuthStore } from '@/store/authStore';
import { ProfileSkeleton } from '@/components/common/Skeleton';
import ErrorState from '@/components/common/ErrorState';
import EmptyState from '@/components/common/EmptyState';
import ProfileGallery from '@/components/tutor/profile/ProfileGallery';
import ProfileHeadline from '@/components/tutor/profile/ProfileHeadline';
import ProfileAnchorNav from '@/components/tutor/profile/ProfileAnchorNav';
import ProfileAbout from '@/components/tutor/profile/ProfileAbout';
import ProfileScheduleExplainer from '@/components/tutor/profile/ProfileScheduleExplainer';
import ProfileFAQSection from '@/components/tutor/profile/ProfileFAQSection';
import CertificatesSection from '@/components/tutor/profile/CertificatesSection';
import ServicePackageGrid from '@/components/tutor/profile/ServicePackageGrid';
import ReviewsSection from '@/components/tutor/profile/ReviewsSection';
import BookingRail from '@/components/tutor/profile/BookingRail';
import MobileBookingBar from '@/components/tutor/profile/MobileBookingBar';
import { SECTION_IDS } from '@/components/tutor/profile/sectionNav';

/**
 * Hồ sơ gia sư công khai — hướng Editorial Portfolio.
 *
 * Nguồn dữ liệu:
 * - GET /tutors/{id}         → TutorProfileDto (kèm `subjects` + `services`)
 * - GET /tutors/{id}/reviews → PagedResult<TutorPublicReviewDto>
 *
 * Bất biến giữ nguyên:
 *: package-based checkout, giữ chỗ 15 phút.
 * - Guards đặt chỗ: chưa đăng nhập → login?redirect; tài khoản Tutor → cảnh báo.
 *
 * Layout: 12 cột — nội dung 8 + rail 4 sticky (§3.1); mobile xếp dọc + CTA
 * dính đáy (§3.2). Mọi block thiếu dữ liệu đều bị ẩn, không dựng số giả (§7).
 */
export default function TutorProfile() {
  const { id } = useParams();
  const location = useLocation();
  const { hash } = location;
  const navigate = useNavigate();
  const toast = useToast();
  const { isAuthenticated, role } = useAuthStore();

  const [tutor, setTutor] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!loading && hash === '#danh-gia') {
      const frame = requestAnimationFrame(() => document.getElementById('danh-gia')?.scrollIntoView({ block: 'start', behavior: 'auto' }));
      return () => cancelAnimationFrame(frame);
    }
  }, [hash, loading]);
  const [error, setError] = useState(null);
  const [secondaryWarning, setSecondaryWarning] = useState(null);
  const [bookingId, setBookingId] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function loadProfile() {
      try {
        setLoading(true);
        setError(null);
        setSecondaryWarning(null);

        const [tutorRes, reviewsRes] = await Promise.allSettled([
          tutorService.getTutorById(id),
          tutorService.getTutorReviews(id),
        ]);

        if (cancelled) return;

        if (tutorRes.status === 'rejected') {
          setError(tutorRes.reason);
          setLoading(false);
          return;
        }

        setTutor(tutorRes.value);
        if (tutorRes.value?.name || tutorRes.value?.fullName) {
          document.title = `Gia sư ${tutorRes.value.fullName || tutorRes.value.name}`;
        }

        if (reviewsRes.status === 'fulfilled') {
          setReviews(reviewsRes.value?.items || []);
        } else {
          setSecondaryWarning(
            'Không tải được danh sách đánh giá. Các thông tin khác vẫn hiển thị đầy đủ.'
          );
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
      toast.warning(
        'Bạn đang đăng nhập bằng tài khoản Gia sư. Vui lòng dùng tài khoản Học viên để đặt lịch.'
      );
      return;
    }

    try {
      setBookingId(service.id);
      const booking = await bookingService.createBooking(service.id);
      const newBookingId = booking?.id;
      if (!newBookingId) {
        throw new Error('Không thể tạo đơn giữ chỗ. Vui lòng thử lại.');
      }
      toast.success('Đã khóa giữ chỗ trong 15 phút. Vui lòng hoàn tất thanh toán bên dưới.');
      navigate(`/student/bookings/${newBookingId}/checkout`);
    } catch (err) {
      toast.error(err?.message || 'Không tạo được đơn giữ chỗ. Vui lòng thử lại.');
    } finally {
      setBookingId(null);
    }
  };

  const anchorSections = useMemo(
    () => [
      { id: SECTION_IDS.about, label: 'Giới thiệu' },
      { id: SECTION_IDS.services, label: 'Dịch vụ học tập' },
      { id: SECTION_IDS.reviews, label: 'Đánh giá' },
      { id: SECTION_IDS.certificates, label: 'Bằng cấp' },
      { id: SECTION_IDS.schedule, label: 'Lịch dạy' },
      { id: SECTION_IDS.faq, label: 'Câu hỏi' },
    ],
    []
  );

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
          backPath="/tutors"
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
          actionPath="/tutors"
        />
      </div>
    );
  }

  return (
    <div className="pb-24 lg:pb-0">
      <div className="page-shell pt-6">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb">
          <ol className="flex items-center gap-1.5 text-caption text-fg-muted">
            <li>
              <Link to="/" className="hover:text-brand-primary-700 transition-colors">
                Trang chủ
              </Link>
            </li>
            <li aria-hidden="true">
              <span>/</span>
            </li>
            <li>
              <Link to="/tutors" className="hover:text-brand-primary-700 transition-colors">
                Gia sư
              </Link>
            </li>
            <li aria-hidden="true">
              <span>/</span>
            </li>
            <li aria-current="page" className="text-fg-secondary font-medium truncate">
              {tutor.fullName}
            </li>
          </ol>
        </nav>
      </div>

      {secondaryWarning && (
        <div className="page-shell pt-4">
          <Callout variant="warning" title="Một phần dữ liệu chưa tải được">
            {secondaryWarning}
          </Callout>
        </div>
      )}

      {/* Profile Hero Card & Video giới thiệu (nếu có) */}
      <div className="page-shell pt-6 space-y-6">
        <ProfileHeadline tutor={tutor} />
        {Boolean(tutor.introVideoUrl || tutor.videoUrl) && (
          <ProfileGallery tutor={tutor} />
        )}
      </div>

      {/* Anchor navigation */}
      <div className="page-shell mt-6">
        <ProfileAnchorNav sections={anchorSections} />
      </div>

      {/* Content + rail */}
      <div className="page-shell pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            <ProfileAbout tutor={tutor} />
            <ServicePackageGrid
              services={tutor.services}
              tutorId={tutor.id}
              bookingId={bookingId}
              onBook={handleBooking}
            />
            <ReviewsSection tutor={tutor} reviews={reviews} />
            <CertificatesSection tutor={tutor} id={SECTION_IDS.certificates} />
            <ProfileScheduleExplainer tutorId={tutor.id} />
            <ProfileFAQSection tutor={tutor} id={SECTION_IDS.faq} />
          </div>

          <div className="lg:col-span-4 relative">
            <BookingRail tutor={tutor} />
          </div>
        </div>
      </div>

      <MobileBookingBar tutorId={tutor.id} />
    </div>
  );
}
