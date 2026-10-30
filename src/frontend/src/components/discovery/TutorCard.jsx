import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import Icon from '@/components/ui/Icon';
import Avatar from '@/components/ui/Avatar';
import { formatRating } from '@/utils/marketplaceHelpers';

export default function TutorCard({ tutor = {} }) {
  const [isFavorite, setIsFavorite] = useState(false);
  const {
    id, fullName = 'Gia sư', avatarUrl, bio = '', education = '', university = '', major = '',
    experienceYears = 0, ratingAvg = 0, totalReviews = 0, subjects = [], minPrice = null,
    isVerified = false, isFeatured = false,
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
  const formattedPrice = useMemo(() => {
    if (!packagePrice || packagePrice <= 0) return null;
    return new Intl.NumberFormat('vi-VN').format(packagePrice);
  }, [packagePrice]);

  return (
    <article className={`mkt-card mkt-tutor-card group${isFeatured ? ' is-featured' : ''}`}>
      {/* Full-card clickable overlay — keeps card accessible and supports middle-click / new-tab */}
      <Link
        to={`/tutors/${id}`}
        aria-hidden="true"
        tabIndex={-1}
        className="absolute inset-0 z-10"
      />

      <div className="flex items-start gap-4">
        <Avatar src={avatarUrl} name={displayName} size="lg" className="mkt-tutor-avatar relative z-20" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <Link to={`/tutors/${id}`} className="mkt-tutor-name relative z-20" title={displayName}>{displayName}</Link>
                {isVerified && (
                  <Icon
                    name="verified"
                    size="sm"
                    className="shrink-0 text-blue-600"
                    label="Đã xác minh"
                  />
                )}
              </div>
              <p className="mt-1 truncate text-[12px] text-[color:var(--mkt-body)]" title={educationDisplay}>{educationDisplay}</p>
            </div>
            <button
              type="button"
              className="mkt-favorite relative z-20"
              aria-label={isFavorite ? 'Bỏ lưu gia sư' : 'Lưu gia sư'}
              aria-pressed={isFavorite}
              onClick={(e) => {
                e.stopPropagation();
                setIsFavorite((value) => !value);
              }}
            >
              <Icon name="favorite" size="sm" filled={isFavorite} />
            </button>
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[12px]">
            {hasRating ? (
              <span className="mkt-rating">
                <Icon name="star" size="xs" filled />
                <strong>{formatRating(rating)}</strong><span>({reviewsCount})</span>
              </span>
            ) : <span className="mkt-new-badge">Mới</span>}
            {yearsExp > 0 && <span className="mkt-experience"><Icon name="work_history" size="xs" /> {yearsExp} năm kinh nghiệm</span>}
          </div>

          {normalizedSubjects.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5" aria-label="Môn học">
              {normalizedSubjects.slice(0, 3).map((subject) => (
                <span key={subject} className="mkt-subject">{subject}</span>
              ))}
              {normalizedSubjects.length > 3 && (
                <span className="mkt-subject">+{normalizedSubjects.length - 3}</span>
              )}
            </div>
          )}
        </div>
      </div>

      <p className="mt-3.5 line-clamp-2 min-h-[44px] text-[13px] leading-[1.65] text-[color:var(--mkt-body)]">
        {bio?.trim() || 'Sẵn sàng thiết kế lộ trình học phù hợp với mục tiêu và nhịp độ riêng của bạn.'}
      </p>

      <div className="mt-5 flex items-end justify-between gap-4 border-t border-[color:var(--mkt-line)] pt-4">
        <div>
          <span className="block text-[11px] font-bold uppercase tracking-[0.08em] text-[color:var(--mkt-muted)]">Gói học từ</span>
          {formattedPrice ? (
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="mkt-tabular text-[19px] font-bold text-[color:var(--mkt-ink)]">
                {formattedPrice}₫
              </span>
              <span className="text-[12px] text-[color:var(--mkt-muted)]">/ gói</span>
            </div>
          ) : <span className="mt-1 block text-[13px] font-bold text-[color:var(--mkt-ink)]">Xem trong hồ sơ</span>}
        </div>
        <Link to={`/tutors/${id}`} className="mkt-card-cta relative z-20">
          <span>Xem hồ sơ</span>
          <Icon name="arrow_forward" size="sm" className="mkt-card-cta-arrow" />
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
    isVerified: PropTypes.bool, isFeatured: PropTypes.bool,
  }).isRequired,
};
