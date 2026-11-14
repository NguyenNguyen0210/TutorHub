import ApprovedProfileBadge from '@/components/discovery/ApprovedProfileBadge';
import { reviewSummary } from '@/utils/reviewSummary';
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Badge, { Tag } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';
import { useWishlist } from '@/hooks/useWishlist';

/**
 * ProfileHeadline — Khối thông tin cốt lõi của gia sư (Hero Card).
 *
 * Tích hợp ảnh đại diện tiêu chuẩn 140px–160px sắc nét cạnh họ tên,
 * biểu tượng hồ sơ đã phê duyệt, điểm đánh giá với ngôi sao vàng đặc
 * và các thông tin uy tín được trình bày mạch lạc, không trùng lặp.
 */
export default function ProfileHeadline({ tutor }) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const [imgError, setImgError] = useState(false);
  const { isFavorited, toggle } = useWishlist();

  const tutorId = tutor?.id || tutor?.tutorProfileId;
  const isFavorite = isFavorited('Tutor', tutorId);

  const services = Array.isArray(tutor.services) ? tutor.services : [];
  const subjects = Array.isArray(tutor.subjects) ? tutor.subjects : [];
  const { rating: ratingValue, hasRating } = reviewSummary(tutor.ratingAvg, tutor.totalReviews);
  const accepting = services.length > 0;
  const avatarUrl = tutor.avatarUrl;
  const hasAvatar = Boolean(avatarUrl) && !imgError;
  const isVerified = Boolean(tutor.isVerified);

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const ta = document.createElement('textarea');
        ta.value = url;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
      toast.success('Đã sao chép liên kết hồ sơ gia sư.');
    } catch {
      toast.error('Không sao chép được liên kết. Bạn có thể copy từ thanh địa chỉ.');
    }
  };

  return (
    <div className="bg-surface rounded-2xl border border-border shadow-sm p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row items-start gap-6 sm:gap-8">
        {/* Khung ảnh đại diện chuẩn 140px - 156px, chống vỡ nét và méo ảnh */}
        <div className="relative w-[140px] h-[140px] sm:w-[156px] sm:h-[156px] shrink-0 rounded-2xl overflow-hidden border border-border/90 bg-neutral-100 shadow-sm">
          {hasAvatar ? (
            // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
            <img
              src={avatarUrl}
              alt={`Ảnh đại diện của gia sư ${tutor.fullName || ''}`.trim()}
              className="w-full h-full object-cover object-top"
              loading="eager"
              decoding="async"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-brand-primary-50 text-brand-primary-600 gap-1">
              <Icon name="person" size="xl" strokeWidth={1.5} />
              <span className="text-[12px] font-semibold">Gia sư</span>
            </div>
          )}
        </div>

        {/* Cột thông tin chi tiết */}
        <div className="flex-1 min-w-0 space-y-3.5">
          {/* Trạng thái nhận học viên */}
          <div>
            <Badge variant={accepting ? 'success' : 'neutral'} size="md" dot>
              {accepting ? 'Đang nhận học viên' : 'Tạm ngừng nhận lớp'}
            </Badge>
          </div>

          {/* Tên gia sư + Tích xanh xác thực */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-headline-page sm:text-[32px] leading-[1.15] font-bold text-fg tracking-tight">
              {tutor.fullName}
            </h1>
            {isVerified && <ApprovedProfileBadge />}
          </div>

          {/* Học vấn / bằng cấp chính */}
          {tutor.education && (
            <p className="text-body-reg font-semibold text-brand-primary-700 flex items-center gap-1.5 m-0">
              <Icon name="school" size="sm" className="text-brand-primary-500 shrink-0" />
              <span className="min-w-0 break-words">{tutor.education}</span>
            </p>
          )}

          {/* Dòng uy tín: Điểm đánh giá (ngôi sao vàng đặc) + Năm kinh nghiệm */}
          <div className="flex flex-wrap items-center gap-3 pt-0.5 text-caption">
            {hasRating ? (
              <span className="inline-flex items-center gap-1.5 font-bold bg-amber-50/90 border border-amber-200/90 px-2.5 py-1 rounded-brand-md text-[13px] text-slate-900 shadow-[0_1px_2px_rgba(245,158,11,0.06)]">
                <Icon name="star" size="xs" filled className="text-amber-500 fill-amber-500" />
                <span className="tabular-nums font-bold text-slate-900">{ratingValue.toFixed(1)}</span>
                <span className="font-medium text-slate-500">
                  ({tutor.totalReviews ?? 0} đánh giá)
                </span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-brand-md bg-neutral-100 text-fg-secondary text-[12px] font-medium">
                Gia sư mới
              </span>
            )}

            {tutor.experienceYears > 0 && (
              <span className="inline-flex items-center gap-1.5 font-medium text-slate-700 bg-slate-100 border border-slate-200/90 px-2.5 py-1 rounded-brand-md text-[13px]">
                <Icon name="work_history" size="xs" className="text-slate-500 shrink-0" />
                <span className="tabular-nums font-semibold text-slate-900">{tutor.experienceYears} năm</span> kinh nghiệm giảng dạy
              </span>
            )}
          </div>

          {/* Danh sách môn học */}
          {subjects.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1" aria-label="Môn học đang giảng dạy">
              {subjects.map((subject, i) => (
                <Tag key={subject.id || subject.subjectId || `${subject.subjectName}-${i}`}>
                  {subject.subjectName}
                </Tag>
              ))}
            </div>
          )}

          {/* Hành động phụ: Lưu gia sư & Chia sẻ hồ sơ */}
          <div className="flex flex-wrap items-center gap-2.5 pt-1.5">
            <Button
              variant={isFavorite ? 'primary' : 'outline'}
              size="md"
              onClick={() => toggle('Tutor', tutorId)}
              icon={<Icon name="favorite" size="xs" filled={isFavorite} />}
            >
              {isFavorite ? 'Đã lưu gia sư' : 'Lưu gia sư'}
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={handleShare}
              icon={<Icon name={copied ? 'check' : 'content_copy'} size="xs" />}
            >
              {copied ? 'Đã sao chép liên kết' : 'Chia sẻ hồ sơ'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

ProfileHeadline.propTypes = {
  tutor: PropTypes.shape({
    id: PropTypes.string,
    tutorProfileId: PropTypes.string,
    fullName: PropTypes.string,
    avatarUrl: PropTypes.string,
    isVerified: PropTypes.bool,
    education: PropTypes.string,
    experienceYears: PropTypes.number,
    ratingAvg: PropTypes.number,
    totalReviews: PropTypes.number,
    subjects: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        subjectId: PropTypes.string,
        subjectName: PropTypes.string,
      })
    ),
    services: PropTypes.arrayOf(PropTypes.object),
  }).isRequired,
};
