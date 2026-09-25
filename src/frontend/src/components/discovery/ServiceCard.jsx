import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate, Link } from 'react-router-dom';
import Icon from '@/components/ui/Icon';
import Button from '@/components/ui/Button';
import { formatVND } from '@/utils/formatters';

// Soft Pastel Palettes: Premium, legible, non-gaming
const THEME_BY_CATEGORY = {
  'Ngoại ngữ': {
    bg: 'bg-blue-50/80 border-b border-blue-100/80',
    tag: 'TIẾNG ANH & NGOẠI NGỮ',
    tagClass: 'bg-blue-100/70 text-blue-700',
  },
  'Công nghệ thông tin': {
    bg: 'bg-indigo-50/80 border-b border-indigo-100/80',
    tag: 'LẬP TRÌNH & CNTT',
    tagClass: 'bg-indigo-100/70 text-indigo-700',
  },
  'Toán học': {
    bg: 'bg-teal-50/80 border-b border-teal-100/80',
    tag: 'TOÁN HỌC PHỔ THÔNG',
    tagClass: 'bg-teal-100/70 text-teal-700',
  },
  'Khoa học tự nhiên': {
    bg: 'bg-teal-50/80 border-b border-teal-100/80',
    tag: 'KHOA HỌC TỰ NHIÊN',
    tagClass: 'bg-teal-100/70 text-teal-700',
  },
  'Khoa học xã hội': {
    bg: 'bg-amber-50/80 border-b border-amber-100/80',
    tag: 'KHOA HỌC XÃ HỘI',
    tagClass: 'bg-amber-100/70 text-amber-800',
  },
  'Kỹ năng mềm': {
    bg: 'bg-amber-50/80 border-b border-amber-100/80',
    tag: 'KỸ NĂNG & PHÁT TRIỂN',
    tagClass: 'bg-amber-100/70 text-amber-800',
  },
  'Luyện thi chứng chỉ': {
    bg: 'bg-blue-50/80 border-b border-blue-100/80',
    tag: 'LUYỆN THI CHỨNG CHỈ',
    tagClass: 'bg-blue-100/70 text-blue-700',
  },
  'Kinh tế & Tài chính': {
    bg: 'bg-amber-50/80 border-b border-amber-100/80',
    tag: 'KINH TẾ & TÀI CHÍNH',
    tagClass: 'bg-amber-100/70 text-amber-800',
  },
  default: {
    bg: 'bg-slate-50/90 border-b border-slate-100',
    tag: 'DỊCH VỤ HỌC TẬP',
    tagClass: 'bg-slate-100 text-slate-700',
  },
};

