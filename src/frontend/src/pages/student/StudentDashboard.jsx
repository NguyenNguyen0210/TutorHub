import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import enrollmentService from '@/services/enrollment.service';
import sessionService from '@/services/session.service';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import { StatsSkeleton } from '@/components/common/Skeleton';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';

export default function StudentDashboard() {
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        const [enrollmentRes, sessionList] = await Promise.all([
          enrollmentService.getMyEnrollments({ pageSize: 20 }),
          sessionService.getMySessions(),
        ]);
        if (isMounted) {
          setEnrollments(enrollmentRes?.items || []);
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

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const activeEnrollments = enrollments.filter((e) => e.status === 'Active');
  const now = new Date();

  // Next scheduled session in the future
  const upcomingSessions = sessions
    .filter((s) => s.status === 'Scheduled' && s.startAt && new Date(s.startAt) > now)
    .sort((a, b) => new Date(a.startAt) - new Date(b.startAt));
  const nextSession = upcomingSessions[0] || null;

  // Actionable session: past session needing attendance confirmation
  const pastSessions = sessions
    .filter((s) => s.status === 'Scheduled' && s.endAt && new Date(s.endAt) <= now)
    .sort((a, b) => new Date(b.endAt) - new Date(a.endAt));
  const actionableSession = pastSessions[0] || null;

  // Escrow remaining in active contracts
  const escrowRemaining = activeEnrollments.reduce((sum, e) => {
    const total = Number(e.totalPrice) || 0;
    const totalSess = Number(e.totalSessions) || 1;
    const completed = Number(e.completedSessions) || 0;
    const remainingRatio = Math.max(0, (totalSess - completed) / totalSess);
    return sum + total * remainingRatio;
  }, 0);

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
          title="Không thể tải Bàn học của bạn"
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Chào mừng trở lại, {user?.fullName || user?.name || 'Học viên'}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Không gian học tập bảo chứng Escrow hai chiều • An tâm chất lượng
          </p>
        </div>
        <Link
          to="/tutors"
          className="px-4 py-2.5 rounded-xl bg-brand-indigo-600 hover:bg-brand-indigo-700 text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-base">search</span>
          Tìm Thêm Gia Sư
        </Link>
      </div>

      {/* 4 Signature Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Contracts */}
        <div className="p-5 rounded-3xl bg-white border border-border-light shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Hợp Đồng Đang Học</span>
            <span className="w-8 h-8 rounded-xl bg-brand-indigo-50 text-brand-indigo-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">school</span>
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-monospace-num">
            {activeEnrollments.length}{' '}
            <span className="text-xs font-normal text-text-muted">hợp đồng</span>
          </div>
          <p className="text-[11px] text-emerald-600 font-semibold">
            {activeEnrollments.length > 0 ? 'Đang triển khai giảng dạy' : 'Chưa có hợp đồng nào'}
          </p>
        </div>

        {/* Card 2: Escrow Protected */}
        <div className="p-5 rounded-3xl bg-white border border-border-light shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Học Phí Trong Escrow</span>
            <span className="w-8 h-8 rounded-xl bg-emerald-50 text-financial-available flex items-center justify-center">
              <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                shield
              </span>
            </span>
          </div>
          <div className="text-2xl font-extrabold text-financial-available font-monospace-num">
            {formatCurrency(escrowRemaining)}
          </div>
          <p className="text-[11px] text-text-muted">Bảo chứng an toàn trong ví sàn</p>
        </div>

        {/* Card 3: Next Session */}
        <div className="p-5 rounded-3xl bg-white border border-border-light shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Buổi Học Sắp Tới</span>
            <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">calendar_clock</span>
            </span>
          </div>
          <div className="text-sm font-extrabold text-slate-900">
            {nextSession?.startAt ? formatDateTime(nextSession.startAt, 'DD/MM HH:mm') : 'Chưa có lịch mới'}
          </div>
          <p className="text-[11px] text-brand-indigo-600 font-semibold line-clamp-1">
            {nextSession?.tutorName || (nextSession?.subjectName ? `Môn: ${nextSession.subjectName}` : '—')}
          </p>
        </div>

        {/* Card 4: Strike Metric */}
        <div className="p-5 rounded-3xl bg-white border border-border-light shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Chỉ Số Tín Nhiệm</span>
            <span className="w-8 h-8 rounded-xl bg-emerald-50 text-financial-available flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">verified</span>
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
            {strikes === 0 ? 'Uy tín 100% • Không vi phạm vắng mặt' : 'Đã ghi nhận vắng mặt'}
          </p>
        </div>
      </div>

      {/* Actionable Urgent Attendance Banner (if any session finished and waiting) */}
      {actionableSession && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500/10 via-amber-50 to-white border-2 border-amber-500/30 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <span className="material-symbols-outlined text-2xl">pending_actions</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-950">
                Buổi học #{actionableSession.sessionNumber} ({actionableSession.subjectName}) đã diễn ra — Vui lòng đối soát điểm danh!
              </h3>
              <p className="text-xs text-amber-800 mt-0.5">
                Cửa sổ đối soát 24h đang mở để bảo vệ quyền lợi học viên trước khi giải ngân.
              </p>
            </div>
          </div>
          <Link
            to={`/student/sessions/${actionableSession.id}`}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 shrink-0"
          >
            <span className="material-symbols-outlined text-base">check_circle</span>
            Xác Nhận Điểm Danh Ngay
          </Link>
        </div>
      )}

      {/* Main Grid: Active Enrollments */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Danh Sách Hợp Đồng Học Tập</h2>
          <span className="text-xs text-slate-500 font-mono">Tổng: {enrollments.length} hợp đồng</span>
        </div>

        {enrollments.length === 0 ? (
          <EmptyState
            icon="school"
            title="Bạn chưa có hợp đồng học tập nào"
            description="Tìm kiếm gia sư phù hợp và đặt mua gói học để bắt đầu hành trình học tập có bảo chứng."
            actionLabel="Khám phá gia sư ngay"
            actionPath="/tutors"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {enrollments.map((enr) => (
              <div
                key={enr.id}
                className="p-6 rounded-3xl bg-white border border-border-light shadow-xs space-y-4 hover:border-brand-indigo-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={enr.tutorAvatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${enr.tutorName}`}
                      alt={enr.tutorName}
                      className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shrink-0"
                    />
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900">{enr.serviceTitle || enr.subjectName}</h3>
                      <p className="text-xs text-brand-indigo-600 font-semibold mt-0.5">Gia sư: {enr.tutorName}</p>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      enr.status === 'Active'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : enr.status === 'Completed'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {enr.status === 'Active' ? 'Đang học' : enr.status === 'Completed' ? 'Hoàn thành' : enr.status}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Tiến độ học tập:</span>
                    <span className="font-bold font-monospace-num">
                      {enr.completedSessions} / {enr.totalSessions} buổi
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-brand-indigo-600 h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, Math.round(((enr.completedSessions || 0) / (enr.totalSessions || 1)) * 100))}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <span className="font-monospace-num font-bold text-slate-700">
                    {formatCurrency(enr.totalPrice)}
                  </span>
                  <Link
                    to={`/student/enrollments/${enr.id}`}
                    className="font-bold text-brand-indigo-600 hover:text-brand-indigo-800 flex items-center gap-1"
                  >
                    Chi tiết hợp đồng
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
