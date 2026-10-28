import React from 'react';
import { Link } from 'react-router-dom';
import Icon from '@/components/ui/Icon';

const TRUST_POINTS = [
  ['verified_user', 'Hồ sơ được xác thực', 'Thông tin chuyên môn được xét duyệt'],
  ['timeline', 'Tiến độ nhìn thấy được', 'Theo dõi từng buổi trong gói học'],
  ['shield', 'Dòng tiền được bảo chứng', 'Có thời gian báo cáo trước giải ngân'],
];

export default function HowItWorksHero() {
  return (
    <section className="overflow-hidden border-b border-brand-primary-100 bg-brand-primary-50 py-10 sm:py-14">
      <div className="page-shell">
        <nav className="mb-6 flex items-center gap-1.5 text-[12px] font-medium text-fg-muted" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-primary">Trang chủ</Link>
          <span aria-hidden="true">/</span>
          <span className="font-semibold text-primary">Cách hoạt động</span>
        </nav>

        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <h1 className="max-w-2xl border-l-4 border-brand-primary-600 pl-5 text-[36px] font-bold leading-[1.08] tracking-[-0.035em] text-fg sm:text-[48px]">
              Một hành trình học tập rõ ràng từ đầu đến cuối
            </h1>
            <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-fg-secondary sm:text-[17px]">
              TutorHub giúp học viên và gia sư cùng nhìn thấy cam kết, tiến độ từng buổi
              và trạng thái học phí trong một quy trình thống nhất.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {TRUST_POINTS.map(([icon, title, description]) => (
                <div key={title} className="border-t border-brand-primary-200 pt-4">
                  <Icon name={icon} size="sm" className="text-brand-primary-600" />
                  <h2 className="mt-2 text-[13px] font-semibold text-fg">{title}</h2>
                  <p className="mt-1 text-[12px] leading-relaxed text-fg-muted">{description}</p>
                </div>
              ))}
            </div>
          </div>

          <figure className="relative mx-auto w-full max-w-[460px]">
            <div className="overflow-hidden rounded-brand-xl border border-brand-primary-100 bg-surface">
              <img
                src="/images/transparent-student-clean.png"
                alt="Học viên đang học trực tuyến trên TutorHub"
                className="h-auto w-full object-contain"
                loading="eager"
              />
            </div>
            <figcaption className="mt-3 text-center text-[12px] text-fg-muted">
              Chọn gói học, xếp lịch và theo dõi tiến độ trong cùng một nơi.
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
