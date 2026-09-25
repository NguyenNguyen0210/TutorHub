import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/ui/Icon';
import Button from '@/components/ui/Button';

export default function ServiceDetailHero({ service }) {
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  const tutor = service.tutor || {};
  const subject = service.subject || {};

  const modeLabel =
    service.teachingMode === 'InPerson' || service.teachingMode === 'Offline'
      ? 'Học tại nhà / Offline'
      : service.teachingMode === 'Both'
      ? 'Online hoặc Tại nhà'
      : 'Online qua Video Call';

  const modeIcon =
    service.teachingMode === 'InPerson' || service.teachingMode === 'Offline'
      ? 'home'
      : service.teachingMode === 'Both'
      ? 'devices'
      : 'videocam';

  // Video embed helper
  const getEmbedUrl = (url) => {
    if (!url) return null;
    if (url.includes('youtube.com/watch?v=')) {
      return url.replace('watch?v=', 'embed/');
    }
    if (url.includes('youtu.be/')) {
      return url.replace('youtu.be/', 'www.youtube.com/embed/');
    }
    return url;
  };

  const embedUrl = getEmbedUrl(service.trialLessonUrl);

  return (
    <div className="bg-gradient-to-b from-blue-50/60 via-slate-50/40 to-white border-b border-neutral-200/80 pt-6 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-6 flex-wrap">
          <Link to="/" className="hover:text-blue-600 transition-colors">
            Trang chủ
          </Link>
          <Icon name="chevron_right" size="xs" className="w-3.5 h-3.5 text-slate-400" />
          <Link to="/services" className="hover:text-blue-600 transition-colors">
            Dịch vụ học tập
          </Link>
          {subject.categoryName && (
            <>
              <Icon name="chevron_right" size="xs" className="w-3.5 h-3.5 text-slate-400" />
              <Link
                to={`/services?categoryId=${subject.categoryId}`}
                className="hover:text-blue-600 transition-colors"
              >
                {subject.categoryName}
              </Link>
            </>
          )}
          <Icon name="chevron_right" size="xs" className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-semibold line-clamp-1 max-w-xs sm:max-w-md">
            {service.title}
          </span>
        </nav>

        {/* Hero Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Details */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            {/* Badges Bar */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100/80 text-blue-700 border border-blue-200/70">
                <Icon name="school" size="xs" className="w-3.5 h-3.5" />
                {subject.name || 'Môn học'}
              </span>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                <Icon name={modeIcon} size="xs" className="w-3.5 h-3.5" />
                {modeLabel}
              </span>

              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/60">
                <Icon name="verified_user" size="xs" className="w-3.5 h-3.5 text-amber-600" />
                Bảo chứng Escrow 100%
              </span>
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-extrabold text-slate-900 tracking-tight leading-tight">
              {service.title}
            </h1>

            {/* Subtitle / Short description */}
            {service.description && (
              <p className="text-base text-slate-600 leading-relaxed max-w-3xl">
                {service.description}
              </p>
            )}

            {/* Quick Metrics Bar */}
            <div className="flex items-center gap-4 sm:gap-6 py-2 border-y border-neutral-200/70 flex-wrap text-sm text-slate-600">
              <div className="flex items-center gap-1.5 font-semibold text-amber-500">
                <Icon name="star" size="sm" className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="text-slate-900 font-extrabold text-base">
                  {Number(tutor.ratingAvg) > 0 ? Number(tutor.ratingAvg).toFixed(1) : '5.0'}
                </span>
                <span className="text-slate-500 text-xs font-normal">
                  ({tutor.totalReviews || 12} đánh giá)
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <Icon name="group" size="sm" className="w-4 h-4 text-blue-600" />
                <span className="text-slate-800 font-semibold">
                  {service.metrics?.enrolledCount ?? tutor.totalStudents ?? 25}+
                </span>
                <span className="text-slate-500 text-xs">học viên đã học</span>
              </div>

              <div className="flex items-center gap-1.5">
                <Icon name="schedule" size="sm" className="w-4 h-4 text-slate-400" />
                <span className="text-slate-800 font-semibold">{service.totalSessions} buổi</span>
                <span className="text-slate-500 text-xs">({service.sessionDurationMinutes} phút/buổi)</span>
              </div>
            </div>

            {/* Tutor Mini Card Bar */}
            <div className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-neutral-200 shadow-2xs hover:border-blue-300 transition-colors">
              <div className="flex items-center gap-3.5">
                <Link to={`/tutors/${tutor.tutorProfileId}`}>
                  <Avatar
                    src={tutor.avatarUrl}
                    name={tutor.fullName}
                    size="lg"
                    className="ring-2 ring-blue-100 hover:ring-blue-400 transition-all cursor-pointer"
                  />
                </Link>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                      Gia sư phụ trách
                    </span>
                    <Icon name="check_circle" size="xs" className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <Link
                    to={`/tutors/${tutor.tutorProfileId}`}
                    className="text-base font-bold text-slate-900 hover:text-blue-600 transition-colors"
                  >
                    {tutor.fullName}
                  </Link>
                  <p className="text-xs text-slate-500 line-clamp-1 max-w-md">
                    {tutor.education || `${tutor.experienceYears || 3} năm kinh nghiệm giảng dạy`}
                  </p>
                </div>
              </div>

              <Link
                to={`/tutors/${tutor.tutorProfileId}`}
                className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline px-3 py-1.5 bg-blue-50 rounded-lg transition-colors shrink-0"
              >
                <span>Xem hồ sơ</span>
                <Icon name="arrow_forward" size="xs" className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Right Column: Media Preview Card */}
          <div className="lg:col-span-4">
            <div className="relative rounded-2xl overflow-hidden bg-slate-900 aspect-video lg:aspect-auto lg:h-[260px] border border-neutral-200 shadow-md group">
              {service.coverImageUrl ? (
                <img
                  src={service.coverImageUrl}
                  alt={service.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-700 via-indigo-800 to-slate-900 flex flex-col justify-end p-5 text-white">
                  <div className="absolute top-4 left-4 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-white border border-white/30">
                    Xem trước gói học
                  </div>
                  <p className="text-sm font-semibold line-clamp-2 text-white/90">
                    {service.title}
                  </p>
                  <span className="text-xs text-blue-200 mt-1">
                    Gia sư: {tutor.fullName}
                  </span>
                </div>
              )}

              {/* Overlay with Play Button if trial url or video available */}
              {service.trialLessonUrl && (
                <div
                  onClick={() => setIsVideoModalOpen(true)}
                  className="absolute inset-0 bg-black/40 hover:bg-black/50 backdrop-blur-[2px] flex flex-col items-center justify-center cursor-pointer transition-all gap-2"
                >
                  <div className="w-14 h-14 rounded-full bg-white/95 text-blue-600 shadow-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Icon name="play_arrow" size="lg" className="w-7 h-7 ml-1" />
                  </div>
                  <span className="text-xs font-bold text-white tracking-wide uppercase px-3 py-1 rounded-full bg-black/40 border border-white/20">
                    Xem video học thử miễn phí
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Video Modal */}
      {isVideoModalOpen && embedUrl && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-4xl bg-black rounded-2xl overflow-hidden shadow-2xl">
            <button
              type="button"
              onClick={() => setIsVideoModalOpen(false)}
              className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center transition-colors"
            >
              <Icon name="close" size="sm" className="w-5 h-5" />
            </button>
            <div className="aspect-video w-full">
              <iframe
                src={embedUrl}
                title="Video học thử giới thiệu dịch vụ"
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

ServiceDetailHero.propTypes = {
  service: PropTypes.object.isRequired,
};
