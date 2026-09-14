import React from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '@/utils/formatters';

export default function AdminDashboard() {
  const kpis = {
    gmv: 1420000000,
    platformRevenue: 142000000,
    escrowLocked: 385000000,
    resolutionRate: 98.4,
  };

  const actionQueues = [
    {
      id: 'q1',
      title: 'Vụ Tranh Chấp Cần Phân Xử',
      count: '2 vụ việc',
      desc: 'Khiếu nại bất đồng điểm danh #ba07ba07-0001 cần trọng tài',
      link: '/admin/disputes/ba07ba07-0001',
      btnText: 'Phân Xử Ngay',
      color: 'border-l-rose-500 bg-rose-50/10 text-rose-400',
    },
    {
      id: 'q2',
      title: 'Lệnh Rút Tiền Gia Sư Chờ Duyệt',
      count: '3 lệnh',
      desc: 'Tổng số tiền: 2.100.000 ₫ (Lệnh WTH-99214 Vietcombank)',
      link: '/admin/audit-logs',
      btnText: 'Duyệt Lệnh',
      color: 'border-l-amber-500 bg-amber-50/10 text-amber-400',
    },
    {
      id: 'q3',
      title: 'Hồ Sơ Gia Sư Chờ Xác Minh',
      count: '4 hồ sơ',
      desc: 'Văn bằng ĐHSP ThS. Nguyễn Văn An và Trần Thị Bích',
      link: '/admin/tutor-applications',
      btnText: 'Kiểm Tra Hồ Sơ',
      color: 'border-l-emerald-500 bg-emerald-50/10 text-emerald-400',
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Bảng Điều Hành Quản Trị Sàn & Giám Sát Dòng Tiền
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Theo dõi tổng quan tài chính, dòng tiền Escrow ký quỹ và các hàng đợi vận hành sàn
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-mono border border-slate-700">
            Audit Ledger: <strong className="text-emerald-400">Synced (Block #1042)</strong>
          </span>
        </div>
      </div>

      {/* Platform Master KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: GMV */}
        <div className="p-5 rounded-3xl bg-slate-800/80 border border-slate-700 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Tổng GMV Khóa Học</span>
            <span className="material-symbols-outlined text-brand-indigo-400">trending_up</span>
          </div>
          <div className="text-2xl font-extrabold text-white font-monospace-num">
            {formatCurrency(kpis.gmv)}
          </div>
          <p className="text-[11px] text-emerald-400 font-semibold">+14.2% so với tháng trước</p>
        </div>

        {/* Card 2: Revenue */}
        <div className="p-5 rounded-3xl bg-slate-800/80 border border-slate-700 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Doanh Thu Phí Sàn 10%</span>
            <span className="material-symbols-outlined text-emerald-400">payments</span>
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 font-monospace-num">
            {formatCurrency(kpis.platformRevenue)}
          </div>
          <p className="text-[11px] text-slate-400">Chính sách FeePolicyVersion: 2</p>
        </div>

        {/* Card 3: Escrow Locked */}
        <div className="p-5 rounded-3xl bg-slate-800/80 border border-slate-700 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Tiền Ký Quỹ Escrow</span>
            <span className="material-symbols-outlined text-blue-400" style={{ fontVariationSettings: "'FILL' 1" }}>shield</span>
          </div>
          <div className="text-2xl font-extrabold text-blue-400 font-monospace-num">
            {formatCurrency(kpis.escrowLocked)}
          </div>
          <p className="text-[11px] text-slate-400">Tạm giữ an toàn 192 hợp đồng</p>
        </div>

        {/* Card 4: Resolution Rate */}
        <div className="p-5 rounded-3xl bg-slate-800/80 border border-slate-700 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Tỷ Lệ Giải Quyết Tranh Chấp</span>
            <span className="material-symbols-outlined text-amber-400">gavel</span>
          </div>
          <div className="text-2xl font-extrabold text-amber-400 font-monospace-num">
            {kpis.resolutionRate}%
          </div>
          <p className="text-[11px] text-slate-400">Thời gian xử lý TB: 4.2 giờ</p>
        </div>
      </div>

      {/* Urgent Action Queues */}
      <div className="p-6 rounded-3xl bg-slate-800/80 border border-slate-700 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-rose-400">emergency</span>
          Hàng Đợi Vận Hành Cần Phê Duyệt Ngay
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {actionQueues.map((q) => (
            <div
              key={q.id}
              className={`p-5 rounded-2xl border border-slate-700 border-l-4 ${q.color} space-y-3 flex flex-col justify-between`}
            >
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-white">{q.title}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900 text-slate-300">{q.count}</span>
                </div>
                <p className="text-xs text-slate-400 leading-normal">{q.desc}</p>
              </div>

              <Link
                to={q.link}
                className="w-full py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                {q.btnText}
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
