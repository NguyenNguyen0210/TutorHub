import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import Icon from '@/components/ui/Icon';
import Avatar from '@/components/ui/Avatar';
import Button, { IconButton } from '@/components/ui/Button';
import Money from '@/components/ui/Money';

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

  // Fallback học vấn thông minh: Major · University -> University -> Major -> Education
  const educationDisplay = useMemo(() => {
    const trimmedMajor = major?.trim();
    const trimmedUni = university?.trim();
    if (trimmedMajor && trimmedUni) return `${trimmedMajor} · ${trimmedUni}`;
    if (trimmedUni) return trimmedUni;
    if (trimmedMajor) return trimmedMajor;
    if (education?.trim()) return education.trim();
    return null;
  }, [major, university, education]);

  // Chuẩn hóa danh sách môn học
  const normalizedSubjects = useMemo(() => {
    return (subjects || [])
      .map((s) => (typeof s === 'string' ? s : s?.name ?? s?.subjectName))
      .filter(Boolean);
  }, [subjects]);

  // Chuẩn hóa số liệu an toàn
  const rating = Number(ratingAvg ?? tutor.rating ?? 0);
  const reviewsCount = Number(totalReviews ?? 0);
  const yearsExp = Number(experienceYears ?? tutor.yearsOfExperience ?? 0);
  const packagePrice =
    minPrice != null
      ? Number(minPrice)
      : tutor.hourlyRate != null
      ? Number(tutor.hourlyRate)
      : null;

  return (
    <article className="group relative flex h-full flex-col justify-between overflow-hidden rounded-brand-lg border border-border bg-surface transition-[border-color,box-shadow,transform] duration-normal ease-standard hover:-translate-y-0.5 hover:border-brand-primary-300 hover:shadow-brand-md">
      <div className="h-1 bg-brand-primary-600" aria-hidden="true" />

      <div className="flex flex-1 flex-col justify-between p-5 space-y-4">
        <div className="space-y-3.5">
          {/* Tầng 1: Header - Avatar + Tên + Badge Xác minh + Học vấn + Đánh giá & Kinh nghiệm */}
          <div className="flex items-start gap-3.5">
            <Avatar
              src={avatarUrl}
              name={displayName}
              size="md"
              className="h-16 w-16 shrink-0 ring-1 ring-neutral-200/80"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <Link
                  to={`/tutors/${id}`}
                  className="truncate text-[17px] font-bold leading-snug text-neutral-900 transition-colors hover:text-brand-primary-600"
                  title={displayName}
                >
                  {displayName}
                </Link>
                {isVerified && (
                  <span
                    className="inline-flex shrink-0 items-center text-success-strong"
                    title="Đã xác minh"
                  >
                    <Icon
                      name="verified"
                      size="xs"
                      filled
                      className="h-4 w-4"
                      label="Đã xác minh"
                    />
                  </span>
                )}
              </div>

              {educationDisplay && (
                <p
                  className="mt-1 flex items-center gap-1.5 text-[12.5px] text-neutral-600 truncate"
                  title={educationDisplay}
                >
                  <Icon name="school" size="xs" className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                  <span className="truncate">{educationDisplay}</span>
                </p>
              )}

              <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[12.5px] text-neutral-600">
                {reviewsCount > 0 ? (
                  <span className="flex items-center gap-1 font-bold text-neutral-900">
                    <Icon
                      name="star"
                      size="xs"
                      filled
                      className="h-3.5 w-3.5 text-brand-secondary-500 shrink-0"
                    />
                    <span>{rating.toFixed(1)}</span>
                    <span className="font-normal text-neutral-500">({reviewsCount} đánh giá)</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
                    Chưa có đánh giá
                  </span>
                )}
                {yearsExp > 0 && (
                  <span className="flex items-center gap-1 text-neutral-600">
                    <span className="text-neutral-300">·</span>
                    <span>{yearsExp} năm kinh nghiệm</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Tầng 2: Môn học chuyên môn */}
          {normalizedSubjects.length > 0 && (
            <div className="flex flex-wrap gap-1.5" aria-label="Môn học">
              {normalizedSubjects.slice(0, 2).map((subject) => (
                <span
                  key={subject}
                  className="rounded-brand-sm bg-brand-primary-50 px-2.5 py-1 text-[12px] font-semibold text-brand-primary-700"
                >
                  {subject}
                </span>
              ))}
              {normalizedSubjects.length > 2 && (
                <span className="rounded-brand-sm bg-neutral-100 px-2 py-1 text-[12px] font-semibold text-neutral-600">
                  +{normalizedSubjects.length - 2} môn
                </span>
              )}
            </div>
          )}

          {/* Tầng 3: Trích đoạn giới thiệu (Bio) */}
          {bio?.trim() && (
            <p
              className="line-clamp-2 text-[13px] leading-relaxed text-neutral-600 min-h-[38px]"
              title={bio.trim()}
            >
              &ldquo;{bio.trim()}&rdquo;
            </p>
          )}
        </div>

        {/* Tầng 4: Học phí gói & Nút hành động */}
        <div className="space-y-3 border-t border-border pt-3.5 mt-auto">
          <div>
            <p className="text-[11.5px] font-semibold uppercase tracking-wider text-neutral-500">
              Giá gói từ
            </p>
            {packagePrice && packagePrice > 0 ? (
              <div className="mt-0.5 flex items-baseline gap-1">
                <Money value={packagePrice} className="text-[19px] font-bold text-neutral-900" />
                <span className="text-[12px] text-neutral-500">/ gói học</span>
              </div>
            ) : (
              <p className="mt-0.5 text-[13.5px] font-semibold text-neutral-700">
                Xem chi tiết hồ sơ
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              as={Link}
              to={`/tutors/${id}`}
              variant="primary"
              size="md"
              className="flex-1 justify-center"
            >
              <span>Xem hồ sơ</span>
              <Icon name="arrow_forward" size="xs" className="h-3 w-3" />
            </Button>

            <IconButton
              label={isFavorite ? 'Bỏ lưu gia sư' : 'Lưu gia sư'}
              variant="ghost"
              size="md"
              onClick={() => setIsFavorite((v) => !v)}
              icon={
                <Icon
                  name="favorite"
                  size="xs"
                  filled={isFavorite}
                  className={isFavorite ? 'text-danger w-4 h-4' : 'text-neutral-400 w-4 h-4'}
                />
              }
            />
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
