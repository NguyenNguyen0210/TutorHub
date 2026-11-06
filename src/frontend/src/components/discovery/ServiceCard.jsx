import React from 'react';
import PropTypes from 'prop-types';
import { Link, useLocation } from 'react-router-dom';
import { discoveryReturn } from '@/utils/discoveryReturn';
import Icon from '@/components/ui/Icon';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import { ServiceTrialBadge, ServiceLessonChips, ServicePricing } from './ServiceCardDetails';
import { formatRating } from '@/utils/marketplaceHelpers';
import WishlistButton from './WishlistButton';
import StretchedCardLink from '@/components/ui/StretchedCardLink';

export default function ServiceCard({ service }) {
  const location = useLocation();
  const serviceId = service.id || service.serviceId;
  const totalSessions = Number(service.totalSessions) > 0 ? Number(service.totalSessions) : null;
  const sessionDuration = Number(service.sessionDurationMinutes) > 0 ? Number(service.sessionDurationMinutes) : null;
  const price = Number(service.price) || 0;
  const rating = Number(service.tutorRating) || 0;
  const reviewsCount = Number(service.tutorTotalReviews) || 0;
  const hasRating = reviewsCount > 0 && rating > 0;
  const subjectLabel = service.subjectName || service.categoryName;
  const hasTrial = Boolean(service.trialVideoUrl?.trim() || service.trialLessonUrl?.trim() || service.hasTrialLesson);
  const description = service.expectedOutcome?.trim() || service.shortDescription?.trim() || service.description?.trim();

  const tutorInfo = (
    <>
      <Avatar key={service.tutorAvatarUrl || service.tutorName} src={service.tutorAvatarUrl} name={service.tutorName} size="md" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-body-reg font-semibold text-fg">{service.tutorName || 'Gia sư'}</p>
        {hasRating && <p className="mt-1 inline-flex flex-wrap items-center gap-x-1.5 gap-y-1 text-caption"><span className="inline-flex items-center gap-1 font-semibold text-[rgb(var(--course-rating-strong))]"><Icon name="star" size="xs" filled />{formatRating(rating)}</span><span className="text-fg-secondary">({reviewsCount} đánh giá)</span></p>}
        {service.totalStudents > 0 && <p className="mt-1 text-caption text-fg-secondary">{service.totalStudents} học viên</p>}
      </div>
    </>
  );

  return (
    <article className="interactive-card flex h-full min-w-0 flex-col rounded-2xl border border-border bg-surface p-5 shadow-[var(--learning-card-shadow)] sm:p-6">
      <StretchedCardLink to={`/services/${serviceId}`} label={`Xem gói học ${service.title}`} />
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-wrap gap-2">
          {subjectLabel && <span className="max-w-full break-words rounded-lg border border-brand-primary-100 bg-brand-primary-50 px-2.5 py-1 text-caption font-medium text-brand-primary-700">{subjectLabel}</span>}
          {hasTrial && <ServiceTrialBadge />}
        </div>
        <WishlistButton itemType="Service" itemId={serviceId} />
      </div>

      <h3 className="mt-4 text-[17px] font-semibold leading-snug text-fg">
        <span className="line-clamp-2">{service.title}</span>
      </h3>
      {description && <p className="mt-2 line-clamp-3 text-body-reg leading-relaxed text-fg-secondary">{description}</p>}
      {service.tutorProfileId ? (
        <Link to={`/tutors/${service.tutorProfileId}`} state={discoveryReturn(location)} className="relative z-20 mt-4 flex items-center gap-3 rounded-xl p-1 -mx-1 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{tutorInfo}</Link>
      ) : <div className="mt-4 flex items-center gap-3">{tutorInfo}</div>}

      {(totalSessions || sessionDuration) && (
        <div className="mt-4"><ServiceLessonChips totalSessions={totalSessions} sessionDurationMinutes={sessionDuration} /></div>
      )}

      <div className="mt-auto pt-5">
        <ServicePricing price={price} totalSessions={totalSessions}>
          <Button as="span" aria-hidden="true" iconRight={<Icon name="arrow_forward" size="sm" />}>Xem gói</Button>
        </ServicePricing>
      </div>
    </article>
  );
}

ServiceCard.propTypes = {
  service: PropTypes.shape({
    id: PropTypes.string.isRequired,
    serviceId: PropTypes.string,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    shortDescription: PropTypes.string,
    expectedOutcome: PropTypes.string,
    trialLessonUrl: PropTypes.string,
    trialVideoUrl: PropTypes.string,
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
