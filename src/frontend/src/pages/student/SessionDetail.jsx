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
import Icon from '@/components/ui/Icon';
import Input, { Textarea, Field } from '@/components/ui/Input';
import StateBadge from '@/components/ledger/StateBadge';
import LedgerStrip from '@/components/ledger/LedgerStrip';
import dayjs from 'dayjs';

/**
 * SessionDetail — `/student/sessions/:id` và `/tutor/sessions/:id` (cùng component,
 * phân nhánh theo `isTutor`).
 *
 * Thứ tự khối (SPEC §5.5): identity → hạn chót đối soát → đối soát 2 chiều →
 * nhật ký buổi học → thanh action ở chân trang. Hành động không còn chen giữa
 * header và khối đối soát — khối quan trọng nhất phải nằm ngay dưới hạn chót.
 *
 * Operational Ledger: số ở `LedgerStrip` phẳng, màu = trạng thái, tiền qua
 * `<Money>` (tabular, không `font-mono`), chỉ timestamp mới dùng mono.
 */
export default function SessionDetail() {
  const toast = useToast();
  const confirm = useConfirm();
  const { id } = useParams();
  const { user } = useAuthStore();

  const [session, setSession] = useState(null);
  const [learningRecord, setLearningRecord] = useState(null);
  const [recordInput, setRecordInput] = useState('');
  const [submittingRecord, setSubmittingRecord] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Reschedule Modal State (for Tutor)
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleStartTime, setRescheduleStartTime] = useState('');
  const [rescheduleEndTime, setRescheduleEndTime] = useState('');
  const [submittingReschedule, setSubmittingReschedule] = useState(false);

  // Action loading state
  const [actionLoading, setActionLoading] = useState(false);

  const isTutor = user?.role === 'Tutor';
  const backPath = isTutor ? '/tutor/dashboard' : '/student/dashboard';
  const backLabel = isTutor ? 'Quay lại bàn điều hành' : 'Quay lại bàn học';

  // Modal tự đóng bằng Escape, khớp hành vi `Dialog` dùng chung.
  useEffect(() => {
    if (!showRescheduleModal) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setShowRescheduleModal(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showRescheduleModal]);

  // Load all session details and records
  const loadSessionData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [sessionData, recordData] = await Promise.allSettled([
        sessionService.getSessionById(id),
        sessionService.getLearningRecord(id),
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

  // Handle Direct Reschedule (Tutor)
  const handleDirectReschedule = async (e) => {
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

    const minNotice = dayjs().add(24, 'hour');
    if (startDateTime.isBefore(minNotice)) {
      toast.error('Lịch mới phải được xếp trước giờ bắt đầu ít nhất 24 giờ.');
      return;
    }

    try {
      setSubmittingReschedule(true);
      const proposedStartAt = startDateTime.toDate().toISOString();
      const proposedEndAt = endDateTime.toDate().toISOString();

      await sessionService.scheduleSession(id, proposedStartAt, proposedEndAt);
      toast.success('Đã cập nhật lịch học mới thành công.');
      setShowRescheduleModal(false);
      setRescheduleDate('');
      setRescheduleStartTime('');
      setRescheduleEndTime('');
      await loadSessionData();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Không thể cập nhật lịch học.');
    } finally {
      setSubmittingReschedule(false);
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
              <strong className="tabular-nums">{session.earningAmount?.toLocaleString('vi-VN')} ₫</strong>
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

  const isCancelled = session.status === 'Cancelled';
  const isCompleted = session.status === 'Completed';
  const isScheduled = session.status === 'Scheduled';
  const isFutureScheduled = isScheduled && session.startAt && dayjs(session.startAt).isAfter(dayjs());
  const canCancel = (isScheduled || session.status === 'Unscheduled') && !isCancelled && !isCompleted;
  const canTutorReschedule = isTutor && isFutureScheduled;

  // Chênh lệch giữa hai mốc ISO nên độc lập múi giờ; chỉ dùng để hiện số phút.
  const durationMinutes =
    session.startAt && session.endAt
      ? dayjs(session.endAt).diff(dayjs(session.startAt), 'minute')
      : 0;

  // Màu = trạng thái (SPEC §2.2): đã quyết toán → neutral, đã hoàn → muted,
  // còn nằm trong két ký quỹ → holding.
  const ledgerFigures = [
    {
      key: 'session-fee',
      label: 'Học phí buổi này',
      value: <Money value={session.earningAmount || 0} />,
      tone: isCompleted ? 'default' : isCancelled ? 'muted' : 'holding',
    },
    {
      key: 'session-duration',
      label: 'Thời lượng buổi học',
      value: durationMinutes > 0 ? `${durationMinutes} phút` : '—',
      tone: 'default',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Back Navigation */}
      <Link
        to={backPath}
        className="inline-flex items-center gap-1.5 rounded-brand-md text-caption font-semibold text-fg-secondary hover:text-brand-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary-600 focus-visible:ring-offset-2 transition-colors"
      >
        <Icon name="arrow_back" size="sm" />
        {backLabel}
      </Link>

      {/* 1 · Identity — ai, môn gì, lúc nào, trạng thái */}
      <Card padding="lg">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          {/* "#N" là số thứ tự buổi học, không phải mã kỹ thuật → chữ thường, không mono. */}
          <span className="text-caption font-bold text-fg-secondary">
            Buổi học #{session.sessionNumber || 1}
          </span>
          <StateBadge status={session.status} domain="session" size="md" />
        </div>

        <h1 className="text-headline-1 text-fg m-0">
          {session.subjectName || 'Nội dung buổi học'}
        </h1>

        <p className="text-body-reg text-fg-secondary mt-2 mb-0">
          {session.tutorName ? `Gia sư: ${session.tutorName}` : 'Chưa phân công gia sư'}
          {session.startAt && (
            <>
              <span aria-hidden="true"> · </span>
              {/* Timestamp là phần tử mono duy nhất trên trang. */}
              <span className="font-mono tabular-nums">
                {formatDateTime(session.startAt)}
                {session.endAt ? ` – ${formatDateTime(session.endAt, 'HH:mm')}` : ''}
              </span>
            </>
          )}
          {!session.startAt && ' · Chưa xếp lịch'}
        </p>
      </Card>

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
            <p className="m-0 mt-1">
              Thời gian hủy:{' '}
              <span className="font-mono tabular-nums">
                {formatDateTime(session.cancelledAt)}
              </span>
            </p>
          )}
        </Callout>
      )}

      {/* 2 · Deadline banner — hạn chót phải thấy TRƯỚC khi học viên bắt đầu thao tác */}
      {session.attendanceVerificationDueAt && !isCancelled && !isCompleted && (
        <Callout
          variant="holding"
          title="Cửa sổ đối soát điểm danh 24h"
          icon={<Icon name="timer" size="md" />}
        >
          Hạn chót:{' '}
          <strong className="font-mono tabular-nums">
            {formatDateTime(session.attendanceVerificationDueAt)}
          </strong>{' '}
          — Đối soát 2 chiều giữa học viên và gia sư.
        </Callout>
      )}

      {/* Hai số cứng của buổi học: tiền và thời lượng. Số là nhân vật chính. */}
      <LedgerStrip figures={ledgerFigures} columns={2} />

      {/* 3 · Attendance 2-way Verification — khối quan trọng nhất của màn */}
      {!isCancelled && (
        <AttendanceCard
          session={session}
          onAttendanceSubmitted={handleAttendanceSubmitted}
          isTutor={isTutor}
        />
      )}

      {/* 4 · Learning Record / Notes */}
      <Card padding="lg">
        <CardHeader
          title="Nhật ký buổi học"
          subtitle="Nội dung do gia sư ghi lại sau buổi học."
          icon={<Icon name="menu_book" size="sm" />}
        />
        {learningRecord ? (
          <div className="text-body-reg text-fg-secondary leading-relaxed bg-neutral-50 p-4 rounded-brand-md border border-border space-y-2">
            <p className="m-0 whitespace-pre-line">{learningRecord.content}</p>
            {learningRecord.createdAt && (
              <p className="m-0 text-caption text-fg-muted">
                Ghi nhận lúc:{' '}
                <span className="font-mono tabular-nums">
                  {formatDateTime(learningRecord.createdAt)}
                </span>
              </p>
            )}
          </div>
        ) : (
          <p className="m-0 text-body-reg text-fg-muted bg-neutral-50 border border-dashed border-border rounded-brand-md p-4">
            Chưa có nhật ký học tập nào được ghi nhận cho buổi học này.
          </p>
        )}

        {isTutor && !learningRecord && !isCancelled && (
          <form
            onSubmit={handleCreateLearningRecord}
            className="space-y-3 pt-5 mt-5 border-t border-border"
          >
            <Field
              label="Ghi nhận tiến độ và nội dung bài học (dành cho gia sư)"
              htmlFor="learning-record-input"
              hint="Tối thiểu 10 ký tự. Học viên đọc nội dung này ngay sau buổi học."
            >
              <Textarea
                id="learning-record-input"
                rows={4}
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
              icon={<Icon name="check" size="xs" />}
            >
              Lưu nhật ký buổi học
            </Button>
          </form>
        )}
      </Card>

      {/* 5 · Footer action bar — luôn nằm sau nội dung, không chen giữa các khối.
          `danger-outline` (B-1) cho hủy buổi: hành động phá hủy nhưng không phải
          hành động chính, nên viền đỏ chứ không phải nút đỏ đặc. */}
      {(canTutorReschedule || canCancel) && (
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 rounded-brand-lg border border-border bg-surface shadow-brand-sm px-5 py-4">
          <p className="m-0 text-caption text-fg-muted">
            Các hành động dưới đây chỉ áp dụng cho riêng buổi học này.
          </p>
          <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-2">
            {canTutorReschedule && (
              <Button
                variant="outline"
                size="md"
                onClick={() => setShowRescheduleModal(true)}
                icon={<Icon name="edit_calendar" size="xs" />}
              >
                Đổi lịch học
              </Button>
            )}

            {canCancel && (
              <Button
                variant="danger-outline"
                size="md"
                loading={actionLoading}
                onClick={handleCancelSession}
                icon={<Icon name="cancel" size="xs" />}
              >
                Hủy buổi học này
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Modal: Direct Reschedule (Tutor Only) */}
      {showRescheduleModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="reschedule-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn"
        >
          <button
            type="button"
            aria-label="Đóng cửa sổ"
            className="fixed inset-0 w-full h-full bg-brand-navy-950/50 backdrop-blur-sm cursor-default"
            onClick={() => setShowRescheduleModal(false)}
            tabIndex={-1}
          />
          <div className="relative bg-surface rounded-brand-lg shadow-brand-xl border border-border w-full max-w-md flex flex-col z-10">
            <div className="p-6 pb-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Icon name="calendar_month" size="md" className="text-brand-primary-600" />
                <h3 id="reschedule-modal-title" className="text-headline-3 text-fg font-bold m-0">
                  Đổi lịch học
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRescheduleModal(false)}
                aria-label="Đóng"
                className="text-fg-muted hover:text-fg p-1 rounded-brand-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary-600"
              >
                <Icon name="close" size="sm" />
              </button>
            </div>

            <form onSubmit={handleDirectReschedule} className="p-6 pt-5 space-y-4 text-caption">
              <div className="p-3 bg-holding-subtle rounded-brand-md border border-holding/30 text-xs text-holding-strong">
                <strong>Quy định đổi lịch:</strong> Lịch học mới phải cách thời điểm hiện tại ít nhất 24 giờ. Lịch học sẽ được cập nhật trực tiếp trên hệ thống ngay sau khi lưu.
              </div>

              <Field label="Ngày học mới" htmlFor="reschedule-date" required>
                <Input
                  id="reschedule-date"
                  type="date"
                  value={rescheduleDate}
                  min={dayjs().add(1, 'day').format('YYYY-MM-DD')}
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
                  icon={<Icon name="check" size="xs" />}
                >
                  Lưu lịch mới
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
