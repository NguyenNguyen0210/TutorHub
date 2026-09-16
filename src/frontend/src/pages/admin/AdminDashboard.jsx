import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import adminService from '@/services/admin.service';
import { formatCurrency } from '@/utils/formatters';
import { StatsSkeleton } from '@/components/common/Skeleton';
import ErrorState from '@/components/common/ErrorState';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadStats() {
      try {
        setLoading(true);
        const data = await adminService.getStats();
        if (isMounted) {
          setStats(data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadStats();
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="h-16 bg-slate-800/60 rounded-2xl animate-pulse" />
        <StatsSkeleton count={4} />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="py-12">
        <ErrorState
          error={error}
          title="Không thể tải dữ liệu điều hành"
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  const { users, tutors, bookings, financials, actionQueue } = stats;

  const actionCards = [
    {
      id: 'disputes',
      title: 'Vụ Tranh Chấp Cần Phân Xử',
      count: `${actionQueue.openDisputes} vụ việc`,
      desc:
        actionQueue.openDisputes > 0
          ? 'Có khiếu nại tranh chấp đang chờ ban trọng tài ra phán quyết.'
          : 'Hiện không có khiếu nại nào đang mở.',
      link: '/admin/audit-logs',
      btnText: 'Xem Sổ Kiểm Toán',
      color: 'border-l-rose-500 bg-rose-50/10 text-rose-400',
    },
    {
      id: 'withdrawals',
      title: 'Lệnh Rút Tiền Gia Sư Chờ Duyệt',
      count: `${actionQueue.pendingWithdrawals} lệnh`,
      desc:
        actionQueue.pendingWithdrawals > 0
          ? 'Gia sư yêu cầu rút thu nhập khả dụng về tài khoản ngân hàng.'
          : 'Không có yêu cầu rút tiền đang chờ duyệt.',
      link: '/admin/audit-logs',
      btnText: 'Kiểm Tra Sổ Cái',
      color: 'border-l-amber-500 bg-amber-50/10 text-amber-400',
    },
    {
      id: 'applications',
      title: 'Hồ Sơ Gia Sư Chờ Xác Minh',
      count: `${actionQueue.pendingTutorApplications} hồ sơ`,
      desc:
        actionQueue.pendingTutorApplications > 0
          ? 'Hồ sơ bằng cấp và thông tin KYC đang chờ phê duyệt huy hiệu.'
          : 'Không có hồ sơ gia sư mới chờ duyệt.',
      link: '/admin/tutor-applications',
      btnText: 'Kiểm Tra Hồ Sơ',
      color: 'border-l-emerald-500 bg-emerald-50/10 text-emerald-400',
    },
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
            Theo dõi tổng quan người dùng, đơn đặt chỗ và hàng đợi vận hành sàn
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-mono border border-slate-700">
            Trạng thái máy chủ: <strong className="text-emerald-400">Sẵn Sàng (Live)</strong>
          </span>
        </div>
      </div>

      {/* Platform Master KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Users */}
        <div className="p-5 rounded-3xl bg-slate-800/80 border border-slate-700 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Tổng Người Dùng</span>
            <span className="material-symbols-outlined text-brand-indigo-400">group</span>
          </div>
          <div className="text-2xl font-extrabold text-white font-monospace-num">
            {users.totalUsers}
          </div>
          <p className="text-[11px] text-emerald-400 font-semibold">
            {users.totalStudents} học viên • {users.totalTutors} gia sư
          </p>
        </div>

        {/* Card 2: Revenue */}
        <div className="p-5 rounded-3xl bg-slate-800/80 border border-slate-700 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Doanh Thu Phí Sàn</span>
            <span className="material-symbols-outlined text-emerald-400">payments</span>
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 font-monospace-num">
            {formatCurrency(financials.totalRevenue)}
          </div>
          <p className="text-[11px] text-slate-400">
            Tỷ lệ phí sàn: {(financials.platformCommissionRate * 100).toFixed(0)}%
          </p>
        </div>

        {/* Card 3: Total Bookings */}
        <div className="p-5 rounded-3xl bg-slate-800/80 border border-slate-700 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Tổng Đơn Đặt Chỗ</span>
            <span
              className="material-symbols-outlined text-blue-400"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              receipt
            </span>
          </div>
          <div className="text-2xl font-extrabold text-blue-400 font-monospace-num">
            {bookings.totalBookings}
          </div>
          <p className="text-[11px] text-slate-400">
            {bookings.paidBookings} đã thanh toán • {bookings.holdingBookings} đang giữ chỗ
          </p>
        </div>

        {/* Card 4: Tutors Active */}
        <div className="p-5 rounded-3xl bg-slate-800/80 border border-slate-700 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Gia Sư Hoạt Động</span>
            <span className="material-symbols-outlined text-amber-400">verified</span>
          </div>
          <div className="text-2xl font-extrabold text-amber-400 font-monospace-num">
            {tutors.activeTutors} / {tutors.totalTutors}
          </div>
          <p className="text-[11px] text-slate-400">
            {tutors.pendingApplications} hồ sơ đang chờ xét duyệt
          </p>
        </div>
      </div>

      {/* Urgent Action Queues */}
      <div className="p-6 rounded-3xl bg-slate-800/80 border border-slate-700 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-rose-400">emergency</span>
          Hàng Đợi Vận Hành Cần Xử Lý
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {actionCards.map((q) => (
            <div
              key={q.id}
              className={`p-5 rounded-2xl border border-slate-700 border-l-4 ${q.color} space-y-3 flex flex-col justify-between`}
            >
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-white">{q.title}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900 text-slate-300">
                    {q.count}
                  </span>
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
