import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import Icon from '@/components/ui/Icon';
import Avatar from '@/components/ui/Avatar';
import Money from '@/components/ui/Money';
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

  return (
    <article className="mkt-card group relative flex min-w-0 flex-col overflow-hidden bg-white p-5 sm:p-6">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400" aria-hidden="true" />

      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex min-h-8 max-w-[calc(100%-3rem)] items-center rounded-full border border-blue-200 bg-blue-50 px-3 text-xs font-bold text-blue-700">
          <span className="truncate">{subjectLabel}</span>
        </span>
        <button
          type="button"
          onClick={() => toggle('Service', serviceId)}
          aria-label={isFavorite ? 'Bỏ lưu dịch vụ' : 'Lưu dịch vụ'}
          aria-pressed={isFavorite}
          className={`relative z-20 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
            isFavorite ? 'bg-rose-50 text-rose-600' : 'text-slate-500 hover:bg-slate-100 hover:text-rose-600'
          }`}
        >
          <Icon name="favorite" size="sm" filled={isFavorite} />
        </button>
      </div>

      <Link to={`/services/${service.id}`} className="mt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
        <h3 className="line-clamp-2 min-h-[52px] text-lg font-bold leading-[1.45] tracking-[-0.015em] text-slate-950 transition-colors group-hover:text-blue-700">
          {service.title}
        </h3>
      </Link>

      {service.tutorProfileId ? (
        <Link
          to={`/tutors/${service.tutorProfileId}`}
          className="mt-4 flex min-h-14 items-center gap-3 rounded-xl transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <TutorInfo service={service} rating={rating} reviewsCount={reviewsCount} />
        </Link>
      ) : (
        <div className="mt-4 flex min-h-14 items-center gap-3">
          <TutorInfo service={service} rating={rating} reviewsCount={reviewsCount} />
        </div>
      )}

      <dl className="mt-5 grid grid-cols-2 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
        <div className="border-r border-slate-200 p-3.5">
          <dt className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <Icon name="calendar_month" size="sm" className="text-blue-600" />
            Lộ trình
          </dt>
          <dd className="mt-1.5 text-sm font-bold text-slate-950">{totalSessions ? `${totalSessions} buổi` : 'Linh hoạt'}</dd>
        </div>
        <div className="p-3.5">
          <dt className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <Icon name="schedule" size="sm" className="text-blue-600" />
            Mỗi buổi
          </dt>
          <dd className="mt-1.5 text-sm font-bold text-slate-950">{sessionDuration ? `${sessionDuration} phút` : 'Tùy chọn'}</dd>
        </div>
      </dl>

      <div className="mt-auto flex items-end justify-between gap-4 border-t border-slate-200 pt-5">
        <div className="min-w-0">
          <span className="block text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">Học phí trọn gói</span>
          {price > 0 ? (
            <Money value={price} className="mt-1 block text-xl font-extrabold tracking-[-0.02em] text-slate-950" />
          ) : (
            <span className="mt-1 block text-lg font-bold text-slate-950">Liên hệ</span>
          )}
        </div>
        <Link
          to={`/services/${service.id}`}
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
        >
          Xem gói
          <Icon name="arrow_forward" size="sm" />
        </Link>
      </div>
    </article>
  );
}

function TutorInfo({ service, rating, reviewsCount }) {
  return (
    <>
      <Avatar src={service.tutorAvatarUrl} name={service.tutorName} size="md" className="shrink-0 border-blue-100 bg-blue-50" />
      <div className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
          <span className="truncate">{service.tutorName || 'Gia sư'}</span>
          <Icon name="verified" size="sm" label="Gia sư đã được xác thực" className="shrink-0 text-blue-600" />
        </span>
        {rating ? (
          <span className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
            <Icon name="star" size="sm" filled className="text-amber-500" />
            <strong className="text-slate-800">{rating.toFixed(1)}</strong>
            {reviewsCount > 0 && <span>({reviewsCount} đánh giá)</span>}
          </span>
        ) : (
          <span className="mt-1 inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700">Gia sư mới</span>
        )}
      </div>
    </>
  );
}

TutorInfo.propTypes = {
  service: PropTypes.shape({
    tutorAvatarUrl: PropTypes.string,
    tutorName: PropTypes.string,
  }).isRequired,
  rating: PropTypes.number,
  reviewsCount: PropTypes.number.isRequired,
};

ServiceCard.propTypes = {
  service: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
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
  }).isRequired,
};
