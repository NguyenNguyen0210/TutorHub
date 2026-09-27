import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';
import Icon from '@/components/ui/Icon';
import Avatar from '@/components/ui/Avatar';
import { formatVND } from '@/utils/formatters';

export default function TutorCard({ tutor, onMessageClick }) {
  const [isFavorite, setIsFavorite] = useState(false);

  const {
    id,
    fullName = 'Gia sư',
    avatarUrl,
    bio = '',
    education = '',
    address = '',
    totalReviews = 0,
    subjects = [],
    isVerified = false,
  } = tutor;

  // Map real backend fields safely
  const rating = Number(tutor.ratingAvg ?? tutor.rating ?? 0);
  const yearsOfExperience = Number(tutor.experienceYears ?? tutor.yearsOfExperience ?? 0);
  const hourlyRate = tutor.minPrice ?? tutor.hourlyRate ?? 0;
  const headline = education || tutor.headline || 'Gia sư chuyên môn';
  const secondaryLocation = address || tutor.university || '';

  // Teaching modes normalization
  const modes = Array.isArray(tutor.teachingModes)
    ? tutor.teachingModes
    : tutor.teachingMode
    ? [tutor.teachingMode]
    : ['Online'];

  return (
    <article className="group bg-surface rounded-[20px] border border-neutral-200/80 hover:border-brand-primary-300 hover:shadow-brand-md transition-all duration-200 flex flex-col justify-between p-5 relative">
      <div>
        {/* 1. Header: Avatar (48px) + Name ✓ + Headline (chuyên môn / trường) + Bookmark */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Avatar with online indicator */}
            <div className="relative shrink-0">
              <Avatar
                src={avatarUrl}
                name={fullName}
                size="md"
                className="w-12 h-12 ring-1 ring-neutral-200/80"
              />
              <span
                className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success border-2 border-white rounded-full"
                title="Đang hoạt động"
                aria-label="Đang hoạt động"
              />
            </div>

            {/* Name + Verified + Headline (Address completely removed per specification) */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <Link
                  to={`/tutors/${id}`}
                  className="font-semibold text-[16px] text-neutral-900 hover:text-brand-primary-600 transition-colors truncate"
                  title={fullName}
                >
                  {fullName}
                </Link>

                {isVerified && (
                  <span
                    className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-success text-white shrink-0"
                    title="Gia sư đã xác thực bằng cấp & hồ sơ"
                  >
                    <svg
                      className="w-2.5 h-2.5 fill-current"
                      viewBox="0 0 20 20"
                      aria-hidden="true"
                    >
                      <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                    </svg>
                  </span>
                )}
              </div>

              <p className="text-[13px] text-neutral-500 truncate leading-snug mt-0.5" title={headline}>
                {headline}
              </p>
            </div>
          </div>

          {/* Favorite heart button */}
          <button
            type="button"
            onClick={() => setIsFavorite(!isFavorite)}
            className="p-1.5 rounded-full text-neutral-400 hover:text-danger hover:bg-danger-subtle transition-colors cursor-pointer shrink-0 -mr-1"
            aria-label={isFavorite ? 'Xóa khỏi yêu thích' : 'Lưu vào yêu thích'}
          >
            <Icon
              name="favorite"
              size="sm"
              className={cn(isFavorite ? 'text-danger fill-danger' : 'text-neutral-400')}
            />
          </button>
        </div>

        {/* 1b. Application Badges (Degree, University, Certifications, Achievements) */}
        {(tutor.university || tutor.degreeLevel || tutor.certifications || tutor.achievements) && (
          <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
            {(tutor.degreeLevel || tutor.university) && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-brand-primary-50 text-brand-primary-700 border border-brand-primary-100" title={`${tutor.degreeLevel || ''} - ${tutor.university || ''}`}>
                <Icon name="school" size="xs" className="w-3 h-3 text-brand-primary-600" />
                <span className="truncate max-w-[200px]">
                  {tutor.degreeLevel ? `${tutor.degreeLevel} · ` : ''}{tutor.university || ''}
                </span>
              </span>
            )}
            {tutor.certifications && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-success-subtle text-success-strong border border-success/20">
                <Icon name="verified" size="xs" className="w-3 h-3 text-success-strong" />
                <span>{tutor.certifications.split(',')[0].trim()}</span>
              </span>
            )}
            {tutor.achievements && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-brand-secondary-50 text-brand-secondary-700 border border-brand-secondary-100">
                <Icon name="emoji_events" size="xs" className="w-3 h-3 text-brand-secondary-600" />
                <span className="truncate max-w-[150px]">{tutor.achievements.split(',')[0].trim()}</span>
              </span>
            )}
          </div>
        )}

        {/* 2. Rating & Experience: ★ 5.0 · 155 đánh giá · 6 năm kinh nghiệm */}
        <div className="flex items-center gap-1.5 mt-3 text-[13px] text-neutral-600 whitespace-nowrap overflow-hidden">
          <span className="flex items-center gap-1 text-brand-secondary-500 font-bold shrink-0">
            <Icon name="star" size="xs" className="fill-brand-secondary-400 text-brand-secondary-400 w-4 h-4" />
            <span>{rating > 0 ? rating.toFixed(1) : '5.0'}</span>
            {totalReviews > 0 ? (
              <span className="text-neutral-400 font-normal">({totalReviews} đánh giá)</span>
            ) : (
              <span className="text-neutral-400 font-normal">(Mới)</span>
            )}
          </span>

          <span className="text-neutral-300 shrink-0">·</span>

          <span className="font-medium text-neutral-600 shrink-0 truncate">
            {yearsOfExperience > 0 ? `${yearsOfExperience} năm kinh nghiệm` : 'Gia sư nhiệt huyết'}
          </span>
        </div>

        {/* 3. Description: Tối đa 2 dòng, text 13-14px */}
        <p className="text-[13.5px] text-neutral-600 line-clamp-2 mt-2.5 leading-relaxed min-h-[40px]">
          {bio || 'Gia sư tận tâm, phương pháp giảng dạy hiện đại, hỗ trợ học viên đạt kết quả tốt nhất.'}
        </p>

        {/* 4. Subject Tags */}
        <div className="flex flex-wrap items-center gap-1.5 mt-3">
          {subjects.slice(0, 2).map((subject, idx) => (
            <span
              key={idx}
              className="px-2.5 py-0.5 rounded-md bg-neutral-100 text-neutral-700 text-[12px] font-medium"
            >
              {typeof subject === 'string' ? subject : subject.name ?? subject.subjectName}
            </span>
          ))}

          {subjects.length > 2 && (
            <span className="px-2 py-0.5 rounded-md bg-brand-primary-50 text-brand-primary-600 text-[11px] font-semibold">
              +{subjects.length - 2}
            </span>
          )}

          {subjects.length === 0 && (
            <span className="text-[12px] text-neutral-400 italic">Đa môn học</span>
          )}
        </div>

        {/* 5. Teaching Modes: Online · Tại nhà */}
        <div className="flex items-center gap-3 mt-2.5 text-[12px] text-neutral-500 font-medium">
          {(modes.includes('Online') || modes.includes('Hybrid') || modes.includes('Both') || modes.length === 0) && (
            <span className="flex items-center gap-1">
              <Icon name="laptop_chromebook" size="xs" className="text-neutral-400 w-3.5 h-3.5" />
              Online
            </span>
          )}
          {(modes.includes('InPerson') || modes.includes('Offline') || modes.includes('Hybrid') || modes.includes('Both')) && (
            <span className="flex items-center gap-1">
              <Icon name="home" size="xs" className="text-neutral-400 w-3.5 h-3.5" />
              Tại nhà
            </span>
          )}
        </div>
      </div>

      {/* 6 & 7. Footer: Giá (dùng màu chữ chính `text-fg`, không dùng green) + [Nhắn tin] [Xem hồ sơ →] */}
      <div className="pt-3.5 mt-3.5 border-t border-neutral-100 flex items-center justify-between gap-2">
        <div className="shrink-0 min-w-0">
          <span className="text-[11px] text-neutral-400 block leading-tight font-medium">
            Từ
          </span>
          <div className="text-[16px] font-bold text-fg font-mono tracking-tight leading-tight mt-0.5">
            {hourlyRate > 0 ? (
              formatVND(hourlyRate)
            ) : (
              <span className="text-[14px] font-semibold text-neutral-700 font-sans">Thỏa thuận</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onMessageClick && onMessageClick(tutor)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[8px] border border-neutral-200 text-neutral-700 hover:text-neutral-900 hover:bg-neutral-50 text-[12.5px] font-medium whitespace-nowrap cursor-pointer transition-colors"
          >
            <Icon name="chat" size="xs" className="w-3.5 h-3.5 text-neutral-500" />
            <span>Nhắn tin</span>
          </button>

          <Link
            to={`/tutors/${id}`}
            className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-[8px] bg-brand-primary-600 hover:bg-brand-primary-700 active:bg-brand-primary-800 text-white text-[12.5px] font-medium whitespace-nowrap cursor-pointer transition-colors shadow-sm"
          >
            <span>Xem hồ sơ</span>
            <Icon name="arrow_forward" size="xs" className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}

TutorCard.propTypes = {
  tutor: PropTypes.shape({
    id: PropTypes.string.isRequired,
    fullName: PropTypes.string,
    avatarUrl: PropTypes.string,
    headline: PropTypes.string,
    education: PropTypes.string,
    address: PropTypes.string,
    ratingAvg: PropTypes.number,
    rating: PropTypes.number,
    totalReviews: PropTypes.number,
    experienceYears: PropTypes.number,
    yearsOfExperience: PropTypes.number,
    bio: PropTypes.string,
    subjects: PropTypes.array,
    minPrice: PropTypes.number,
    hourlyRate: PropTypes.number,
    isVerified: PropTypes.bool,
    teachingMode: PropTypes.string,
    teachingModes: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
  onMessageClick: PropTypes.func,
};
