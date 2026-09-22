import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import PublicTopbar from '@/components/layout/PublicTopbar';
import MobileFloatingDock from '@/components/layout/MobileFloatingDock';
import Logo from '@/components/ui/Logo';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/ui/Icon';

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-canvas text-fg antialiased">
      <PublicTopbar />

      <main className="flex-1 w-full relative z-0 pb-28 md:pb-0">
        <Outlet />
      </main>

      <footer className="bg-brand-navy-950 text-slate-300 py-12 px-4 sm:px-6 lg:px-8 mt-16">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-2">
            <div className="flex items-center gap-3">
              <Logo variant="horizontal" size={32} tone="light" />
              <Badge variant="success" size="sm" dot>
                BẢO CHỨNG ESCROW 2 CHIỀU
              </Badge>
            </div>
            <p className="text-caption text-slate-400 max-w-xl leading-relaxed">
              Nền tảng kết nối gia sư và học viên với bảo chứng học phí hai chiều, giải ngân
              từng buổi học và phân xử tranh chấp minh bạch.
            </p>
          </div>

          <nav
            className="flex flex-wrap items-center justify-center md:justify-end gap-x-6 gap-y-2 text-caption text-slate-400"
            aria-label="Liên kết chân trang"
          >
            <Link to="/tutors" className="hover:text-white transition-colors">
              Khám phá gia sư
            </Link>
            <Link to="/auth/register" className="hover:text-white transition-colors">
              Đăng ký làm gia sư
            </Link>
            <Link to="/tutors" className="hover:text-white transition-colors">
              Quy trình đối soát 24 giờ
            </Link>
          </nav>
        </div>

        <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center text-[11px] text-slate-500 gap-2">
          <span>© 2026 TutorHub Platform. Bảo vệ quyền lợi người học.</span>
          <span className="font-mono flex items-center gap-1.5">
            <Icon name="shield" size="sm" />
            Bảo chứng Escrow
          </span>
        </div>
      </footer>

      <MobileFloatingDock />
    </div>
  );
}
