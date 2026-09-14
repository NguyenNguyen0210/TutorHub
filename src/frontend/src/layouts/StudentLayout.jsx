import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Dropdown, Avatar } from 'antd';
import { useAuthStore } from '@/store/authStore';

export default function StudentLayout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/auth/login');
  };

  const navLinks = [
    { path: '/student/dashboard', label: 'Bàn Học Của Tôi', icon: 'space_dashboard' },
    { path: '/tutors', label: 'Khám Phá Gia Sư', icon: 'explore' },
    { path: '/app/messages', label: 'Hộp Thư & Hợp Đồng', icon: 'chat' },
    { path: '/app/notifications', label: 'Thông Báo', icon: 'notifications' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-surface-canvas-light text-text-primary antialiased font-sans">
      {/* Student Sticky Topbar */}
      <header className="bg-surface-card-glass backdrop-blur-md border-b border-border-light shadow-xs sticky top-0 z-50">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 gap-4">
          {/* Logo & Student Badge */}
          <div className="flex items-center gap-6">
            <Link to="/student/dashboard" className="flex items-center gap-2.5 group shrink-0">
              <div className="w-9 h-9 rounded-xl bg-brand-indigo-50 flex items-center justify-center border border-brand-indigo-100 shadow-xs">
                <span className="material-symbols-outlined text-financial-available text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  school
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-extrabold text-brand-indigo-600 tracking-tight leading-none">
                  Tutor<span className="text-brand-navy-900">Hub</span>
                </span>
                <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider mt-0.5">
                  Student Learning Hub
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map((item) => {
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-1.5 text-xs font-bold py-1.5 transition-colors border-b-2 ${
                      isActive
                        ? 'border-brand-indigo-600 text-brand-indigo-600'
                        : 'border-transparent text-text-secondary hover:text-brand-indigo-600'
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Student Status & Profile */}
          <div className="flex items-center gap-3">
            {/* Discipline Status Badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              0 Vi Phạm (Uy Tín 100%)
            </div>

            <Dropdown
              menu={{
                items: [
                  {
                    key: 'profile',
                    icon: <span className="material-symbols-outlined text-base">person</span>,
                    label: 'Hồ Sơ Của Tôi',
                    onClick: () => navigate('/student/dashboard'),
                  },
                  {
                    key: 'dispute',
                    icon: <span className="material-symbols-outlined text-base text-amber-600">gavel</span>,
                    label: 'Khiếu Nại Buổi Học',
                    onClick: () => navigate('/student/disputes/new'),
                  },
                  { type: 'divider' },
                  {
                    key: 'logout',
                    icon: <span className="material-symbols-outlined text-base text-rose-500">logout</span>,
                    label: <span className="text-rose-600 font-medium">Đăng Xuất</span>,
                    onClick: handleLogout,
                  },
                ],
              }}
              trigger={['click']}
              placement="bottomRight"
            >
              <div className="flex items-center gap-2.5 pl-3 border-l border-border-light cursor-pointer hover:opacity-80 transition-opacity">
                <Avatar
                  src={user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'student'}`}
                  className="border border-brand-indigo-200"
                />
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-800 line-clamp-1">{user?.fullName || user?.name || 'Học Viên'}</span>
                  <span className="text-[10px] font-semibold text-emerald-600 uppercase">Student</span>
                </div>
              </div>
            </Dropdown>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}
