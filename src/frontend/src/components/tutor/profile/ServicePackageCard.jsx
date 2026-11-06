import React from 'react';
import PropTypes from 'prop-types';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import { ServiceTrialBadge, ServiceLessonChips, ServicePricing } from '@/components/discovery/ServiceCardDetails';
import StretchedCardLink from '@/components/ui/StretchedCardLink';

/** Profile packages share the same comparison prices and accents as marketplace cards. */
export default function ServicePackageCard({ service, isBooking = false, onBook }) {
  const hasTrial = Boolean(service.trialVideoUrl?.trim() || service.trialLessonUrl?.trim() || service.hasTrialLesson);
  const commitments = [
    service.expectedOutcome && { key: 'outcome', icon: 'verified', text: service.expectedOutcome },
    service.learningScope && { key: 'scope', icon: 'menu_book', text: service.learningScope },
  ].filter(Boolean);

  return (
    <Card as="article" padding="none" variant="outlined"
      className="interactive-card flex h-full flex-col overflow-hidden rounded-2xl shadow-[var(--learning-card-shadow)]">
      <StretchedCardLink to={`/services/${service.id}`} label={`Xem gói học ${service.title}`} />
      <div className="flex flex-1 flex-col gap-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-2">
          {service.subjectName && <span className="max-w-full break-words rounded-lg border border-brand-primary-100 bg-brand-primary-50 px-2.5 py-1 text-caption font-medium text-brand-primary-700">{service.subjectName}</span>}
          {hasTrial && <ServiceTrialBadge />}
        </div>
        <h3 className="text-[17px] font-semibold leading-snug text-fg">
          <span className="line-clamp-2">{service.title}</span>
        </h3>

        {commitments.length > 0 ? <ul className="space-y-3">
          {commitments.map(item => <li key={item.key} className="flex items-start gap-2 text-body-reg leading-relaxed text-fg-secondary">
            <Icon name={item.icon} size="sm" className="mt-1 text-primary" /><span className="line-clamp-3 min-w-0">{item.text}</span>
          </li>)}
        </ul> : (service.shortDescription || service.description) && <p className="line-clamp-3 text-body-reg leading-relaxed text-fg-secondary">{service.shortDescription || service.description}</p>}

        <ServiceLessonChips totalSessions={service.totalSessions} sessionDurationMinutes={service.sessionDurationMinutes} />
        <div className="mt-auto pt-1">
          <ServicePricing price={service.price} totalSessions={service.totalSessions}>
            <div className="flex w-full flex-wrap gap-2.5">
              <Button as="span" aria-hidden="true" variant="outline" className="min-w-[120px] flex-1" iconRight={<Icon name="arrow_forward" size="sm" />}>Xem gói</Button>
              <Button variant="primary" className="relative z-20 min-w-[140px] flex-1" loading={isBooking} onClick={() => onBook(service)} icon={<Icon name="lock_clock" size="sm" />}>Giữ chỗ ngay</Button>
            </div>
          </ServicePricing>
        </div>
      </div>
    </Card>
  );
}

ServicePackageCard.propTypes = {
  service: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string,
    subjectName: PropTypes.string,
    totalSessions: PropTypes.number,
    sessionDurationMinutes: PropTypes.number,
    price: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    hasTrialLesson: PropTypes.bool,
    trialLessonUrl: PropTypes.string,
    trialVideoUrl: PropTypes.string,
    expectedOutcome: PropTypes.string,
    learningScope: PropTypes.string,
    shortDescription: PropTypes.string,
    description: PropTypes.string,
  }).isRequired,
  isBooking: PropTypes.bool,
  onBook: PropTypes.func.isRequired,
};
