import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import tutorService from '@/services/tutor.service';
import ServiceDetailHero from '@/components/service-detail/ServiceDetailHero';
import ServiceSyllabus from '@/components/service-detail/ServiceSyllabus';
import ServiceSidebarCard from '@/components/service-detail/ServiceSidebarCard';
import ServiceReviews from '@/components/service-detail/ServiceReviews';
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

export default function ServiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { isAuthenticated, role } = useAuthStore();

  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [bookingLoading, setBookingLoading] = useState(false);

  const handleBookNow = async () => {
    if (!service) return;
    if (!isAuthenticated) {
      toast.info('Vui lòng đăng nhập với tài khoản học viên để tiến hành đăng ký.');
      navigate(`/auth/login?redirect=/services/${service.id}`);
      return;
    }
    if (role === 'Tutor') {
      toast.warning('Bạn đang đăng nhập bằng tài khoản Gia sư. Vui lòng dùng tài khoản Học viên để đặt lịch.');
      return;
    }
    try {
      setBookingLoading(true);
      const booking = await bookingService.createBooking(service.id);
      if (booking?.id) {
        toast.success('Đã giữ chỗ thành công 15 phút! Đang chuyển đến cổng thanh toán...');
        navigate(`/student/bookings/${booking.id}/checkout`);
      }
    } catch (err) {
      toast.error(err?.message || 'Không tạo được đơn giữ chỗ. Vui lòng thử lại.');
    } finally {
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
        }
      } catch (err) {
        if (!cancelled) {
          console.error('[ServiceDetail] Error loading service:', err);
          setError(err.message || 'Không thể tải thông tin dịch vụ học tập.');
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
  }, [id]);

  const scrollToSection = (sectionId, tabKey) => {
    setActiveTab(tabKey);
    const element = document.getElementById(sectionId);
    if (element) {
      const yOffset = -90;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

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
          title="Không thể tải khóa học"
          description={error}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <EmptyState
          title="Dịch vụ học tập không tồn tại"
          description="Dịch vụ học tập bạn đang tìm kiếm có thể đã bị gỡ hoặc không tồn tại."
          actionText="Về danh sách dịch vụ"
          onAction={() => navigate('/services')}
        />
      </div>
    );
  }

  const tutor = service.tutor || {};
  const targetAudience = Array.isArray(service.targetAudience) ? service.targetAudience : [];
  const prerequisites = Array.isArray(service.prerequisites) ? service.prerequisites : [];
  const expectedOutcomes = service.expectedOutcome
    ? service.expectedOutcome.split('. ').filter(Boolean)
    : [
        'Nắm vững phương pháp giải các dạng bài tập trọng tâm.',
        'Tự tin nâng cao phản xạ và tư duy logic độc lập.',
        'Bứt phá kết quả học tập và đạt chuẩn điểm số đề ra.',
      ];

  const tabs = [
    { key: 'overview', label: 'Tổng quan', sectionId: 'overview' },
    { key: 'outcomes', label: 'Bạn sẽ học gì?', sectionId: 'outcomes' },
    { key: 'syllabus', label: 'Lộ trình học', sectionId: 'syllabus' },
    { key: 'tutor', label: 'Gia sư', sectionId: 'tutor-info' },
    { key: 'reviews', label: 'Đánh giá', sectionId: 'reviews' },
    { key: 'faqs', label: 'Hỏi đáp (FAQ)', sectionId: 'faqs' },
  ];

  return (
    <div className="min-h-screen bg-neutral-50/60 pb-20">
      {/* 1. Top Hero Section */}
      <ServiceDetailHero service={service} />

      {/* 2. Sticky Tab Navigation Bar */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-neutral-200/90 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-2.5 no-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => scrollToSection(tab.sectionId, tab.key)}
                className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold whitespace-nowrap transition-colors ${
                  activeTab === tab.key
                    ? 'bg-brand-primary-600 text-white shadow-sm'
                    : 'text-fg-secondary hover:text-brand-primary-600 hover:bg-neutral-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Main Content: 2-Column Golden Ratio Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (70% - 8 Cols) */}
          <div className="lg:col-span-8 flex flex-col gap-8">
            {/* Section: Overview & Target Audience */}
            <div id="overview" className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8 shadow-sm flex flex-col gap-6">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-primary-600" />
                <h2 className="text-xl sm:text-2xl font-bold text-fg tracking-tight">
                  Tổng quan dịch vụ & Phạm vi đào tạo
                </h2>
              </div>

              {service.learningScope && (
                <div className="p-4 bg-brand-primary-50/50 rounded-xl border border-brand-primary-100/70 text-neutral-700 text-sm leading-relaxed">
                  <strong className="text-brand-primary-800 block mb-1">Phạm vi kiến thức trọng tâm:</strong>
                  {service.learningScope}
                </div>
              )}

              {/* Target Audience */}
              <div>
                <h3 className="text-sm font-bold text-fg uppercase tracking-wider mb-3">
                  Khóa học này dành cho ai?
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {targetAudience.map((aud, i) => (
                    <div
                      key={i}
                      className="p-3.5 bg-neutral-50/80 rounded-xl border border-neutral-100 flex items-start gap-3"
                    >
                      <div className="w-6 h-6 rounded-full bg-brand-primary-100 text-brand-primary-700 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon name="person" size="xs" className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs sm:text-sm text-neutral-700 leading-snug">
                        {aud}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Prerequisites */}
              <div>
                <h3 className="text-sm font-bold text-fg uppercase tracking-wider mb-3">
                  Yêu cầu chuẩn bị trước khi học
                </h3>
                <ul className="flex flex-col gap-2.5">
                  {prerequisites.map((pre, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-neutral-700">
                      <Icon
                        name="task_alt"
                        size="xs"
                        className="w-4 h-4 text-success-strong shrink-0 mt-0.5"
                      />
                      <span>{pre}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Section: Expected Outcomes */}
            <div id="outcomes" className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <span className="w-2.5 h-2.5 rounded-full bg-success" />
                <h2 className="text-xl sm:text-2xl font-bold text-fg tracking-tight">
                  Bạn sẽ đạt được những gì sau khóa học?
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {expectedOutcomes.map((item, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl border border-success/30 bg-success-subtle/30 flex items-start gap-3.5"
                  >
                    <div className="w-7 h-7 rounded-full bg-success-subtle text-success-strong flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                      <Icon name="check" size="xs" className="w-4 h-4 font-bold" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-fg block mb-0.5">
                        Mục tiêu {i + 1}
                      </span>
                      <p className="text-xs sm:text-sm text-fg-secondary leading-relaxed">
                        {item}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section: Syllabus (Accordion) */}
            <ServiceSyllabus
              curriculum={service.curriculum}
              totalSessions={service.totalSessions}
              sessionDurationMinutes={service.sessionDurationMinutes}
            />

            {/* Section: Tutor Detailed Profile Card */}
            <div id="tutor-info" className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8 shadow-sm flex flex-col gap-6">
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
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-primary-100 text-brand-primary-700">
                      <Icon name="verified" size="xs" className="w-3.5 h-3.5" />
                      Gia sư xác thực
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-neutral-500">
                    {tutor.education || 'Giảng viên chuyên môn chất lượng cao'}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-fg-secondary mt-1 flex-wrap">
                    <span className="flex items-center gap-1 font-bold text-brand-secondary-500">
                      <Icon name="star" size="xs" className="w-4 h-4 fill-brand-secondary-400 text-brand-secondary-400" />
                      {Number(tutor.ratingAvg) > 0 ? Number(tutor.ratingAvg).toFixed(1) : '5.0'}
                      <span className="text-fg-muted font-normal">({tutor.totalReviews || 12} đánh giá)</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Icon name="work_history" size="xs" className="w-3.5 h-3.5 text-fg-muted" />
                      {tutor.experienceYears || 3} năm kinh nghiệm
                    </span>
                    {tutor.address && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Icon name="location_on" size="xs" className="w-3.5 h-3.5 text-fg-muted" />
                          {tutor.address}
                        </span>
                      </>
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
            </div>

            {/* Section: Student Reviews */}
            <ServiceReviews
              reviews={service.recentReviews}
              ratingAvg={tutor.ratingAvg}
              totalReviews={tutor.totalReviews}
              satisfactionRate={service.metrics?.satisfactionRate}
            />

            {/* Section: FAQs */}
            <ServiceFaqs faqs={service.faqs} />
          </div>

          {/* Right Column (30% - 4 Cols - Sticky Sidebar) */}
          <div className="lg:col-span-4">
            <ServiceSidebarCard service={service} onBookNow={handleBookNow} />
          </div>
        </div>
      </div>

      {/* 4. Mobile Sticky Bottom CTA Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-neutral-200 p-4 shadow-lg flex items-center justify-between gap-4">
        <div>
          <span className="text-[11px] text-neutral-500 block">Học phí trọn gói:</span>
          <Money value={service.price} className="text-xl font-extrabold text-brand-primary-600" />
        </div>

        <Button
          type="button"
          variant="primary"
          size="md"
          loading={bookingLoading}
          onClick={handleBookNow}
          className="!rounded-xl px-5 py-2.5 text-sm font-bold shadow-brand-sm"
        >
          <span>Đăng ký học</span>
          <Icon name="arrow_forward" size="xs" className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
