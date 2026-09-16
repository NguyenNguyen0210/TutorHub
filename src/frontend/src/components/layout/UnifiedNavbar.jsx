import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Dropdown, Avatar } from 'antd';
import { useAuthStore } from '@/store/authStore';
import MobileFloatingDock from '@/components/layout/MobileFloatingDock';

export default function UnifiedNavbar() {
  const { user, role, isAuthenticated, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/auth/login');
  };

  const getDashboardPath = () => {
    if (role === 'Admin') return '/admin/dashboard';
    if (role === 'Tutor') return '/tutor/dashboard';
    return '/student/dashboard';
  };

  // Define navigation links strictly according to role
  const getNavLinks = () => {
    if (!isAuthenticated) {
      return [
        { path: '/tutors', label: 'Khám Phá Gia Sư', icon: 'explore', match: (p) => p.startsWith('/tutors') },
      ];
    }

    if (role === 'Student') {
      return [
        { 
          path: '/student/dashboard', 
          label: 'Bàn Học Của Tôi', 
          icon: 'space_dashboard', 
          match: (p) => p.startsWith('/student') 
        },
        { 
          path: '/tutors', 
          label: 'Khám Phá Gia Sư', 
          icon: 'explore', 
          match: (p) => p.startsWith('/tutors') 
        },
        { 
          path: '/app/messages', 
          label: 'Hộp Thư & Hợp Đồng', 
          icon: 'chat', 
          match: (p) => p.startsWith('/app/messages') 
        },
        { 
          path: '/app/notifications', 
          label: 'Thông Báo', 
          icon: 'notifications', 
          match: (p) => p.startsWith('/app/notifications') 
        },
      ];
    }

    if (role === 'Tutor') {
      return [
        { path: '/tutor/dashboard', label: 'Bảng Điều Hành', icon: 'space_dashboard', match: (p) => p === '/tutor/dashboard' },
        { path: '/tutor/availability', label: 'Thời Khóa Biểu', icon: 'calendar_month', match: (p) => p.startsWith('/tutor/availability') },
        { path: '/tutor/services', label: 'Gói Dịch Vụ', icon: 'inventory_2', match: (p) => p.startsWith('/tutor/services') },
        { path: '/tutor/wallet', label: 'Ví Escrow & Rút Tiền', icon: 'account_balance_wallet', match: (p) => p.startsWith('/tutor/wallet') },
        { path: '/app/messages', label: 'Tin Nhắn', icon: 'chat', match: (p) => p.startsWith('/app/messages') },
        { path: '/app/notifications', label: 'Thông Báo', icon: 'notifications', match: (p) => p.startsWith('/app/notifications') },
      ];
    }

    if (role === 'Admin') {
      return [
        { path: '/admin/dashboard', label: 'Bảng Quản Trị', icon: 'space_dashboard', match: (p) => p === '/admin/dashboard' },
        { path: '/admin/tutor-applications', label: 'Duyệt Gia Sư', icon: 'verified_user', match: (p) => p.startsWith('/admin/tutor-applications') },
        { path: '/admin/users', label: 'Người Dùng', icon: 'group', match: (p) => p.startsWith('/admin/users') },
        { path: '/admin/audit-logs', label: 'Sổ Kiểm Toán', icon: 'history', match: (p) => p.startsWith('/admin/audit-logs') },
      ];
    }

    return [{ path: '/tutors', label: 'Khám Phá Gia Sư', icon: 'explore', match: (p) => p.startsWith('/tutors') }];
  };

  const navLinks = getNavLinks();

  // Unified subtitle badge for the logo
  const getSubBrandLabel = () => {
    if (!isAuthenticated) return 'Nền Tảng Gia Sư Bảo Chứng';
    if (role === 'Student') return 'Student Learning Hub';
    if (role === 'Tutor') return 'Verified Master Tutor';
    if (role === 'Admin') return 'Governance Console';
    return 'Escrow Learning Hub';
  };

  const getSubBrandColor = () => {
    if (role === 'Tutor') return 'text-brand-indigo-600';
    if (role === 'Student') return 'text-emerald-600';
    if (role === 'Admin') return 'text-amber-600';
    return 'text-emerald-600';
  };

  // User dropdown menu items
  const getUserMenuItems = () => {
    const items = [
      {
        key: 'dashboard',
        icon: <span className="material-symbols-outlined text-base text-brand-indigo-600">space_dashboard</span>,
        label: <span className="font-semibold text-xs">{role === 'Student' ? 'Bàn Học Của Tôi' : role === 'Tutor' ? 'Bảng Điều Hành' : 'Bảng Quản Trị'}</span>,
        onClick: () => navigate(getDashboardPath()),
      },
    ];

    if (role === 'Student') {
      items.push({
        key: 'dispute',
        icon: <span className="material-symbols-outlined text-base text-amber-600">gavel</span>,
        label: <span className="font-semibold text-xs">Khiếu Nại Buổi Học</span>,
        onClick: () => navigate('/student/disputes/new'),
      });
    }

    if (role === 'Tutor') {
      items.push({
        key: 'wallet',
        icon: <span className="material-symbols-outlined text-base text-emerald-600">account_balance_wallet</span>,
        label: <span className="font-semibold text-xs">Ví Escrow & Rút Tiền</span>,
        onClick: () => navigate('/tutor/wallet'),
      });
    }

    items.push(
      { type: 'divider' },
      {
        key: 'logout',
        icon: <span className="material-symbols-outlined text-base text-rose-500">logout</span>,
        label: <span className="text-rose-600 font-bold text-xs">Đăng Xuất</span>,
        danger: true,
        onClick: handleLogout,
      }
    );

    return items;
  };

  return (
    <>
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/85 border-b border-slate-200/80 shadow-[0_2px_15px_-3px_rgba(15,23,42,0.04)] transition-all">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 gap-4">
        {/* Left: Brand Identity & Subtitle */}
        <div className="flex items-center gap-6 xl:gap-8 flex-1">
          <Link
            to={isAuthenticated ? getDashboardPath() : '/tutors'}
            className="flex items-center gap-2.5 group shrink-0 select-none"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-indigo-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-brand-indigo-500/20 group-hover:scale-105 group-hover:shadow-brand-indigo-500/35 transition-all duration-300">
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                {role === 'Tutor' ? 'psychology' : 'school'}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold tracking-tight leading-none text-slate-900">
                Tutor<span className="text-gradient-indigo">Hub</span>
              </span>
              <span className={`text-[9px] font-extrabold tracking-wider uppercase mt-1 flex items-center gap-1.5 ${getSubBrandColor()}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                {getSubBrandLabel()}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-2 lg:gap-3">
            {navLinks.map((item) => {
              const isActive = item.match ? item.match(location.pathname) : location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-brand-indigo-50 text-brand-indigo-700 shadow-xs ring-1 ring-brand-indigo-100 font-extrabold'
                      : 'text-slate-600 hover:text-brand-indigo-600 hover:bg-slate-100/70'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-lg ${
                      isActive ? 'text-brand-indigo-600' : 'text-slate-400 group-hover:text-brand-indigo-600'
                    }`}
                  >
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Section: Status Badge, Quick Actions, Profile Dropdown */}
        <div className="flex items-center gap-3 shrink-0">
          {isAuthenticated ? (
            <>
              {/* Student Trust Badge */}
              {role === 'Student' && (
                <div
                  className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50/90 border border-emerald-200/80 text-emerald-700 text-xs font-extrabold shadow-xs select-none"
                  title={(user?.absentStrikes ?? 0) > 0 ? `Tài khoản ghi nhận ${user.absentStrikes} vi phạm vắng mặt` : "Tài khoản chấp hành nội quy tốt - Không có vi phạm vắng mặt"}
                >
                  <span className="material-symbols-outlined text-base text-emerald-600" style={{ fontVariationSettings: "'FILL' 1" }}>
                    verified
                  </span>
                  <span>{(user?.absentStrikes ?? 0) === 0 ? '0 Vi Phạm (Uy Tín)' : `${user.absentStrikes} Vi Phạm`}</span>
                </div>
              )}

              {/* Tutor Wallet Status Shortcut */}
              {role === 'Tutor' && (
                <Link
                  to="/tutor/wallet"
                  className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50/90 border border-indigo-200/80 text-brand-indigo-700 text-xs font-extrabold shadow-xs hover:bg-indigo-100/80 transition-all"
                  title="Truy cập nhanh Ví Escrow"
                >
                  <span className="material-symbols-outlined text-base text-brand-indigo-600" style={{ fontVariationSettings: "'FILL' 1" }}>
                    account_balance_wallet
                  </span>
                  <span>Ví Escrow & Rút Tiền</span>
                </Link>
              )}

              {/* User Avatar Dropdown */}
              <Dropdown
                menu={{ items: getUserMenuItems() }}
                trigger={['click']}
                placement="bottomRight"
              >
                <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200/80 cursor-pointer group">
                  <Avatar
                    src={user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'user'}`}
                    size={38}
                    className="border-2 border-brand-indigo-100 group-hover:border-brand-indigo-400 transition-all shadow-xs shrink-0"
                  />
                  <div className="hidden sm:flex flex-col text-left">
                    <span className="text-xs font-bold text-slate-800 line-clamp-1 max-w-[140px] group-hover:text-brand-indigo-600 transition-colors">
                      {user?.fullName || user?.name || 'Tài khoản'}
                    </span>
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider ${
                        role === 'Tutor' ? 'text-brand-indigo-600' : role === 'Admin' ? 'text-amber-600' : 'text-emerald-600'
                      }`}
                    >
                      {role || 'Student'}
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-base text-slate-400 group-hover:text-slate-600 transition-transform group-hover:translate-y-0.5">
                    expand_more
                  </span>
                </div>
              </Dropdown>
            </>
          ) : (
            /* Guest Actions */
            <div className="flex items-center gap-3">
              <Link
                to="/tutor/application"
                className="hidden sm:inline-flex text-xs font-bold text-slate-700 hover:text-brand-indigo-600 px-3 py-2 transition-colors"
              >
                Trở Thành Gia Sư
              </Link>
              <Link
                to="/auth/login"
                className="inline-flex items-center justify-center text-xs font-extrabold text-white bg-gradient-to-r from-brand-indigo-600 to-indigo-700 hover:from-brand-indigo-700 hover:to-indigo-800 px-4 py-2 rounded-xl shadow-sm hover:shadow-md shadow-brand-indigo-500/20 transition-all duration-200"
              >
                Đăng Nhập
              </Link>
            </div>
          )}

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-10 h-10 rounded-xl bg-slate-100/80 hover:bg-slate-200/80 flex items-center justify-center text-slate-700 transition-colors"
            aria-label="Toggle navigation"
          >
            <span className="material-symbols-outlined text-2xl">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200/80 bg-white/95 backdrop-blur-xl px-4 pt-3 pb-5 space-y-2 animate-fadeIn">
          {navLinks.map((item) => {
            const isActive = item.match ? item.match(location.pathname) : location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-brand-indigo-50 text-brand-indigo-700 font-extrabold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="material-symbols-outlined text-lg">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
          {isAuthenticated && role === 'Student' && (
            <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-xs font-extrabold text-emerald-700 px-3 py-1.5">
              <span className="material-symbols-outlined text-base text-emerald-600">verified</span>
              {(user?.absentStrikes ?? 0) === 0 ? '0 Vi Phạm (Uy Tín)' : `${user.absentStrikes} Vi Phạm`}
            </div>
          )}
        </div>
      )}
    </header>
      {/* Mobile Floating Bottom Dock */}
      <MobileFloatingDock />
    </>
  );
}
