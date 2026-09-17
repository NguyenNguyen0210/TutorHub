import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import sessionService from '@/services/session.service';
import AttendanceCard from '@/components/feedback/AttendanceCard';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import { useAuthStore } from '@/store/authStore';
import { message } from 'antd';
import ErrorState from '@/components/common/ErrorState';
import { DetailSkeleton } from '@/components/common/Skeleton';

export default function SessionDetail() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const [session, setSession] = useState(null);
  const [learningRecord, setLearningRecord] = useState(null);
  const [recordInput, setRecordInput] = useState('');
  const [submittingRecord, setSubmittingRecord] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isTutor = user?.role === 'Tutor';

  useEffect(() => {
    let isMounted = true;
    async function loadSessionAndRecord() {
      try {
        setLoading(true);
        const [sessionData, recordData] = await Promise.allSettled([
          sessionService.getSessionById(id),
          sessionService.getLearningRecord(id),
        ]);

        if (isMounted) {
          if (sessionData.status === 'fulfilled') {
            setSession(sessionData.value);
            setError(null);
          } else {
            setError(sessionData.reason);
          }

          if (recordData.status === 'fulfilled' && recordData.value) {
            setLearningRecord(recordData.value);
          }
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
      loadSessionAndRecord();
    }
    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleAttendanceSubmitted = async (outcome) => {
    const updated = await sessionService.submitAttendance(id, outcome);
    setSession(updated);
  };

  const handleCreateLearningRecord = async (e) => {
    e.preventDefault();
    if (!recordInput.trim() || recordInput.trim().length < 10) {
      message.error('Nội dung nhật ký buổi học cần tối thiểu 10 ký tự.');
      return;
    }
    try {
      setSubmittingRecord(true);
      const res = await sessionService.createLearningRecord(id, recordInput.trim());
      setLearningRecord(res);
      message.success('Đã lưu nhật ký buổi học thành công.');
      setRecordInput('');
    } catch (err) {
      message.error(err?.message || 'Không thể lưu nhật ký buổi học.');
    } finally {
      setSubmittingRecord(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <DetailSkeleton />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <ErrorState
          error={error || new Error('Không tìm thấy thông tin buổi học.')}
          title="Không thể tải chi tiết buổi học"
          onRetry={() => window.location.reload()}
          backPath="/student/dashboard"
          backLabel="Quay lại Bàn Học"
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Back button */}
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
      <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
        <span className="text-xs font-bold text-slate-800 block flex items-center gap-1.5">
          <span className="material-symbols-outlined text-base text-brand-indigo-600">menu_book</span>
          Nhật Ký Buổi Học (Learning Record)
        </span>
        {learningRecord ? (
          <div className="text-xs text-slate-700 leading-relaxed bg-white p-4 rounded-xl border border-slate-200 space-y-1">
            <p className="m-0">{learningRecord.content}</p>
            {learningRecord.createdAt && (
              <span className="text-[10px] text-slate-400 block pt-1">
                Ghi nhận lúc: {formatDateTime(learningRecord.createdAt)}
              </span>
            )}
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic m-0">
            Chưa có nhật ký học tập nào được ghi nhận cho buổi học này.
          </p>
        )}

        {/* Tutor input for learning record */}
        {isTutor && !learningRecord && (
          <form onSubmit={handleCreateLearningRecord} className="space-y-2 pt-2 border-t border-slate-200">
            <label htmlFor="learning-record-input" className="text-xs font-semibold text-slate-700 block">
              Ghi nhận tiến độ và nội dung bài học (dành cho Gia sư):
            </label>
            <textarea
              id="learning-record-input"
              rows={3}
              value={recordInput}
              onChange={(e) => setRecordInput(e.target.value)}
              placeholder="Tóm tắt nội dung đã dạy, mức độ tiếp thu của học viên và bài tập về nhà..."
              className="w-full p-3 rounded-xl border border-slate-300 text-xs text-slate-800 focus:ring-2 focus:ring-brand-indigo-500 outline-none"
            />
            <button
              type="submit"
              disabled={submittingRecord}
              className="py-2 px-4 rounded-xl bg-brand-indigo-600 hover:bg-brand-indigo-700 text-white font-bold text-xs transition-colors"
            >
              {submittingRecord ? 'Đang lưu...' : 'Lưu Nhật Ký Buổi Học'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
