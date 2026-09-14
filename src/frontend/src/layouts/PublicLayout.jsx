import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Button, Dropdown, Space, Avatar, Badge } from 'antd';
import {
  SafetyCertificateOutlined,
  UserOutlined,
  MessageOutlined,
  BellOutlined,
  LogoutOutlined,
  DashboardOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../store/authStore';

export default function PublicLayout() {
  const { user, role, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();

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
      icon: <DashboardOutlined />,
      label: 'Bang Dieu Khien',
      onClick: () => navigate(getDashboardPath()),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Cai Dat Tai Khoan',
      onClick: () => navigate('/app/settings'),
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Dang Xuat',
      danger: true,
      onClick: handleLogout,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      {/* Top Sticky Glass Navigation */}
      <header className="sticky top-0 z-50 glass-surface border-b border-slate-200/80 px-4 lg:px-8 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">

          {/* Logo & Slogan */}
          <Link to="/" className="flex items-center gap-2.5 text-decoration-none group">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <SafetyCertificateOutlined className="text-xl" />
            </div>
            <div>
              <span className="text-xl font-extrabold text-slate-900 tracking-tight block leading-tight">
                Tutor<span className="text-indigo-600">Hub</span>
              </span>
              <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider block">
                2-Way Escrow Guarantee
              </span>
            </div>
          </Link>

          {/* Quick Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
            <Link to="/tutors" className="hover:text-indigo-600 transition-colors">Kham Pha Gia Su</Link>
            {isAuthenticated && (
              <Link to={getDashboardPath()} className="hover:text-indigo-600 transition-colors">
                Bang Dieu Khien
              </Link>
            )}
          </nav>

          {/* Action Bar */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link to="/app/messages">
                  <Button type="text" shape="circle" icon={<MessageOutlined />} className="text-slate-600" />
                </Link>
                <Link to="/app/notifications">
                  <Badge count={0} size="small">
                    <Button type="text" shape="circle" icon={<BellOutlined />} className="text-slate-600" />
                  </Badge>
                </Link>
                <Dropdown menu={{ items: userMenuItems }} trigger={['click']} placement="bottomRight">
                  <div className="flex items-center gap-2 pl-2 border-l border-slate-200 cursor-pointer hover:opacity-80 transition-opacity">
                    <Avatar src={user?.avatarUrl} icon={<UserOutlined />} className="border border-indigo-200" />
                    <span className="text-xs font-bold text-slate-800 hidden sm:inline-block">{user?.name}</span>
                  </div>
                </Dropdown>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/auth/login">
                  <Button type="text" className="font-semibold text-slate-700">Dang Nhap</Button>
                </Link>
                <Link to="/auth/register">
                  <Button type="primary" className="font-semibold">Dang Ky</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6">
        <Outlet />
      </main>

      {/* Trust Footer */}
      <footer className="bg-slate-900 text-slate-300 py-10 px-4 lg:px-8 mt-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2 text-white font-bold text-lg">
              <SafetyCertificateOutlined className="text-emerald-400 text-xl" />
              TutorHub Smart Escrow System
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-md">
              Nen tang ket noi gia su va hoc vien theo goi dich vu hoc tap voi co che bao chung hoc phi hai chieu (2-Way Escrow Guarantee). Tien hoc duoc giu an toan va chi giai ngan tung buoi sau khi doi soat diem danh thanh cong 24 gio.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Quy Trinh Bao Chung</h4>
            <ul className="text-xs text-slate-400 space-y-2">
              <li>1. Dat giu cho 15 phut (Holding Lock)</li>
              <li>2. Cap phat hop dong N buoi hoc</li>
              <li>3. Diem danh doi soat 2 chieu 24h</li>
              <li>4. Trong tai tranh chap DEC-S8-025</li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Cong Thanh Toan</h4>
            <div className="p-3 bg-slate-800 rounded-lg border border-slate-700 inline-block text-xs">
              <span className="text-emerald-400 font-bold block mb-1">VNPay Gateway</span>
              <span className="text-slate-400 block">Thanh toan an toan qua cong VNPay</span>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-slate-800 flex justify-between items-center text-xs text-slate-500">
          <span>&copy; 2026 TutorHub Platform. Bat bien tai chinh & Kiem toan bat kha xam pham.</span>
          <span>Version 1.0</span>
        </div>
      </footer>
    </div>
  );
}