import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import sessionService from '@/services/session.service';
import AttendanceCard from '@/components/feedback/AttendanceCard';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import { message } from 'antd';

export default function SessionDetail() {
  const { id } = useParams();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadSession() {
      try {
        setLoading(true);
        const data = await sessionService.getSessionById(id);
        if (isMounted) {
          setSession(data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.message || 'Không thể tải chi tiết buổi học.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (id) {
      loadSession();
    }
    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleAttendanceSubmitted = async (outcome) => {
    try {
      const updated = await sessionService.submitAttendance(id, outcome);
      setSession(updated);
    } catch (err) {
      message.error(err?.message || 'Không thể ghi nhận điểm danh.');
      throw err;
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center text-slate-500">
        <span className="material-symbols-outlined text-3xl animate-spin text-brand-indigo-600 block mb-2">
          sync
        </span>
        Đang tải thông tin buổi học...
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="max-w-4xl mx-auto space-y-4 py-8">
        <Link
          to="/student/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-brand-indigo-600 transition-colors"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Quay lại Bàn Học
        </Link>
        <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
          <p className="font-bold m-0">{error || 'Không tìm thấy buổi học yêu cầu.'}</p>
        </div>
      </div>
    );
  }

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

      {/* 24-Hour Dual Verification Window Header */}
      <div className="p-6 rounded-3xl bg-white border border-border-light shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-xs font-bold text-brand-indigo-600 uppercase font-monospace-num">
              Buổi Học #{session.sessionNumber || 1}
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-0.5">
              {session.subjectName || 'Nội Dung Buổi Học'}
            </h1>
            <p className="text-xs text-text-muted">
              {session.tutorName ? `Gia sư: ${session.tutorName} • ` : ''}
              Thời gian: {session.startAt ? formatDateTime(session.startAt) : 'Chưa xếp lịch'}
              {session.endAt ? ` - ${formatDateTime(session.endAt, 'HH:mm')}` : ''}
            </p>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-text-muted block">Học phí buổi học:</span>
            <span className="text-xl font-extrabold text-financial-available font-monospace-num">
              {formatCurrency(session.earningAmount || 0)}
            </span>
          </div>
        </div>

        {/* 24-Hour Countdown Alert */}
        {session.attendanceVerificationDueAt && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-3 text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-600 text-xl">timer</span>
              <span>
                Cửa sổ đối soát điểm danh 24h — Hạn chót:{' '}
                <strong>{formatDateTime(session.attendanceVerificationDueAt)}</strong>
              </span>
            </div>
            <span className="font-bold text-amber-700 text-xs">Đối soát 2 chiều</span>
          </div>
        )}
      </div>

      {/* Signature Component: Dual Attendance Verification Card */}
      <AttendanceCard session={session} onAttendanceSubmitted={handleAttendanceSubmitted} />

      {/* Learning Notes Box */}
      {session.learningRecord && (
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
          <label className="text-xs font-bold text-slate-800 block">
            Nhật Ký Buổi Học (Learning Record)
          </label>
          <p className="text-xs text-slate-600 leading-relaxed bg-white p-3 rounded-xl border border-slate-200">
            {session.learningRecord}
          </p>
        </div>
      )}
    </div>
  );
}
