import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import Icon from '@/components/ui/Icon';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Money from '@/components/ui/Money';
import { formatRating } from '@/utils/marketplaceHelpers';
import WishlistButton from './WishlistButton';
import ApprovedProfileBadge from './ApprovedProfileBadge';
import StretchedCardLink from '@/components/ui/StretchedCardLink';

export default function TutorCard({ tutor = {} }) {
  const tutorId = tutor.id || tutor.tutorProfileId;
  const {
    fullName = 'Gia sư', avatarUrl, bio = '', education = '', university = '', major = '',
    experienceYears, ratingAvg, totalReviews = 0, subjects = [], minPrice = null,
    isVerified = false,
  } = tutor;

  const displayName = fullName?.trim() || 'Gia sư';
  const educationDisplay = useMemo(() => {
    if (major?.trim() && university?.trim()) return `${major.trim()} · ${university.trim()}`;
    return university?.trim() || major?.trim() || education?.trim() || '';
  }, [major, university, education]);
  const normalizedSubjects = useMemo(() => [...new Set((Array.isArray(subjects) ? subjects : [])
    .map(subject => typeof subject === 'string' ? subject : subject?.name ?? subject?.subjectName)
    .filter(Boolean))], [subjects]);
  const rating = Number(ratingAvg ?? tutor.rating ?? 0);
  const reviewsCount = Number(totalReviews);
  const yearsExp = Number(experienceYears ?? tutor.yearsOfExperience ?? 0);
  // Only a package minimum can be labelled "Gói học từ"; hourlyRate is a different unit.
  const packagePrice = minPrice != null && Number(minPrice) > 0 ? Number(minPrice) : null;
  const hasRating = reviewsCount > 0 && rating > 0;
  const profilePath = `/tutors/${tutorId}`;

  return (
    <article className="interactive-card flex h-full min-w-0 flex-col rounded-2xl border border-border bg-surface p-5 shadow-[var(--learning-card-shadow)] sm:p-6">
      <StretchedCardLink to={profilePath} label={`Xem hồ sơ ${displayName}`} />
      <div className="relative flex items-start gap-3 sm:gap-4">
        <Avatar key={avatarUrl || displayName} src={avatarUrl} name={displayName} size="lg" />
        <div className="min-w-0 flex-1">
          <h3 className="flex items-start gap-1 text-[17px] font-semibold leading-snug text-fg">
            <span className="min-w-0">{displayName}</span>{isVerified && <ApprovedProfileBadge />}
          </h3>
          {educationDisplay && <p className="mt-1 line-clamp-2 text-caption leading-relaxed text-fg-secondary" title={educationDisplay}>{educationDisplay}</p>}
        </div>
        <WishlistButton itemType="Tutor" itemId={tutorId} />
      </div>

      {(yearsExp > 0 || hasRating) && (
        <div className="mt-4 flex flex-wrap items-center gap-2 text-caption">
          {yearsExp > 0 && <span className="inline-flex items-center gap-1.5 py-1 text-fg-secondary"><Icon name="work_history" size="sm" />{yearsExp} năm kinh nghiệm</span>}
          {hasRating && <span className="inline-flex flex-wrap items-center gap-1.5 py-1 text-fg-secondary"><Icon name="star" size="xs" className="text-brand-secondary-500" filled /><strong className="font-semibold text-[rgb(var(--course-rating-strong))]">{formatRating(rating)}</strong><span>({reviewsCount} đánh giá)</span></span>}
        </div>
      )}

      {normalizedSubjects.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2" aria-label="Môn học">
          {normalizedSubjects.slice(0, 3).map(subject => <span key={subject} className="max-w-full rounded-lg border border-brand-primary-100 bg-brand-primary-50 px-2.5 py-1 text-caption font-medium text-brand-primary-700 break-words">{subject}</span>)}
          {normalizedSubjects.length > 3 && <span title={normalizedSubjects.slice(3).join(', ')} className="rounded-lg bg-neutral-100 px-2.5 py-1 text-caption text-fg-secondary">+{normalizedSubjects.length - 3} môn</span>}
        </div>
      )}

      {bio?.trim() && <p className="my-4 line-clamp-3 text-body-reg leading-relaxed text-fg-secondary">{bio.trim()}</p>}

      <div className="mt-auto pt-5">
        <div className="flex flex-wrap items-end justify-between gap-4 border-t border-border pt-4">
          <div className="min-w-0">
            <p className="text-caption text-fg-secondary">{packagePrice ? 'Gói học từ' : 'Thông tin gói học'}</p>
            {packagePrice ? <p className="mt-1 text-[22px] font-semibold text-fg"><Money value={packagePrice} /><span className="ml-1 text-caption font-normal text-fg-secondary">/ gói</span></p>
              : <p className="mt-1 text-body-reg font-medium text-fg">Xem trong hồ sơ</p>}
          </div>
          <Button as="span" aria-hidden="true" iconRight={<Icon name="arrow_forward" size="sm" />}>Xem hồ sơ</Button>
        </div>
      </div>
    </article>
  );
}

TutorCard.propTypes = {
  tutor: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    tutorProfileId: PropTypes.string,
    fullName: PropTypes.string, avatarUrl: PropTypes.string, bio: PropTypes.string,
    education: PropTypes.string, university: PropTypes.string, major: PropTypes.string,
    ratingAvg: PropTypes.number, rating: PropTypes.number, totalReviews: PropTypes.number,
    experienceYears: PropTypes.number, yearsOfExperience: PropTypes.number,
    subjects: PropTypes.array, minPrice: PropTypes.number, hourlyRate: PropTypes.number,
    isVerified: PropTypes.bool, isFeatured: PropTypes.bool,
  }).isRequired,
};
