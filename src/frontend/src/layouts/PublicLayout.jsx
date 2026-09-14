import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Dropdown, Avatar } from 'antd';
import { useAuthStore } from '@/store/authStore';

export default function PublicLayout() {
  const { user, role, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/auth/login');
  };

  const getDashboardPath = () => {
    if (role === 'Admin') return '/admin/dashboard';
    if (role === 'Tutor') return '/tutor/dashboard';
    return '/student/dashboard';
  };

  const userMenuItems = [
    {
      key: 'dashboard',
      icon: <span className="material-symbols-outlined text-base">dashboard</span>,
      label: 'Bảng Điều Khiển',
      onClick: () => navigate(getDashboardPath()),
    },
    {
      key: 'messages',
      icon: <span className="material-symbols-outlined text-base">chat</span>,
      label: 'Tin Nhắn & Hợp Đồng',
      onClick: () => navigate('/app/messages'),
    },
    {
      key: 'notifications',
      icon: <span className="material-symbols-outlined text-base">notifications</span>,
      label: 'Trung Tâm Thông Báo',
      onClick: () => navigate('/app/notifications'),
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <span className="material-symbols-outlined text-base text-rose-500">logout</span>,
      label: <span className="text-rose-600 font-medium">Đăng Xuất</span>,
      danger: true,
      onClick: handleLogout,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-surface-canvas-light text-text-primary antialiased font-sans">
      {/* Top Sticky Glass Navigation */}
      <header className="bg-surface-card-glass backdrop-blur-md dark:bg-brand-navy-900 border-b border-border-light shadow-xs sticky top-0 z-50 transition-all">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 gap-4">
          {/* Brand Logo & Slogan */}
          <div className="flex items-center gap-6 flex-1">
            <Link to="/tutors" className="flex items-center gap-2.5 group shrink-0">
              <div className="w-10 h-10 rounded-xl bg-brand-indigo-50 flex items-center justify-center border border-brand-indigo-100 shadow-xs group-hover:scale-105 transition-transform duration-150">
                <span className="material-symbols-outlined text-financial-available text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  verified_user
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-headline-2 text-xl font-extrabold text-brand-indigo-600 tracking-tight leading-none">
                  Tutor<span className="text-brand-navy-900">Hub</span>
                </span>
                <span className="font-caption text-[10px] tracking-wider font-bold text-financial-available uppercase mt-0.5">
                  Dual Escrow Verified
                </span>
              </div>
            </Link>

            {/* Quick Category Nav */}
            <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold text-text-secondary">
              <Link 
                to="/tutors" 
                className={`flex items-center gap-1.5 transition-colors ${location.pathname === '/tutors' ? 'text-brand-indigo-600 font-bold' : 'hover:text-brand-indigo-600'}`}
              >
                <span className="material-symbols-outlined text-lg">explore</span>
                Khám Phá Gia Sư
              </Link>
              {isAuthenticated && (
                <Link 
                  to={getDashboardPath()} 
                  className="flex items-center gap-1.5 hover:text-brand-indigo-600 transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">space_dashboard</span>
                  Bàn Làm Việc
                </Link>
              )}
            </nav>
          </div>

          {/* Action Bar */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/app/messages"
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-text-secondary hover:bg-slate-100 transition-colors"
                  title="Tin nhắn"
                >
                  <span className="material-symbols-outlined text-xl">chat</span>
                </Link>
                <Link
                  to="/app/notifications"
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-text-secondary hover:bg-slate-100 transition-colors relative"
                  title="Thông báo"
                >
                  <span className="material-symbols-outlined text-xl">notifications</span>
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500"></span>
                </Link>
                <Dropdown menu={{ items: userMenuItems }} trigger={['click']} placement="bottomRight">
                  <div className="flex items-center gap-2.5 pl-3 border-l border-border-light cursor-pointer hover:opacity-80 transition-opacity">
                    <Avatar
                      src={user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'user'}`}
                      className="border border-brand-indigo-200"
                    />
                    <div className="hidden sm:flex flex-col text-left">
                      <span className="text-xs font-bold text-slate-800 line-clamp-1">{user?.fullName || user?.name || 'Tài khoản'}</span>
                      <span className="text-[10px] font-semibold text-brand-indigo-600 uppercase">{role || 'User'}</span>
                    </div>
                  </div>
                </Dropdown>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/auth/login"
                  className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-brand-indigo-600 rounded-xl transition-colors"
                >
                  Đăng Nhập
                </Link>
                <Link
                  to="/auth/register"
                  className="px-4 py-2 text-xs font-bold text-white bg-brand-indigo-600 hover:bg-brand-indigo-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-base">person_add</span>
                  Đăng Ký
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Page Content */}
      <main className="flex-1 w-full">
        <Outlet />
      </main>

      {/* Stitch Trust Footer */}
      <footer className="bg-surface-canvas-light dark:bg-brand-navy-950 border-t border-border-light py-10 px-4 sm:px-6 lg:px-8 mt-12 transition-all">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-headline-2 text-lg text-brand-navy-900 font-bold">TutorHub</span>
              <span className="px-2 py-0.5 text-[10px] font-monospace-num font-semibold rounded bg-financial-available-bg text-financial-available border border-financial-available/20">
                ESCROW V2 PROTECTED
              </span>
            </div>
            <p className="font-caption text-xs text-text-muted max-w-xl">
              © 2026 TutorHub Vietnam. Nền tảng kết nối gia sư và học viên trực tuyến với cơ chế ký quỹ bảo chứng Escrow 2 chiều và phân xử tranh chấp DEC-S8.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center md:justify-end gap-x-6 gap-y-2 text-xs text-text-muted">
            <Link to="/tutors" className="hover:text-brand-indigo-600 transition-colors">Tìm Gia Sư</Link>
            <Link to="/auth/register" className="hover:text-brand-indigo-600 transition-colors">Đăng Ký Làm Gia Sư</Link>
            <a href="#" className="hover:text-brand-indigo-600 transition-colors">Chính Sách Bảo Chứng Escrow</a>
            <a href="#" className="hover:text-brand-indigo-600 transition-colors">Quy Trình Đối Soát 24h</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
