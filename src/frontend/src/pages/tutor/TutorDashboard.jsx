import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import sessionService from '@/services/session.service';
import walletService from '@/services/wallet.service';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import { StatsSkeleton } from '@/components/common/Skeleton';
import ErrorState from '@/components/common/ErrorState';

export default function TutorDashboard() {
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    let isMounted = true;
    async function loadTutorData() {
      try {
        setLoading(true);
        const [walletData, sessionList] = await Promise.all([
          walletService.getMyWallet(),
          sessionService.getMySessions(),
        ]);
        if (isMounted) {
          setWallet(walletData);
          setSessions(Array.isArray(sessionList) ? sessionList : []);
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

    loadTutorData();
    return () => {
      isMounted = false;
    };
  }, []);

  const now = new Date();
  const upcomingSessions = sessions
    .filter((s) => s.status === 'Scheduled' && s.startAt && new Date(s.startAt) > now)
    .sort((a, b) => new Date(a.startAt) - new Date(b.startAt));
  const nextSession = upcomingSessions[0] || null;

  // Active students count (unique student names)
  const activeStudents = new Set(sessions.map((s) => s.studentName).filter(Boolean)).size;

  const strikes = user?.absentStrikes ?? 0;

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="h-16 bg-slate-100 rounded-2xl animate-pulse" />
        <StatsSkeleton count={4} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12">
        <ErrorState
          error={error}
          title="Không thể tải Bảng điều hành gia sư"
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {user?.fullName || user?.name || 'Gia sư'}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-financial-available-bg text-financial-available text-xs font-bold border border-financial-available/30 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                verified
              </span>
              Verified Tutor
            </span>
          </div>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Quản trị giảng dạy, theo dõi lịch dạy và doanh thu đối soát theo từng buổi học
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/tutor/availability"
            className="px-4 py-2.5 rounded-xl border border-border-light bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">calendar_month</span>
            Thời Khóa Biểu
          </Link>
          <Link
            to="/tutor/wallet/withdraw"
            className="px-4 py-2.5 rounded-xl bg-financial-available hover:bg-emerald-600 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">payments</span>
            Rút Tiền Ví
          </Link>
        </div>
      </div>

      {/* 4 Operational Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-border-light shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Học Viên Đang Dạy</span>
            <span className="w-8 h-8 rounded-xl bg-brand-indigo-50 text-brand-indigo-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">group</span>
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-monospace-num">
            {activeStudents} <span className="text-xs font-normal text-text-muted">học viên</span>
          </div>
          <p className="text-[11px] text-emerald-600 font-semibold">{sessions.length} buổi học ghi nhận</p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-border-light shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Ký Quỹ Chờ Giải Ngân</span>
            <span className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">hourglass_top</span>
            </span>
          </div>
          <div className="text-2xl font-extrabold text-amber-600 font-monospace-num">
            {formatCurrency(wallet?.pendingBalance || 0)}
          </div>
          <p className="text-[11px] text-text-muted">Đang bảo toàn trong Escrow</p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-border-light shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Thu Nhập Khả Dụng</span>
            <span className="w-8 h-8 rounded-xl bg-emerald-50 text-financial-available flex items-center justify-center">
              <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                account_balance_wallet
              </span>
            </span>
          </div>
          <div className="text-2xl font-extrabold text-financial-available font-monospace-num">
            {formatCurrency(wallet?.availableBalance || 0)}
          </div>
          <p className="text-[11px] text-text-muted">Đã giải ngân sau đối soát (trừ 10% phí)</p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-border-light shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Chỉ Số Kỷ Luật</span>
            <span className="w-8 h-8 rounded-xl bg-emerald-50 text-financial-available flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">verified_user</span>
            </span>
          </div>
          <div
            className={`text-2xl font-extrabold font-monospace-num ${
              strikes > 0 ? 'text-rose-500' : 'text-emerald-600'
            }`}
          >
            {strikes} / 3 Strikes
          </div>
          <p className="text-[11px] text-text-muted">
            {strikes === 0 ? 'Không có vi phạm vắng mặt' : 'Đã ghi nhận vắng mặt'}
          </p>
        </div>
      </div>

      {/* Main Row: Next Class & Quick Links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Next Class Hero Card */}
        <div className="lg:col-span-2 p-6 sm:p-8 rounded-3xl bg-white border border-border-light shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-brand-indigo-600">notifications_active</span>
              Buổi Dạy Sắp Tới
            </h2>
            {nextSession && (
              <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
                Đã Xếp Lịch
              </span>
            )}
          </div>

          {nextSession ? (
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {nextSession.subjectName || 'Buổi dạy chuyên đề'}
                  </h3>
                  <p className="text-xs text-brand-indigo-600 font-semibold mt-0.5">
                    Học viên: {nextSession.studentName || 'Học viên đăng ký'}
                  </p>
                </div>
                <div className="text-xs font-monospace-num font-bold text-slate-700">
                  {formatDateTime(nextSession.startAt, 'HH:mm')} - {formatDateTime(nextSession.endAt, 'HH:mm')} (
                  {formatDateTime(nextSession.startAt, 'DD/MM/YYYY')})
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href="https://meet.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-xl bg-brand-indigo-600 hover:bg-brand-indigo-700 text-white font-bold text-xs shadow-xs transition-colors inline-flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-base">video_camera_front</span>
                  Vào Phòng Dạy Google Meet
                </a>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-slate-50 text-center text-xs text-slate-500 space-y-2">
              <span className="material-symbols-outlined text-3xl text-slate-300 block">event_available</span>
              <p className="font-bold text-slate-700 m-0">Không có buổi dạy nào trong thời gian tới</p>
              <p className="m-0 text-[11px]">Vào mục Thời Khóa Biểu để cập nhật khung giờ rảnh nhận thêm học viên.</p>
            </div>
          )}
        </div>

        {/* Quick Nav Links */}
        <div className="space-y-4">
          <div className="p-6 rounded-3xl bg-white border border-border-light shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Thao Tác Nhanh</h3>
            <div className="space-y-2">
              <Link
                to="/tutor/availability"
                className="p-3.5 rounded-2xl border border-border-light hover:bg-slate-50 flex items-center justify-between text-xs font-bold text-slate-800 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-brand-indigo-600">calendar_month</span>
                  Cài Đặt Lịch Rảnh Tuần
                </span>
                <span className="material-symbols-outlined text-slate-400">chevron_right</span>
              </Link>
              <Link
                to="/tutor/services"
                className="p-3.5 rounded-2xl border border-border-light hover:bg-slate-50 flex items-center justify-between text-xs font-bold text-slate-800 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-600">inventory_2</span>
                  Quản Lý Gói Dịch Vụ
                </span>
                <span className="material-symbols-outlined text-slate-400">chevron_right</span>
              </Link>
              <Link
                to="/tutor/wallet"
                className="p-3.5 rounded-2xl border border-border-light hover:bg-slate-50 flex items-center justify-between text-xs font-bold text-slate-800 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-500">account_balance_wallet</span>
                  Sao Kê & Ví Bảo Chứng
                </span>
                <span className="material-symbols-outlined text-slate-400">chevron_right</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
