import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import Logo from '@/components/ui/Logo';
import Icon from '@/components/ui/Icon';

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-canvas relative overflow-hidden">
      {/* Ambient background glows */}
      <div
        className="absolute top-0 -left-40 w-96 h-96 bg-brand-primary-500/10 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-0 -right-40 w-96 h-96 bg-brand-secondary-500/10 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      {/* Main Responsive Grid Layout */}
      <div className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Brand Hero & Trust Pillars (Desktop Only) */}
          <div className="hidden lg:flex lg:col-span-5 flex-col justify-between space-y-8 p-8 rounded-brand-2xl bg-gradient-to-br from-brand-primary-900 via-slate-900 to-brand-primary-950 text-white shadow-brand-xl border border-brand-primary-800/40 relative overflow-hidden">
            {/* Ambient inner mesh */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary-500/20 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 space-y-6">
              <Link to="/" className="inline-flex" aria-label="TutorHub — trang chủ">
                <Logo
                  variant="horizontal"
                  size={42}
                  showSubtitle
                  subtitle="Better Learning. Brighter Future."
                  className="[&_span]:text-white"
                />
              </Link>

              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight text-white">
                  Nền tảng kết nối Gia sư & Học viên có bảo chứng tài chính
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Học tập chất lượng theo mô hình dịch vụ trọn gói (Package-based Learning). Minh bạch từng buổi học với ví bảo chứng Escrow.
                </p>
              </div>

              {/* 3 Core Trust Pillars */}
              <div className="space-y-3.5 pt-2">
                <div className="flex items-start gap-3.5 p-3 rounded-brand-lg bg-white/10 backdrop-blur-sm border border-white/10">
                  <div className="w-9 h-9 rounded-brand-md bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0">
                    <Icon name="shield" size="sm" filled />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-white uppercase tracking-wider block">
                      100% Bảo chứng Escrow
                    </span>
                    <p className="text-xs text-slate-300 leading-normal">
                      Học phí được giữ trung lập an toàn, giải ngân từng buổi chỉ khi có đối soát điểm danh.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3 rounded-brand-lg bg-white/10 backdrop-blur-sm border border-white/10">
                  <div className="w-9 h-9 rounded-brand-md bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
                    <Icon name="hourglass_top" size="sm" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-white uppercase tracking-wider block">
                      Khóa giữ chỗ 15 phút
                    </span>
                    <p className="text-xs text-slate-300 leading-normal">
                      Khóa slot học độc quyền với gia sư theo thời gian thực khi thanh toán qua VNPay.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3 rounded-brand-lg bg-white/10 backdrop-blur-sm border border-white/10">
                  <div className="w-9 h-9 rounded-brand-md bg-brand-primary-500/20 border border-brand-primary-400/30 flex items-center justify-center text-blue-300 shrink-0">
                    <Icon name="done_all" size="sm" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-white uppercase tracking-wider block">
                      Đối soát 2 chiều 24h
                    </span>
                    <p className="text-xs text-slate-300 leading-normal">
                      Xác nhận tham gia buổi học hai chiều, bảo vệ quyền lợi học viên và công sức gia sư.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Platform Stats Row */}
            <div className="relative z-10 pt-4 border-t border-white/10 grid grid-cols-3 gap-2 text-center">
              <div>
                <span className="text-xl font-bold text-white block">500+</span>
                <span className="text-[11px] text-slate-400 uppercase tracking-wide">Gia sư duyệt</span>
              </div>
              <div className="border-x border-white/10">
                <span className="text-xl font-bold text-emerald-400 block">100%</span>
                <span className="text-[11px] text-slate-400 uppercase tracking-wide">Escrow bảo toàn</span>
              </div>
              <div>
                <span className="text-xl font-bold text-amber-400 block">24/7</span>
                <span className="text-[11px] text-slate-400 uppercase tracking-wide">Hỗ trợ đối soát</span>
              </div>
            </div>
          </div>

          {/* Right Column: Dynamic Auth Form (Login or Register) */}
          <div className="col-span-12 lg:col-span-7 flex flex-col items-center justify-center">
            {/* Mobile-only logo */}
            <div className="lg:hidden mb-6 flex justify-center">
              <Link to="/" aria-label="TutorHub — trang chủ">
                <Logo variant="horizontal" size={36} showSubtitle subtitle="Better Learning. Brighter Future." />
              </Link>
            </div>

            <div className="w-full max-w-md">
              <Outlet />
            </div>
          </div>
        </div>
      </div>

      {/* Footer copyright and invariant statement */}
      <footer className="relative z-10 pb-6 text-caption text-fg-muted text-center max-w-xl mx-auto px-4">
        © 2026 TutorHub Vietnam. Nền tảng học tập trực tuyến bảo chứng Escrow & kiểm toán bất biến theo chuẩn PCI-DSS & VNPay 2.1.0.
      </footer>
    </div>
  );
}
