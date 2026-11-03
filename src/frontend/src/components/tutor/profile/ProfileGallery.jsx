import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/cn';

/**
 * ProfileGallery — Khung phát video giới thiệu của gia sư (nếu có).
 * Khi gia sư cập nhật video giới thiệu, khung này hiển thị video tỉ lệ 16:9 sắc nét.
 * Nếu không có video, khung sẽ ẩn đi để nhường không gian cho thẻ đại diện gọn gàng.
 */
export default function ProfileGallery({ tutor, className = '' }) {
  const videoUrl = tutor?.introVideoUrl || tutor?.videoUrl;
  if (!videoUrl) return null;

  return (
    <figure
      className={cn(
        'relative w-full aspect-video overflow-hidden rounded-2xl border border-border bg-neutral-900 shadow-sm',
        className
      )}
    >
      <iframe
        src={videoUrl}
        title={`Video giới thiệu của gia sư ${tutor.fullName || ''}`.trim()}
        className="w-full h-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </figure>
  );
}

ProfileGallery.propTypes = {
  tutor: PropTypes.shape({
    fullName: PropTypes.string,
    introVideoUrl: PropTypes.string,
    videoUrl: PropTypes.string,
  }),
  className: PropTypes.string,
};
