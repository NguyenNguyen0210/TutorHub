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
  const rawMainSubject = subjects[0];
  const mainSubject =
    typeof rawMainSubject === 'string'
      ? rawMainSubject
      : rawMainSubject?.name ?? rawMainSubject?.subjectName ?? '';

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
              className="w-14 h-14 ring-1 ring-neutral-200/80"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <Link
                  to={`/tutors/${id}`}
                  className="text-[16px] font-bold text-neutral-900 hover:text-brand-primary-600 transition-colors truncate"
                  title={displayName}
                >
                  {displayName}
                </Link>
                {isVerified && (
                  <span
                    className="text-success shrink-0 inline-flex items-center"
                    title="Gia sư đã được xác thực"
                  >
                    <Icon name="verified" size="xs" filled className="text-success w-4 h-4" />
                    <span className="sr-only">Gia sư đã được xác thực</span>
                  </span>
                )}
              </div>
              {mainSubject ? (
                <span
                  className="inline-block mt-1 text-[12px] font-medium text-brand-primary-700 truncate max-w-full"
                  title={mainSubject}
                >
                  {mainSubject}
                </span>
              ) : null}
            </div>
          </div>

          {/* Hàng 2: sao + đánh giá + năm kinh nghiệm (thiếu trường nào ẩn đoạn đó) */}
          <div className="flex flex-wrap items-center gap-1.5 text-[12px] text-neutral-500">
            <span className="flex items-center text-brand-primary-700 font-bold gap-0.5">
              <Icon name="star" size="xs" filled className="text-brand-primary-600 w-3.5 h-3.5" />
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

          {/* Hàng 3: meta 2 dòng — học phí/buổi + hình thức (thiếu giá ẩn dòng giá) */}
          <div className="space-y-2 py-4 border-y border-border text-[12px]">
            {hourlyRate > 0 && (
              <div className="flex items-center gap-1.5 font-medium text-neutral-700">
                <Icon name="schedule" size="xs" className="text-brand-primary-600 w-3.5 h-3.5 shrink-0" />
                <span>
                  Học phí <Money value={hourlyRate} className="font-bold text-neutral-900" />
                  /buổi
                </span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-neutral-500">
              <Icon name={modeIcon} size="xs" className="text-fg-muted w-3.5 h-3.5 shrink-0" />
              <span>{modeLabel}</span>
            </div>
          </div>
        </div>

        {/* Hàng 4: CTA Xem hồ sơ (primary) + tim lưu (ghost) */}
        <div className="flex items-center justify-between gap-2">
          <Button
            as={Link}
            to={`/tutors/${id}`}
            variant="primary"
            size="md"
            className="gap-1"
          >
            <span>Xem hồ sơ</span>
            <Icon name="arrow_forward" size="xs" className="w-3 h-3" />
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