export default function ServiceCard({ service, onDetail, onBookNow }) {
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(false);

  const theme = THEME_BY_CATEGORY[service.categoryName] || THEME_BY_CATEGORY.default;

  const modeLabel =
    service.teachingMode === 'InPerson' || service.teachingMode === 'Offline'
      ? 'Tại nhà'
      : service.teachingMode === 'Both'
      ? 'Online hoặc tại nhà'
      : 'Online';

  const modeIcon =
    service.teachingMode === 'InPerson' || service.teachingMode === 'Offline'
      ? 'home'
      : service.teachingMode === 'Both'
      ? 'devices'
      : 'videocam';

  const totalSessions = Number(service.totalSessions) || 1;
  const sessionDuration = Number(service.sessionDurationMinutes) || 90;
  const price = Number(service.price) || 0;
  const rating = Number(service.tutorRating) > 0 ? Number(service.tutorRating).toFixed(1) : '5.0';
  const reviewsCount = service.tutorTotalReviews > 0 ? service.tutorTotalReviews : 12;

  const handleCardClick = () => {
    if (onDetail) {
      onDetail(service);
    } else {
      navigate(`/services/${service.id}`);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="group relative flex flex-col justify-between bg-white rounded-2xl border border-neutral-200/90 shadow-2xs hover:shadow-brand-md hover:border-[#2563EB]/40 transition-all duration-200 overflow-hidden cursor-pointer"
    >
      {/* Top Banner Header: Soft Pastel Tint Background */}
      <div className={`relative px-4 py-3 ${theme.bg} flex items-center justify-between`}>
        <span
          className={`inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold tracking-wide uppercase line-clamp-1 ${theme.tagClass}`}
        >
          {service.subjectName || theme.tag}
        </span>

        {/* Favorite Heart Button: subtle gray border by default, red when active */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsFavorite(!isFavorite);
          }}
          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
            isFavorite
              ? 'bg-rose-50 text-rose-500 border border-rose-200'
              : 'bg-white/90 text-neutral-400 border border-neutral-200/80 hover:text-rose-500 hover:border-rose-200 shadow-2xs'
          }`}
          aria-label={isFavorite ? 'Bỏ yêu thích' : 'Yêu thích dịch vụ này'}
        >
          <Icon
            name="favorite"
            size="xs"
            filled={isFavorite}
            className={`w-3.5 h-3.5 ${isFavorite ? 'text-rose-500' : 'text-neutral-400'}`}
          />
        </button>
      </div>

      {/* Main Card Content */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3.5">
        <div className="space-y-2.5">
          {/* Service Full Title */}
          <Link
            to={`/services/${service.id}`}
            onClick={(e) => e.stopPropagation()}
            className="group/title block"
          >
            <h3
              title={service.title}
              className="text-[15px] font-bold text-neutral-900 group-hover/title:text-[#2563EB] group-hover:text-[#2563EB] transition-colors line-clamp-2 leading-snug min-h-[42px]"
            >
              {service.title}
            </h3>
          </Link>

          {/* Tutor Info Row */}
          <div
            className="flex items-center gap-2 hover:opacity-85 transition-opacity cursor-pointer group/tutor"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/tutors/${service.tutorProfileId}`);
            }}
          >
            <img
              src={
                service.tutorAvatarUrl ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                  service.tutorName || 'tutor'
                )}`
              }
              alt={service.tutorName}
              className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0 bg-slate-100"
              loading="lazy"
            />
            <span className="text-[13px] font-semibold text-slate-800 line-clamp-1 group-hover/tutor:text-[#2563EB]">
              {service.tutorName}
            </span>
            <span
              className="text-emerald-500 shrink-0 inline-flex items-center"
              title="Gia sư đã được xác thực"
            >
              <Icon name="verified" size="xs" filled className="text-emerald-500 w-3.5 h-3.5" />
            </span>
          </div>

          {/* Rating & Reviews (Streamlined, no noisy student count) */}
          <div className="flex items-center gap-1.5 text-[12px] text-slate-500">
            <span className="flex items-center text-amber-500 font-bold gap-0.5">
              <Icon name="star" size="xs" filled className="text-amber-500 w-3.5 h-3.5" />
              <span>{rating}</span>
            </span>
            <span className="text-slate-300">·</span>
            <span>{reviewsCount} đánh giá</span>
          </div>

          {/* Package Terms Row: Sessions · Duration & Mode */}
          <div className="space-y-1 pt-2 border-t border-slate-100 text-[12px] text-slate-600">
            <div className="flex items-center gap-1.5 font-medium text-slate-700">
              <Icon name="schedule" size="xs" className="text-[#2563EB] w-3.5 h-3.5 shrink-0" />
              <span>
                {totalSessions} buổi · {sessionDuration} phút/buổi
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-500">
              <Icon name={modeIcon} size="xs" className="text-slate-400 w-3.5 h-3.5 shrink-0" />
              <span>{modeLabel}</span>
            </div>
          </div>
        </div>

        {/* Footer: Price (Từ X đ) + Primary CTA */}
        <div className="pt-3 border-t border-neutral-100 flex items-center justify-between gap-2">
          <div>
            <span className="text-[11px] text-slate-500 font-medium block">Học phí trọn gói</span>
            <span className="text-[16px] sm:text-[17px] font-extrabold text-[#2563EB] tracking-tight block">
              Từ {formatVND(price)}
            </span>
          </div>

          <Button
            as={Link}
            to={`/services/${service.id}`}
            variant="primary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="!rounded-lg px-3.5 py-1.5 text-[12.5px] font-bold gap-1 shadow-2xs group-hover:bg-[#1D4ED8] transition-colors"
          >
            <span>Xem chi tiết</span>
            <Icon name="arrow_forward" size="xs" className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

ServiceCard.propTypes = {
  service: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    subjectName: PropTypes.string,
    categoryName: PropTypes.string,
    totalSessions: PropTypes.number,
    sessionDurationMinutes: PropTypes.number,
    price: PropTypes.number,
    teachingMode: PropTypes.string,
    tutorProfileId: PropTypes.string,
    tutorName: PropTypes.string,
    tutorAvatarUrl: PropTypes.string,
    tutorRating: PropTypes.number,
    tutorTotalReviews: PropTypes.number,
  }).isRequired,
};
