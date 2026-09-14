import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Avatar, Badge, Tag, Button } from 'antd';
import { 
  DashboardOutlined, 
  CalendarOutlined, 
  AppstoreOutlined, 
  WalletOutlined, 
  BankOutlined,
  MessageOutlined, 
  BellOutlined,
  CheckCircleOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import { useAuthStore } from '../store/authStore';

export default function TutorLayout() {
  const { user } = useAuthStore();
  const location = useLocation();

  const navItems = [
    { path: '/tutor/dashboard', label: 'Bảng Điều Hành', icon: <DashboardOutlined /> },
    { path: '/tutor/availability', label: 'Lịch Rảnh Tuần', icon: <CalendarOutlined /> },
    { path: '/tutor/services', label: 'Gói Dịch Vụ', icon: <AppstoreOutlined /> },
    { path: '/tutor/wallet', label: 'Trung Tâm Ví Escrow', icon: <WalletOutlined /> },
    { path: '/tutor/wallet/withdraw', label: 'Rút Tiền Về Ngân Hàng', icon: <BankOutlined /> },
    { path: '/app/messages', label: 'Tin Nhắn & Đề Xuất', icon: <MessageOutlined /> },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans">
      {/* Tutor Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-800 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-900 font-black">
            TH
          </div>
          <div>
            <span className="font-extrabold text-sm text-white block leading-tight">TutorHub Workspace</span>
            <span className="text-[10px] text-emerald-400 font-semibold block">Gia Sư Xác Thực ✅</span>
          </div>
        </div>

        {/* Tutor Profile & Wallet Snapshot */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <Avatar src={user?.avatarUrl} size={40} className="border border-indigo-400" />
            <div>
              <span className="text-xs font-bold text-white block">{user?.name || 'ThS. Nguyễn Văn An'}</span>
              <span className="text-[10px] text-slate-400 block">Rating: 4.90 ★ (8 reviews)</span>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-center">
            <div className="p-2 bg-slate-800/80 rounded border border-slate-700">
              <span className="text-[9px] text-amber-400 block font-semibold">TẠM GIỮ (PENDING)</span>
              <span className="font-mono-num font-bold text-white text-xs">3.600.000 ₫</span>
            </div>
            <div className="p-2 bg-emerald-950/60 rounded border border-emerald-800">
              <span className="text-[9px] text-emerald-400 block font-semibold">KHẢ DỤNG (AVAIL)</span>
              <span className="font-mono-num font-bold text-emerald-300 text-xs">900.000 ₫</span>
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="p-3 space-y-1 flex-1">
          {navItems.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <Link to="/">
            <Button size="small" icon={<ArrowLeftOutlined />} block ghost className="text-xs text-slate-300 border-slate-700">
              Về Trang Khám Phá
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <Tag color="green" icon={<CheckCircleOutlined />} className="text-xs m-0">Uy Tín: 0/2 Strikes</Tag>
            <span className="text-xs text-slate-400">|</span>
            <span className="text-xs font-semibold text-slate-700">Hạn mức được phép rút: <span className="font-mono-num text-emerald-600 font-bold">700.000 ₫</span></span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/tutor/wallet/withdraw">
              <Button type="primary" size="small" className="bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold">
                Rút Tiền Nhanh
              </Button>
            </Link>
            <Badge count={1} size="small">
              <Button type="text" shape="circle" icon={<BellOutlined />} />
            </Badge>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
