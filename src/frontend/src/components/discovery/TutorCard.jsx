import React, { useState } from 'react';
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
    totalReviews = 0,
    subjects = [],
    isVerified = false,
  } = tutor;

  const displayName = (fullName || '').trim() || 'Gia sư';

  // Map real backend fields safely
  const rating = Number(tutor.ratingAvg ?? tutor.rating ?? 0);
  const yearsOfExperience = Number(tutor.experienceYears ?? tutor.yearsOfExperience ?? 0);
  const hourlyRate = Number(tutor.minPrice ?? tutor.hourlyRate ?? 0);
  const normalizedSubjects = subjects
    .map((subject) =>
      typeof subject === 'string' ? subject : subject?.name ?? subject?.subjectName
    )
    .filter(Boolean);

  // Teaching modes normalization (single-line label, mirror ServiceCard)
  const modes = Array.isArray(tutor.teachingModes)
    ? tutor.teachingModes
    : tutor.teachingMode
    ? [tutor.teachingMode]
    : ['Online'];
  let modeLabel = 'Online';
  let modeIcon = 'videocam';
  if (modes.includes('Both') || modes.includes('Hybrid')) {
    modeLabel = 'Online hoặc tại nhà';
    modeIcon = 'devices';
  } else if (modes.includes('InPerson') || modes.includes('Offline')) {
    modeLabel = 'Tại nhà';
    modeIcon = 'home';
  }

  return (
    <article className="group relative flex flex-col justify-between bg-surface rounded-brand-lg border border-border hover:shadow-brand-md hover:border-brand-primary-300 hover:-translate-y-0.5 transition-[border-color,box-shadow,transform] duration-normal ease-standard overflow-hidden">
      <div className="h-1 bg-brand-primary-600" aria-hidden="true" />
      <div className="p-5 flex-1 flex flex-col justify-between space-y-5">
        <div className="space-y-4">
          {/* Hàng 1: avatar thật + tên + tick xác thực + chip môn chính */}
          <div className="flex items-center gap-3">
            <Avatar
              src={avatarUrl}
              name={displayName}
              size="md"
            className="h-16 w-16 ring-1 ring-neutral-200/80"
            />
            <div className="min-w-0 flex-1">
              <Link
                to={`/tutors/${id}`}
                className="block truncate text-[18px] font-bold leading-snug text-neutral-900 transition-colors hover:text-brand-primary-600"
                title={displayName}
              >
                {displayName}
              </Link>
              {isVerified && (
                <span
                  className="mt-1 inline-flex items-center gap-1 text-[12px] font-semibold text-success-strong"
                  title="Gia sư đã được xác thực"
                >
                  <Icon name="verified" size="xs" filled className="h-4 w-4" />
                  <span>Đã xác minh</span>
                </span>
              )}
            </div>
          </div>

          {normalizedSubjects.length > 0 && (
            <div className="flex flex-wrap gap-2" aria-label="Môn học">
              {normalizedSubjects.slice(0, 2).map((subject) => (
                <span
                  key={subject}
                  className="rounded-brand-sm bg-brand-primary-50 px-2.5 py-1 text-[13px] font-semibold text-brand-primary-700"
                >
                  {subject}
                </span>
              ))}
              {normalizedSubjects.length > 2 && (
                <span className="rounded-brand-sm bg-neutral-100 px-2.5 py-1 text-[13px] font-semibold text-neutral-600">
                  +{normalizedSubjects.length - 2} môn
                </span>
              )}
            </div>
          )}

          {/* Hàng 2: sao + đánh giá + năm kinh nghiệm (thiếu trường nào ẩn đoạn đó) */}
          <div className="flex flex-wrap items-center gap-1.5 text-[14px] text-neutral-600">
            <span className="flex items-center gap-1 font-bold text-neutral-900">
              <Icon name="star" size="xs" filled className="h-4 w-4 text-brand-secondary-500" />
              <span>{rating > 0 ? rating.toFixed(1) : 'Mới'}</span>
            </span>
            {totalReviews > 0 && (
              <span className="flex items-center gap-1.5">
                <span className="text-neutral-300">·</span>
                <span>{totalReviews} đánh giá</span>
              </span>
            )}
            {yearsOfExperience > 0 && (
              <span className="flex items-center gap-1.5">
                <span className="text-neutral-300">·</span>
                <span>{yearsOfExperience} năm kinh nghiệm</span>
              </span>
            )}
          </div>

          {/* Hàng 3: hình thức học và học phí, ưu tiên khả năng so sánh nhanh. */}
          <div className="space-y-3 border-y border-border py-4 text-[14px]">
            <div className="flex items-center gap-2 text-neutral-700">
              <Icon name={modeIcon} size="sm" className="shrink-0 text-brand-primary-600" />
              <span>{modeLabel}</span>
            </div>
            <div>
              <p className="text-[12px] font-semibold text-neutral-500">Học phí từ</p>
              {hourlyRate > 0 ? (
                <div className="mt-0.5 flex items-baseline gap-1">
                  <Money value={hourlyRate} className="text-[20px] font-bold text-neutral-900" />
                  <span className="text-[13px] text-neutral-500">/ buổi</span>
                </div>
              ) : (
                <p className="mt-0.5 font-semibold text-neutral-700">Xem trong hồ sơ</p>
              )}
            </div>
          </div>
        </div>

        {/* Hàng 4: CTA Xem hồ sơ (primary) + tim lưu (ghost) */}
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
    </article>
  );
}

TutorCard.propTypes = {
  tutor: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    fullName: PropTypes.string,
    avatarUrl: PropTypes.string,
    ratingAvg: PropTypes.number,
    rating: PropTypes.number,
    totalReviews: PropTypes.number,
    experienceYears: PropTypes.number,
    yearsOfExperience: PropTypes.number,
    subjects: PropTypes.array,
    minPrice: PropTypes.number,
    hourlyRate: PropTypes.number,
    isVerified: PropTypes.bool,
    teachingMode: PropTypes.string,
    teachingModes: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
};
