import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate, Link } from 'react-router-dom';
import Icon from '@/components/ui/Icon';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import { formatVND } from '@/utils/formatters';

// Single brand tint for every category (was 5 decorative hues: blue/indigo/teal/amber/slate)
const THEME_BY_CATEGORY = {
  'Ngoại ngữ': {
    bg: 'bg-brand-primary-50/80 border-b border-brand-primary-100/80',
    tag: 'TIẾNG ANH & NGOẠI NGỮ',
    tagClass: 'bg-brand-primary-100/70 text-brand-primary-700',
  },
  'Công nghệ thông tin': {
    bg: 'bg-brand-primary-50/80 border-b border-brand-primary-100/80',
    tag: 'LẬP TRÌNH & CNTT',
    tagClass: 'bg-brand-primary-100/70 text-brand-primary-700',
  },
  'Toán học': {
    bg: 'bg-brand-primary-50/80 border-b border-brand-primary-100/80',
    tag: 'TOÁN HỌC PHỔ THÔNG',
    tagClass: 'bg-brand-primary-100/70 text-brand-primary-700',
  },
  'Khoa học tự nhiên': {
    bg: 'bg-brand-primary-50/80 border-b border-brand-primary-100/80',
    tag: 'KHOA HỌC TỰ NHIÊN',
    tagClass: 'bg-brand-primary-100/70 text-brand-primary-700',
  },
  'Khoa học xã hội': {
    bg: 'bg-brand-primary-50/80 border-b border-brand-primary-100/80',
    tag: 'KHOA HỌC XÃ HỘI',
    tagClass: 'bg-brand-primary-100/70 text-brand-primary-700',
  },
  'Kỹ năng mềm': {
    bg: 'bg-brand-primary-50/80 border-b border-brand-primary-100/80',
    tag: 'KỸ NĂNG & PHÁT TRIỂN',
    tagClass: 'bg-brand-primary-100/70 text-brand-primary-700',
  },
  'Luyện thi chứng chỉ': {
    bg: 'bg-brand-primary-50/80 border-b border-brand-primary-100/80',
    tag: 'LUYỆN THI CHỨNG CHỈ',
    tagClass: 'bg-brand-primary-100/70 text-brand-primary-700',
  },
  'Kinh tế & Tài chính': {
    bg: 'bg-brand-primary-50/80 border-b border-brand-primary-100/80',
    tag: 'KINH TẾ & TÀI CHÍNH',
    tagClass: 'bg-brand-primary-100/70 text-brand-primary-700',
  },
  default: {
    bg: 'bg-neutral-50/90 border-b border-neutral-100',
    tag: 'DỊCH VỤ HỌC TẬP',
    tagClass: 'bg-neutral-100 text-neutral-700',
  },
};

export default function ServiceCard({ service }) {
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

  return (
    /* Thẻ KHÔNG phải control: nó chứa hai link (dịch vụ, gia sư) và một nút yêu
       thích, mà một <button>/<a> thì không được chứa control khác. Trước đây thẻ là
       <div onClick> — bàn phím không với tới được, và mọi child phải
       stopPropagation để giành quyền click.

       Nay: <Link> tiêu đề có `::after` phủ kín thẻ ("stretched link"), nên toàn bộ
       mặt thẻ bấm được, Tab tới được, Enter kích hoạt được, và chuột phải mở
       được tab mới. Nút yêu thích và link gia sư được nâng lên `z-10` để nằm trên
       lớp phủ đó. Không còn stopPropagation nào. */
    <div className="group relative flex flex-col justify-between bg-surface rounded-2xl border border-neutral-200/90 shadow-sm hover:shadow-brand-md hover:border-brand-primary-600/40 transition-all duration-200 overflow-hidden">
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
          onClick={() => setIsFavorite(!isFavorite)}
          className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
            isFavorite
              ? 'bg-danger-subtle text-danger border border-danger/20'
              : 'bg-white/90 text-neutral-400 border border-neutral-200/80 hover:text-danger hover:border-danger/20 shadow-sm'
          }`}
          aria-label={isFavorite ? 'Bỏ yêu thích' : 'Yêu thích dịch vụ này'}
        >
          <Icon
            name="favorite"
            size="xs"
            filled={isFavorite}
            className={`w-3.5 h-3.5 ${isFavorite ? 'text-danger' : 'text-neutral-400'}`}
          />
        </button>
      </div>

      {/* Main Card Content */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3.5">
        <div className="space-y-2.5">
          {/* Service Full Title */}
          <Link
            to={`/services/${service.id}`}
            className="group/title block after:absolute after:inset-0 after:content-['']"
          >
            <h3
              title={service.title}
              className="text-[15px] font-bold text-neutral-900 group-hover/title:text-brand-primary-600 group-hover:text-brand-primary-600 transition-colors line-clamp-2 leading-snug min-h-[42px]"
            >
              {service.title}
            </h3>
          </Link>

          {/* Tutor Info Row — link thật, nằm trên lớp phủ của link tiêu đề */}
          <Link
            to={`/tutors/${service.tutorProfileId}`}
            className="relative z-10 flex items-center gap-2 rounded-brand-sm hover:opacity-85 transition-opacity group/tutor"
          >
            {/* Không dùng ảnh sinh từ dịch vụ bên thứ ba: bản cũ truyền TÊN thật
                của gia sư vào seed của dicebear. <Avatar> tự hiện chữ cái đầu. */}
            <Avatar
              src={service.tutorAvatarUrl}
              name={service.tutorName}
              size="sm"
              className="w-7 h-7 shrink-0"
            />
            <span className="text-[13px] font-semibold text-fg line-clamp-1 group-hover/tutor:text-brand-primary-600">
              {service.tutorName}
            </span>
            <span
              className="text-success shrink-0 inline-flex items-center"
              title="Gia sư đã được xác thực"
            >
              <Icon name="verified" size="xs" filled className="text-success w-3.5 h-3.5" />
            </span>
          </Link>

          {/* Rating & Reviews (Streamlined, no noisy student count) */}
          <div className="flex items-center gap-1.5 text-[12px] text-neutral-500">
            <span className="flex items-center text-brand-secondary-500 font-bold gap-0.5">
              <Icon name="star" size="xs" filled className="text-brand-secondary-500 w-3.5 h-3.5" />
              <span>{rating}</span>
            </span>
            <span className="text-neutral-300">·</span>
            <span>{reviewsCount} đánh giá</span>
          </div>

          {/* Package Terms Row: Sessions · Duration & Mode */}
          <div className="space-y-1 pt-2 border-t border-neutral-100 text-[12px] text-fg-secondary">
            <div className="flex items-center gap-1.5 font-medium text-neutral-700">
              <Icon name="schedule" size="xs" className="text-brand-primary-600 w-3.5 h-3.5 shrink-0" />
              <span>
                {totalSessions} buổi · {sessionDuration} phút/buổi
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-neutral-500">
              <Icon name={modeIcon} size="xs" className="text-fg-muted w-3.5 h-3.5 shrink-0" />
              <span>{modeLabel}</span>
            </div>
          </div>
        </div>

        {/* Footer: Price (Từ X đ) + Primary CTA */}
        <div className="pt-3 border-t border-neutral-100 flex items-center justify-between gap-2">
          <div>
            <span className="text-[11px] text-neutral-500 font-medium block">Học phí trọn gói</span>
            <span className="text-[16px] sm:text-[17px] font-extrabold text-brand-primary-600 tracking-tight block">
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
            className="!rounded-lg px-3.5 py-1.5 text-[12.5px] font-bold gap-1 shadow-sm group-hover:bg-brand-primary-700 transition-colors"
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
