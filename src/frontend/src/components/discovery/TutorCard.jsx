import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import Icon from '@/components/ui/Icon';
import Avatar from '@/components/ui/Avatar';
import Money from '@/components/ui/Money';
import { formatRating } from '@/utils/marketplaceHelpers';
import { useWishlist } from '@/hooks/useWishlist';

export default function TutorCard({ tutor = {} }) {
  const { isFavorited, toggle } = useWishlist();
  const tutorId = tutor?.id || tutor?.tutorProfileId;
  const isFavorite = isFavorited('Tutor', tutorId);
  const {
    id, fullName = 'Gia sư', avatarUrl, bio = '', education = '', university = '', major = '',
    experienceYears = 0, ratingAvg = 0, totalReviews = 0, subjects = [], minPrice = null,
    isVerified = false,
  } = tutor;

  const displayName = fullName.trim() || 'Gia sư';
  const educationDisplay = useMemo(() => {
    if (major?.trim() && university?.trim()) return `${major.trim()} · ${university.trim()}`;
    return university?.trim() || major?.trim() || education?.trim() || 'Gia sư độc lập';
  }, [major, university, education]);
  const normalizedSubjects = useMemo(() => subjects
    .map((subject) => typeof subject === 'string' ? subject : subject?.name ?? subject?.subjectName)
    .filter(Boolean), [subjects]);

  const rating = Number(ratingAvg ?? tutor.rating ?? 0);
  const reviewsCount = Number(totalReviews ?? 0);
  const yearsExp = Number(experienceYears ?? tutor.yearsOfExperience ?? 0);
  const packagePrice = minPrice != null ? Number(minPrice) : Number(tutor.hourlyRate ?? 0);
  const hasRating = reviewsCount > 0 && rating > 0;

  return (
    <article className="mkt-card mkt-tutor-card group">
      <div className="mkt-card-topline" aria-hidden="true" />
      <div className="flex items-start gap-4">
        <Avatar src={avatarUrl} name={displayName} size="lg" className="mkt-tutor-avatar" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <Link to={`/tutors/${id}`} className="mkt-tutor-name" title={displayName}>{displayName}</Link>
                {isVerified && (
                  <Icon
                    name="verified"
                    size="xs"
                    strokeWidth={1.8}
                    className="h-[15px] w-[15px] shrink-0 text-[color:var(--mkt-green)]"
                    label="Đã xác minh"
                  />
                )}
              </div>
              <p className="mt-1 truncate text-[12px] text-[color:var(--mkt-body)]" title={educationDisplay}>{educationDisplay}</p>
            </div>
            <button
              type="button"
              className="mkt-favorite"
              aria-label={isFavorite ? 'Bỏ lưu gia sư' : 'Lưu gia sư'}
              aria-pressed={isFavorite}
              onClick={() => toggle('Tutor', tutorId)}
            >
              <Icon name="favorite" size="sm" filled={isFavorite} />
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px]">
            {hasRating ? (
              <span className="mkt-rating">
                <Icon name="star" size="xs" filled />
                <strong>{formatRating(rating)}</strong><span>({reviewsCount})</span>
              </span>
            ) : <span className="mkt-new-badge">Mới</span>}
            {yearsExp > 0 && <span className="mkt-experience"><Icon name="work_history" size="xs" /> {yearsExp} năm kinh nghiệm</span>}
          </div>
        </div>
      </div>

      <div className="mt-5 flex min-h-[30px] flex-wrap gap-2" aria-label="Môn học">
        {normalizedSubjects.slice(0, 3).map((subject) => <span key={subject} className="mkt-subject">{subject}</span>)}
        {normalizedSubjects.length > 3 && <span className="mkt-subject">+{normalizedSubjects.length - 3}</span>}
      </div>

      <p className="mt-4 line-clamp-2 min-h-[44px] text-[13px] leading-[1.65] text-[color:var(--mkt-body)]">
        {bio?.trim() || 'Sẵn sàng thiết kế lộ trình học phù hợp với mục tiêu và nhịp độ riêng của bạn.'}
      </p>

      <div className="mt-6 flex items-end justify-between gap-4 border-t border-[color:var(--mkt-line)] pt-5">
        <div>
          <span className="block text-[12px] font-bold uppercase tracking-[0.08em] text-[color:var(--mkt-muted)]">Gói học từ</span>
          {packagePrice > 0 ? (
            <div className="mt-1 flex items-baseline gap-1.5">
              <Money value={packagePrice} className="mkt-tabular text-[19px] font-extrabold text-[color:var(--mkt-ink)]" />
              <span className="text-[12px] text-[color:var(--mkt-muted)]">/ gói</span>
            </div>
          ) : <span className="mt-1 block text-[13px] font-bold">Xem trong hồ sơ</span>}
        </div>
        <Link to={`/tutors/${id}`} className="mkt-card-cta">
          Xem hồ sơ <Icon name="arrow_forward" size="sm" />
        </Link>
      </div>
    </article>
  );
}

TutorCard.propTypes = {
  tutor: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    fullName: PropTypes.string, avatarUrl: PropTypes.string, bio: PropTypes.string,
    education: PropTypes.string, university: PropTypes.string, major: PropTypes.string,
    ratingAvg: PropTypes.number, rating: PropTypes.number, totalReviews: PropTypes.number,
    experienceYears: PropTypes.number, yearsOfExperience: PropTypes.number,
    subjects: PropTypes.array, minPrice: PropTypes.number, hourlyRate: PropTypes.number,
    isVerified: PropTypes.bool,
  }).isRequired,
};
