import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import Icon from '@/components/ui/Icon';
import Avatar from '@/components/ui/Avatar';
import { formatRating } from '@/utils/marketplaceHelpers';
import { useWishlist } from '@/hooks/useWishlist';

export default function ServiceCard({ service }) {
  const { isFavorited, toggle } = useWishlist();
  const serviceId = service?.id || service?.serviceId;
  const isFavorite = isFavorited('Service', serviceId);

  const totalSessions = Number(service.totalSessions) > 0 ? Number(service.totalSessions) : null;
  const sessionDuration = Number(service.sessionDurationMinutes) > 0 ? Number(service.sessionDurationMinutes) : null;
  const price = Number(service.price) || 0;
  const rating = Number(service.tutorRating) > 0 ? Number(service.tutorRating) : null;
  const reviewsCount = Number(service.tutorTotalReviews) || 0;
  const subjectLabel = service.subjectName || service.categoryName || 'Dịch vụ học tập';
  const hasTrial = Boolean(service.trialLessonUrl?.trim() || service.hasTrialLesson);

  const outcomeOrDescription = useMemo(() => {
    const text = service.expectedOutcome?.trim() || service.shortDescription?.trim() || service.description?.trim();
    return text || '';
  }, [service.expectedOutcome, service.shortDescription, service.description]);

  const formattedPrice = useMemo(() => {
    if (!price || price <= 0) return null;
    return new Intl.NumberFormat('vi-VN').format(price);
  }, [price]);

  const pricePerSession = useMemo(() => {
    if (price > 0 && totalSessions && totalSessions > 0) {
      const perSession = Math.round(price / totalSessions);
      return new Intl.NumberFormat('vi-VN').format(perSession);
    }
    return null;
  }, [price, totalSessions]);

  return (
    <article className="mkt-card group relative flex min-w-0 flex-col overflow-hidden bg-white p-5 cursor-pointer sm:p-6">
      {/* Full-card clickable overlay — keeps card accessible and supports middle-click / new-tab */}
      <Link
        to={`/services/${service.id}`}
        aria-hidden="true"
        tabIndex={-1}
        className="absolute inset-0 z-10"
      />

      {/* Header: Tag môn học + Badge Học thử (nếu có) + Nút lưu yêu thích đồng bộ */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 min-w-0">
          <span className="inline-flex min-h-[26px] items-center rounded-lg border border-blue-100 bg-blue-50/80 px-2.5 text-xs font-semibold text-blue-700">
            <span className="truncate">{subjectLabel}</span>
          </span>

          {hasTrial && (
            <span
              className="inline-flex min-h-[26px] items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2 text-[11.5px] font-semibold text-amber-700 shadow-sm"
              title="Gói học có video học thử"
            >
              <span className="text-[10px]" aria-hidden="true">▶</span>
              Học thử
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggle('Service', serviceId);
          }}
          aria-label={isFavorite ? 'Bỏ lưu dịch vụ' : 'Lưu dịch vụ'}
          aria-pressed={isFavorite}
          className="mkt-favorite relative z-20"
        >
          <Icon name="favorite" size="sm" filled={isFavorite} />
        </button>
      </div>

      {/* Tiêu đề gói dịch vụ: màu tối (#0F172A), hover chuyển xanh cobalt */}
      <Link
        to={`/services/${service.id}`}
        className="relative z-20 mt-3.5 block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <h3 className="line-clamp-2 min-h-[48px] text-[17px] font-bold leading-[1.4] tracking-[-0.015em] text-[#0F172A] transition-colors duration-200 group-hover:text-blue-600">
          {service.title}
        </h3>
      </Link>

      {/* Cam kết đầu ra (ExpectedOutcome) hoặc Mô tả ngắn (ShortDescription) */}
      <p
        className="mt-1.5 line-clamp-2 min-h-[38px] text-[12.5px] leading-[1.55] text-slate-500"
        title={outcomeOrDescription}
      >
        {outcomeOrDescription || 'Thiết kế lộ trình học bài bản, củng cố kiến thức và nâng cao điểm số mục tiêu.'}
      </p>

      {/* Thông tin gia sư: Avatar, tên, tick xanh, rating đồng bộ với TutorCard */}
      {service.tutorProfileId ? (
        <Link
          to={`/tutors/${service.tutorProfileId}`}
          className="relative z-20 mt-3 flex min-h-12 items-center gap-3 rounded-xl p-1 -mx-1 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <TutorInfo service={service} rating={rating} reviewsCount={reviewsCount} />
        </Link>
      ) : (
        <div className="relative z-20 mt-3 flex min-h-12 items-center gap-3 p-1 -mx-1">
          <TutorInfo service={service} rating={rating} reviewsCount={reviewsCount} />
        </div>
      )}

      {/* Dải thông số tinh gọn trên 1 dòng: Lộ trình & Thời lượng mỗi buổi */}
      <div className="mt-3.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 rounded-xl border border-slate-200/70 bg-slate-50/90 px-3 py-2 text-[12px] text-slate-600">
        <span className="inline-flex items-center gap-1.5 font-medium">
          <Icon name="calendar_month" size="xs" className="shrink-0 text-blue-600" />
          <span>Lộ trình <strong className="font-semibold text-slate-900">{totalSessions ? `${totalSessions} buổi` : 'Linh hoạt'}</strong></span>
        </span>
        <span className="text-slate-300" aria-hidden="true">•</span>
        <span className="inline-flex items-center gap-1.5 font-medium">
          <Icon name="schedule" size="xs" className="shrink-0 text-blue-600" />
          <span><strong className="font-semibold text-slate-900">{sessionDuration ? `${sessionDuration} phút` : 'Tùy chọn'}</strong>/buổi</span>
        </span>
      </div>

      {/* Học phí & Nút hành động — Xóa lặp số buổi, hiển thị giá trọn gói và đơn giá mỗi buổi */}
      <div className="mt-auto flex items-end justify-between gap-3 pt-4">
        <div className="min-w-0">
          <span className="block text-[11px] font-bold uppercase tracking-[0.08em] text-[color:var(--mkt-muted)]">
            Trọn gói
          </span>
          {formattedPrice ? (
            <div>
              <div className="mt-0.5 flex items-baseline gap-1">
                <span className="mkt-tabular text-[19px] font-bold text-[color:var(--mkt-ink)]">
                  {formattedPrice}₫
                </span>
              </div>
              {pricePerSession && (
                <span className="block text-[11.5px] font-medium text-emerald-600">
                  ~{pricePerSession}₫ / buổi
                </span>
              )}
            </div>
          ) : (
            <span className="mt-1 block text-[14px] font-bold text-[color:var(--mkt-ink)]">
              Liên hệ
            </span>
          )}
        </div>

        <Link
          to={`/services/${service.id}`}
          className="mkt-card-cta shrink-0 relative z-20"
        >
          <span>Xem gói</span>
          <Icon name="arrow_forward" size="sm" className="mkt-card-cta-arrow" />
        </Link>
      </div>
    </article>
  );
}

function TutorInfo({ service, rating, reviewsCount }) {
  const hasRating = reviewsCount > 0 && rating > 0;

  return (
    <>
      <Avatar
        src={service.tutorAvatarUrl}
        name={service.tutorName}
        size="md"
        className="shrink-0 border-2 border-white bg-blue-50 shadow-sm"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-bold text-slate-900 transition-colors group-hover:text-blue-600">
            {service.tutorName || 'Gia sư'}
          </span>
          <Icon name="verified" size="sm" label="Đã xác minh" className="shrink-0 text-blue-600" />
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-xs">
          {hasRating ? (
            <span className="mkt-rating">
              <Icon name="star" size="xs" filled />
              <strong>{formatRating(rating)}</strong>
              <span>({reviewsCount})</span>
            </span>
          ) : (
            <span className="mkt-new-badge">Mới</span>
          )}
          {service.totalStudents > 0 && (
            <span className="text-slate-500">· {service.totalStudents} học viên</span>
          )}
        </div>
      </div>
    </>
  );
}

TutorInfo.propTypes = {
  service: PropTypes.shape({
    tutorAvatarUrl: PropTypes.string,
    tutorName: PropTypes.string,
    totalStudents: PropTypes.number,
  }).isRequired,
  rating: PropTypes.number,
  reviewsCount: PropTypes.number.isRequired,
};

ServiceCard.propTypes = {
  service: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    shortDescription: PropTypes.string,
    expectedOutcome: PropTypes.string,
    trialLessonUrl: PropTypes.string,
    hasTrialLesson: PropTypes.bool,
    subjectName: PropTypes.string,
    categoryName: PropTypes.string,
    totalSessions: PropTypes.number,
    sessionDurationMinutes: PropTypes.number,
    price: PropTypes.number,
    tutorProfileId: PropTypes.string,
    tutorName: PropTypes.string,
    tutorAvatarUrl: PropTypes.string,
    tutorRating: PropTypes.number,
    tutorTotalReviews: PropTypes.number,
    totalStudents: PropTypes.number,
  }).isRequired,
};
