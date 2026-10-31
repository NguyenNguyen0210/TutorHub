import React from 'react';
import Icon from '@/components/ui/Icon';
import Button from '@/components/ui/Button';
import HowItWorksHeroVisual from './HowItWorksHeroVisual';

export const TRUST_POINTS = [
  {
    icon: 'verified_user',
    title: 'Hồ sơ được xác thực',
    description: 'Thông tin chuyên môn, chứng chỉ và bằng cấp được xét duyệt chặt chẽ.',
  },
  {
    icon: 'timeline',
    title: 'Tiến độ nhìn thấy được',
    description: 'Theo dõi từng buổi học và lộ trình cam kết xuyên suốt toàn bộ gói học.',
  },
  {
    icon: 'shield',
    title: 'Dòng tiền được bảo chứng',
    description: 'Ký quỹ an toàn với cơ chế 12 giờ nghiệm thu tự động trước khi giải ngân.',
  },
];

export function HowItWorksTrustBar() {
  return (
    <section className="border-b border-slate-200/80 bg-white" aria-label="Cam kết quy trình TutorHub">
      <div className="page-shell grid grid-cols-1 gap-6 py-6 sm:grid-cols-3 lg:gap-8 lg:py-7">
        {TRUST_POINTS.map((item) => (
          <div key={item.title} className="flex items-start gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-sm">
              <Icon name={item.icon} size="md" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold leading-tight text-slate-900">{item.title}</h2>
              <p className="mt-1 text-[13px] leading-relaxed text-slate-500">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function HowItWorksHero() {
  return (
    <section className="relative overflow-hidden border-b border-[color:var(--mkt-line)] bg-gradient-to-br from-blue-50 via-white to-sky-50 py-10 sm:py-14 lg:py-16">
      {/* Nền đồ họa chấm bi & hào quang đồng bộ với các trang Discovery */}
      <div
        className="pointer-events-none absolute inset-0 opacity-60 [background-image:radial-gradient(#bfdbfe_1px,transparent_1px)] [background-size:22px_22px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-32 -top-40 h-[420px] w-[420px] rounded-full bg-blue-200/40 blur-3xl"
        aria-hidden="true"
      />

      <div className="page-shell relative z-10">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.08fr)_minmax(420px,0.92fr)] lg:gap-14">
          <div className="max-w-[680px]">
            {/* Tiêu đề 2 màu chuẩn hóa: Dòng 1 đen mực, Dòng 2 xanh dương nổi bật */}
            <h1 className="mkt-display text-[38px] leading-[1.1] tracking-[-0.025em] text-[color:var(--mkt-ink)] sm:text-[48px] lg:text-[54px]">
              Một hành trình học tập.
              <span className="block text-[color:var(--mkt-cobalt)]">Rõ ràng từ đầu đến cuối.</span>
            </h1>

            {/* Đoạn mô tả mở rộng */}
            <p className="mt-6 max-w-[600px] text-[15px] leading-7 text-[color:var(--mkt-body)] sm:text-[17px]">
              TutorHub giúp học viên và gia sư cùng nhìn thấy cam kết, tiến độ từng buổi
              và trạng thái học phí trong một quy trình thống nhất, minh bạch.
            </p>

            {/* Cụm nút CTA điều hướng trực tiếp đến các bước quy trình */}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button
                as="a"
                href="#quy-trinh-hoc-vien"
                variant="primary"
                size="lg"
                iconRight={<Icon name="keyboard_arrow_down" size="sm" />}
              >
                Quy trình cho học viên
              </Button>
              <Button
                as="a"
                href="#quy-trinh-gia-su"
                variant="outline"
                size="lg"
                iconRight={<Icon name="keyboard_arrow_down" size="sm" />}
              >
                Quy trình cho gia sư
              </Button>
            </div>

            {/* Dòng cam kết cốt lõi */}
            <div className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[12px] font-semibold text-slate-500 sm:text-[13px]">
              <span>Cam kết:</span>
              <span className="text-slate-800">Hồ sơ xác thực</span>
              <span className="text-blue-300" aria-hidden="true">•</span>
              <span className="text-slate-800">Tiến độ minh bạch</span>
              <span className="text-blue-300" aria-hidden="true">•</span>
              <span className="text-slate-800">Bảo vệ thanh toán 12h</span>
            </div>
          </div>

          {/* Cột phải: Hình minh họa các bước kết nối lớp học */}
          <div className="hidden lg:flex items-center justify-center">
            <HowItWorksHeroVisual />
          </div>
        </div>
      </div>
    </section>
  );
}
