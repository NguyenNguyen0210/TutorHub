import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import Icon from '@/components/ui/Icon';
import Avatar from '@/components/ui/Avatar';
import { IconButton } from '@/components/ui/Button';
import Money from '@/components/ui/Money';
import { formatRating } from '@/utils/marketplaceHelpers';

export default function TutorCard({ tutor = {} }) {
  const [isFavorite, setIsFavorite] = useState(false);

  const {
    id,
    fullName = 'Gia sư',
    avatarUrl,
    bio = '',
    education = '',
    university = '',
    major = '',
    experienceYears = 0,
    ratingAvg = 0,
    totalReviews = 0,
    subjects = [],
    minPrice = null,
    isVerified = false,
  } = tutor;

  const displayName = (fullName || '').trim() || 'Gia sư';

  const educationDisplay = useMemo(() => {
    const trimmedMajor = major?.trim();
    const trimmedUni = university?.trim();
    if (trimmedMajor && trimmedUni) return `${trimmedMajor} · ${trimmedUni}`;
    if (trimmedUni) return trimmedUni;
    if (trimmedMajor) return trimmedMajor;
    if (education?.trim()) return education.trim();
    return null;
  }, [major, university, education]);

  const normalizedSubjects = useMemo(() => {
    return (subjects || [])
      .map((s) => (typeof s === 'string' ? s : s?.name ?? s?.subjectName))
      .filter(Boolean);
  }, [subjects]);

  const rating = Number(ratingAvg ?? tutor.rating ?? 0);
  const reviewsCount = Number(totalReviews ?? 0);
  const yearsExp = Number(experienceYears ?? tutor.yearsOfExperience ?? 0);
  const packagePrice =
    minPrice != null
      ? Number(minPrice)
      : tutor.hourlyRate != null
      ? Number(tutor.hourlyRate)
      : null;

  const visibleSubjects = normalizedSubjects.slice(0, 3);
  const extraSubjects = normalizedSubjects.length - visibleSubjects.length;
  const hasRating = reviewsCount > 0 && Number.isFinite(rating) && rating > 0;

  return (
    <article className="mkt-card group flex h-full flex-col overflow-hidden">
      <div className="flex flex-1 flex-col p-4 pl-5 sm:p-5 sm:pl-6">
        <div className="flex items-start gap-3">
          <Avatar
            src={avatarUrl}
            name={displayName}
            size="md"
            className="h-[42px] w-[42px] shrink-0 ring-1 ring-neutral-200/80 sm:h-12 sm:w-12"
          />

          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-1.5">
              <Link
                to={`/tutors/${id}`}
                className="truncate text-[13.5px] font-extrabold tracking-[-0.02em] text-[color:var(--mkt-ink)] transition-colors hover:text-[color:var(--mkt-cobalt)] sm:text-[15px]"
                title={displayName}
              >
                {displayName}
              </Link>
              {isVerified && (
                <Icon
                  name="verified"
                  size="xs"
                  filled
                  strokeWidth={1.7}
                  className="h-3.5 w-3.5 shrink-0 text-[color:var(--mkt-green)]"
                  label="Đã xác minh"
                />
              )}
            </div>

            {educationDisplay && (
              <p
                className="mt-0.5 truncate text-[10.5px] text-[color:var(--mkt-body)] sm:text-[11px]"
                title={educationDisplay}
              >
                {educationDisplay}
              </p>
            )}

            <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[10.5px] text-[color:var(--mkt-body)]">
              {hasRating ? (
                <span className="inline-flex items-center gap-1">
                  <Icon
                    name="star"
                    size="xs"
                    filled
                    strokeWidth={1.7}
                    className="h-3 w-3 text-[color:var(--mkt-amber)]"
                  />
                  <strong className="mkt-tabular font-bold text-[color:var(--mkt-ink)]">
                    {formatRating(rating)}
                  </strong>
                  <span>({reviewsCount} đánh giá)</span>
                </span>
              ) : (
                <span className="rounded-full border border-[color:var(--mkt-line)] bg-[color:var(--mkt-canvas)] px-2 py-0.5 text-[9.5px] font-semibold text-[color:var(--mkt-muted)]">
                  Chưa có đánh giá
                </span>
              )}
              {yearsExp > 0 && (
                <span className="inline-flex items-center gap-1">
                  <span aria-hidden="true" className="text-[color:var(--mkt-line)]">
                    ·
                  </span>
                  <span>{yearsExp} năm</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {visibleSubjects.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1" aria-label="Môn học">
            {visibleSubjects.map((subject) => (
              <span
                key={subject}
                className="border-b border-[color:var(--mkt-line)] pb-0.5 text-[10.5px] font-semibold text-[color:var(--mkt-body)]"
              >
                {subject}
              </span>
            ))}
            {extraSubjects > 0 && (
              <span className="text-[10px] font-medium text-[color:var(--mkt-muted)]">
                +{extraSubjects} môn
              </span>
            )}
          </div>
        )}

        {bio?.trim() && (
          <p
            className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-[color:var(--mkt-body)]"
            title={bio.trim()}
          >
            {bio.trim()}
          </p>
        )}

        <div className="mt-auto border-t border-[color:var(--mkt-line)] pt-3">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="mkt-mono text-[7.5px] font-semibold uppercase tracking-[0.12em] text-[color:var(--mkt-muted)]">
                Giá gói từ
              </p>
              {packagePrice && packagePrice > 0 ? (
                <div className="mt-0.5 flex items-baseline gap-1">
                  <Money
                    value={packagePrice}
                    className="mkt-tabular text-[16px] font-extrabold text-[color:var(--mkt-ink)]"
                  />
                  <span className="text-[8.5px] font-medium text-[color:var(--mkt-muted)]">
                    / gói học
                  </span>
                </div>
              ) : (
                <p className="mt-0.5 text-[11px] font-semibold text-[color:var(--mkt-body)]">
                  Xem chi tiết hồ sơ
                </p>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Link
                to={`/tutors/${id}`}
                className="mkt-btn-primary h-11 min-h-11 px-3 text-[11px] sm:h-9 sm:min-h-9 sm:px-3"
              >
                <span>Xem hồ sơ</span>
                <Icon name="arrow_forward" size="xs" strokeWidth={1.7} />
              </Link>

              <IconButton
                label={isFavorite ? 'Bỏ lưu gia sư' : 'Lưu gia sư'}
                variant="ghost"
                size="sm"
                onClick={() => setIsFavorite((v) => !v)}
                className="h-11 w-11 min-h-11 sm:h-9 sm:w-9 sm:min-h-9"
                icon={
                  <Icon
                    name="favorite"
                    size="xs"
                    filled={isFavorite}
                    strokeWidth={1.7}
                    className={
                      isFavorite
                        ? 'h-4 w-4 text-[color:var(--mkt-danger)]'
                        : 'h-4 w-4 text-[color:var(--mkt-muted)]'
                    }
                  />
                }
              />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

TutorCard.propTypes = {
  tutor: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    fullName: PropTypes.string,
    avatarUrl: PropTypes.string,
    bio: PropTypes.string,
    education: PropTypes.string,
    university: PropTypes.string,
    major: PropTypes.string,
    degreeLevel: PropTypes.string,
    ratingAvg: PropTypes.number,
    rating: PropTypes.number,
    totalReviews: PropTypes.number,
    experienceYears: PropTypes.number,
    yearsOfExperience: PropTypes.number,
    subjects: PropTypes.array,
    minPrice: PropTypes.number,
    hourlyRate: PropTypes.number,
    isVerified: PropTypes.bool,
  }).isRequired,
};
