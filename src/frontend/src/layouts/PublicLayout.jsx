import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Button, Dropdown, Space, Avatar, Badge, Tag } from 'antd';
import { 
  SafetyCertificateOutlined, 
  SearchOutlined, 
  UserOutlined, 
  MessageOutlined, 
  BellOutlined,
  SwapOutlined
} from '@ant-design/icons';
import { useAuthStore } from '../store/authStore';
import { TEST_ACCOUNTS } from '../config/constants';

export default function PublicLayout() {
  const { user, role, switchTestAccount } = useAuthStore();
  const navigate = useNavigate();

  const testAccountMenuItems = TEST_ACCOUNTS.map((acc, index) => ({
    key: String(index),
    label: (
      <div className="flex items-center gap-2 py-1" onClick={() => switchTestAccount(index)}>
        <Tag color={acc.badgeColor}>{acc.role}</Tag>
        <span className="font-semibold text-xs">{acc.name}</span>
      </div>
    ),
  }));

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
            <Link to="/tutors" className="hover:text-indigo-600 transition-colors">Khám Phá Gia Sư</Link>
            <Link to="/tutors/tutor-an-001" className="hover:text-indigo-600 transition-colors">Gia Sư Mẫu (ThS. An)</Link>
            <Link to="/student/dashboard" className="hover:text-indigo-600 transition-colors">Bàn Học Viên</Link>
            <Link to="/tutor/dashboard" className="hover:text-indigo-600 transition-colors">Bàn Gia Sư</Link>
            <Link to="/admin/dashboard" className="hover:text-indigo-600 transition-colors">Quản Trị Sàn</Link>
          </nav>

          {/* Action Bar & Quick Switcher */}
          <div className="flex items-center gap-3">
            {/* Quick Test Switcher Dropdown */}
            <Dropdown menu={{ items: testAccountMenuItems }} trigger={['click']} placement="bottomRight">
              <Button size="small" icon={<SwapOutlined />} className="hidden sm:inline-flex border-indigo-200 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100">
                Đổi Vai Trò: <span className="font-bold ml-1">{user?.role || 'Guest'}</span>
              </Button>
            </Dropdown>

            {user ? (
              <div className="flex items-center gap-3">
                <Link to="/app/messages">
                  <Button type="text" shape="circle" icon={<MessageOutlined />} className="text-slate-600" />
                </Link>
                <Link to="/app/notifications">
                  <Badge count={3} size="small">
                    <Button type="text" shape="circle" icon={<BellOutlined />} className="text-slate-600" />
                  </Badge>
                </Link>
                <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                  <Avatar src={user.avatarUrl} icon={<UserOutlined />} className="border border-indigo-200" />
                  <span className="text-xs font-bold text-slate-800 hidden sm:inline-block">{user.name}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/auth/login">
                  <Button type="text" className="font-semibold text-slate-700">Đăng Nhập</Button>
                </Link>
                <Link to="/auth/register">
                  <Button type="primary" className="font-semibold">Đăng Ký</Button>
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
              Nền tảng kết nối gia sư và học viên theo gói dịch vụ học tập với cơ chế bảo chứng học phí hai chiều (2-Way Escrow Guarantee). Tiền học được giữ an toàn và chỉ giải ngân từng buổi sau khi đối soát điểm danh thành công 24 giờ.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Quy Trình Bảo Chứng</h4>
            <ul className="text-xs text-slate-400 space-y-2">
              <li>1. Đặt giữ chỗ 15 phút (Holding Lock)</li>
              <li>2. Cấp phát hợp đồng N buổi học</li>
              <li>3. Điểm danh đối soát 2 chiều 24h</li>
              <li>4. Trọng tài tranh chấp DEC-S8-025</li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Cổng Thanh Toán</h4>
            <div className="p-3 bg-slate-800 rounded-lg border border-slate-700 inline-block text-xs">
              <span className="text-emerald-400 font-bold block mb-1">VNPay Sandbox 2.1.0</span>
              <span className="text-slate-400 block">Thẻ test NCB: 9704198526191432198</span>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-slate-800 flex justify-between items-center text-xs text-slate-500">
          <span>© 2026 TutorHub Platform. Bất biến tài chính & Kiểm toán bất khả xâm phạm.</span>
          <span>Version 1.0 (React 18 + Vite + Antd + Tailwind)</span>
        </div>
      </footer>
    </div>
  );
}
