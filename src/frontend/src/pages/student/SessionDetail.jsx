import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import sessionService from '@/services/session.service';
import AttendanceCard from '@/components/feedback/AttendanceCard';
import { formatDateTime } from '@/utils/formatters';
import Money from '@/components/ui/Money';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/Dialog';
import ErrorState from '@/components/common/ErrorState';
import { DetailSkeleton } from '@/components/common/Skeleton';
import Card, { CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Callout from '@/components/ui/Callout';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/ui/Icon';
import Input, { Textarea, Field } from '@/components/ui/Input';
import { getSessionStatusMeta } from '@/config/enums';
import dayjs from 'dayjs';

export default function SessionDetail() {
  const toast = useToast();
  const confirm = useConfirm();
  const { id } = useParams();
  const { user } = useAuthStore();

  const [session, setSession] = useState(null);
  const [learningRecord, setLearningRecord] = useState(null);
  const [rescheduleRequests, setRescheduleRequests] = useState([]);
  const [recordInput, setRecordInput] = useState('');
  const [submittingRecord, setSubmittingRecord] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Reschedule Modal State (for Tutor)
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleStartTime, setRescheduleStartTime] = useState('');
  const [rescheduleEndTime, setRescheduleEndTime] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [submittingReschedule, setSubmittingReschedule] = useState(false);

  // Action loading state
  const [actionLoading, setActionLoading] = useState(false);

  const isTutor = user?.role === 'Tutor';
  const backPath = isTutor ? '/tutor/dashboard' : '/student/dashboard';
  const backLabel = isTutor ? 'Quay lại bàn điều hành' : 'Quay lại bàn học';

  // Load all session details, records, and reschedule requests
  const loadSessionData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [sessionData, recordData, reschedulesData] = await Promise.allSettled([
        sessionService.getSessionById(id),
        sessionService.getLearningRecord(id),
        sessionService.getRescheduleRequests(id),
      ]);

      if (sessionData.status === 'fulfilled') {
        setSession(sessionData.value);
        setError(null);
      } else {
        setError(sessionData.reason);
      }

      if (recordData.status === 'fulfilled' && recordData.value) {
        setLearningRecord(recordData.value);
      } else {
        setLearningRecord(null);
      }

      if (reschedulesData.status === 'fulfilled' && Array.isArray(reschedulesData.value)) {
        setRescheduleRequests(reschedulesData.value);
      } else {
        setRescheduleRequests([]);
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadSessionData();
  }, [loadSessionData]);

  // Handle Attendance submission from AttendanceCard
  const handleAttendanceSubmitted = async (outcome) => {
    const updated = await sessionService.submitAttendance(id, outcome);
    setSession(updated);
    toast.success('Đã cập nhật trạng thái điểm danh buổi học.');
  };

  // Handle Learning Record creation (Tutor only)
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

  // Find active Pending Reschedule Request
  const pendingReschedule = rescheduleRequests.find((r) => r.status === 'Pending');

  // Handle Propose Reschedule (Tutor)
  const handleProposeReschedule = async (e) => {
    e.preventDefault();
    if (!rescheduleDate || !rescheduleStartTime || !rescheduleEndTime) {
      toast.error('Vui lòng chọn đầy đủ ngày, giờ bắt đầu và giờ kết thúc.');
      return;
    }

    const startDateTime = dayjs(`${rescheduleDate}T${rescheduleStartTime}:00`);
    const endDateTime = dayjs(`${rescheduleDate}T${rescheduleEndTime}:00`);

    if (!endDateTime.isAfter(startDateTime)) {
      toast.error('Giờ kết thúc phải sau giờ bắt đầu.');
      return;
    }

    if (startDateTime.isBefore(dayjs())) {
      toast.error('Thời gian đề xuất phải ở tương lai.');
      return;
    }

    try {
      setSubmittingReschedule(true);
      const proposedStartAt = startDateTime.toISOString();
      const proposedEndAt = endDateTime.toISOString();

      await sessionService.proposeReschedule(id, proposedStartAt, proposedEndAt, rescheduleReason.trim());
      toast.success('Đã gửi đề xuất dời lịch thành công đến học viên.');
      setShowRescheduleModal(false);
      setRescheduleDate('');
      setRescheduleStartTime('');
      setRescheduleEndTime('');
      setRescheduleReason('');
      await loadSessionData();
    } catch (err) {
      toast.error(err?.message || 'Không thể gửi yêu cầu dời lịch.');
    } finally {
      setSubmittingReschedule(false);
    }
  };

  // Handle Accept Reschedule (Student)
  const handleAcceptReschedule = async (requestId) => {
    const ok = await confirm({
      title: 'Xác nhận đồng ý dời lịch học',
      content: (
        <div className="space-y-2 text-caption text-fg-secondary">
          <p>
            Bạn có chắc chắn muốn chấp thuận thời gian học mới do Gia sư đề xuất?
          </p>
          <div className="bg-neutral-50 p-3 rounded-brand-md border border-border space-y-1">
            <div className="flex justify-between">
              <span>Lịch mới:</span>
              <strong className="text-fg">
                {formatDateTime(pendingReschedule.proposedStartAt)} -{' '}
                {formatDateTime(pendingReschedule.proposedEndAt, 'HH:mm')}
              </strong>
            </div>
            {pendingReschedule.reason && (
              <div className="flex justify-between">
                <span>Ghi chú:</span>
                <span className="text-fg-secondary italic">{pendingReschedule.reason}</span>
              </div>
            )}
          </div>
          <p className="text-[11px] text-fg-muted">
            Lịch buổi học sẽ được cập nhật chính thức trên hệ thống ngay sau khi xác nhận.
          </p>
        </div>
      ),
      confirmText: 'Đồng ý dời lịch',
      cancelText: 'Hủy',
      danger: false,
    });

    if (!ok) return;

    try {
      setActionLoading(true);
      const updatedSession = await sessionService.acceptReschedule(id, requestId);
      setSession(updatedSession);
      toast.success('Đã chấp thuận dời lịch học thành công.');
      await loadSessionData();
    } catch (err) {
      toast.error(err?.message || 'Không thể chấp thuận dời lịch học.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Reject Reschedule (Student)
  const handleRejectReschedule = async (requestId) => {
    let rejectionReason = '';
    const ok = await confirm({
      title: 'Từ chối đề xuất dời lịch học',
      content: (
        <p className="text-caption text-fg-secondary">
          Vui lòng nhập lý do từ chối để gia sư có thể sắp xếp khung giờ khác phù hợp hơn:
        </p>
      ),
      confirmText: 'Từ chối đề xuất',
      cancelText: 'Hủy',
      danger: true,
      requireReason: true,
      reasonLabel: 'Lý do từ chối',
      reasonPlaceholder: 'Ví dụ: Khung giờ này tôi bận học tại trường...',
      minReasonLength: 5,
      onConfirmReason: (val) => {
        rejectionReason = val;
      },
    });

    if (!ok) return;

    try {
      setActionLoading(true);
      await sessionService.rejectReschedule(id, requestId, rejectionReason);
      toast.success('Đã từ chối đề xuất dời lịch.');
      await loadSessionData();
    } catch (err) {
      toast.error(err?.message || 'Không thể từ chối đề xuất dời lịch.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Cancel Session (Student or Tutor)
  const handleCancelSession = async () => {
    let cancelReason = '';
    const ok = await confirm({
      title: 'Hủy buổi học đơn lẻ',
      content: (
        <div className="space-y-3 text-caption text-fg-secondary">
          <p>
            Bạn có chắc chắn muốn hủy <strong>Buổi học #{session.sessionNumber}</strong>?
          </p>
          <div className="bg-holding-subtle text-holding-strong p-3 rounded-brand-md text-caption space-y-1">
            <strong className="block font-semibold">Quy định hoàn tiền ký quỹ (INV-REFUND-004):</strong>
            <p className="text-xs m-0">
              Phần tiền học phí tương ứng (
              <strong className="font-mono">{session.earningAmount?.toLocaleString('vi-VN')} ₫</strong>
              ) sẽ được trừ khỏi két ký quỹ của gia sư và hoàn trả đầy đủ cho học viên.
            </p>
          </div>
          <p className="text-[11px] text-danger-strong font-medium">
            Thao tác hủy buổi học không thể hoàn tác sau khi đã xác nhận.
          </p>
        </div>
      ),
      confirmText: 'Xác nhận hủy buổi học',
      cancelText: 'Quay lại',
      danger: true,
      requireReason: true,
      reasonLabel: 'Lý do hủy buổi học',
      reasonPlaceholder: 'Ví dụ: Có việc bận đột xuất không thể sắp xếp lại lịch...',
      minReasonLength: 5,
      onConfirmReason: (val) => {
        cancelReason = val;
      },
    });

    if (!ok || !cancelReason) return;

    try {
      setActionLoading(true);
      const updated = await sessionService.cancelSession(id, cancelReason);
      setSession(updated);
      toast.success('Đã hủy buổi học và thực hiện hoàn tiền ký quỹ thành công.');
      await loadSessionData();
    } catch (err) {
      toast.error(err?.message || 'Không thể hủy buổi học.');
    } finally {
      setActionLoading(false);
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
          onRetry={loadSessionData}
          backPath={backPath}
          backLabel={backLabel}
        />
      </div>
    );
  }

  const sessionStatusMeta = getSessionStatusMeta(session.status);
  const isCancelled = session.status === 'Cancelled';
  const isCompleted = session.status === 'Completed';
  const isScheduled = session.status === 'Scheduled';
  const isFutureScheduled = isScheduled && session.startAt && dayjs(session.startAt).isAfter(dayjs());
  const canCancel = (isScheduled || session.status === 'Unscheduled') && !isCancelled && !isCompleted;
  const canTutorPropose = isTutor && isFutureScheduled && !pendingReschedule;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Back Navigation */}
      <Link
        to={backPath}
        className="inline-flex items-center gap-1.5 text-caption font-semibold text-fg-secondary hover:text-brand-primary-700 transition-colors"
      >
        <Icon name="arrow_back" size="sm" />
        {backLabel}
      </Link>

      {/* Main Session Card Header */}
      <Card padding="lg" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-caption font-bold text-brand-primary-700 uppercase font-mono">
                Buổi học #{session.sessionNumber || 1}
              </span>
              <Badge variant={sessionStatusMeta.color} size="sm">
                {sessionStatusMeta.label}
              </Badge>
            </div>
            <h1 className="text-headline-1 text-fg mt-0.5">
              {session.subjectName || 'Nội dung buổi học'}
            </h1>
            <p className="text-caption text-fg-muted mt-1">
              {session.tutorName ? `Gia sư: ${session.tutorName} • ` : ''}
              Thời gian: {session.startAt ? formatDateTime(session.startAt) : 'Chưa xếp lịch'}
              {session.endAt ? ` - ${formatDateTime(session.endAt, 'HH:mm')}` : ''}
            </p>
          </div>

          <div className="text-left sm:text-right shrink-0">
            <span className="text-[11px] text-fg-muted block">Học phí buổi học:</span>
            <span className="text-headline-2 text-success-strong font-semibold font-mono">
              <Money value={session.earningAmount || 0} />
            </span>
          </div>
        </div>

        {/* Cancellation Notice if Cancelled */}
        {isCancelled && (
          <Callout
            variant="danger"
            title="Buổi học đã bị hủy"
            icon={<Icon name="cancel" size="md" />}
          >
            {session.cancellationReason ? (
              <p className="m-0">
                Lý do: <strong>{session.cancellationReason}</strong>
              </p>
            ) : (
              <p className="m-0">Buổi học đã được hủy và tiền ký quỹ đã hoàn trả cho học viên.</p>
            )}
            {session.cancelledAt && (
              <span className="text-[11px] block mt-1 opacity-80">
                Thời gian hủy: {formatDateTime(session.cancelledAt)}
              </span>
            )}
          </Callout>
        )}

        {/* Attendance Verification Due Warning */}
        {session.attendanceVerificationDueAt && !isCancelled && !isCompleted && (
          <Callout
            variant="holding"
            title="Cửa sổ đối soát điểm danh 24h"
            icon={<Icon name="timer" size="md" />}
          >
            Hạn chót: <strong>{formatDateTime(session.attendanceVerificationDueAt)}</strong> — Đối soát 2 chiều
          </Callout>
        )}

        {/* Action Controls for Reschedule and Cancellation */}
        {!isCancelled && !isCompleted && (
          <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-border">
            {canTutorPropose && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRescheduleModal(true)}
                icon={<Icon name="edit_calendar" size="xs" />}
              >
                Đề xuất dời lịch
              </Button>
            )}

            {canCancel && (
              <Button
                variant="danger-outline"
                size="sm"
                loading={actionLoading}
                onClick={handleCancelSession}
                icon={<Icon name="cancel" size="xs" />}
              >
                Hủy buổi học này
              </Button>
            )}
          </div>
        )}
      </Card>

      {/* Pending Reschedule Proposal Banner */}
      {pendingReschedule && !isCancelled && (
        <Card className="border-brand-primary-200 bg-brand-primary-50/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="p-2 rounded-brand-md bg-brand-primary-100 text-brand-primary-700 mt-0.5">
                <Icon name="event_repeat" size="md" />
              </span>
              <div>
                <h3 className="text-body font-bold text-fg m-0">
                  {!isTutor
                    ? 'Gia sư đề xuất dời lịch buổi học này'
                    : 'Đã gửi đề xuất dời lịch học (Đang chờ học viên)'}
                </h3>
                <div className="text-caption text-fg-secondary mt-1 space-y-0.5">
                  <p className="m-0">
                    Thời gian mới đề xuất:{' '}
                    <strong className="text-brand-primary-800">
                      {formatDateTime(pendingReschedule.proposedStartAt)} -{' '}
                      {formatDateTime(pendingReschedule.proposedEndAt, 'HH:mm')}
                    </strong>
                  </p>
                  {pendingReschedule.reason && (
                    <p className="m-0 text-xs italic text-fg-muted">
                      Lý do: {pendingReschedule.reason}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Student Action Buttons: Accept / Reject */}
            {!isTutor && (
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  loading={actionLoading}
                  onClick={() => handleRejectReschedule(pendingReschedule.id)}
                  icon={<Icon name="close" size="xs" />}
                >
                  Từ chối
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  loading={actionLoading}
                  onClick={() => handleAcceptReschedule(pendingReschedule.id)}
                  icon={<Icon name="check" size="xs" />}
                >
                  Đồng ý dời lịch
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Attendance 2-way Verification Card */}
      {!isCancelled && (
        <AttendanceCard
          session={session}
          onAttendanceSubmitted={handleAttendanceSubmitted}
          isTutor={isTutor}
        />
      )}

      {/* Learning Record / Notes */}
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

        {isTutor && !learningRecord && !isCancelled && (
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

      {/* Modal: Propose Reschedule (Tutor Only) */}
      {showRescheduleModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="reschedule-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
        >
          <button
            type="button"
            aria-label="Đóng cửa sổ"
            className="fixed inset-0 w-full h-full bg-black/60 backdrop-blur-xs cursor-default"
            onClick={() => setShowRescheduleModal(false)}
            tabIndex={-1}
          />
          <div className="relative bg-surface rounded-brand-xl shadow-brand-xl border border-border w-full max-w-md flex flex-col z-10">
            <div className="p-5 border-b border-border flex items-center justify-between bg-neutral-50/50">
              <div className="flex items-center gap-2">
                <Icon name="calendar_month" size="md" className="text-brand-primary-600" />
                <h3 id="reschedule-modal-title" className="text-headline-3 text-fg font-bold m-0">
                  Đề xuất dời lịch học
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRescheduleModal(false)}
                aria-label="Đóng"
                className="text-fg-muted hover:text-fg p-1 rounded-brand-md transition-colors"
              >
                <Icon name="close" size="sm" />
              </button>
            </div>

            <form onSubmit={handleProposeReschedule} className="p-5 space-y-4 text-caption">
              <Field label="Ngày học mới đề xuất" htmlFor="reschedule-date" required>
                <Input
                  id="reschedule-date"
                  type="date"
                  value={rescheduleDate}
                  min={dayjs().format('YYYY-MM-DD')}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  required
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Giờ bắt đầu" htmlFor="reschedule-start" required>
                  <Input
                    id="reschedule-start"
                    type="time"
                    value={rescheduleStartTime}
                    onChange={(e) => setRescheduleStartTime(e.target.value)}
                    required
                  />
                </Field>
                <Field label="Giờ kết thúc" htmlFor="reschedule-end" required>
                  <Input
                    id="reschedule-end"
                    type="time"
                    value={rescheduleEndTime}
                    onChange={(e) => setRescheduleEndTime(e.target.value)}
                    required
                  />
                </Field>
              </div>

              <Field label="Lý do dời lịch (gửi tới học viên)" htmlFor="reschedule-reason">
                <Textarea
                  id="reschedule-reason"
                  rows={2}
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  placeholder="Ví dụ: Bận đột xuất kỳ thi tại trường, xin phép dời lịch học..."
                />
              </Field>

              <div className="p-3 bg-neutral-50 rounded-brand-md border border-border text-xs text-fg-muted">
                <strong>Lưu ý hợp đồng:</strong> Lịch học chỉ thay đổi sau khi học viên bấm đồng ý trên hệ thống (INV-RESCHED-002).
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => setShowRescheduleModal(false)}
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  loading={submittingReschedule}
                  icon={<Icon name="send" size="xs" />}
                >
                  Gửi đề xuất
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
