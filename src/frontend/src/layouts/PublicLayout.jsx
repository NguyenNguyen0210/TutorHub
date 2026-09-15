import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import UnifiedNavbar from '@/components/layout/UnifiedNavbar';

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50/60 text-slate-900 antialiased font-sans relative overflow-x-hidden">
      {/* Unified Persistent Topbar */}
      <UnifiedNavbar />

      {/* Main Page Content */}
      <main className="flex-1 w-full relative z-0">
        <Outlet />
      </main>

      {/* Ultra-Premium Trust Footer */}
      <footer className="bg-gradient-to-b from-slate-900 via-slate-950 to-brand-navy-950 text-slate-300 py-12 px-4 sm:px-6 lg:px-8 mt-16 border-t border-slate-800 relative overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
          <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-xl font-extrabold text-white tracking-tight">TutorHub</span>
              <span className="px-2.5 py-0.5 text-[10px] font-monospace-num font-extrabold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                2-WAY ESCROW PROTOCOL V2
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
              Nền tảng tiên phong tại Việt Nam tích hợp hợp đồng thông minh ký quỹ học phí hai chiều, giải ngân tự động theo từng buổi học và phân xử tranh chấp DEC-S8-025 minh bạch.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-end gap-x-6 gap-y-2 text-xs text-slate-400">
            <Link to="/tutors" className="hover:text-white transition-colors">Khám Phá Gia Sư</Link>
            <Link to="/auth/register" className="hover:text-white transition-colors">Đăng Ký Làm Gia Sư</Link>
            <a href="#" className="hover:text-white transition-colors">Chứng Thư Bảo Chứng Ký Quỹ</a>
            <a href="#" className="hover:text-white transition-colors">Quy Trình Đối Soát 24 Giờ</a>
          </div>
        </div>

        {/* Ambient bottom line */}
        <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row justify-between items-center text-[11px] text-slate-500 gap-2">
          <span>© 2026 TutorHub Platform. Bất biến tài chính & Bảo vệ quyền lợi người học.</span>
          <span className="font-mono text-[10px] text-slate-400">DEC-S8 Core Engine • Security Level 4</span>
        </div>
      </footer>
    </div>
  );
}
