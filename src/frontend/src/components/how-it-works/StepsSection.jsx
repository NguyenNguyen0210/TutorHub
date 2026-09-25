import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import Icon from '@/components/ui/Icon';

const JOURNEY_CONFIG = {
  student: {
    containerBg: 'bg-[#F0F7FF]/70 border-blue-100/70',
    headerIconBg: 'bg-blue-100 text-[#2563EB]',
    headerIcon: 'school',
    titlePrefix: 'Dành cho',
    titleHighlight: 'học viên',
    highlightColor: 'text-[#2563EB]',
    subtitle: 'Tìm gia sư phù hợp và bắt đầu hành trình học tập chỉ với 4 bước đơn giản.',
    ctaText: 'Khám phá dịch vụ học tập',
    ctaLink: '/services',
    ctaBtnStyle: 'text-[#2563EB] border-blue-200/80 hover:bg-blue-50/50',
    stepPillBg: 'bg-blue-100 text-[#2563EB]',
    iconBoxBg: 'bg-blue-50 text-[#2563EB]',
    arrowColor: 'text-blue-300',
    cardBorder: 'border-blue-100/60 hover:border-blue-200',
    steps: [
      {
        num: 1,
        title: 'Tìm gia sư hoặc dịch vụ',
        desc: 'Tìm kiếm theo môn học, nhu cầu và lựa chọn gia sư phù hợp.',
        icon: 'search',
      },
      {
        num: 2,
        title: 'Trao đổi & tư vấn',
        desc: 'Liên hệ gia sư, trao đổi mục tiêu và chọn gói học phù hợp.',
        icon: 'forum',
      },
      {
        num: 3,
        title: 'Thanh toán an toàn',
        desc: 'Thanh toán qua hệ thống bảo chứng của TutorHub.',
        icon: 'credit_card',
      },
      {
        num: 4,
        title: 'Bắt đầu học tập',
        desc: 'Lên lịch học và bắt đầu hành trình cùng gia sư.',
        icon: 'event_available',
      },
    ],
  },
  tutor: {
    containerBg: 'bg-[#F0FDF4]/70 border-emerald-100/70',
    headerIconBg: 'bg-emerald-100 text-emerald-600',
    headerIcon: 'person',
    titlePrefix: 'Dành cho',
    titleHighlight: 'gia sư',
    highlightColor: 'text-emerald-600',
    subtitle: 'Chia sẻ tri thức, tạo thu nhập và truyền cảm hứng cho hàng ngàn học viên.',
    ctaText: 'Trở thành gia sư ngay',
    ctaLink: '/tutor/application',
    ctaBtnStyle: 'text-emerald-600 border-emerald-200/80 hover:bg-emerald-50/50',
    stepPillBg: 'bg-emerald-100 text-emerald-600',
    iconBoxBg: 'bg-emerald-50 text-emerald-600',
    arrowColor: 'text-emerald-300',
    cardBorder: 'border-emerald-100/60 hover:border-emerald-200',
    steps: [
      {
        num: 1,
        title: 'Đăng ký & gửi hồ sơ',
        desc: 'Tạo tài khoản và gửi hồ sơ giảng dạy để được xét duyệt.',
        icon: 'description',
      },
      {
        num: 2,
        title: 'Xác minh & phê duyệt',
        desc: 'Đội ngũ TutorHub kiểm duyệt thông tin và bằng cấp của bạn.',
        icon: 'verified_user',
      },
      {
        num: 3,
        title: 'Tạo dịch vụ học tập',
        desc: 'Thiết lập các gói học, giá cả, lịch rảnh và mô tả chi tiết.',
        icon: 'inventory_2',
      },
      {
        num: 4,
        title: 'Kết nối với học viên',
        desc: 'Nhận yêu cầu, giảng dạy và nhận thanh toán an toàn.',
        icon: 'group_add',
      },
    ],
  },
};

export default function StepsSection({ variant = 'student' }) {
  const config = JOURNEY_CONFIG[variant] || JOURNEY_CONFIG.student;

  return (
    <section className="py-4 sm:py-6">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`rounded-3xl p-6 sm:p-8 lg:p-9 border shadow-xs transition-all ${config.containerBg}`}>
          {/* Header Row: Icon + Title/Subtitle + CTA Link */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 sm:pb-8 border-b border-neutral-200/40">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs ${config.headerIconBg}`}>
                <Icon name={config.headerIcon} size="md" />
              </div>
              <div>
                <h2 className="text-[20px] sm:text-[24px] font-bold text-neutral-900 leading-tight">
                  {config.titlePrefix} <span className={config.highlightColor}>{config.titleHighlight}</span>
                </h2>
                <p className="text-[13px] sm:text-[14px] text-neutral-500 mt-0.5">
                  {config.subtitle}
                </p>
              </div>
            </div>

            <Link
              to={config.ctaLink}
              className={`inline-flex items-center gap-1.5 self-start sm:self-auto px-4 py-2 rounded-xl text-[13px] font-semibold bg-white border shadow-2xs transition-all cursor-pointer ${config.ctaBtnStyle}`}
            >
              <span>{config.ctaText}</span>
              <Icon name="arrow_forward" size="xs" />
            </Link>
          </div>

          {/* 4 Steps Row with Horizontal Arrow Connectors on Desktop */}
          <div className="pt-6 sm:pt-7 relative">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {config.steps.map((step, idx) => (
                <div key={step.num} className="relative flex items-stretch">
                  <div className={`w-full bg-white rounded-2xl p-5 sm:p-6 border shadow-xs hover:shadow-sm transition-all flex flex-col justify-between ${config.cardBorder}`}>
                    <div>
                      {/* Top inside card: Step Pill (left) + Icon in circle (right) */}
                      <div className="flex items-center justify-between">
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-bold shrink-0 ${config.stepPillBg}`}>
                          {step.num}
                        </span>
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${config.iconBoxBg}`}>
                          <Icon name={step.icon} size="sm" />
                        </div>
                      </div>

                      {/* Title & Desc */}
                      <h3 className="text-[15px] font-bold text-neutral-900 mt-4 mb-1.5 leading-snug">
                        {step.title}
                      </h3>
                      <p className="text-[13px] text-neutral-500 leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  </div>

                  {/* Arrow Connector to next card (visible on lg screens, except after last card) */}
                  {idx < config.steps.length - 1 && (
                    <div
                      className={`hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 items-center justify-center pointer-events-none ${config.arrowColor}`}
                      aria-hidden="true"
                    >
                      <Icon name="arrow_forward" size="sm" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

StepsSection.propTypes = {
  variant: PropTypes.oneOf(['student', 'tutor']),
};
