import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import sessionService from '@/services/session.service';
import AttendanceCard from '@/components/feedback/AttendanceCard';
import { formatDateTime } from '@/utils/formatters';
import Money from '@/components/ui/Money';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/components/ui/Toast';
import ErrorState from '@/components/common/ErrorState';
import { DetailSkeleton } from '@/components/common/Skeleton';
import Card, { CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Callout from '@/components/ui/Callout';
import Icon from '@/components/ui/Icon';
import { Textarea, Field } from '@/components/ui/Input';

export default function SessionDetail() {
  const toast = useToast();
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
      toast.error('Nội dung nhật ký buổi học cần tối thiểu 10 ký tự.');
      return;
    }
    try {
      setSubmittingRecord(true);
      const res = await sessionService.createLearningRecord(id, recordInput.trim());
      setLearningRecord(res);
      toast.success('Đã lưu nhật ký buổi học thành công.');
      setRecordInput('');
    } catch (err) {
      toast.error(err?.message || 'Không thể lưu nhật ký buổi học.');
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
          backLabel="Quay lại bàn học"
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        to="/student/dashboard"
        className="inline-flex items-center gap-1.5 text-caption font-semibold text-fg-secondary hover:text-brand-primary-700 transition-colors"
      >
        <Icon name="arrow_back" size="sm" />
        Quay lại bàn học
      </Link>

      <Card padding="lg" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-caption font-bold text-brand-primary-700 uppercase font-mono">
              Buổi học #{session.sessionNumber || 1}
            </span>
            <h1 className="text-headline-1 text-fg mt-0.5">
              {session.subjectName || 'Nội dung buổi học'}
            </h1>
            <p className="text-caption text-fg-muted">
              {session.tutorName ? `Gia sư: ${session.tutorName} • ` : ''}
              Thời gian: {session.startAt ? formatDateTime(session.startAt) : 'Chưa xếp lịch'}
              {session.endAt ? ` - ${formatDateTime(session.endAt, 'HH:mm')}` : ''}
            </p>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-[11px] text-fg-muted block">Học phí buổi học:</span>
            <span className="text-headline-2 text-success-strong font-semibold">
              <Money value={session.earningAmount || 0} />
            </span>
          </div>
        </div>

        {session.attendanceVerificationDueAt && (
          <Callout
            variant="holding"
            title="Cửa sổ đối soát điểm danh 24h"
            icon={<Icon name="timer" size="md" />}
          >
            Hạn chót: <strong>{formatDateTime(session.attendanceVerificationDueAt)}</strong> —
            Đối soát 2 chiều
          </Callout>
        )}
      </Card>

      <AttendanceCard session={session} onAttendanceSubmitted={handleAttendanceSubmitted} />

      <Card>
        <CardHeader
          title="Nhật ký buổi học (Learning Record)"
          icon={<Icon name="menu_book" size="sm" />}
        />
        {learningRecord ? (
          <div className="text-caption text-fg-secondary leading-relaxed bg-neutral-50 p-4 rounded-brand-md border border-border space-y-1">
            <p className="m-0">{learningRecord.content}</p>
            {learningRecord.createdAt && (
              <span className="text-[10px] text-fg-muted block pt-1">
                Ghi nhận lúc: {formatDateTime(learningRecord.createdAt)}
              </span>
            )}
          </div>
        ) : (
          <p className="text-caption text-fg-muted italic m-0">
            Chưa có nhật ký học tập nào được ghi nhận cho buổi học này.
          </p>
        )}

        {isTutor && !learningRecord && (
          <form onSubmit={handleCreateLearningRecord} className="space-y-3 pt-3 mt-3 border-t border-border">
            <Field
              label="Ghi nhận tiến độ và nội dung bài học (dành cho gia sư)"
              htmlFor="learning-record-input"
            >
              <Textarea
                id="learning-record-input"
                rows={3}
                value={recordInput}
                onChange={(e) => setRecordInput(e.target.value)}
                placeholder="Tóm tắt nội dung đã dạy, mức độ tiếp thu của học viên và bài tập về nhà..."
              />
            </Field>
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={submittingRecord}
            >
              Lưu nhật ký buổi học
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
