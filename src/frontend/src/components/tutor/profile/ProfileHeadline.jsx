import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Badge, { Tag } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';
import { getTeachingModeMeta } from '@/config/enums';

function StarRow({ value, className = '' }) {
  const rounded = Math.round(value);
  return (
    <span className={className}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Icon
          key={i}
          name="star"
          size="xs"
          filled={i < rounded}
          className={i < rounded ? 'text-brand-secondary-500' : 'text-neutral-300'}
        />
      ))}
    </span>
  );
}

StarRow.propTypes = { value: PropTypes.number.isRequired, className: PropTypes.string };

/**
 * ProfileHeadline — phần "con người + niềm tin" của hồ sơ (SPEC §4.2).
 *
 * Nguyên tắc: chỉ hiện số liệu có thật từ API. Các số liệu cần backend mới
 * (tỷ lệ phản hồi, số học viên đã dạy, nút Lưu) nằm ở V2 — xem SPEC §7 —
 * nên ở đây cố tình không dựng, không hiện 0 giả.
 */
export default function ProfileHeadline({ tutor }) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  const services = Array.isArray(tutor.services) ? tutor.services : [];
  const subjects = Array.isArray(tutor.subjects) ? tutor.subjects : [];
  const modeMeta = getTeachingModeMeta(tutor.teachingMode);
  const ratingValue = Number(tutor.ratingAvg);
  const hasRating = Number.isFinite(ratingValue) && ratingValue > 0;
  const firstSubject = subjects[0]?.subjectName || subjects[0]?.name || null;
  const accepting = services.length > 0;

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        // Fallback cho ngữ cảnh không secure (http trong LAN) hoặc browser cũ.
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
    <div className="space-y-4">
      {/* Trạng thái nhận học viên — suy từ việc có gói học niêm yết hay không */}
      <div>
        <Badge variant={accepting ? 'success' : 'neutral'} size="md" dot>
          {accepting ? 'Đang nhận học viên' : 'Tạm ngừng nhận lớp'}
        </Badge>
      </div>

      {/* Tên + tick thẩm định */}
      <div className="flex items-center gap-2.5 flex-wrap">
        <h1 className="text-headline-page sm:text-[34px] leading-[1.15] font-bold text-fg tracking-tight">
          {tutor.fullName}
        </h1>
        {tutor.isVerified && (
          <span
            className="inline-flex items-center gap-1 text-brand-primary-600"
            title="Hồ sơ đã được thẩm định"
          >
            <Icon name="verified" size="md" filled />
            <span className="sr-only">Hồ sơ đã được thẩm định</span>
          </span>
        )}
      </div>

      {/* Học vấn / kinh nghiệm */}
      <div className="space-y-1">
        {tutor.education && (
          <p className="text-body-reg font-semibold text-brand-primary-700 flex items-center gap-1.5">
            <Icon name="school" size="sm" className="text-brand-primary-500 shrink-0" />
            <span className="min-w-0">{tutor.education}</span>
          </p>
        )}
        <p className="text-body-reg text-fg-secondary">
          {[
            firstSubject ? `Gia sư ${firstSubject}` : 'Gia sư',
            tutor.experienceYears > 0 ? `${tutor.experienceYears} năm kinh nghiệm` : null,
          ]
            .filter(Boolean)
            .join(' · ')}
        </p>
      </div>

      {/* Dòng tin cậy — số đi kèm nhãn, không chỉ dựa vào màu/icon */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-caption">
        {hasRating && (
          <span className="inline-flex items-center gap-1.5 font-bold text-fg bg-brand-secondary-50 border border-brand-secondary-200 px-2 py-0.5 rounded-brand-sm">
            <Icon name="star" size="xs" filled className="text-brand-secondary-500" />
            <span className="tabular-nums">{ratingValue.toFixed(1)}</span>
            <StarRow value={ratingValue} className="inline-flex" />
            <span className="font-medium text-fg-secondary">
              ({tutor.totalReviews ?? 0} đánh giá)
            </span>
          </span>
        )}

        {tutor.experienceYears > 0 && (
          <span className="inline-flex items-center gap-1.5 text-fg-secondary">
            <Icon name="history_edu" size="sm" className="text-brand-primary-500 shrink-0" />
            <span className="tabular-nums">{tutor.experienceYears}</span> năm giảng dạy
          </span>
        )}

        {tutor.address && (
          <span className="inline-flex items-center gap-1.5 text-fg-secondary min-w-0">
            <Icon name="location_on" size="sm" className="text-neutral-400 shrink-0" />
            <span className="truncate">{tutor.address}</span>
          </span>
        )}

        {modeMeta.label && (
          <span className="inline-flex items-center gap-1.5 text-fg-secondary">
            <Icon name="videocam" size="sm" className="text-neutral-400 shrink-0" />
            {modeMeta.label}
          </span>
        )}
      </div>

      {/* Môn học */}
      {subjects.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {subjects.map((subject, i) => (
            <Tag key={subject.id || subject.subjectId || `${subject.subjectName}-${i}`}>
              {subject.subjectName}
            </Tag>
          ))}
        </div>
      )}

      {/* Hành động phụ: chia sẻ (V1). Lưu gia sư là V2 — cần endpoint bookmark. */}
      <div className="pt-1">
        <Button
          variant="outline"
          size="sm"
          onClick={handleShare}
          icon={<Icon name={copied ? 'check' : 'content_copy'} size="xs" />}
        >
          {copied ? 'Đã sao chép liên kết' : 'Chia sẻ hồ sơ'}
        </Button>
      </div>
    </div>
  );
}

ProfileHeadline.propTypes = {
  tutor: PropTypes.shape({
    fullName: PropTypes.string,
    isVerified: PropTypes.bool,
    education: PropTypes.string,
    experienceYears: PropTypes.number,
    teachingMode: PropTypes.string,
    address: PropTypes.string,
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
