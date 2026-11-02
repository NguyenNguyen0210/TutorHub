import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import chatService from '@/services/chat.service';
import tutorService from '@/services/tutor.service';
import { summarizeTuition } from '@/utils/studentDashboard';
import dayjs from 'dayjs';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/store/authStore';
import enrollmentService from '@/services/enrollment.service';
import sessionService from '@/services/session.service';
import { formatDateTime } from '@/utils/formatters';
import Money from '@/components/ui/Money';
import { SESSION_STATUS } from '@/config/enums';
import ErrorState from '@/components/common/ErrorState';
import Card, { CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import Icon from '@/components/ui/Icon';
import { Progress } from '@/components/ui/Callout';
import { DetailSkeleton } from '@/components/common/Skeleton';
import { Textarea, Field } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import StateBadge, { getStateMeta } from '@/components/common/StateBadge';
import StretchedCardLink from '@/components/ui/StretchedCardLink';
import { useConfirm } from '@/components/ui/Dialog';
import { useQueryClient } from '@tanstack/react-query';
import disputeService from '@/services/dispute.service';

/** Lộ trình học tập — dùng trạng thái và thao tác hiện có của hợp đồng. */
const TONE_CLASS = {
  success: {
    border: 'border-l-success',
    bar: 'bg-success',
    chip: 'bg-success-subtle text-success-strong',
  },
  holding: {
    border: 'border-l-holding',
    bar: 'bg-holding',
    chip: 'bg-holding-subtle text-holding-strong',
  },
  info: {
    border: 'border-l-info',
    bar: 'bg-info',
    chip: 'bg-info-subtle text-info',
  },
  danger: {
    border: 'border-l-danger',
    bar: 'bg-danger',
    chip: 'bg-danger-subtle text-danger-strong',
  },
  neutral: {
    border: 'border-l-neutral-300',
    bar: 'bg-neutral-300',
    chip: 'bg-neutral-100 text-fg-secondary',
  },
};

function sessionTone(session) {
  if (session.hasIssueReport) return TONE_CLASS.danger;
  const { color } = getStateMeta('session', session.status);
  return TONE_CLASS[color] || TONE_CLASS.neutral;
}

export default function EnrollmentDetail() {
  const toast = useToast();
  const confirm = useConfirm();
  const client = useQueryClient();
  const [cancelling, setCancelling] = useState(false);
  const navigate = useNavigate();
  const [sessionFilter, setSessionFilter] = useState('all');
  const [visibleCount, setVisibleCount] = useState(5);
  const [openingChat, setOpeningChat] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return undefined;
    const timeout = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  const { id } = useParams();
  const { role } = useAuthStore();
  const isTutor = role === 'Tutor';
  const backPath = isTutor ? '/tutor/schedule' : '/student/dashboard';
  const backLabel = isTutor ? 'Quay lại lịch dạy' : 'Quay lại bàn học';

  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Scheduling states (for Tutor)
  const [schedulingSessionId, setSchedulingSessionId] = useState(null);
  const [scheduleDatetime, setScheduleDatetime] = useState('');
  const [submittingSchedule, setSubmittingSchedule] = useState(false);

  const minNoticeString = useMemo(() => {
    return dayjs().add(2, 'hour').add(5, 'minute').format('YYYY-MM-DDTHH:mm');
  }, []);

  // Review states
  const [review, setReview] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const loadEnrollment = useCallback(async () => {
    try {
      setLoading(true);
      // The existing summary endpoint supplies course/tutor metadata absent in the detail DTO.
      const [data, summaries] = await Promise.all([
        enrollmentService.getEnrollmentById(id),
        enrollmentService.getAllMyEnrollments().catch(() => ({ items: [] })),
      ]);
      const summary = summaries.items.find(item => item.id === id) || {};
      setEnrollment({ ...summary, ...data });
      setError(null);

      // If enrollment is completed, fetch any existing review
      if (data?.status === 'Completed') {
        try {
          setReviewLoading(true);
          const rev = await enrollmentService.getReview(id);
          if (rev?.id) {
            setReview(rev);
          }
        } catch {
          // No review yet or not found - silent
          setReview(null);
        } finally {
          setReviewLoading(false);
        }
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const cancelCourse = async () => {
    if (cancelling || isTutor) return;
    setCancelling(true);
    try {
      const [current, disputes] = await Promise.all([
        enrollmentService.getEnrollmentById(id),
        disputeService.getMyDisputes(),
      ]);
      if (current.status !== 'Active') {
        toast.info('Lớp học không còn ở trạng thái có thể dừng.');
        await loadEnrollment();
        return;
      }
      if (disputes.some(item => item.enrollmentId === id && !['Resolved', 'Dismissed'].includes(item.status))) {
        toast.info('Vui lòng chờ giải quyết các khiếu nại của lớp trước khi dừng khóa học.');
        return;
      }
      const remaining = (current.sessions || []).filter(item => !['Completed', 'Cancelled'].includes(item.status));
      if (remaining.some(item => item.status === 'AwaitingPayout')) {
        toast.info('Vui lòng chờ kết thúc thời gian bảo lưu học phí của buổi học trước khi dừng khóa học.');
        return;
      }
      const refund = remaining.reduce((sum, item) => sum + Number(item.sessionPrice || 0), 0);
      let reason = '';
      const accepted = await confirm({
        title: 'Dừng khóa học?', danger: true, confirmText: 'Xác nhận dừng', cancelText: 'Tiếp tục học',
        requireReason: true, minReasonLength: 5, maxReasonLength: 500,
        reasonLabel: 'Lý do dừng khóa học', reasonPlaceholder: 'Chia sẻ lý do (5–500 ký tự)',
        onConfirmReason: value => { reason = value; },
        content: <div className="space-y-3"><p>{remaining.length} buổi học còn lại sẽ bị hủy. Các buổi đã hoàn thành được giữ nguyên.</p><p>Học phí dự kiến hoàn về Ví học viên: <strong className="text-success-strong"><Money value={refund} /></strong>.</p><p>Số tiền cuối cùng được xác định theo trạng thái hợp đồng khi xác nhận. Thao tác này không thể hoàn tác.</p></div>,
      });
      if (!accepted) return;
      const updated = await enrollmentService.cancelEnrollment(id, reason);
      setEnrollment(previous => ({ ...previous, ...updated }));
      await Promise.all([
        client.invalidateQueries({ queryKey: ['student-schedule'] }),
        client.invalidateQueries({ queryKey: ['booking-enrollments'] }),
      ]);
      toast.success('Đã dừng khóa học. Bạn có thể xem khoản hoàn tiền trong Ví học viên.');
    } catch (err) {
      toast.error(err?.status === 409 ? 'Trạng thái lớp học vừa thay đổi. Vui lòng tải lại lộ trình trước khi dừng.' : 'Chưa thể dừng khóa học. Vui lòng thử lại.');
    } finally { setCancelling(false); }
  };

  useEffect(() => {
    if (id) {
      setSessionFilter('all');
      setVisibleCount(5);
      setCopied(false);
      loadEnrollment();
    }
  }, [id, loadEnrollment]);

  const handleScheduleInline = async (e, session) => {
    e.preventDefault();
    if (!scheduleDatetime) {
      toast.error('Vui lòng chọn thời gian bắt đầu buổi học.');
      return;
    }

    const startAtDate = dayjs(scheduleDatetime);
    const minNotice = dayjs().add(2, 'hour');
    if (startAtDate.isBefore(minNotice)) {
      toast.error('Lịch mới phải cách thời điểm hiện tại ít nhất 2 giờ.');
      return;
    }

    const durationMinutes = enrollment?.sessionDurationMinutes || 60;
    const endAtDate = startAtDate.add(durationMinutes, 'minute');

    try {
      setSubmittingSchedule(true);
      await sessionService.scheduleSession(
        session.id,
        startAtDate.toDate().toISOString(),
        endAtDate.toDate().toISOString()
      );

      toast.success(`Đã xếp lịch buổi học #${session.sessionNumber} thành công.`);
      setSchedulingSessionId(null);
      setScheduleDatetime('');
      await loadEnrollment();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Không thể xếp lịch buổi học.');
    } finally {
      setSubmittingSchedule(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) {
      toast.error('Vui lòng chọn số sao đánh giá từ 1 đến 5.');
      return;
    }

    try {
      setSubmittingReview(true);
      const res = await enrollmentService.createReview(id, rating, comment.trim());
      setReview(res);
      toast.success('Đã gửi đánh giá khóa học thành công! Cảm ơn bạn đã phản hồi.');
    } catch (err) {
      toast.error(err?.message || 'Không thể gửi đánh giá. Vui lòng thử lại.');
    } finally {
      setSubmittingReview(false);
    }
  };

  /**
   * Thứ tự ưu tiên: có báo cáo sự cố > chờ giải ngân (AwaitingPayout) >
   * trạng thái buổi học.
   */
  const getStatusBadge = (session) => {
    if (session.hasIssueReport) {
      return (
        <Badge variant="danger" size="sm" icon={<Icon name="warning" size="sm" />}>
          Có báo cáo sự cố
        </Badge>
      );
    }
    if (session.status === SESSION_STATUS.AWAITING_PAYOUT) {
      return (
        <Badge variant="holding" size="sm" icon={<Icon name="timer" size="sm" />}>
          Chờ giải ngân
        </Badge>
      );
    }
    return <StateBadge domain="session" status={session.status} />;
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-[1200px] py-8">
        <DetailSkeleton />
      </div>
    );
  }

  if (error || !enrollment) {
    return (
      <div className="mx-auto max-w-[1200px] space-y-4 py-8">
        <Link
          to={backPath}
          className="inline-flex items-center gap-1.5 text-caption font-semibold text-fg-secondary hover:text-brand-primary-700 transition-colors"
        >
          <Icon name="arrow_back" size="sm" />
          {backLabel}
        </Link>
        <ErrorState
          error={error}
          title="Không tìm thấy hợp đồng học tập"
          backPath={backPath}
          backLabel={backLabel}
        />
      </div>
    );
  }

  const sessions = Array.isArray(enrollment.sessions) ? enrollment.sessions : [];
  const completedCount = sessions.filter((s) => s.status === SESSION_STATUS.COMPLETED).length;
  const progressPercent = Math.round((completedCount / (enrollment.totalSessions || 1)) * 100);
  const isCompleted = enrollment.status === 'Completed';
  const isActive = enrollment.status === 'Active';
  const tutorName = enrollment.tutorName || sessions[0]?.tutorName || 'Gia sư';
  const durationMinutes = enrollment.sessionDurationMinutes || 60;
  const courseTitle = enrollment.serviceTitle || enrollment.subjectName || 'Lộ trình học tập';
  const upcomingSessions = sessions.filter(session =>
    session.status === SESSION_STATUS.SCHEDULED && session.startAt && dayjs(session.startAt).isAfter(dayjs())
  ).sort((a, b) => dayjs(a.startAt).valueOf() - dayjs(b.startAt).valueOf());
  const nextSession = upcomingSessions[0] || null;
  const uniformSessionPrice = sessions.length > 0 && sessions.every(session => session.sessionPrice === sessions[0].sessionPrice)
    ? sessions[0].sessionPrice : null;
  const hasFinancialSummary = enrollment.releasedAmount != null && enrollment.refundedAmount != null;
  const completedSessions = sessions.filter(session => session.status === SESSION_STATUS.COMPLETED);
  const filteredSessions = [...(sessionFilter === 'upcoming' ? upcomingSessions
    : sessionFilter === 'completed' ? completedSessions : sessions)]
    .sort((a, b) => sessionFilter === 'upcoming'
      ? dayjs(a.startAt).valueOf() - dayjs(b.startAt).valueOf() : a.sessionNumber - b.sessionNumber);
  const visibleSessions = filteredSessions.slice(0, visibleCount);
  const needsSchedule = isActive && !nextSession && sessions.some(session => session.status === SESSION_STATUS.UNSCHEDULED);
  const finances = summarizeTuition([{
    ...enrollment,
    releasedAmount: enrollment.releasedAmount ?? sessions.filter(session => session.isPayoutReleased)
      .reduce((sum, session) => sum + (Number(session.sessionPrice) || 0), 0),
  }]);

  const messageTutor = async () => {
    if (openingChat) return;
    setOpeningChat(true);
    try {
      const tutorUserId = enrollment.tutorUserId
        || (await tutorService.getTutorById(enrollment.tutorProfileId)).userId;
      if (!tutorUserId) throw new Error('Không thể mở cuộc trò chuyện với gia sư.');
      const conversation = await chatService.getOrCreateConversation(tutorUserId);
      if (!conversation?.id) throw new Error('Không thể mở cuộc trò chuyện với gia sư.');
      navigate(`/app/messages?conversationId=${conversation.id}`);
    } catch (err) {
      toast.error(err?.message || 'Không thể mở tin nhắn. Vui lòng thử lại.');
    } finally {
      setOpeningChat(false);
    }
  };

  const copyContractId = async () => {
    try {
      await navigator.clipboard.writeText(String(enrollment.id));
      setCopied(true);
    } catch {
      toast.error('Không thể sao chép. Bạn có thể chọn và sao chép mã trong thông tin hợp đồng.');
    }
  };

  const sessionRows = visibleSessions.map((sess) => {
    const isUnscheduled = sess.status === SESSION_STATUS.UNSCHEDULED;
    const isSchedulingThis = schedulingSessionId === sess.id;
    const canTutorSchedule = isTutor && isUnscheduled && isActive;
    const tone = sessionTone(sess);

    return {
      id: sess.id,
      number: sess.sessionNumber,
      session: sess,
      hasActions: canTutorSchedule || (!isTutor && sess.status === SESSION_STATUS.AWAITING_PAYOUT && !sess.hasIssueReport),
      tone,
      badge: getStatusBadge(sess),
      actions: (
        <>
          {canTutorSchedule && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                if (isSchedulingThis) {
                  setSchedulingSessionId(null);
                  setScheduleDatetime('');
                } else {
                  setSchedulingSessionId(sess.id);
                  setScheduleDatetime('');
                }
              }}
              icon={<Icon name="calendar_month" size="xs" />}
            >
              {isSchedulingThis ? 'Đóng' : 'Xếp lịch'}
            </Button>
          )}

          {!isTutor && sess.status === SESSION_STATUS.AWAITING_PAYOUT && !sess.hasIssueReport && (
            <Button
              as={Link}
              to={`/student/disputes/new?sessionId=${sess.id}`}
              variant="danger-outline"
              size="sm"
            >
              Khiếu nại
            </Button>
          )}
        </>
      ),
      // Inline schedule form for Tutor — chỉ render khi đang mở form của buổi này.
      scheduleForm: isSchedulingThis && (
        <form
          onSubmit={(e) => handleScheduleInline(e, sess)}
          className="w-full pt-3.5 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-surface p-3.5 rounded-brand-md"
        >
          <div className="flex-1 w-full sm:w-auto">
            <label
              htmlFor={`schedule-time-${sess.id}`}
              className="block text-caption font-bold text-fg cursor-pointer"
            >
              <span className="flex items-center gap-1.5 mb-1.5">
                <Icon name="event" size="xs" className="text-brand-primary-600" />
                Xếp lịch cho buổi #{sess.sessionNumber}
              </span>
              <input
                id={`schedule-time-${sess.id}`}
                aria-label={`Thời gian bắt đầu buổi học #${sess.sessionNumber}`}
                type="datetime-local"
                min={minNoticeString}
                value={scheduleDatetime}
                onChange={(e) => setScheduleDatetime(e.target.value)}
                required
                className="w-full sm:w-64 h-9 px-3 rounded-brand-md border border-border bg-surface text-caption text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary-600"
              />
            </label>
            <span className="block text-[11px] text-holding-strong mt-1 font-medium">
              Lịch học phải cách thời điểm hiện tại ít nhất 2 giờ. Thời lượng:{' '}
              {durationMinutes} phút.
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setSchedulingSessionId(null);
                setScheduleDatetime('');
              }}
              disabled={submittingSchedule}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={submittingSchedule}
              icon={<Icon name="check" size="xs" />}
            >
              Lưu lịch
            </Button>
          </div>
        </form>
      ),
    };
  });

  return (
    <div className="mx-auto max-w-[1200px] space-y-6 lg:space-y-8">
      <Link to={backPath}
        className="inline-flex min-h-9 items-center gap-2 rounded-lg text-sm font-medium text-fg-secondary transition-colors hover:text-brand-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary-500">
        <Icon name="arrow_back" size="sm" />{backLabel}
      </Link>

      <Card padding="lg" className="rounded-2xl shadow-none">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="min-w-0">
            <button type="button" onClick={copyContractId} title={String(enrollment.id)}
              aria-label="Sao chép mã hợp đồng"
              className="inline-flex min-h-8 items-center gap-2 rounded-lg text-xs font-medium text-fg-muted transition-colors hover:text-brand-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary-500">
              <span>{copied ? 'Đã sao chép mã' : `Mã hợp đồng #${String(enrollment.id || '').slice(0, 8)}`}</span>
              <Icon name={copied ? 'check' : 'content_copy'} size="xs" />
            </button>
            <span className="sr-only" role="status">{copied ? 'Đã sao chép mã hợp đồng' : ''}</span>
            <h1 className="mt-2 text-headline-page leading-snug tracking-tight text-fg">{courseTitle}</h1>
            <div className="mt-4 flex items-center gap-3">
              <Avatar src={enrollment.tutorAvatarUrl} name={tutorName} size="sm" />
              <p className="text-sm text-fg-secondary">Gia sư <span className="font-medium text-fg">{tutorName}</span></p>
            </div>
          </div>
          <StateBadge status={enrollment.status} domain="enrollment" size="md" className="shrink-0 self-start" />
        </div>
        <div className="mt-6 space-y-3 border-t border-border pt-5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="font-medium text-fg">Tiến độ học tập</span>
            <span className="text-fg-secondary tabular-nums">{completedCount}/{enrollment.totalSessions} buổi hoàn thành <span className="ml-2 font-semibold text-brand-primary-600">{progressPercent}%</span></span>
          </div>
          <Progress value={progressPercent} label="Tiến độ học tập" />
          {isActive && <p className="inline-flex items-center gap-1.5 text-xs text-fg-muted">
            <Icon name="shield" size="xs" className="text-brand-primary-600" />Học phí được bảo vệ qua Escrow
          </p>}
        </div>
      </Card>

      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card padding="md" className="rounded-2xl shadow-none">
          <dt className="flex items-center gap-2 text-sm font-medium text-fg-secondary"><Icon name="trending_up" size="sm" className="text-brand-primary-600" />Tiến độ học</dt>
          <dd className="mt-4 text-[28px] font-semibold leading-none tracking-tight text-fg tabular-nums">{completedCount}<span className="ml-1 text-lg font-medium text-fg-muted">/ {enrollment.totalSessions}</span></dd>
          <p className="mt-2 text-xs text-fg-muted">Buổi hoàn thành</p>
        </Card>
        <Card padding="md" className="rounded-2xl shadow-none">
          <dt className="flex items-center gap-2 text-sm font-medium text-fg-secondary"><Icon name="calendar_month" size="sm" className="text-brand-primary-600" />Buổi tiếp theo</dt>
          <dd className="mt-4 text-xl font-semibold leading-snug text-fg">
            {nextSession ? formatDateTime(nextSession.startAt, 'DD/MM · HH:mm') : 'Chưa có lịch'}
          </dd>
          <p className="mt-2 text-xs text-fg-muted">{nextSession ? `Buổi học ${nextSession.sessionNumber}` : isActive ? 'Chờ xếp lịch' : 'Chưa có buổi học sắp tới'}</p>
        </Card>
        <Card padding="md" className="rounded-2xl shadow-none">
          <dt className="flex items-center gap-2 text-sm font-medium text-fg-secondary"><Icon name="shield" size="sm" className="text-holding-strong" />Học phí ký quỹ</dt>
          <dd className="mt-4 text-[26px] font-semibold leading-none tracking-tight text-fg tabular-nums">{hasFinancialSummary ? <Money value={finances.escrowRemaining} /> : '—'}</dd>
          <p className="mt-2 text-xs text-fg-muted">{!hasFinancialSummary ? 'Xem chi tiết trong Ví học viên' : finances.escrowRemaining > 0 ? 'Đang được bảo vệ' : 'Không còn học phí đang giữ'}</p>
        </Card>
      </dl>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1.85fr)_minmax(280px,1fr)] lg:gap-8">
        <div className="min-w-0 space-y-6">
          {!isTutor && needsSchedule && (
            <Card padding="lg" className="rounded-2xl border-brand-primary-100 bg-brand-primary-50/40 shadow-none">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface text-brand-primary-600"><Icon name="chat" size="sm" /></span>
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-fg">{completedCount === 0 ? 'Lớp học của bạn chưa có lịch' : 'Thống nhất lịch học tiếp theo'}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-fg-secondary">
                    Trao đổi với gia sư để chọn thời gian phù hợp cho buổi học {completedCount === 0 ? 'đầu tiên' : 'tiếp theo'}.
                  </p>
                  <Button variant="primary" size="md" className="mt-4" loading={openingChat} onClick={messageTutor}
                    icon={<Icon name="chat" size="sm" />}>Nhắn tin gia sư</Button>
                </div>
              </div>
            </Card>
          )}

          <Card padding="lg" className="rounded-2xl shadow-none">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-fg">Lộ trình học tập</h2>
                <p className="mt-2 text-sm text-fg-secondary">{enrollment.totalSessions} buổi học · {durationMinutes} phút/buổi</p>
              </div>
              <span className="rounded-lg bg-neutral-50 px-3 py-2 text-xs font-medium text-fg-secondary tabular-nums">{completedCount}/{enrollment.totalSessions} hoàn thành</span>
            </div>
            <div role="group" aria-label="Lọc buổi học" className="mt-5 flex flex-wrap gap-1 border-b border-border pb-4">
              {[
                { key: 'all', label: 'Tất cả', count: sessions.length },
                { key: 'upcoming', label: 'Sắp tới', count: upcomingSessions.length },
                { key: 'completed', label: 'Hoàn thành', count: completedSessions.length },
              ].map(filter => (
                <button key={filter.key} type="button" aria-pressed={sessionFilter === filter.key}
                  onClick={() => { setSessionFilter(filter.key); setVisibleCount(5); }}
                  className={cn('inline-flex min-h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary-500',
                    sessionFilter === filter.key ? 'bg-brand-primary-50 text-brand-primary-700' : 'text-fg-secondary hover:bg-neutral-50')}>
                  {filter.label}<span className="text-xs opacity-75 tabular-nums">{filter.count}</span>
                </button>
              ))}
            </div>

            {sessionRows.length === 0 ? (
              <div className="py-10 text-center">
                <Icon name={sessionFilter === 'completed' ? 'school' : 'calendar_month'} size="lg" className="mx-auto text-fg-muted" />
                <p className="mt-3 text-sm font-medium text-fg">
                  {sessionFilter === 'upcoming' ? 'Chưa có buổi học sắp tới' : sessionFilter === 'completed' ? 'Chưa có buổi học hoàn thành' : 'Lộ trình chưa có buổi học'}
                </p>
                <p className="mt-2 text-xs text-fg-muted">{sessionFilter === 'all' ? 'Các buổi học sẽ được hiển thị tại đây.' : 'Chọn Tất cả để xem toàn bộ lộ trình.'}</p>
              </div>
            ) : (
              <ul className="mt-4 space-y-3">
                {sessionRows.map(row => (
                  <li key={row.id} className="interactive-card overflow-hidden rounded-xl border border-border bg-surface">
                    <StretchedCardLink to={isTutor ? `/tutor/sessions/${row.id}` : `/student/sessions/${row.id}`} label={`Xem chi tiết buổi học ${row.number}`} />
                    <div className="flex min-h-24 items-center gap-3 rounded-xl p-4">
                      <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold tabular-nums', row.tone.chip)}>{String(row.number).padStart(2, '0')}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-fg">Buổi học {row.number}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          {row.badge}
                          {row.session.startAt && <span className="text-xs text-fg-secondary tabular-nums">{formatDateTime(row.session.startAt, 'DD/MM/YYYY · HH:mm')}</span>}
                        </div>
                      </div>
                      <Icon name="chevron_right" size="sm" className="shrink-0 text-fg-muted" />
                    </div>
                    {row.hasActions && (
                      <div className="flex flex-wrap items-center gap-2 border-t border-border px-4 py-3 [&_button]:relative [&_button]:z-20 [&_a]:relative [&_a]:z-20">{row.actions}</div>
                    )}
                    {row.scheduleForm && <div className="relative z-20 px-3 pb-3">{row.scheduleForm}</div>}
                  </li>
                ))}
              </ul>
            )}
            {filteredSessions.length > 5 && (
              <div className="mt-5 flex flex-col items-center justify-between gap-3 border-t border-border pt-4 sm:flex-row">
                <p className="text-xs text-fg-muted">Hiển thị {Math.min(visibleCount, filteredSessions.length)}/{filteredSessions.length} buổi học</p>
                <Button variant="ghost" size="sm" className="text-brand-primary-600"
                  onClick={() => setVisibleCount(visibleCount < filteredSessions.length ? filteredSessions.length : 5)}
                  iconRight={<Icon name={visibleCount < filteredSessions.length ? 'expand_more' : 'expand_less'} size="sm" />}>
                  {visibleCount < filteredSessions.length ? `Xem tất cả ${filteredSessions.length} buổi` : 'Thu gọn danh sách'}
                </Button>
              </div>
            )}
          </Card>

      {/* Review Section (for Completed Enrollment) */}
      {isCompleted && (
        <Card padding="lg" className="space-y-5">
          <div className="flex items-center justify-between gap-4 border-b border-border pb-3">
            <CardHeader
              className="mb-0"
              title="Đánh giá & Chấm điểm gia sư"
              subtitle="Đóng góp ý kiến khách quan giúp gia sư nâng cao chất lượng và hỗ trợ các học viên khác lựa chọn"
              icon={<Icon name="star" size="sm" filled className="text-brand-secondary-500" />}
            />
            {review && (
              <Badge variant="success" size="sm" icon={<Icon name="check" size="xs" />}>
                Đã gửi đánh giá
              </Badge>
            )}
          </div>

          {reviewLoading ? (
            <div className="py-6 text-center text-caption text-fg-muted">
              Đang tải thông tin đánh giá...
            </div>
          ) : review ? (
            /* Display Submitted Review */
            <div className="space-y-4">
              <div className="p-4 rounded-brand-md bg-surface border border-border space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Icon
                          key={idx}
                          name="star"
                          size="sm"
                          filled={idx < (review.rating || 5)}
                          className={idx < (review.rating || 5) ? 'text-brand-secondary-500' : 'text-neutral-300'}
                        />
                      ))}
                    </div>
                    <span className="font-bold text-caption text-fg">
                      {review.rating}/5 sao
                    </span>
                  </div>
                  {review.createdAt && (
                    <span className="text-[11px] text-fg-muted font-mono tabular-nums whitespace-nowrap">
                      {formatDateTime(review.createdAt, 'DD/MM/YYYY HH:mm')}
                    </span>
                  )}
                </div>

                <p className="text-caption text-fg-secondary leading-relaxed m-0 italic bg-neutral-50 p-3 rounded-brand-sm border border-border">
                  &ldquo;{review.comment || 'Học viên không để lại lời bình.'}&rdquo;
                </p>

                {/* Tutor Reply if available */}
                {review.tutorReply && (
                  <div className="mt-3 p-3 rounded-brand-md bg-brand-primary-50/60 border border-brand-primary-200 text-caption space-y-1">
                    <div className="flex items-center gap-1.5 text-brand-primary-800 font-bold text-xs">
                      <Icon name="chat" size="xs" />
                      <span>Phản hồi từ gia sư ({enrollment.tutorName || 'Gia sư'}):</span>
                      {review.tutorRepliedAt && (
                        <span className="text-fg-muted font-normal text-[11px] ml-auto font-mono tabular-nums whitespace-nowrap">
                          {formatDateTime(review.tutorRepliedAt, 'DD/MM/YYYY')}
                        </span>
                      )}
                    </div>
                    <p className="text-fg-secondary m-0 pl-4">
                      {review.tutorReply}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : isTutor ? (
            <p className="text-caption text-fg-muted italic m-0">
              Chưa có đánh giá nào từ học viên cho khóa học này.
            </p>
          ) : (
            /* Review Submission Form */
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div className="space-y-2">
                <span className="text-caption font-semibold text-fg block">
                  Mức độ hài lòng của bạn (1 đến 5 sao):
                </span>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-surface p-2 rounded-brand-md border border-border inline-flex">
                    {Array.from({ length: 5 }).map((_, i) => {
                      const starValue = i + 1;
                      const isFilled = starValue <= (hoverRating || rating);
                      return (
                        <button
                          key={starValue}
                          type="button"
                          onClick={() => setRating(starValue)}
                          onMouseEnter={() => setHoverRating(starValue)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="p-1 hover:scale-110 transition-transform cursor-pointer focus-visible:outline-none"
                          aria-label={`${starValue} sao`}
                        >
                          <Icon
                            name="star"
                            size="md"
                            filled={isFilled}
                            className={cn(
                              'transition-colors',
                              isFilled ? 'text-brand-secondary-500' : 'text-neutral-300'
                            )}
                          />
                        </button>
                      );
                    })}
                  </div>
                  <span className="text-caption font-bold text-fg-secondary">
                    {hoverRating || rating} / 5 sao (
                    {(hoverRating || rating) === 5
                      ? 'Xuất sắc'
                      : (hoverRating || rating) === 4
                        ? 'Tốt'
                        : (hoverRating || rating) === 3
                          ? 'Đạt yêu cầu'
                          : (hoverRating || rating) === 2
                            ? 'Chưa hài lòng'
                            : 'Kém'}
                    )
                  </span>
                </div>
              </div>

              <Field
                label="Lời nhận xét chi tiết (chia sẻ phương pháp dạy, thái độ, kiến thức truyền đạt...):"
                htmlFor="review-comment"
              >
                <Textarea
                  id="review-comment"
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Gia sư dạy rất nhiệt tình, giải thích cặn kẽ và chuẩn bị giáo án chu đáo..."
                />
              </Field>

              <div className="flex justify-end pt-1">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  loading={submittingReview}
                  icon={<Icon name="send" size="xs" />}
                >
                  Gửi đánh giá công khai
                </Button>
              </div>
            </form>
          )}
        </Card>
      )}

        </div>

        <aside className="min-w-0 space-y-4 lg:sticky lg:top-24">
          <Card padding="lg" className="rounded-2xl shadow-none">
            <h2 className="flex items-center gap-2 text-base font-semibold text-fg"><Icon name="calendar_month" size="sm" className="text-brand-primary-600" />Buổi học tiếp theo</h2>
            {nextSession ? (
              <div className="mt-5">
                <p className="text-2xl font-semibold text-brand-primary-700 tabular-nums">{formatDateTime(nextSession.startAt, 'HH:mm')}</p>
                <p className="mt-1 text-sm text-fg-secondary">{formatDateTime(nextSession.startAt, 'DD/MM/YYYY')}</p>
                <p className="mt-4 text-sm font-medium text-fg">Buổi học {nextSession.sessionNumber}</p>
                <p className="mt-1 text-xs text-fg-muted">{durationMinutes} phút · Gia sư {tutorName}</p>
                <Button as={Link} to={isTutor ? `/tutor/sessions/${nextSession.id}` : `/student/sessions/${nextSession.id}`}
                  variant="primary" size="md" fullWidth className="mt-5" iconRight={<Icon name="arrow_forward" size="sm" />}>Xem buổi học</Button>
              </div>
            ) : (
              <div className="mt-4 rounded-xl bg-neutral-50 p-4">
                <Icon name="event" size="md" className="text-fg-muted" />
                <p className="mt-3 text-sm font-medium text-fg">Chưa có lịch học sắp tới</p>
                <p className="mt-2 text-xs leading-relaxed text-fg-secondary">{isTutor && isActive ? 'Chọn buổi chưa xếp lịch trong lộ trình để thiết lập thời gian học.' : needsSchedule ? 'Lịch học sẽ hiển thị sau khi bạn và gia sư thống nhất thời gian.' : 'Các buổi học đã được xếp lịch sẽ xuất hiện tại đây.'}</p>
              </div>
            )}
          </Card>

          <Card padding="lg" className="rounded-2xl shadow-none">
            <h2 className="flex items-center justify-between gap-2 text-base font-semibold text-fg">Thông tin thanh toán<Icon name="shield" size="sm" className="text-fg-muted" /></h2>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex flex-wrap justify-between gap-2"><dt className="text-fg-secondary">Tổng học phí</dt><dd className="font-semibold text-fg tabular-nums"><Money value={enrollment.totalPrice} /></dd></div>
              {uniformSessionPrice != null && <div className="flex flex-wrap justify-between gap-2"><dt className="text-fg-secondary">Học phí / buổi</dt><dd className="font-medium text-fg-secondary tabular-nums"><Money value={uniformSessionPrice} /></dd></div>}
              <div className="flex flex-wrap justify-between gap-2"><dt className="text-fg-secondary">Đang ký quỹ</dt><dd className="font-semibold text-holding-strong tabular-nums"><Money value={finances.escrowRemaining} /></dd></div>
              <div className="flex flex-wrap justify-between gap-2"><dt className="text-fg-secondary">Đã giải ngân</dt><dd className="font-semibold text-success-strong tabular-nums"><Money value={finances.escrowReleased} /></dd></div>
              {finances.escrowRefunded > 0 && <div className="flex flex-wrap justify-between gap-2"><dt className="text-fg-secondary">Đã hoàn tiền</dt><dd className="font-medium tabular-nums"><Money value={finances.escrowRefunded} /></dd></div>}
              <div className="flex flex-wrap justify-between gap-2 border-t border-border pt-3"><dt className="text-fg-muted">Tỷ lệ phí sàn</dt><dd className="text-fg-secondary">{enrollment.platformFeeRate != null ? `${(Number(enrollment.platformFeeRate) * 100).toFixed(0)}%` : '—'}</dd></div>
            </dl>
            <p className="mt-4 text-xs leading-relaxed text-fg-muted">Học phí được giải ngân sau 12 giờ nếu buổi học không có khiếu nại.</p>
            {!isTutor && <Button as={Link} to="/student/wallet" variant="ghost" size="md" fullWidth className="mt-3 text-brand-primary-600"
              icon={<Icon name="account_balance_wallet" size="sm" />}>Xem Ví học viên</Button>}
            <details className="group mt-4 border-t border-border pt-4">
              <summary className="cursor-pointer rounded-lg text-xs font-medium text-fg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary-500">Thông tin hợp đồng</summary>
              <dl className="mt-3 space-y-3 text-xs">
                <div><dt className="text-fg-muted">Mã hợp đồng</dt><dd className="mt-1 break-all text-fg-secondary select-all">{enrollment.id}</dd></div>
                {enrollment.createdAt && <div><dt className="text-fg-muted">Ngày đăng ký</dt><dd className="mt-1 text-fg-secondary">{formatDateTime(enrollment.createdAt, 'DD/MM/YYYY')}</dd></div>}
              </dl>
            </details>
            {!isTutor && enrollment.status === 'Active' && <div className="mt-4 space-y-2 border-t border-border pt-4"><Button variant="danger-outline" fullWidth loading={cancelling} onClick={cancelCourse}>Dừng khóa học</Button><p className="text-xs leading-relaxed text-fg-secondary">Các buổi chưa hoàn thành sẽ được hủy và hoàn học phí theo trạng thái hợp đồng. Khiếu nại và thời gian bảo lưu cần kết thúc trước khi dừng.</p></div>}
            {enrollment.status === 'Cancelled' && enrollment.cancellationReason && <p className="mt-4 whitespace-pre-wrap break-words border-t border-border pt-4 text-xs leading-relaxed text-fg-secondary">Lý do dừng: {enrollment.cancellationReason}</p>}
          </Card>
        </aside>
      </div>
    </div>
  );
}
