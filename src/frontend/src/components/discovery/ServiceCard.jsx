import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import Icon from '@/components/ui/Icon';
import Avatar from '@/components/ui/Avatar';
import Button, { IconButton } from '@/components/ui/Button';
import Money from '@/components/ui/Money';

export default function ServiceCard({ service }) {
  const [isFavorite, setIsFavorite] = useState(false);

  const modeLabel =
    service.teachingMode === 'InPerson' || service.teachingMode === 'Offline'
      ? 'Tại nhà'
      : service.teachingMode === 'Both'
      ? 'Online hoặc tại nhà'
      : 'Online';

  const modeIcon =
    service.teachingMode === 'InPerson' || service.teachingMode === 'Offline'
      ? 'home'
      : service.teachingMode === 'Both'
      ? 'devices'
      : 'videocam';

  const totalSessions = Number(service.totalSessions) > 0 ? Number(service.totalSessions) : null;
  const sessionDuration = Number(service.sessionDurationMinutes) > 0
    ? Number(service.sessionDurationMinutes)
    : null;
  const price = Number(service.price) || 0;
  const rating = Number(service.tutorRating) > 0 ? Number(service.tutorRating) : null;
  const reviewsCount = Number(service.tutorTotalReviews) || 0;
  const subjectLabel = service.subjectName || service.categoryName || 'Dịch vụ học tập';
  const TutorIdentity = service.tutorProfileId ? Link : 'div';

  return (
    <article className="group relative flex min-w-0 flex-col overflow-hidden rounded-brand-lg border border-border bg-surface shadow-brand-sm transition-[border-color,box-shadow] duration-normal ease-standard hover:border-brand-primary-300 hover:shadow-brand-md">
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-3">
          <span className="inline-flex max-w-[calc(100%-3rem)] items-center rounded-pill border border-brand-primary-100 bg-primary-subtle px-3 py-1.5 text-caption font-semibold text-brand-primary-700">
            <span className="truncate">{subjectLabel}</span>
          </span>
          <IconButton
            label={isFavorite ? 'Bỏ lưu dịch vụ' : 'Lưu dịch vụ'}
            aria-pressed={isFavorite}
            variant="ghost"
            size="md"
            onClick={() => setIsFavorite((value) => !value)}
            className="relative z-10 -mr-2.5 -mt-2.5 text-fg-muted hover:bg-neutral-100 hover:text-danger"
            icon={
              <Icon
                name="favorite"
                size="sm"
                filled={isFavorite}
                className={isFavorite ? 'text-danger' : undefined}
              />
            }
          />
        </div>

        <Link
          to={`/services/${service.id}`}
          className="group/title after:absolute after:inset-0 after:content-['']"
        >
          <h3 className="min-h-[3.25rem] text-headline-3 font-bold leading-snug text-fg transition-colors line-clamp-2 group-hover/title:text-primary group-hover:text-primary">
            {service.title}
          </h3>
        </Link>

        <TutorIdentity
          {...(service.tutorProfileId ? { to: `/tutors/${service.tutorProfileId}` } : {})}
          className="relative z-10 mt-4 flex items-center gap-3 rounded-brand-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Avatar
            src={service.tutorAvatarUrl}
            name={service.tutorName}
            size="md"
            className="shrink-0 border-brand-primary-100 bg-brand-primary-50"
          />
          <div className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5 text-body-reg font-semibold text-fg">
              <span className="truncate">{service.tutorName || 'Gia sư'}</span>
              <Icon
                name="verified"
                size="sm"
                strokeWidth={2.25}
                label="Gia sư đã được xác thực"
                className="shrink-0 text-brand-primary-600"
              />
            </span>
            {rating ? (
              <span className="mt-1 flex items-center gap-1.5 text-caption text-fg-muted">
                <Icon name="star" size="sm" filled className="text-brand-secondary-500" />
                <span className="font-semibold text-fg">{rating.toFixed(1)}</span>
                {reviewsCount > 0 && <span>· {reviewsCount} đánh giá</span>}
              </span>
            ) : (
              <span className="mt-1 block text-caption text-fg-muted">Chưa có đánh giá</span>
            )}
          </div>
        </TutorIdentity>

        <dl className="mt-5 grid grid-cols-2 overflow-hidden rounded-brand-md border border-border bg-neutral-50 text-caption">
          <div className="border-r border-border p-3.5">
            <dt className="flex items-center gap-1.5 text-fg-muted">
              <Icon name="calendar_month" size="sm" className="text-brand-primary-600" />
              Lộ trình
            </dt>
            <dd className="mt-1.5 text-body-reg font-semibold text-fg">
              {totalSessions ? `${totalSessions} buổi` : 'Chưa cập nhật'}
            </dd>
          </div>
          <div className="p-3.5">
            <dt className="flex items-center gap-1.5 text-fg-muted">
              <Icon name="schedule" size="sm" className="text-brand-primary-600" />
              Mỗi buổi
            </dt>
            <dd className="mt-1.5 text-body-reg font-semibold text-fg">
              {sessionDuration ? `${sessionDuration} phút` : 'Chưa cập nhật'}
            </dd>
          </div>
          <div className="col-span-2 flex items-center gap-2 border-t border-border px-3.5 py-3 text-fg-secondary">
            <Icon name={modeIcon} size="sm" className="text-brand-primary-600" />
            <dd>{modeLabel}</dd>
          </div>
        </dl>

        <div className="relative z-10 mt-auto pt-5">
          <div>
            <span className="block text-caption font-medium text-fg-muted">Trọn gói</span>
            {price > 0 ? (
              <Money value={price} className="mt-0.5 block text-[20px] font-bold text-fg" />
            ) : (
              <span className="mt-0.5 block text-[16px] font-bold text-fg">Liên hệ</span>
            )}
          </div>
          <Button
            as={Link}
            to={`/services/${service.id}`}
            variant="primary"
            size="md"
            fullWidth
            iconRight={<Icon name="arrow_forward" size="sm" />}
            className="mt-4"
          >
            Xem chi tiết
          </Button>
        </div>
      </div>
    </article>
  );
}

ServiceCard.propTypes = {
  service: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    subjectName: PropTypes.string,
    categoryName: PropTypes.string,
    totalSessions: PropTypes.number,
    sessionDurationMinutes: PropTypes.number,
    price: PropTypes.number,
    teachingMode: PropTypes.string,
    tutorProfileId: PropTypes.string,
    tutorName: PropTypes.string,
    tutorAvatarUrl: PropTypes.string,
    tutorRating: PropTypes.number,
    tutorTotalReviews: PropTypes.number,
  }).isRequired,
};
