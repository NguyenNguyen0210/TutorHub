import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/cn';
import Icon from '@/components/ui/Icon';

/**
 * ProfileGallery — khối ảnh đại diện 16/10 của hồ sơ gia sư.
 *
 * V1 (SPEC §4.1 G-1): chỉ ảnh đại diện. V2 sẽ thêm album + video giới thiệu
 * (cần backend `galleryImageUrls[]` + `introVideoUrl`, xem SPEC §7) — không
 * dựng placeholder ảnh giả.
 *
 * Ảnh chân dung trong khung 16/10 rất dễ cắt mất mặt, nên dùng `object-top`
 * để giữ phần đầu (nơi khuôn mặt thường nằm) thay vì center.
 */
export default function ProfileGallery({ tutor, className = '' }) {
  const [broken, setBroken] = useState(false);
  const avatarUrl = tutor?.avatarUrl;
  const hasImage = Boolean(avatarUrl) && !broken;
  const subjects = Array.isArray(tutor?.subjects) ? tutor.subjects : [];
  const subjectName = subjects[0]?.subjectName || subjects[0]?.name || 'Gia sư';

  return (
    <figure
      className={cn(
        'relative w-full aspect-[16/10] overflow-hidden rounded-brand-lg border border-border bg-neutral-100',
        className
      )}
    >
      {hasImage ? (
        // onError không phải tương tác người dùng; cần để fallback ảnh chạy khi
        // URL ảnh hỏng (cùng cách Avatar.jsx xử lý).
        // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
        <img
          src={avatarUrl}
          alt={`Ảnh đại diện của gia sư ${tutor.fullName || ''}`.trim()}
          className="w-full h-full object-cover object-top"
          loading="eager"
          decoding="async"
          onError={() => setBroken(true)}
        />
      ) : (
        <div
          className="w-full h-full flex flex-col items-center justify-center gap-2 bg-brand-primary-50 border-brand-primary-100 p-6 text-center"
        >
          <Icon name="person" size="xl" strokeWidth={1.5} className="text-brand-primary-300" />
          <p className="text-[20px] font-bold text-brand-primary-700 leading-tight">
            {subjectName}
          </p>
          <p className="text-caption font-medium text-brand-primary-600">
            {tutor?.fullName || 'Gia sư chưa cập nhật ảnh đại diện'}
          </p>
        </div>
      )}
    </figure>
  );
}

ProfileGallery.propTypes = {
  tutor: PropTypes.shape({
    fullName: PropTypes.string,
    avatarUrl: PropTypes.string,
    subjects: PropTypes.arrayOf(
      PropTypes.shape({ subjectName: PropTypes.string, name: PropTypes.string })
    ),
  }).isRequired,
  className: PropTypes.string,
};

