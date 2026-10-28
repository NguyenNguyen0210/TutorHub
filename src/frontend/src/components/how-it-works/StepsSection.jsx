import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import Icon from '@/components/ui/Icon';

const JOURNEY_CONFIG = {
  student: {
    icon: 'school',
    title: 'Hành trình của học viên',
    subtitle: 'Từ mục tiêu học tập đến từng buổi học được bảo chứng.',
    ctaText: 'Khám phá gói học',
    ctaLink: '/services',
    accent: 'bg-brand-primary-600',
    iconStyle: 'bg-brand-primary-50 text-brand-primary-700 border-brand-primary-100',
    steps: [
      ['search', 'Tìm người phù hợp', 'Lọc theo môn học, mục tiêu, hình thức và học phí.'],
      ['forum', 'Trao đổi mục tiêu', 'Xem hồ sơ thật và thống nhất kỳ vọng trước khi đăng ký.'],
      ['credit_card', 'Giữ chỗ an toàn', 'Chọn gói học; hệ thống giữ chỗ 15 phút trong lúc thanh toán.'],
      ['event_available', 'Học theo tiến độ', 'Xếp lịch từng buổi và có 12 giờ báo cáo sự cố trước giải ngân.'],
    ],
  },
  tutor: {
    icon: 'person',
    title: 'Hành trình của gia sư',
    subtitle: 'Xây hồ sơ đáng tin cậy và vận hành lớp học minh bạch.',
    ctaText: 'Gửi hồ sơ gia sư',
    ctaLink: '/tutor/application',
    accent: 'bg-success',
    iconStyle: 'bg-success-subtle text-success-strong border-success/20',
    steps: [
      ['description', 'Hoàn thiện hồ sơ', 'Cung cấp chuyên môn, kinh nghiệm và tài liệu xác minh.'],
      ['verified_user', 'Được xét duyệt', 'Hồ sơ được kiểm tra trước khi nhận học viên trên sàn.'],
      ['inventory_2', 'Thiết kế gói học', 'Công khai số buổi, thời lượng, nội dung và học phí trọn gói.'],
      ['group_add', 'Dạy và nhận giải ngân', 'Theo dõi từng buổi; khoản học phí hợp lệ được giải ngân theo tiến độ.'],
    ],
  },
};

export default function StepsSection({ variant = 'student' }) {
  const config = JOURNEY_CONFIG[variant] || JOURNEY_CONFIG.student;

  return (
    <section className="py-10 sm:py-14">
      <div className="page-shell">
        <div className="grid gap-8 border-y border-border py-8 sm:py-10 lg:grid-cols-[0.75fr_1.25fr] lg:gap-14">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-brand-lg border ${config.iconStyle}`}>
              <Icon name={config.icon} size="md" />
            </div>
            <h2 className="max-w-sm text-[26px] font-bold leading-tight text-fg sm:text-[32px]">
              {config.title}
            </h2>
            <p className="mt-3 max-w-md text-body-reg leading-relaxed text-fg-secondary">
              {config.subtitle}
            </p>
            <Link
              to={config.ctaLink}
              className="mt-6 inline-flex min-h-11 items-center rounded-brand-md border border-border bg-surface px-4 text-[13px] font-semibold text-fg transition-colors hover:border-brand-primary-300 hover:text-primary"
            >
              {config.ctaText}
            </Link>
          </div>

          <ol className="learning-rail space-y-7">
            {config.steps.map(([icon, title, description], index) => (
              <li key={title} className="relative min-h-[5rem] pl-4">
                <span
                  className={`absolute -left-[2.05rem] top-0 flex h-8 w-8 items-center justify-center rounded-full text-caption font-bold text-white ring-4 ring-canvas ${config.accent}`}
                  aria-hidden="true"
                >
                  {index + 1}
                </span>
                <div className="flex items-start gap-3">
                  <Icon name={icon} size="sm" className="mt-1 text-brand-primary-600" />
                  <div>
                    <h3 className="text-[16px] font-semibold text-fg">{title}</h3>
                    <p className="mt-1 max-w-xl text-[14px] leading-relaxed text-fg-secondary">
                      {description}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

StepsSection.propTypes = {
  variant: PropTypes.oneOf(['student', 'tutor']),
};
