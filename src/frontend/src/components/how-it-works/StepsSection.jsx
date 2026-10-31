import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import Icon from '@/components/ui/Icon';

const JOURNEY_CONFIG = {
  student: {
    icon: 'school',
    title: 'Hành trình của học viên',
    subtitle: 'Từ mục tiêu học tập đến từng buổi học được bảo chứng rõ ràng.',
    ctaText: 'Khám phá gói học',
    ctaLink: '/services',
    // Visual styling tokens
    sectionBg: 'bg-white',
    iconHeaderStyle: 'bg-blue-50 text-blue-600 border-blue-200/80',
    numberBadge: 'bg-blue-600 text-white shadow-blue-500/20',
    cardBorder: 'border-slate-200/80 hover:border-blue-300 hover:shadow-[0_8px_24px_-8px_rgba(37,99,235,0.15)]',
    cardIcon: 'bg-blue-50 text-blue-600 border border-blue-100',
    ctaButton:
      'border-blue-200 bg-blue-50/80 text-blue-700 hover:bg-blue-600 hover:text-white hover:border-blue-600 hover:shadow-md hover:shadow-blue-500/20',
    steps: [
      ['search', 'Tìm người phù hợp', 'Lọc theo môn học, mục tiêu và học phí trọn gói minh bạch.'],
      ['forum', 'Trao đổi mục tiêu', 'Xem hồ sơ thật và thống nhất kỳ vọng trước khi đăng ký.'],
      ['credit_card', 'Giữ chỗ an toàn', 'Chọn gói học; hệ thống giữ chỗ 15 phút trong lúc thanh toán ký quỹ.'],
      ['event_available', 'Học theo tiến độ', 'Xếp lịch từng buổi và có 12 giờ nghiệm thu tự động trước giải ngân.'],
    ],
  },
  tutor: {
    icon: 'person',
    title: 'Hành trình của gia sư',
    subtitle: 'Xây dựng hồ sơ đáng tin cậy và vận hành lớp học minh bạch.',
    ctaText: 'Gửi hồ sơ gia sư',
    ctaLink: '/tutor/application',
    // Visual styling tokens
    sectionBg: 'bg-slate-50/70',
    iconHeaderStyle: 'bg-emerald-50 text-emerald-600 border-emerald-200/80',
    numberBadge: 'bg-emerald-600 text-white shadow-emerald-500/20',
    cardBorder: 'border-slate-200/80 hover:border-emerald-300 hover:shadow-[0_8px_24px_-8px_rgba(16,185,129,0.15)]',
    cardIcon: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
    ctaButton:
      'border-emerald-200 bg-emerald-50/80 text-emerald-800 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 hover:shadow-md hover:shadow-emerald-500/20',
    steps: [
      ['description', 'Hoàn thiện hồ sơ', 'Cung cấp chuyên môn, kinh nghiệm và tài liệu xác minh minh bạch.'],
      ['verified_user', 'Được xét duyệt', 'Hồ sơ được đội ngũ kiểm duyệt kỹ lưỡng trước khi nhận học viên.'],
      ['inventory_2', 'Thiết kế gói học', 'Chủ động công khai số buổi, thời lượng, nội dung và học phí trọn gói.'],
      ['group_add', 'Dạy và nhận giải ngân', 'Theo dõi từng buổi; khoản học phí hợp lệ được giải ngân minh bạch sau 12h.'],
    ],
  },
};

export default function StepsSection({ variant = 'student', id }) {
  const config = JOURNEY_CONFIG[variant] || JOURNEY_CONFIG.student;

  return (
    <section id={id} className={`scroll-mt-20 border-b border-slate-200/80 py-12 sm:py-16 ${config.sectionBg}`}>
      <div className="page-shell">
        <div className="grid items-start gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
          {/* Cột trái: Tiêu đề, mô tả, nút CTA nổi bật */}
          <div className="space-y-4 lg:sticky lg:top-28 lg:self-start">
            <div
              className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl border shadow-sm ${config.iconHeaderStyle}`}
            >
              <Icon name={config.icon} size="md" />
            </div>

            <h2 className="text-[28px] font-extrabold leading-tight tracking-[-0.02em] text-slate-900 sm:text-[34px]">
              {config.title}
            </h2>

            <p className="max-w-md text-[15px] leading-relaxed text-slate-600 sm:text-[16px]">
              {config.subtitle}
            </p>

            <div className="pt-2">
              <Link
                to={config.ctaLink}
                className={`inline-flex min-h-12 items-center gap-2 rounded-xl border px-5 text-[14px] font-bold shadow-sm transition-all active:scale-[0.98] ${config.ctaButton}`}
              >
                <span>{config.ctaText}</span>
                <Icon name="arrow_forward" size="sm" />
              </Link>
            </div>
          </div>

          {/* Cột phải: 4 thẻ bước học bo viền, cân bằng khoảng trống */}
          <div className="space-y-3.5 sm:space-y-4">
            {config.steps.map(([icon, title, description], index) => (
              <div
                key={title}
                className={`group flex items-start gap-4 rounded-2xl border bg-white p-5 shadow-sm transition-all duration-200 sm:gap-5 sm:p-5 ${config.cardBorder}`}
              >
                {/* Con số thứ tự làm điểm nhấn duy nhất bên trái */}
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[14px] font-extrabold shadow-sm sm:h-10 sm:w-10 sm:text-[15px] ${config.numberBadge}`}
                >
                  {index + 1}
                </div>

                {/* Nội dung tiêu đề & mô tả của bước */}
                <div className="min-w-0 flex-1 pt-0.5">
                  <h3 className="text-[15px] font-bold leading-snug text-slate-900 group-hover:text-slate-950 sm:text-[16px]">
                    {title}
                  </h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-slate-600 sm:text-[14px]">
                    {description}
                  </p>
                </div>

                {/* Icon nhỏ tách riêng sang góc phải của thẻ */}
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${config.cardIcon}`}
                  aria-hidden="true"
                >
                  <Icon name={icon} size="md" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

StepsSection.propTypes = {
  variant: PropTypes.oneOf(['student', 'tutor']),
  id: PropTypes.string,
};
