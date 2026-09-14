import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Avatar, Badge, Tag, Button } from 'antd';
import { 
  DashboardOutlined, 
  ReadOutlined, 
  CalendarOutlined, 
  AlertOutlined, 
  MessageOutlined, 
  BellOutlined,
  SafetyCertificateOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import { useAuthStore } from '../store/authStore';

export default function StudentLayout() {
  const { user } = useAuthStore();
  const location = useLocation();

  const navItems = [
    { path: '/student/dashboard', label: 'Bàn Học Của Tôi', icon: <DashboardOutlined /> },
    { path: '/student/enrollments/e1e1e1e1-0001', label: 'Hợp Đồng Học Tập', icon: <ReadOutlined /> },
    { path: '/student/sessions/s3s3s3s3-0003', label: 'Đối Soát Điểm Danh', icon: <CalendarOutlined /> },
    { path: '/student/disputes/new', label: 'Nộp Đơn Khiếu Nại', icon: <AlertOutlined /> },
    { path: '/app/messages', label: 'Tin Nhắn & Chat', icon: <MessageOutlined /> },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans">
      {/* Student Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-100 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
            TH
          </div>
          <div>
            <span className="font-extrabold text-sm text-slate-900 block leading-tight">TutorHub Student</span>
            <span className="text-[10px] text-emerald-600 font-semibold block">Ví Học Viên Bảo Chứng</span>
          </div>
        </div>

        {/* Student Profile Card in Sidebar */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <Avatar src={user?.avatarUrl} size={40} className="border border-emerald-300" />
            <div>
              <span className="text-xs font-bold text-slate-900 block">{user?.name || 'Phạm Minh Tuấn'}</span>
              <span className="text-[11px] text-slate-500 block">Mục tiêu: Toán 9+</span>
            </div>
          </div>
          <div className="mt-3 p-2 bg-emerald-50 rounded-lg border border-emerald-100 text-center">
            <span className="text-[10px] text-emerald-700 block font-semibold">TIỀN TRONG ESCROW BẢO VỆ</span>
            <span className="font-mono-num font-bold text-emerald-800 text-sm">1.600.000 ₫</span>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="p-3 space-y-1 flex-1">
          {navItems.map(item => {
            const isActive = location.pathname.startsWith(item.path.split('/')[2] ? `/${item.path.split('/')[1]}/${item.path.split('/')[2]}` : item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive 
                    ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100' 
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <Link to="/">
            <Button size="small" icon={<ArrowLeftOutlined />} block className="text-xs text-slate-600">
              Về Trang Khám Phá
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Tag color="cyan" className="font-semibold text-xs m-0">Không Gian Học Viên</Tag>
            <span className="text-xs text-slate-400">|</span>
            <span className="text-xs font-medium text-slate-600">Hợp đồng hoạt động: 1 (Toán THPT)</span>
          </div>
          <div className="flex items-center gap-4">
            <Badge count={2} size="small">
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
