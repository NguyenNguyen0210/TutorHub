import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import enrollmentService from '@/services/enrollment.service';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import { SESSION_STATUS, getSessionStatusMeta } from '@/config/enums';
import ErrorState from '@/components/common/ErrorState';

export default function EnrollmentDetail() {
  const { id } = useParams();
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadEnrollment() {
      try {
        setLoading(true);
        const data = await enrollmentService.getEnrollmentById(id);
        if (isMounted) {
          setEnrollment(data);
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

    if (id) {
      loadEnrollment();
    }
    return () => {
      isMounted = false;
    };
  }, [id]);

  const STATUS_BADGE_CLASS = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    processing: 'bg-blue-50 text-blue-700 border-blue-200',
    default: 'bg-slate-100 text-slate-600 border-slate-200',
    error: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  const getStatusBadge = (session) => {
    if (session.hasAttendanceConflict) {
      return (
        <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-300 text-xs font-bold">
          Bất đồng điểm danh ⚠️
        </span>
      );
    }
    if (session.status === SESSION_STATUS.SCHEDULED && session.attendanceVerificationDueAt) {
      const isWindowOpen = new Date(session.attendanceVerificationDueAt) > new Date();
      if (isWindowOpen && !session.studentAttendance) {
        return (
          <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold">
            Chờ Điểm Danh 24H ⏰
          </span>
        );
      }
    }
    const meta = getSessionStatusMeta(session.status);
    const badgeClass = STATUS_BADGE_CLASS[meta.color] ?? STATUS_BADGE_CLASS.default;
    return (
      <span className={`px-2.5 py-1 rounded-full border text-xs font-bold ${badgeClass}`}>
        {meta.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center text-slate-500">
        <span className="material-symbols-outlined text-3xl animate-spin text-brand-indigo-600 block mb-2">
          sync
        </span>
        Đang tải chi tiết hợp đồng...
      </div>
    );
  }

  if (error || !enrollment) {
    return (
      <div className="max-w-4xl mx-auto space-y-4 py-8">
        <Link
          to="/student/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-brand-indigo-600 transition-colors"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Quay lại Bàn Học
        </Link>
        <ErrorState
          error={error}
          title="Không tìm thấy hợp đồng học tập"
          backPath="/student/dashboard"
          backLabel="Về Bàn Học"
        />
      </div>
    );
  }

  const sessions = Array.isArray(enrollment.sessions) ? enrollment.sessions : [];
  const completedCount = sessions.filter((s) => s.status === SESSION_STATUS.COMPLETED).length;
  const progressPercent = Math.round((completedCount / (enrollment.totalSessions || 1)) * 100);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Top Back Navigation */}
      <Link
        to="/student/dashboard"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-brand-indigo-600 transition-colors"
      >
        <span className="material-symbols-outlined text-base">arrow_back</span>
        Quay lại Bàn Học
      </Link>

      {/* Header with Contract Summary */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-border-light shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="font-monospace-num text-xs font-bold text-brand-indigo-600 block">
              HỢP ĐỒNG #{enrollment.id}
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
              {enrollment.serviceTitle || enrollment.subjectName || 'Hợp Đồng Học Tập'}
            </h1>
            <p className="text-xs text-text-muted mt-0.5">
              Gia sư phụ trách: <strong>{enrollment.tutorName || enrollment.sessions?.[0]?.tutorName || 'Gia sư'}</strong>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1.5 rounded-full border text-xs font-bold ${
                enrollment.status === 'Active'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-blue-50 border-blue-200 text-blue-700'
              }`}
            >
              {enrollment.status === 'Active' ? 'Đang Hiệu Lực (Escrow Locked)' : enrollment.status}
            </span>
          </div>
        </div>

        {/* 4 Financial Micro-Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs border-t border-slate-100 pt-4">
          <div className="p-3 bg-slate-50 rounded-2xl">
            <span className="text-slate-500 block">Tổng học phí:</span>
            <span className="font-extrabold text-slate-900 font-monospace-num">
              {formatCurrency(enrollment.totalPrice)}
            </span>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl">
            <span className="text-slate-500 block">Số buổi:</span>
            <span className="font-extrabold text-slate-900 font-monospace-num">
              {enrollment.totalSessions} Buổi ({enrollment.sessionDurationMinutes || 60}p/buổi)
            </span>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl">
            <span className="text-slate-500 block">Tiến độ hoàn thành:</span>
            <span className="font-extrabold text-brand-indigo-600 font-monospace-num">
              {completedCount} / {enrollment.totalSessions} Buổi
            </span>
          </div>
          <div className="p-3 bg-emerald-50 rounded-2xl">
            <span className="text-emerald-700 block font-semibold">Tỷ lệ phí sàn:</span>
            <span className="font-extrabold text-financial-available font-monospace-num">
              {(Number(enrollment.platformFeeRate || 0.1) * 100).toFixed(0)}% (Snapshot)
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-slate-600">
            <span>Tiến độ hợp đồng:</span>
            <span className="font-bold font-monospace-num">{progressPercent}%</span>
          </div>
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-brand-indigo-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Signature Component 5: Session Breakdown Timeline §3.5 */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-border-light shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-brand-indigo-600">timeline</span>
              Lộ Trình & Tiến Độ Phân Rã {enrollment.totalSessions} Buổi Học (Session Timeline)
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              Mỗi buổi học tương ứng một khoản ký quỹ riêng biệt được giải ngân sau khi đối soát thành công
            </p>
          </div>
          <span className="text-xs font-bold text-slate-500 font-mono">
            Tự động cấp phát qua EnrollmentSessionAllocator
          </span>
        </div>

        {/* Sessions List */}
        <div className="space-y-3">
          {sessions.map((sess) => (
            <div
              key={sess.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                sess.hasAttendanceConflict
                  ? 'border-rose-300 bg-rose-50/40'
                  : sess.status === SESSION_STATUS.COMPLETED
                  ? 'border-emerald-200 bg-emerald-50/20'
                  : sess.status === SESSION_STATUS.SCHEDULED
                  ? 'border-blue-200 bg-blue-50/20'
                  : 'border-slate-200 bg-slate-50/50'
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center font-monospace-num font-extrabold text-sm shrink-0 shadow-xs ${
                    sess.status === SESSION_STATUS.COMPLETED
                      ? 'bg-emerald-500 text-white'
                      : sess.status === SESSION_STATUS.SCHEDULED
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  #{sess.sessionNumber}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-xs text-slate-900">
                      Buổi học #{sess.sessionNumber}
                    </span>
                    {getStatusBadge(sess)}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Thời gian:{' '}
                    {sess.startAt ? formatDateTime(sess.startAt, 'DD/MM/YYYY HH:mm') : 'Chưa xếp lịch'}
                    {sess.endAt ? ` - ${formatDateTime(sess.endAt, 'HH:mm')}` : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 text-xs">
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Ký quỹ buổi:</span>
                  <span className="font-extrabold text-slate-800 font-monospace-num">
                    {formatCurrency(sess.earningAmount || 0)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to={`/student/sessions/${sess.id}`}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-white text-slate-700 font-bold text-xs transition-colors flex items-center gap-1"
                  >
                    <span>Chi tiết</span>
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </Link>

                  {sess.hasAttendanceConflict && (
                    <Link
                      to={`/student/disputes/new?sessionId=${sess.id}`}
                      className="px-3 py-1.5 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition-colors"
                    >
                      Khiếu nại
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
