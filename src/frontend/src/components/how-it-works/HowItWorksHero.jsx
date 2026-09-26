import React from 'react';
import { Link } from 'react-router-dom';
import Icon from '@/components/ui/Icon';

export default function HowItWorksHero() {
  return (
    <section className="relative py-8 sm:py-10 lg:py-12 bg-gradient-to-r from-[#EFF6FF] to-[#ECFEFF] border-b border-sky-100/70 overflow-hidden">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-center">
          {/* Left Column: Breadcrumb, Heading, Subtitle, Trust Badges */}
          <div className="lg:col-span-7 space-y-4 sm:space-y-5">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-[12px] font-medium text-slate-500" aria-label="Breadcrumb">
              <Link to="/" className="text-slate-500 hover:text-[#2563EB] transition-colors">
                Trang chủ
              </Link>
              <span className="text-slate-300">›</span>
              <span className="text-[#2563EB] font-semibold">Cách hoạt động</span>
            </nav>

            <h1 className="text-headline-page sm:text-[38px] lg:text-[42px] font-bold text-neutral-900 leading-[1.18] tracking-tight">
              Hành trình học tập dễ dàng <br />
              cùng <span className="text-[#2563EB]">TutorHub</span>
            </h1>

            <p className="text-[14px] sm:text-[15px] text-neutral-600 max-w-xl leading-relaxed">
              Chúng tôi kết nối học viên với những gia sư chất lượng, cung cấp dịch vụ học tập an toàn,
              minh bạch và hiệu quả. Chỉ với vài bước đơn giản, bạn đã có thể bắt đầu hành trình học tập của mình.
            </p>

            {/* 3 Trust Badges */}
            <div className="pt-2 flex flex-wrap items-center gap-4 sm:gap-6">
              {/* Badge 1: An toàn thanh toán */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                  <Icon name="verified_user" size="sm" />
                </div>
                <div>
                  <h3 className="text-[13px] font-bold text-neutral-900 leading-tight">An toàn thanh toán</h3>
                  <p className="text-[11.5px] text-neutral-500 font-medium">Bảo chứng qua Escrow</p>
                </div>
              </div>

              {/* Badge 2: Gia sư chất lượng */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2563EB] shrink-0">
                  <Icon name="group" size="sm" />
                </div>
                <div>
                  <h3 className="text-[13px] font-bold text-neutral-900 leading-tight">Gia sư chất lượng</h3>
                  <p className="text-[11.5px] text-neutral-500 font-medium">Được xác thực kỹ càng</p>
                </div>
              </div>

              {/* Badge 3: Học tập hiệu quả */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                  <Icon name="trending_up" size="sm" />
                </div>
                <div>
                  <h3 className="text-[13px] font-bold text-neutral-900 leading-tight">Học tập hiệu quả</h3>
                  <p className="text-[11.5px] text-neutral-500 font-medium">Đạt mục tiêu nhanh hơn</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Graphic Banner with Student & Floating Benefit Badges */}
          <div className="lg:col-span-5 relative flex items-center justify-center lg:justify-end">
            <div className="relative w-full max-w-[460px] flex items-center justify-center pt-2 pb-2 select-none">
              {/* Soft ambient backlight */}
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-sky-200/40 rounded-full blur-3xl -z-10 pointer-events-none"
                aria-hidden="true"
              />

              {/* Floating person cutout, same as main hero (/register & /login) */}
              <img
                src="/images/transparent-student-clean.png"
                alt="Học viên TutorHub học tập hiệu quả cùng gia sư"
                className="w-full h-auto object-contain select-none pointer-events-none drop-shadow-sm"
                loading="eager"
              />

              {/* Floating Badge 1: Top Right - Kết nối tri thức */}
              <div
                className="absolute top-2 -right-1 sm:right-0 bg-white/95 backdrop-blur-md p-2.5 px-3 rounded-2xl shadow-md border border-white/90 flex items-center gap-2.5 animate-float z-20"
                style={{ animationDuration: '4.8s' }}
              >
                <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                  <Icon name="timeline" size="sm" />
                </div>
                <div>
                  <p className="text-[12px] font-bold text-slate-900 leading-tight">Kết nối tri thức</p>
                  <p className="text-[10px] text-slate-500 font-medium">Đạt mục tiêu nhanh hơn, gia sư phù hợp</p>
                </div>
              </div>

              {/* Floating Badge 2: Bottom Left - Hơn 10.000+ */}
              <div
                className="absolute bottom-6 -left-2 sm:left-0 bg-white/95 backdrop-blur-md p-2.5 px-3 rounded-2xl shadow-md border border-white/90 flex items-center gap-2.5 animate-float z-20"
                style={{ animationDuration: '5.2s', animationDelay: '0.8s' }}
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Icon name="verified" size="sm" />
                </div>
                <div>
                  <p className="text-[12.5px] font-bold text-slate-900 leading-tight">Hơn 10.000+</p>
                  <p className="text-[10px] text-slate-500 font-medium">học viên đã tìm được gia sư phù hợp</p>
                </div>
              </div>

              {/* Floating Badge 3: Middle Right - Small Chart */}
              <div
                className="absolute bottom-14 -right-1 sm:right-2 bg-white/95 backdrop-blur-md p-2 rounded-xl shadow-md border border-white/90 flex items-center justify-center text-amber-500 animate-float z-20"
                style={{ animationDuration: '4.2s', animationDelay: '1.4s' }}
              >
                <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
                  <Icon name="timeline" size="sm" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
