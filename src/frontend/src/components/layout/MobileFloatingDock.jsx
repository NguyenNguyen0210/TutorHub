import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

export default function MobileFloatingDock() {
  const { role, isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return (
      <div className="md:hidden fixed bottom-4 left-4 right-4 z-50">
        <nav className="backdrop-blur-2xl bg-white/95 border border-slate-200/80 shadow-2xl rounded-2xl p-1.5 flex items-center justify-around">
          <Link
            to="/tutors"
            className={`flex flex-col items-center py-1 px-3 rounded-xl text-[10px] font-bold transition-colors ${
              location.pathname.startsWith('/tutors') ? 'text-brand-indigo-600 bg-indigo-50/80' : 'text-slate-600'
            }`}
          >
            <span className="material-symbols-outlined text-xl">explore</span>
            Khám phá
          </Link>
          <Link
            to="/tutor/application"
            className="flex flex-col items-center py-1 px-3 rounded-xl text-[10px] font-bold text-slate-600"
          >
            <span className="material-symbols-outlined text-xl">school</span>
            Làm gia sư
          </Link>
          <Link
            to="/auth/login"
            className="flex flex-col items-center py-1 px-4 rounded-xl text-[10px] font-bold text-white bg-brand-indigo-600 shadow-sm"
          >
            <span className="material-symbols-outlined text-xl">login</span>
            Đăng nhập
          </Link>
        </nav>
      </div>
    );
  }

  // Student Dock
  if (role === 'Student') {
    return (
      <div className="md:hidden fixed bottom-4 left-4 right-4 z-50">
        <nav className="backdrop-blur-2xl bg-white/95 border border-slate-200/80 shadow-2xl rounded-2xl p-1.5 flex items-center justify-around">
          <Link
            to="/student/dashboard"
            className={`flex flex-col items-center py-1 px-3 rounded-xl text-[10px] font-bold transition-colors ${
              location.pathname.startsWith('/student') ? 'text-brand-indigo-600 bg-indigo-50/80 font-extrabold' : 'text-slate-600'
            }`}
          >
            <span className="material-symbols-outlined text-xl">space_dashboard</span>
            Bàn học
          </Link>
          <Link
            to="/tutors"
            className={`flex flex-col items-center py-1 px-3 rounded-xl text-[10px] font-bold transition-colors ${
              location.pathname.startsWith('/tutors') ? 'text-brand-indigo-600 bg-indigo-50/80 font-extrabold' : 'text-slate-600'
            }`}
          >
            <span className="material-symbols-outlined text-xl">explore</span>
            Tìm gia sư
          </Link>
          <Link
            to="/app/messages"
            className={`flex flex-col items-center py-1 px-3 rounded-xl text-[10px] font-bold transition-colors ${
              location.pathname.startsWith('/app/messages') ? 'text-brand-indigo-600 bg-indigo-50/80 font-extrabold' : 'text-slate-600'
            }`}
          >
            <span className="material-symbols-outlined text-xl">chat</span>
            Hộp thư
          </Link>
          <Link
            to="/app/notifications"
            className={`flex flex-col items-center py-1 px-3 rounded-xl text-[10px] font-bold transition-colors ${
              location.pathname.startsWith('/app/notifications') ? 'text-brand-indigo-600 bg-indigo-50/80 font-extrabold' : 'text-slate-600'
            }`}
          >
            <span className="material-symbols-outlined text-xl">notifications</span>
            Thông báo
          </Link>
        </nav>
      </div>
    );
  }

  // Tutor Dock
  if (role === 'Tutor') {
    return (
      <div className="md:hidden fixed bottom-4 left-4 right-4 z-50">
        <nav className="backdrop-blur-2xl bg-white/95 border border-slate-200/80 shadow-2xl rounded-2xl p-1.5 flex items-center justify-around">
          <Link
            to="/tutor/dashboard"
            className={`flex flex-col items-center py-1 px-2.5 rounded-xl text-[10px] font-bold ${
              location.pathname === '/tutor/dashboard' ? 'text-brand-indigo-600 bg-indigo-50/80' : 'text-slate-600'
            }`}
          >
            <span className="material-symbols-outlined text-xl">space_dashboard</span>
            Tổng quan
          </Link>
          <Link
            to="/tutor/availability"
            className={`flex flex-col items-center py-1 px-2.5 rounded-xl text-[10px] font-bold ${
              location.pathname.startsWith('/tutor/availability') ? 'text-brand-indigo-600 bg-indigo-50/80' : 'text-slate-600'
            }`}
          >
            <span className="material-symbols-outlined text-xl">calendar_month</span>
            Lịch dạy
          </Link>
          <Link
            to="/tutor/wallet"
            className={`flex flex-col items-center py-1 px-2.5 rounded-xl text-[10px] font-bold ${
              location.pathname.startsWith('/tutor/wallet') ? 'text-brand-indigo-600 bg-indigo-50/80' : 'text-slate-600'
            }`}
          >
            <span className="material-symbols-outlined text-xl">account_balance_wallet</span>
            Ví Escrow
          </Link>
          <Link
            to="/app/messages"
            className={`flex flex-col items-center py-1 px-2.5 rounded-xl text-[10px] font-bold ${
              location.pathname.startsWith('/app/messages') ? 'text-brand-indigo-600 bg-indigo-50/80' : 'text-slate-600'
            }`}
          >
            <span className="material-symbols-outlined text-xl">chat</span>
            Tin nhắn
          </Link>
        </nav>
      </div>
    );
  }

  return null;
}
