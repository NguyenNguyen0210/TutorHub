import React from 'react';

export default function ServiceHeroVisual() {
  return (
    <div className="relative flex w-full max-w-[620px] select-none items-center justify-center">
      {/* Vòng hào quang sáng mờ phía sau */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -z-0 h-[360px] w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-200/50 blur-3xl"
        aria-hidden="true"
      />

      {/* Ảnh 3D banner minh họa gói học và lộ trình học (tách nền trong suốt, không viền) */}
      <img
        src="/images/services-hero-banner.png"
        alt="Không gian học tập trực tuyến TutorHub với gói học linh hoạt và lộ trình rõ ràng"
        width="1774"
        height="887"
        className="pointer-events-none relative z-10 h-auto w-full select-none object-contain animate-float"
        loading="eager"
      />
    </div>
  );
}
