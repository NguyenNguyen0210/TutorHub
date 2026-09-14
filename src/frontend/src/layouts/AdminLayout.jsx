import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Tag, Button } from 'antd';
import { 
  DashboardOutlined, 
  AuditOutlined, 
  TeamOutlined, 
  AlertOutlined, 
  SafetyCertificateOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';

export default function AdminLayout() {
  const location = useLocation();

  const navItems = [
    { path: '/admin/dashboard', label: 'Bảng Điều Hành KPI', icon: <DashboardOutlined /> },
    { path: '/admin/tutor-applications', label: 'Duyệt Hồ Sơ Gia Sư', icon: <SafetyCertificateOutlined /> },
    { path: '/admin/disputes/ba07ba07-0001', label: 'Bàn Trọng Tài DEC-S8-025', icon: <AlertOutlined /> },
    { path: '/admin/users', label: 'Quản Lý Người Dùng & Strikes', icon: <TeamOutlined /> },
    { path: '/admin/audit-logs', label: 'Sổ Cái Kiểm Toán Bất Biến', icon: <AuditOutlined /> },
  ];

  return (
    <div className="min-h-screen flex bg-slate-900 font-sans text-slate-200">
      {/* Admin Dark Slate Sidebar */}
      <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-800 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white font-black">
            GOV
          </div>
          <div>
            <span className="font-extrabold text-sm text-white block leading-tight">TutorHub Governance</span>
            <span className="text-[10px] text-indigo-400 font-semibold block">Quản Trị & Kiểm Toán Sàn</span>
          </div>
        </div>

        {/* Master Policy Banner */}
        <div className="p-3 mx-3 mt-3 bg-slate-900 rounded-lg border border-slate-800 text-[11px] text-slate-400">
          <span className="text-emerald-400 font-bold block mb-0.5">Phí sàn: 10% (Version 2)</span>
          <span>Bất biến: Refund ≡ Recovery + Reversal</span>
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

      {/* Main Admin Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-900">
        <header className="h-14 bg-slate-950/80 border-b border-slate-800 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <Tag color="purple" className="text-xs m-0">Quản Trị Viên Toàn Quyền</Tag>
            <span className="text-xs text-slate-500">|</span>
            <span className="text-xs text-slate-400">Hệ thống sổ cái: <span className="text-emerald-400 font-bold">Append-Only Active</span></span>
          </div>
          <div className="text-xs text-slate-400 font-mono-num">
            UTC+7 (Asia/Ho_Chi_Minh)
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
