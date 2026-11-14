import ApprovedProfileBadge from '@/components/discovery/ApprovedProfileBadge';
import { reviewSummary } from '@/utils/reviewSummary';
import { userFacingError } from '@/utils/userFacingError';
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { discoveryReturn } from '@/utils/discoveryReturn';
import tutorService from '@/services/tutor.service';
import ServiceDetailHero from '@/components/service-detail/ServiceDetailHero';
import ServiceSyllabus from '@/components/service-detail/ServiceSyllabus';
import ServiceSidebarCard from '@/components/service-detail/ServiceSidebarCard';
import ServiceReviews from '@/components/service-detail/ServiceReviews';
import ModerationAction from '@/components/admin/ModerationAction';
import ServiceFaqs from '@/components/service-detail/ServiceFaqs';
import ErrorState from '@/components/common/ErrorState';
import EmptyState from '@/components/common/EmptyState';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Money from '@/components/ui/Money';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/components/ui/Toast';
import bookingService from '@/services/booking.service';
import { useWishlist } from '@/hooks/useWishlist';

export default function ServiceDetail() {
  const { id } = useParams();
  const location = useLocation();
  const listingContext = discoveryReturn(location);
  const navigate = useNavigate();
  const toast = useToast();
  const { isAuthenticated, role } = useAuthStore();
  const { isFavorited, toggle, isPending: favoritePending } = useWishlist();
  const bookingInFlight = useRef(false);

  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  const serviceId = service?.id || id;
  const isFavorite = isFavorited('Service', serviceId);
  const handleToggleFavorite = () => {
    if (serviceId) {
      toggle('Service', serviceId);
    }
  };

  const handleBookNow = async () => {
    if (!service || bookingInFlight.current) return;
    if (!isAuthenticated) {
      toast.info('Vui lòng đăng nhập với tài khoản học viên để tiến hành đăng ký.');
      navigate(`/auth/login?redirect=${encodeURIComponent(location.pathname + location.search + location.hash)}`);
      return;
    }
    if (role === 'Tutor') {
      toast.warning('Bạn đang đăng nhập bằng tài khoản Gia sư. Vui lòng dùng tài khoản Học viên để đặt lịch.');
      return;
    }
    bookingInFlight.current = true;
    try {
      setBookingLoading(true);
      const booking = await bookingService.createBooking(service.id);
      if (booking?.id) {
        toast.success('Đã khóa giữ chỗ trong 15 phút. Vui lòng hoàn tất thanh toán bên dưới.');
        navigate(`/student/bookings/${booking.id}/checkout`);
      }
    } catch (err) {
      toast.error(userFacingError(err, 'Không tạo được đơn giữ chỗ. Vui lòng thử lại.'));
    } finally {
      bookingInFlight.current = false;
      setBookingLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function loadService() {
      try {
        setLoading(true);
        setError(null);
        const data = await tutorService.getServiceById(id);
        if (!cancelled) {
          setService(data);
          if (data?.title) {
            document.title = data.title;
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.error('[ServiceDetail] Error loading service:', err);
          setError(err);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (id) {
      loadService();
    }

    return () => {
      cancelled = true;
    };
  }, [id, reloadToken]);

  const scrollToSection = (sectionId, tabKey) => {
    setActiveTab(tabKey);
    const element = document.getElementById(sectionId);
    if (element) {
      const yOffset = -120;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (!service) return;
    const sectionMap = [
      { key: 'overview', id: 'overview' },
      { key: 'outcomes', id: 'outcomes' },
      { key: 'syllabus', id: 'syllabus' },
      { key: 'tutor', id: 'tutor-info' },
      { key: 'reviews', id: 'reviews' },
      { key: 'faqs', id: 'faqs' },
    ];

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const threshold = 140;
      for (let i = sectionMap.length - 1; i >= 0; i--) {
        const el = document.getElementById(sectionMap[i].id);
        if (el) {
          const top = el.offsetTop - threshold;
          if (scrollY >= top) {
            setActiveTab(sectionMap[i].key);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [service]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50/50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-8 animate-pulse">
          <div className="h-6 w-64 bg-neutral-200 rounded-md" />
          <div className="h-44 bg-neutral-200 rounded-2xl" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 flex flex-col gap-6">
              <div className="h-64 bg-neutral-200 rounded-2xl" />
              <div className="h-96 bg-neutral-200 rounded-2xl" />
            </div>
            <div className="lg:col-span-4">
              <div className="h-80 bg-neutral-200 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <ErrorState
          error={error}
          title={error.status === 404 ? 'Không tìm thấy gói học' : undefined}
          onRetry={() => setReloadToken(token => token + 1)}
          backPath="/services"
          backLabel="Xem các gói học"
        />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <EmptyState
          title="Không tìm thấy gói học"
          description="Gói học này hiện không có trong danh sách. Bạn có thể xem các gói học khác để tiếp tục lựa chọn."
          actionLabel="Xem các gói học"
          onAction={() => navigate('/services')}
        />
      </div>
    );
  }

  const tutor = service.tutor || {};
  const targetAudience = Array.isArray(service.targetAudience) ? service.targetAudience : [];
  const prerequisites = Array.isArray(service.prerequisites) ? service.prerequisites : [];
  const expectedOutcomes = (service.expectedOutcome || '').split(/(?<=[.!?])\s+/).filter(Boolean).map(description => ({ title: '', description }));
  const resolvedLearningScope = service.learningScope || '';

  const tabs = [
    { key: 'overview', label: 'Tổng quan', sectionId: 'overview' },
    { key: 'outcomes', label: 'Bạn sẽ học gì?', sectionId: 'outcomes' },
    { key: 'syllabus', label: 'Lộ trình học', sectionId: 'syllabus' },
    { key: 'tutor', label: 'Gia sư', sectionId: 'tutor-info' },
    { key: 'reviews', label: 'Đánh giá', sectionId: 'reviews' },
    { key: 'faqs', label: 'Hỏi đáp (FAQ)', sectionId: 'faqs' },
  ];

  return (
    <div className="min-h-screen bg-canvas pb-28 lg:pb-20">
      {listingContext && <div className="page-shell pt-4"><Link to={listingContext.listingReturn} state={{ restoreScrollKey: listingContext.listingKey }} className="inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-semibold text-brand-primary-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Icon name="arrow_back" size="sm" />Quay lại danh sách trước đó</Link></div>}
      {/* 1. Top Hero Section */}
      <ServiceDetailHero service={service} />
      {service.status === 'Published' && <div className="page-shell py-4"><ModerationAction type="service" targetId={service.id} onSaved={() => setReloadToken(value => value + 1)} /></div>}

      {/* 2. Sticky Tab Navigation Bar */}
      <div className="sticky top-[64px] z-30 bg-surface/95 backdrop-blur-sm border-b border-border shadow-xs">
        <div className="page-shell">
          <div
            role="tablist"
            className="flex items-center gap-1 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  role="tab"
                  type="button"
                  aria-selected={isActive}
                  onClick={() => scrollToSection(tab.sectionId, tab.key)}
                  className={`group inline-flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-semibold whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary-500 focus-visible:ring-offset-2 cursor-pointer ${
                    isActive
                      ? 'border-brand-primary-600 text-brand-primary-700'
                      : 'border-transparent text-fg-secondary hover:text-fg hover:border-neutral-300'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Main Content: 2-Column Golden Ratio Layout */}
      <div className="page-shell pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column (70% - 8 Cols) */}
          <div className="lg:col-span-8 flex flex-col gap-8">
            {/* Section: Overview & Target Audience */}
            <section id="overview" className="bg-white rounded-brand-lg border border-border p-6 sm:p-8 flex flex-col gap-6">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-primary-600" />
                <h2 className="text-xl sm:text-2xl font-bold text-fg tracking-tight">
                  Tổng quan gói học & Phạm vi đào tạo
                </h2>
              </div>

              {/* Hộp tóm tắt các chủ đề chuyên môn trọng tâm sẽ học (tránh lặp với đối tượng học viên) */}
              {resolvedLearningScope && (
                <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200/80 text-neutral-700 text-sm leading-relaxed">
                  <div className="flex items-center gap-2 mb-1.5 text-blue-900 font-bold">
                    <Icon name="menu_book" size="xs" className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Phạm vi kiến thức trọng tâm:</span>
                  </div>
                  <p className="text-neutral-700 text-xs sm:text-sm leading-relaxed m-0">
                    {resolvedLearningScope}
                  </p>
                </div>
              )}

              {/* Target Audience: 3 cột đều nhau lấp đầy khoảng trống */}
              {targetAudience.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-fg mb-3">
                    Khóa học này dành cho ai?
                  </h3>
                  <div
                    className={`grid gap-3 ${
                      targetAudience.length === 3
                        ? 'grid-cols-1 sm:grid-cols-3'
                        : targetAudience.length === 2
                        ? 'grid-cols-1 sm:grid-cols-2'
                        : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                    }`}
                  >
                    {targetAudience.map((aud, i) => (
                      <div
                        key={i}
                        className="p-3.5 bg-neutral-50/80 rounded-xl border border-neutral-200/80 flex items-start gap-3 transition-colors hover:border-blue-200 hover:bg-neutral-50"
                      >
                        <div className="w-6 h-6 rounded-full bg-brand-primary-100 text-brand-primary-700 flex items-center justify-center shrink-0 mt-0.5">
                          <Icon name="person" size="xs" className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs sm:text-sm text-neutral-700 leading-snug font-medium">
                          {aud}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Prerequisites: Dàn 2 cột ngang tiết kiệm chiều cao */}
              {prerequisites.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-fg mb-3">
                    Yêu cầu chuẩn bị trước khi học
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {prerequisites.map((pre, i) => (
                      <div
                        key={i}
                        className="p-3 bg-neutral-50/80 rounded-xl border border-neutral-200/80 flex items-center gap-2.5 text-xs sm:text-sm text-neutral-700 transition-colors hover:border-emerald-200 hover:bg-neutral-50"
                      >
                        <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                          <Icon
                            name="task_alt"
                            size="xs"
                            className="w-3.5 h-3.5 text-emerald-600"
                          />
                        </div>
                        <span className="font-medium leading-snug">{pre}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Section: Expected Outcomes */}
            {expectedOutcomes.length > 0 && (
              <section id="outcomes" className="bg-white rounded-brand-lg border border-border p-6 sm:p-8">
                <div className="flex items-center gap-2 mb-6">
                  <span className="w-2.5 h-2.5 rounded-full bg-success" />
                  <h2 className="text-xl sm:text-2xl font-bold text-fg tracking-tight">
                    Bạn sẽ đạt được những gì sau khóa học?
                  </h2>
                </div>

                <div
                  className={`grid gap-4 ${
                    expectedOutcomes.length === 1
                      ? 'grid-cols-1'
                      : 'grid-cols-1 sm:grid-cols-2'
                  }`}
                >
                  {expectedOutcomes.map((item, i) => {
                    const title = typeof item === 'object' && item.title ? item.title : `Mục tiêu ${i + 1}`;
                    const description = typeof item === 'object' && item.description ? item.description : item;
                    return (
                      <div
                        key={i}
                        className="p-4 rounded-xl border border-success/30 bg-success-subtle/30 flex items-start gap-3.5 transition-all hover:border-success/50 hover:bg-success-subtle/40"
                      >
                        <div className="w-7 h-7 rounded-full bg-success-subtle text-success-strong flex items-center justify-center shrink-0 mt-0.5 shadow-xs border border-success/20">
                          <Icon name="check" size="xs" className="w-4 h-4 font-bold" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-sm font-bold text-fg block mb-1">
                            {title}
                          </span>
                          <p className="text-xs sm:text-sm text-fg-secondary leading-relaxed">
                            {description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Section: Syllabus (Accordion) */}
            <ServiceSyllabus
              curriculum={service.curriculum}
              totalSessions={service.totalSessions}
              sessionDurationMinutes={service.sessionDurationMinutes}
              serviceTitle={service.title}
              onModerated={() => setReloadToken(value => value + 1)}
              subjectName={service.subject?.name}
            />

            {/* Section: Tutor Detailed Profile Card */}
            <section id="tutor-info" className="bg-white rounded-brand-lg border border-border p-6 sm:p-8 flex flex-col gap-6">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-primary-600" />
                <h2 className="text-xl sm:text-2xl font-bold text-fg tracking-tight">
                  Thông tin Gia sư hướng dẫn
                </h2>
              </div>

              <div className="flex flex-col sm:flex-row items-start gap-6 p-6 bg-neutral-50/70 rounded-2xl border border-neutral-100">
                <Link to={`/tutors/${tutor.tutorProfileId}`} className="shrink-0">
                  <Avatar
                    src={tutor.avatarUrl}
                    name={tutor.fullName}
                    size="xl"
                    className="ring-4 ring-brand-primary-100 shadow-sm hover:scale-105 transition-transform"
                  />
                </Link>

                <div className="flex flex-col gap-2 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      to={`/tutors/${tutor.tutorProfileId}`}
                      className="text-xl font-extrabold text-fg hover:text-brand-primary-600 transition-colors"
                    >
                      {tutor.fullName}
                    </Link>
                    {tutor.isVerified && <ApprovedProfileBadge />}
                  </div>

                  {tutor.education && (
                    <p className="text-xs font-semibold text-neutral-500">{tutor.education}</p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-fg-secondary mt-1 flex-wrap">
                    {reviewSummary(tutor.ratingAvg, tutor.totalReviews).hasRating && (
                      <span className="flex items-center gap-1 font-bold text-slate-900">
                        <Icon name="star" size="xs" filled className="w-4 h-4 text-amber-500 fill-amber-500" />
                        <span className="tabular-nums">{Number(tutor.ratingAvg).toFixed(1)}</span>
                        {Number(tutor.totalReviews) > 0 && (
                          <span className="text-fg-muted font-normal">({tutor.totalReviews} đánh giá gia sư)</span>
                        )}
                      </span>
                    )}
                    {tutor.experienceYears > 0 && (
                      <span className="flex items-center gap-1">
                        <Icon name="work_history" size="xs" className="w-3.5 h-3.5 text-fg-muted" />
                        {tutor.experienceYears} năm kinh nghiệm
                      </span>
                    )}
                  </div>

                  {tutor.bio && (
                    <p className="text-xs sm:text-sm text-fg-secondary leading-relaxed mt-2 line-clamp-3">
                      {tutor.bio}
                    </p>
                  )}

                  <div className="pt-3">
                    <Link
                      to={`/tutors/${tutor.tutorProfileId}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-primary-600 hover:text-brand-primary-700 hover:underline"
                    >
                      <span>Xem đầy đủ hồ sơ gia sư, bằng cấp & các gói học khác</span>
                      <Icon name="arrow_forward" size="xs" className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </section>

            {/* Section: Student Reviews */}
            <ServiceReviews
              reviews={service.reviews || service.recentReviews || []}
              ratingAvg={service.ratingAvg}
              totalReviews={service.totalReviews}
              ratingDistribution={service.ratingDistribution}
              satisfactionRate={service.metrics?.satisfactionRate}
              serviceTitle={service.title}
            />

            {/* Section: FAQs */}
            <ServiceFaqs faqs={service.faqs} />
          </div>

          {/* Right Column (30% - 4 Cols - Sticky Sidebar) */}
          <aside className="lg:col-span-4 relative">
            <div className="lg:sticky lg:top-[124px] space-y-4">
              <ServiceSidebarCard
                service={service}
                onBookNow={handleBookNow}
                isBookingPending={bookingLoading}
                isFavoritePending={favoritePending}
                isFavorite={isFavorite}
                onToggleFavorite={handleToggleFavorite}
              />
            </div>
          </aside>
        </div>
      </div>

      {/* 4. Mobile Sticky Bottom CTA Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-neutral-200 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-lg flex items-center justify-between gap-3">
        <div>
          <span className="text-[11px] text-neutral-500 block">Học phí trọn gói:</span>
          <Money value={service.price} className="text-xl font-extrabold text-brand-primary-600" />
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={isFavorite ? 'primary' : 'outline'}
            size="md"
            onClick={handleToggleFavorite}
            disabled={favoritePending}
            aria-busy={favoritePending || undefined}
            aria-label={isFavorite ? "Bỏ lưu gói học" : "Lưu gói học"}
            className={`!rounded-xl px-3 min-h-[44px] ${isFavorite ? 'text-danger bg-danger-subtle' : ''}`}
          >
            <Icon name="favorite" size="sm" filled={isFavorite} />
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            loading={bookingLoading}
            onClick={handleBookNow}
            className="!rounded-xl px-5 py-2.5 min-h-[44px] text-sm font-bold shadow-brand-sm"
          >
            <span>Đăng ký học</span>
            <Icon name="arrow_forward" size="xs" className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
