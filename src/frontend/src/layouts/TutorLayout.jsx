import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Dropdown, Avatar } from 'antd';
import { useAuthStore } from '@/store/authStore';

export default function TutorLayout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/auth/login');
  };

  const navLinks = [
    { path: '/tutor/dashboard', label: 'Bảng Điều Hành', icon: 'space_dashboard' },
    { path: '/tutor/availability', label: 'Thời Khóa Biểu', icon: 'calendar_month' },
    { path: '/tutor/services', label: 'Gói Dịch Vụ', icon: 'inventory_2' },
    { path: '/tutor/wallet', label: 'Ví Escrow & Rút Tiền', icon: 'account_balance_wallet' },
    { path: '/app/messages', label: 'Tin Nhắn & Thỏa Thuận', icon: 'chat' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-surface-canvas-light text-text-primary antialiased font-sans">
      {/* Tutor Topbar */}
      <header className="bg-surface-card-glass backdrop-blur-md border-b border-border-light shadow-xs sticky top-0 z-50">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-6">
            <Link to="/tutor/dashboard" className="flex items-center gap-2.5 group shrink-0">
              <div className="w-9 h-9 rounded-xl bg-brand-indigo-50 flex items-center justify-center border border-brand-indigo-100 shadow-xs">
                <span className="material-symbols-outlined text-brand-indigo-600 text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  psychology
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-extrabold text-brand-indigo-600 tracking-tight leading-none">
                  Tutor<span className="text-brand-navy-900">Hub</span>
                </span>
                <span className="text-[9px] font-bold text-financial-available uppercase tracking-wider mt-0.5">
                  Verified Master Tutor
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-6">
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

          {/* Tutor Fast Stats & Profile */}
          <div className="flex items-center gap-3">
            <Link
              to="/tutor/wallet"
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition-colors"
              title="Xem chi tiết ví"
            >
              <span className="material-symbols-outlined text-base">payments</span>
              <span>Số dư khả dụng</span>
            </Link>

            <Dropdown
              menu={{
                items: [
                  {
                    key: 'profile',
                    icon: <span className="material-symbols-outlined text-base">badge</span>,
                    label: 'Hồ Sơ Gia Sư',
                    onClick: () => navigate('/tutor/dashboard'),
                  },
                  {
                    key: 'application',
                    icon: <span className="material-symbols-outlined text-base">verified</span>,
                    label: 'Nâng Cấp / Xác Thực Bằng Cấp',
                    onClick: () => navigate('/tutor/application'),
                  },
                  {
                    key: 'withdraw',
                    icon: <span className="material-symbols-outlined text-base text-emerald-600">account_balance</span>,
                    label: 'Yêu Cầu Rút Tiền',
                    onClick: () => navigate('/tutor/wallet/withdraw'),
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
                  src={user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'tutor'}`}
                  className="border border-brand-indigo-200"
                />
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-800 line-clamp-1">{user?.fullName || user?.name || 'Gia Sư'}</span>
                  <span className="text-[10px] font-semibold text-brand-indigo-600 uppercase">Master Tutor</span>
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
