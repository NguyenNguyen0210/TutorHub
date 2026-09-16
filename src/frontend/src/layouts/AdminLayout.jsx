import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Dropdown, Avatar } from 'antd';
import { useAuthStore } from '@/store/authStore';

export default function AdminLayout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/auth/login');
  };

  const navLinks = [
    { path: '/admin/dashboard', label: 'Bảng Điều Hành KPI', icon: 'dashboard' },
    { path: '/admin/tutor-applications', label: 'Duyệt Bằng Cấp Gia Sư', icon: 'verified' },
    { path: '/admin/users', label: 'Quản Lý Người Dùng & Kỷ Luật', icon: 'group' },
    { path: '/admin/audit-logs', label: 'Sổ Cái Kiểm Toán Audit', icon: 'receipt_long' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100 antialiased font-sans">
      {/* Stitch Dark Navy Executive Topbar */}
      <header className="w-full bg-brand-navy-950 border-b border-slate-800 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo + Governance Badge */}
          <div className="flex items-center gap-6">
            <Link to="/admin/dashboard" className="flex items-center gap-3 shrink-0">
              <div className="w-9 h-9 rounded-xl bg-brand-indigo-600 flex items-center justify-center text-white shadow-xs">
                <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  admin_panel_settings
                </span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-white text-lg tracking-tight leading-none">TutorHub</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    GOVERNANCE DESK
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono mt-0.5">Ban Trọng Tài & Bảo Chứng Ký Quỹ</span>
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
                    className={`flex items-center gap-1.5 text-xs font-bold py-4 border-b-2 transition-colors ${
                      isActive
                        ? 'border-brand-indigo-500 text-white'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Admin User Status */}
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Ledger Synchronized
            </span>

            <Dropdown
              menu={{
                items: [
                  {
                    key: 'logout',
                    icon: <span className="material-symbols-outlined text-base text-rose-400">logout</span>,
                    label: <span className="text-rose-400 font-medium">Đăng Xuất Admin</span>,
                    onClick: handleLogout,
                  },
                ],
              }}
              trigger={['click']}
              placement="bottomRight"
            >
              <div className="flex items-center gap-2.5 pl-3 border-l border-slate-800 cursor-pointer hover:opacity-80 transition-opacity">
                <Avatar
                  src={user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=admin`}
                  className="bg-brand-indigo-600 border border-brand-indigo-400"
                />
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-bold text-white line-clamp-1">{user?.fullName || user?.name || 'Administrator'}</span>
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Platform Officer</span>
                </div>
              </div>
            </Dropdown>
          </div>
        </div>
      </header>

      {/* Mobile & Tablet Secondary Navigation Bar (<1024px) */}
      <nav
        className="lg:hidden w-full bg-slate-950/95 border-b border-slate-800 px-4 py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar sticky top-16 z-40"
        aria-label="Admin Mobile Navigation"
      >
        {navLinks.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-brand-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
              }`}
            >
              <span className="material-symbols-outlined text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Main Admin Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}
