import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import enrollmentService from '@/services/enrollment.service';
import chatService from '@/services/chat.service';
import tutorService from '@/services/tutor.service';
import Avatar, { Menu } from '@/components/ui/Avatar';
import sessionService from '@/services/session.service';
import GracePeriodCard from '@/components/feedback/GracePeriodCard';
import { formatDateTime } from '@/utils/formatters';
import Money from '@/components/ui/Money';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/Dialog';
import ErrorState from '@/components/common/ErrorState';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Callout from '@/components/ui/Callout';
import Icon from '@/components/ui/Icon';
import Input, { Textarea, Field } from '@/components/ui/Input';
import StateBadge from '@/components/common/StateBadge';
import dayjs from 'dayjs';
import { scheduleReturn, TEACHING_ZONE } from '@/utils/tutorSchedule';
import { tutorSessionPermissions } from '@/utils/tutorSessionDetail';
import TutorSessionActions from '@/components/tutor/TutorSessionActions';

/** Chi tiết một buổi học; hành động theo trạng thái và quyền hiện có. */
export default function SessionDetail() {
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const loadVersion = useRef(0);
  const [enrollment, setEnrollment] = useState(null);
  const [recordError, setRecordError] = useState(null);
  const [openingChat, setOpeningChat] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const confirm = useConfirm();
  const { id } = useParams();
  const { user } = useAuthStore();

  const [session, setSession] = useState(null);
  const [learningRecord, setLearningRecord] = useState(null);
  const [recordInput, setRecordInput] = useState('');
  const [submittingRecord, setSubmittingRecord] = useState(false);
  const [recordEditorOpen, setRecordEditorOpen] = useState(false);
  const [recordSaveError, setRecordSaveError] = useState('');
  const recordSubmitting = useRef(false);
  const rescheduleSubmitting = useRef(false);
  const reschedulePanel = useRef(null);
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
  const scheduleContext = isTutor ? scheduleReturn(location.state) : null;
  const backPath = scheduleContext || (isTutor ? '/tutor/dashboard' : '/student/dashboard');
  const backLabel = scheduleContext ? 'Quay lại lịch dạy' : isTutor ? 'Quay lại bàn điều hành' : 'Quay lại bàn học';

  useEffect(() => {
    if (recordEditorOpen) {
      document.getElementById('session-record')?.scrollIntoView({ behavior: 'auto', block: 'start' });
      document.getElementById('learning-record-input')?.focus();
    }
  }, [recordEditorOpen]);

  // Keep keyboard navigation inside the schedule dialog and restore its trigger.
  useEffect(() => {
    if (!showRescheduleModal) return undefined;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const frame = window.requestAnimationFrame(() => document.getElementById('reschedule-date')?.focus());
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (!rescheduleSubmitting.current) setShowRescheduleModal(false);
      }
      if (e.key !== 'Tab') return;
      const fields = reschedulePanel.current?.querySelectorAll('button:not([disabled]), input:not([disabled])');
      if (!fields?.length) return;
      const first = fields[0];
      const last = fields[fields.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [showRescheduleModal]);

  const loadSessionData = useCallback(async () => {
    if (!id) return;
    const request = ++loadVersion.current;
    try {
      setLoading(true);
      const [sessionResult, recordResult] = await Promise.allSettled([
        sessionService.getSessionById(id),
        sessionService.getLearningRecord(id),
      ]);
      if (request !== loadVersion.current) return;
      if (sessionResult.status === 'rejected') throw sessionResult.reason;
      const data = sessionResult.value;
      setSession(data);
      setError(null);
      setLearningRecord(recordResult.status === 'fulfilled' ? recordResult.value : null);
      setRecordError(recordResult.status === 'rejected' ? recordResult.reason : null);

      // Existing contract endpoints provide the planned duration and tutor metadata.
      const [contractResult, summariesResult] = await Promise.allSettled([
        enrollmentService.getEnrollmentById(data.enrollmentId),
        enrollmentService.getAllMyEnrollments(),
      ]);
      if (request !== loadVersion.current) return;
      const summary = summariesResult.status === 'fulfilled'
        ? summariesResult.value.items.find(item => item.id === data.enrollmentId) : null;
      const contract = contractResult.status === 'fulfilled' ? contractResult.value : null;
      setEnrollment(contract || summary ? { ...summary, ...contract } : null);
    } catch (err) {
      if (request === loadVersion.current) setError(err);
    } finally {
      if (request === loadVersion.current) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    setShowRescheduleModal(false);
    setRecordInput('');
    setRecordEditorOpen(false);
    setRecordSaveError('');
    loadSessionData();
    return () => { loadVersion.current += 1; };
  }, [loadSessionData]);

  const messageParticipant = async () => {
    if (openingChat) return;
    setOpeningChat(true);
    try {
      const contract = enrollment || await enrollmentService.getEnrollmentById(session.enrollmentId);
      const targetUserId = isTutor ? contract.studentUserId : contract.tutorUserId
        || (await tutorService.getTutorById(contract.tutorProfileId)).userId;
      if (!targetUserId) throw new Error();
      const conversation = await chatService.getOrCreateConversation(targetUserId);
      if (!conversation?.id) throw new Error('Không thể mở cuộc trò chuyện với gia sư.');
      navigate(`/app/messages?conversationId=${conversation.id}`);
    } catch {
      toast.error('Chưa thể mở cuộc trò chuyện. Vui lòng thử lại.');
    } finally { setOpeningChat(false); }
  };

  // Handle Issue Report from GracePeriodCard
  const handleIssueReported = async (reason, description) => {
    const updated = await sessionService.reportSessionIssue(id, reason, description);
    setSession(updated);
  };

  // Handle Learning Record creation (Tutor only)
  const handleCreateLearningRecord = async (e) => {
    e.preventDefault();
    if (recordSubmitting.current) return;
    if (!recordInput.trim() || recordInput.trim().length < 10) {
      toast.error('Nội dung nhật ký buổi học cần tối thiểu 10 ký tự.');
      return;
    }
    recordSubmitting.current = true;
    const requestVersion = loadVersion.current;
    setRecordSaveError('');
    try {
      setSubmittingRecord(true);
      const res = await sessionService.createLearningRecord(id, recordInput.trim());
      if (requestVersion !== loadVersion.current) return;
      setLearningRecord(res);
      setRecordError(null);
      toast.success('Đã lưu nhật ký buổi học thành công.');
      setRecordInput('');
      setRecordEditorOpen(false);
    } catch {
      if (requestVersion === loadVersion.current) setRecordSaveError('Chưa thể lưu nhật ký. Nội dung của bạn vẫn được giữ lại, vui lòng thử lại.');
    } finally {
      recordSubmitting.current = false;
      setSubmittingRecord(false);
    }
  };

  // Handle Direct Reschedule (Tutor)
  const handleDirectReschedule = async (e) => {
    e.preventDefault();
    if (rescheduleSubmitting.current) return;
    if (!rescheduleDate || !rescheduleStartTime || !rescheduleEndTime) {
      toast.error('Vui lòng chọn đầy đủ ngày, giờ bắt đầu và giờ kết thúc.');
      return;
    }

    const startDateTime = dayjs.tz(`${rescheduleDate}T${rescheduleStartTime}:00`, TEACHING_ZONE);
    const endDateTime = dayjs.tz(`${rescheduleDate}T${rescheduleEndTime}:00`, TEACHING_ZONE);

    if (!endDateTime.isAfter(startDateTime)) {
      toast.error('Giờ kết thúc phải sau giờ bắt đầu.');
      return;
    }

    const minNotice = dayjs().add(2, 'hour');
    if (startDateTime.isBefore(minNotice)) {
      toast.error('Lịch mới phải được xếp trước giờ bắt đầu ít nhất 2 giờ.');
      return;
    }
    if (enrollment?.sessionDurationMinutes && endDateTime.diff(startDateTime, 'minute') !== enrollment.sessionDurationMinutes) {
      toast.error(`Buổi học cần đúng ${enrollment.sessionDurationMinutes} phút theo gói học.`);
      return;
    }

    rescheduleSubmitting.current = true;
    const requestVersion = loadVersion.current;
    try {
      setSubmittingReschedule(true);
      const proposedStartAt = startDateTime.toDate().toISOString();
      const proposedEndAt = endDateTime.toDate().toISOString();

      await sessionService.scheduleSession(id, proposedStartAt, proposedEndAt);
      if (requestVersion !== loadVersion.current) return;
      toast.success('Đã cập nhật lịch học mới thành công.');
      setShowRescheduleModal(false);
      setRescheduleDate('');
      setRescheduleStartTime('');
      setRescheduleEndTime('');
      await loadSessionData();
    } catch (err) {
      toast.error(err?.status === 409 ? 'Khung giờ này không khả dụng hoặc buổi học vừa được cập nhật. Vui lòng kiểm tra và chọn lại.' : 'Chưa thể cập nhật lịch học. Vui lòng thử lại.');
    } finally {
      rescheduleSubmitting.current = false;
      setSubmittingReschedule(false);
    }
  };

  // Handle Cancel Session (Student or Tutor)
  const handleCancelSession = async () => {
    if (actionLoading) return;
    let cancelReason = '';
    const ok = await confirm({
      title: 'Hủy buổi học này?',
      content: (
        <div className="space-y-3 text-caption text-fg-secondary">
          <p>
            Bạn có chắc chắn muốn hủy <strong>Buổi học #{session.sessionNumber}</strong>?
          </p>
          <div className="bg-holding-subtle text-holding-strong p-3 rounded-brand-md text-caption space-y-1">
            <strong className="block font-semibold">Quy định hoàn tiền học phí:</strong>
            <p className="text-xs m-0">
              Khi hủy thành công, học phí buổi học (
              <strong className="tabular-nums">{(session.sessionPrice ?? session.earningAmount)?.toLocaleString('vi-VN')} ₫</strong>
              ) được hoàn vào Ví học viên.
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
      <div role="status" aria-label="Đang tải chi tiết buổi học" className="mx-auto max-w-[1100px] space-y-6">
        <div className="h-5 w-48 rounded bg-neutral-200 motion-safe:animate-pulse" />
        <Card padding="lg" className="space-y-4 rounded-2xl shadow-none">
          <div className="h-4 w-2/3 rounded bg-neutral-100 motion-safe:animate-pulse" />
          <div className="h-9 w-1/2 rounded bg-neutral-100 motion-safe:animate-pulse" />
          <div className="h-10 w-52 rounded bg-neutral-100 motion-safe:animate-pulse" />
        </Card>
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(280px,1fr)]">
          <div className="space-y-6">
            <Card padding="lg" className="space-y-5 rounded-2xl shadow-none">
              {[0, 1, 2, 3].map(key => <div key={key} className="h-8 rounded bg-neutral-100 motion-safe:animate-pulse" />)}
            </Card>
            <Card padding="lg" className="h-48 rounded-2xl shadow-none"><div className="h-5 w-1/2 rounded bg-neutral-100 motion-safe:animate-pulse" /></Card>
          </div>
          <Card padding="lg" className="space-y-5 rounded-2xl shadow-none">
            <div className="h-6 w-3/4 rounded bg-neutral-100 motion-safe:animate-pulse" />
            <div className="h-16 rounded bg-neutral-100 motion-safe:animate-pulse" />
            <div className="h-11 rounded bg-neutral-100 motion-safe:animate-pulse" />
          </Card>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="mx-auto max-w-[1100px] py-12">
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
  const isUnscheduled = session.status === 'Unscheduled';
  const isAwaitingPayout = session.status === 'AwaitingPayout';
  const isActiveEnrollment = enrollment?.status === 'Active';
  const isFutureScheduled = isScheduled && session.startAt && dayjs.utc(session.startAt).isAfter(dayjs(now));
  const hasMinimumNotice = isFutureScheduled && !dayjs.utc(session.startAt).isBefore(dayjs(now).add(2, 'hour'));
  const canCancel = ['Student', 'Tutor'].includes(user?.role) && isActiveEnrollment && (isUnscheduled || hasMinimumNotice);
  const canTutorSchedule = isTutor && isActiveEnrollment && (isUnscheduled || hasMinimumNotice);
  const isReportWindowOpen = isAwaitingPayout && session.gracePeriodEndsAt
    && dayjs(session.gracePeriodEndsAt).isAfter(dayjs(now));
  const enrollmentPath = session.enrollmentId ? `/${isTutor ? 'tutor' : 'student'}/enrollments/${session.enrollmentId}` : backPath;
  const courseTitle = enrollment?.serviceTitle || enrollment?.subjectName || session.subjectName || 'Lộ trình học tập';
  const tutorName = enrollment?.tutorName || session.tutorName;
  const number = session.sessionNumber != null ? String(session.sessionNumber).padStart(2, '0') : '—';
  const scheduledDuration = session.startAt && session.endAt
    ? dayjs.utc(session.endAt).diff(dayjs.utc(session.startAt), 'minute') : 0;
  const plannedDuration = Number(enrollment?.sessionDurationMinutes) || scheduledDuration;
  const siblings = [...(Array.isArray(enrollment?.sessions) ? enrollment.sessions : [])]
    .sort((a, b) => a.sessionNumber - b.sessionNumber);
  const sessionIndex = siblings.findIndex(item => item.id === session.id);
  const previousSession = sessionIndex > 0 ? siblings[sessionIndex - 1] : null;
  const nextSession = sessionIndex >= 0 ? siblings[sessionIndex + 1] : null;
  const feeStatus = session.isPayoutReleased ? 'Đã giải ngân'
    : isAwaitingPayout && session.hasIssueReport ? 'Đang xử lý sự cố'
    : isAwaitingPayout ? 'Chờ giải ngân'
    : session.isPayoutReleased === false ? 'Chưa giải ngân' : 'Chưa có thông tin';
  const showProtection = isAwaitingPayout && (session.hasIssueReport || isReportWindowOpen);
  const permissions = tutorSessionPermissions(session, enrollment, learningRecord, now);
  const addRecord = () => {
    setRecordEditorOpen(true);
    window.requestAnimationFrame(() => {
      document.getElementById('session-record')?.scrollIntoView({ behavior: 'auto', block: 'start' });
      document.getElementById('learning-record-input')?.focus();
    });
  };
  const openSchedule = () => {
    setRescheduleDate(session.startAt ? formatDateTime(session.startAt, 'YYYY-MM-DD') : '');
    setRescheduleStartTime(session.startAt ? formatDateTime(session.startAt, 'HH:mm') : '');
    setRescheduleEndTime(session.endAt ? formatDateTime(session.endAt, 'HH:mm') : '');
    setShowRescheduleModal(true);
  };
  const participantName = isTutor ? enrollment?.studentName : tutorName;
  const participantAvatar = isTutor ? enrollment?.studentAvatarUrl : enrollment?.tutorAvatarUrl;


  return (
    <div className="mx-auto max-w-[1100px] space-y-6">
      {scheduleContext && <Button as={Link} to={scheduleContext} variant="ghost" icon={<Icon name="arrow_back" size="sm" />}>Quay lại lịch dạy</Button>}
      <nav aria-label="Đường dẫn buổi học">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-caption text-fg-secondary">
          <li><Link to={backPath} className="hover:text-primary focus-visible:underline">{scheduleContext ? 'Lịch giảng dạy' : isTutor ? 'Bảng điều hành' : 'Bàn học'}</Link></li>
          <li aria-hidden="true">/</li>
          <li className="min-w-0"><Link to={enrollmentPath} state={scheduleContext ? { scheduleReturn: scheduleContext } : undefined} className="break-words hover:text-primary focus-visible:underline">{courseTitle}</Link></li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="font-medium text-fg">Buổi #{number}</li>
        </ol>
      </nav>

      <Card as="header" padding="lg" variant="outlined" className="rounded-2xl">
        <p className="mb-2 text-body-reg text-fg-secondary break-words">{courseTitle}</p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-headline-1 font-bold text-fg">Buổi học #{number}</h1>
          <StateBadge status={session.status} domain="session" size="md" />
          {isTutor && canCancel && <div className="ml-auto">{actionLoading ? <span role="status" className="text-caption text-fg-secondary">Đang hủy buổi học…</span> : <Menu label="Thêm thao tác" trigger={<span className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm text-fg-secondary hover:bg-neutral-50">Thêm thao tác<Icon name="more_vert" size="sm" /></span>} items={[{ key: 'cancel', label: 'Hủy buổi học', danger: true, icon: <Icon name="cancel" size="sm" />, onClick: handleCancelSession }]} />}</div>}
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border pt-5">
          <Avatar key={participantAvatar || participantName} src={participantAvatar} name={participantName} />
          <div className="min-w-0 flex-1">
            <p className="text-caption text-fg-secondary">{isTutor ? 'Học viên' : 'Gia sư phụ trách'}</p>
            <p className="text-body-reg font-semibold text-fg break-words">{participantName || (isTutor ? 'Học viên của lớp' : 'Chưa có thông tin gia sư')}</p>
          </div>
          <Button variant="outline" size="sm" className={isTutor ? 'w-full sm:w-auto' : undefined} disabled={isTutor && !enrollment?.studentUserId} onClick={messageParticipant} loading={openingChat} icon={<Icon name="chat" size="xs" />}>{isTutor ? 'Nhắn tin học viên' : 'Nhắn tin'}</Button>
        </div>
      </Card>

      {isCancelled && (
        <Callout id="session-cancellation" className="scroll-mt-24" variant="neutral" icon={<Icon name="cancel" size="sm" />}>
          <p className="font-semibold">Buổi học đã hủy{session.cancelledAt ? ` · ${formatDateTime(session.cancelledAt)}` : ''}</p>
          <p className="mt-1">Buổi học này không còn trong lịch học của bạn. Bạn có thể xem lịch sử ví để kiểm tra giao dịch liên quan.</p>
          {session.cancellationReason && <p className="mt-2 whitespace-pre-wrap break-words">Lý do hủy: {session.cancellationReason}</p>}
        </Callout>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(280px,1fr)]">
        <div className={isTutor ? 'contents' : 'min-w-0 space-y-6'}>
          <Card as="section" id="session-info" padding="lg" variant="outlined" className={`scroll-mt-24 rounded-2xl ${isTutor ? 'order-1 min-w-0 lg:col-start-1' : ''}`} aria-labelledby="session-info-title">
            <h2 id="session-info-title" className="mb-2 text-headline-3 font-semibold text-fg">{isTutor ? 'Lịch giảng dạy' : 'Thông tin buổi học'}</h2>
            {isTutor && <div className="my-5 flex items-center gap-4 rounded-2xl bg-brand-primary-50 p-4 sm:gap-5 sm:p-5">
              {session.startAt ? <>
                <div aria-hidden="true" className="flex w-20 shrink-0 flex-col items-center rounded-xl bg-surface px-2 py-3 text-brand-primary-700"><span className="text-caption font-medium">{formatDateTime(session.startAt, 'ddd')}</span><span className="my-1 text-3xl font-semibold">{formatDateTime(session.startAt, 'DD')}</span><span className="text-[11px]">{formatDateTime(session.startAt, 'MM/YYYY')}</span></div>
                <div className="min-w-0 space-y-2"><p className="text-xl font-semibold tabular-nums text-fg sm:text-2xl">{formatDateTime(session.startAt, 'HH:mm')}{session.endAt ? ` – ${formatDateTime(session.endAt, 'HH:mm')}` : ''}</p><p className="text-caption text-fg-secondary">{formatDateTime(session.startAt, 'DD/MM/YYYY')} · Giờ Việt Nam (UTC+7)</p>{plannedDuration > 0 && <p className="text-caption font-medium text-brand-primary-700">{plannedDuration} phút/buổi</p>}</div>
              </> : <div className="space-y-2"><p className="font-semibold text-fg">Chưa xếp lịch học</p><p className="text-caption leading-relaxed text-fg-secondary">Thống nhất ngày giờ với học viên để bắt đầu{plannedDuration > 0 ? ` buổi học ${plannedDuration} phút` : ' buổi học'}.</p></div>}
            </div>}
            <dl className="divide-y divide-border text-body-reg">
              {!isTutor && <>
              <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 py-4">
                <dt className="text-fg-secondary">Ngày học</dt>
                <dd className="font-medium text-fg">{session.startAt ? formatDateTime(session.startAt, 'DD/MM/YYYY') : 'Chưa xếp lịch'}</dd>
              </div>
              {session.startAt && session.endAt && (
                <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 py-4">
                  <dt className="text-fg-secondary">Khung giờ</dt>
                  <dd className="font-medium tabular-nums text-fg">{formatDateTime(session.startAt, 'HH:mm')} – {formatDateTime(session.endAt, 'HH:mm')} (UTC+7)</dd>
                </div>
              )}
              <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 py-4">
                <dt className="text-fg-secondary">Thời lượng dự kiến</dt>
                <dd className="font-medium text-fg">{plannedDuration > 0 ? `${plannedDuration} phút` : 'Chưa có thông tin'}</dd>
              </div>
              </>}
              <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 py-4">
                <dt className="text-fg-secondary">Học phí buổi học</dt>
                <dd className="font-semibold text-fg"><Money value={session.sessionPrice ?? session.earningAmount} /></dd>
              </div>
              <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 py-4">
                <dt className="text-fg-secondary">Trạng thái học phí</dt>
                <dd className="font-medium">
                  {isCancelled ? <Link to={isTutor ? '/tutor/wallet' : '/student/wallet'} className="text-primary hover:underline">Xem lịch sử ví →</Link>
                    : <span className={session.isPayoutReleased ? 'text-success-strong' : isAwaitingPayout ? 'text-holding-strong' : 'text-fg'}>{feeStatus}</span>}
                </dd>
              </div>
            </dl>
          </Card>

          {showProtection && (
            <section id="session-protection" className={`scroll-mt-24 ${isTutor ? 'order-3 min-w-0 lg:col-start-1' : ''}`} aria-label="Bảo vệ học phí">
              <GracePeriodCard key={session.id} session={session} onIssueReported={handleIssueReported} isTutor={isTutor} />
            </section>
          )}

          <Card as="section" id="session-record" padding="lg" variant="outlined" className={`scroll-mt-24 rounded-2xl ${isTutor ? 'order-3 min-w-0 lg:col-start-1' : ''}`} aria-labelledby="session-record-title">
            <h2 id="session-record-title" className="text-headline-3 font-semibold text-fg">Nhật ký buổi học</h2>
            {recordError ? (
              <div className="mt-5 space-y-3">
                <p className="text-body-reg text-fg-secondary">Chưa tải được nhật ký buổi học. Vui lòng thử lại.</p>
                <Button variant="outline" size="sm" onClick={loadSessionData}>Thử lại</Button>
              </div>
            ) : learningRecord ? (
              <div className="mt-5">
                <p className="whitespace-pre-wrap break-words text-body-reg leading-relaxed text-fg">{learningRecord.content}</p>
                {learningRecord.createdAt && <p className="mt-4 text-caption text-fg-secondary">Cập nhật {formatDateTime(learningRecord.createdAt)}</p>}
              </div>
            ) : !(isTutor && recordEditorOpen) && (
              <div className="flex flex-col items-center px-2 py-8 text-center">
                <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-100 text-fg-secondary"><Icon name="menu_book" size="md" /></span>
                <p className="font-semibold text-fg">{isTutor ? 'Chưa có nhật ký buổi học' : 'Chưa có nội dung buổi học'}</p>
                <p className="mt-2 max-w-sm text-body-reg leading-relaxed text-fg-secondary">{isTutor ? isCancelled ? 'Buổi học đã hủy nên không thể bổ sung nhật ký.' : permissions.canCreateRecord ? 'Ghi lại nội dung đã giảng dạy để theo dõi quá trình học của học viên.' : 'Bạn có thể cập nhật nhật ký sau khi buổi học hoàn thành.' : 'Nội dung giảng dạy và ghi chú sẽ xuất hiện tại đây sau khi gia sư cập nhật.'}</p>
                {isTutor && permissions.canCreateRecord && <Button className="mt-4" onClick={addRecord} icon={<Icon name="edit" size="sm" />}>Thêm nhật ký</Button>}
              </div>
            )}
            {isTutor && permissions.canCreateRecord && recordEditorOpen && !recordError && (
          <form
            onSubmit={handleCreateLearningRecord}
            className="space-y-3 pt-5 mt-5 border-t border-border"
          >
            <Field
              label="Ghi nhận tiến độ và nội dung bài học (dành cho gia sư)"
              htmlFor="learning-record-input"
              hint="Từ 10 đến 2.000 ký tự. Học viên sẽ đọc được nhật ký sau khi bạn lưu."
            >
              <Textarea
                id="learning-record-input"
                rows={4}
                maxLength={2000}
                disabled={submittingRecord}
                value={recordInput}
                onChange={(e) => setRecordInput(e.target.value)}
                placeholder="Tóm tắt nội dung đã dạy, mức độ tiếp thu của học viên và bài tập về nhà..."
              />
            </Field>
            {recordSaveError && <p role="alert" className="text-caption text-danger-strong">{recordSaveError}</p>}
            <div className="flex flex-wrap gap-3">
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={submittingRecord}
              icon={<Icon name="check" size="xs" />}
            >
              Lưu nhật ký buổi học
            </Button>
            <Button variant="outline" disabled={submittingRecord} onClick={() => { setRecordEditorOpen(false); setRecordInput(''); setRecordSaveError(''); }}>Hủy</Button>
            </div>
          </form>

            )}
          </Card>
        </div>

        {isTutor ? <TutorSessionActions session={session} permissions={permissions} record={learningRecord} recordError={recordError} onSchedule={openSchedule} onAddRecord={addRecord} showProtection={showProtection} /> : <Card as="aside" padding="lg" variant="outlined" className="rounded-2xl lg:sticky lg:top-24" aria-labelledby="session-action-title">
          <h2 id="session-action-title" className="text-headline-3 font-semibold text-fg">Hành động tiếp theo</h2>
          <div className="mt-5 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-primary-50 text-primary">
            <Icon name={isCancelled ? 'description' : isCompleted || isAwaitingPayout ? 'menu_book' : 'calendar_month'} size="md" />
          </div>
          <h3 className="mt-4 text-body-reg font-semibold text-fg">
            {isCancelled ? 'Xem lại lộ trình học'
              : isCompleted ? 'Buổi học đã hoàn thành'
              : isAwaitingPayout ? (session.hasIssueReport ? 'Báo cáo sự cố đang được xử lý' : 'Kiểm tra nội dung buổi học')
              : isUnscheduled ? 'Buổi học chưa được lên lịch'
              : 'Thời gian học đã được xác nhận'}
          </h3>
          <p className="mt-2 text-body-reg leading-relaxed text-fg-secondary">
            {isCancelled ? 'Theo dõi các buổi còn lại và tiếp tục kế hoạch học tập của bạn.'
              : isCompleted ? 'Xem nội dung và ghi chú gia sư đã cập nhật trong nhật ký buổi học.'
              : isAwaitingPayout ? (session.hasIssueReport ? 'Theo dõi thông tin báo cáo và tình trạng xử lý học phí bên dưới.'
                : isReportWindowOpen ? 'Xem nhật ký và gửi báo cáo nếu buổi học gặp sự cố trong thời hạn bảo vệ học phí.' : 'Xem lại nội dung đã học trong nhật ký buổi học.')
              : isUnscheduled ? (isTutor ? 'Thống nhất thời gian với học viên trước khi xác nhận lịch học.' : 'Hãy trao đổi với gia sư để thống nhất thời gian học phù hợp.')
              : session.startAt ? formatDateTime(session.startAt) : 'Xem thông tin lịch học và trao đổi khi cần hỗ trợ.'}
          </p>
          <div className="mt-5 space-y-3">
            {isCancelled ? (
              <Button as={Link} to={enrollmentPath} fullWidth icon={<Icon name="menu_book" size="sm" />}>Xem lộ trình học</Button>
            ) : isAwaitingPayout && showProtection ? (
              <Button as="a" href="#session-protection" fullWidth icon={<Icon name="shield" size="sm" />}>{session.hasIssueReport ? 'Xem báo cáo sự cố' : isTutor ? 'Xem bảo vệ học phí' : 'Kiểm tra buổi học'}</Button>
            ) : isCompleted || isAwaitingPayout ? (
              <Button as="a" href="#session-record" fullWidth icon={<Icon name="menu_book" size="sm" />}>Xem nhật ký</Button>
            ) : canTutorSchedule ? (
              <Button onClick={() => setShowRescheduleModal(true)} fullWidth icon={<Icon name="calendar_month" size="sm" />}>{isUnscheduled ? 'Xếp lịch buổi học' : 'Đổi lịch học'}</Button>
            ) : !isTutor && (isUnscheduled || isScheduled) ? (
              <Button onClick={messageParticipant} loading={openingChat} fullWidth icon={<Icon name="chat" size="sm" />}>Nhắn tin gia sư</Button>
            ) : null}
            {!isCancelled && <Button as={Link} to={enrollmentPath} variant="outline" fullWidth>Quay lại lộ trình</Button>}
          </div>
          {canCancel && (
            <div className="mt-5 flex justify-end border-t border-border pt-4">
              {actionLoading ? <p role="status" className="text-caption text-fg-secondary">Đang hủy buổi học…</p> : (
                <Menu label="Thêm thao tác" align="right"
                  trigger={<span className="inline-flex min-h-10 items-center gap-2 px-3 text-caption font-medium text-fg-secondary hover:text-fg">Thêm thao tác<Icon name="more_vert" size="sm" /></span>}
                  items={[{ key: 'cancel', label: 'Hủy buổi học', danger: true, icon: <Icon name="cancel" size="sm" />, onClick: handleCancelSession }]}
                />
              )}
            </div>
          )}
        </Card>}
      </div>

      {(previousSession || nextSession) && (
        <nav aria-label="Điều hướng buổi học" className="flex flex-wrap justify-between gap-4 border-t border-border pt-5">
          {previousSession ? <Link to={`/${isTutor ? 'tutor' : 'student'}/sessions/${previousSession.id}`} state={scheduleContext ? { scheduleReturn: scheduleContext } : undefined} className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-body-reg font-medium text-primary hover:bg-brand-primary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Icon name="arrow_back" size="sm" />Buổi trước · #{String(previousSession.sessionNumber).padStart(2, '0')}</Link> : <span />}
          {nextSession && <Link to={`/${isTutor ? 'tutor' : 'student'}/sessions/${nextSession.id}`} state={scheduleContext ? { scheduleReturn: scheduleContext } : undefined} className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-body-reg font-medium text-primary hover:bg-brand-primary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Buổi tiếp theo · #{String(nextSession.sessionNumber).padStart(2, '0')}<Icon name="arrow_forward" size="sm" /></Link>}
        </nav>
      )}

      {/* Modal: Direct Reschedule (Tutor Only) */}
      {showRescheduleModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="reschedule-modal-title"
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-fadeIn motion-reduce:animate-none"
        >
          <button
            type="button"
            aria-label="Đóng cửa sổ"
            className="fixed inset-0 w-full h-full bg-brand-navy-950/50 backdrop-blur-sm cursor-default"
            onClick={() => { if (!rescheduleSubmitting.current) setShowRescheduleModal(false); }}
            tabIndex={-1}
          />
          <div ref={reschedulePanel} className="relative bg-surface rounded-brand-lg shadow-brand-xl border border-border w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto flex flex-col z-10">
            <div className="p-6 pb-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Icon name="calendar_month" size="md" className="text-brand-primary-600" />
                <h3 id="reschedule-modal-title" className="text-headline-3 text-fg font-bold m-0">
                  {isUnscheduled ? 'Xếp lịch buổi học' : 'Đổi lịch học'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRescheduleModal(false)}
                disabled={submittingReschedule}
                aria-label="Đóng"
                className="text-fg-muted hover:text-fg p-1 rounded-brand-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary-600"
              >
                <Icon name="close" size="sm" />
              </button>
            </div>

            <form onSubmit={handleDirectReschedule} className="p-6 pt-5 space-y-4 text-caption">
              <div className="rounded-xl bg-brand-primary-50 p-3 text-caption leading-relaxed text-fg-secondary">
                Lịch mới phải cách hiện tại ít nhất 2 giờ{plannedDuration > 0 ? ` và có thời lượng ${plannedDuration} phút` : ''}. Hãy trao đổi với học viên trước khi lưu. Hệ thống sẽ kiểm tra trùng lịch và cập nhật lịch học sau khi xác nhận thành công.
              </div>

              <Field label="Ngày học mới" htmlFor="reschedule-date" required>
                <Input
                  id="reschedule-date"
                  type="date"
                  value={rescheduleDate}
                  min={dayjs().tz(TEACHING_ZONE).format('YYYY-MM-DD')}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  required
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Giờ bắt đầu (UTC+7)" htmlFor="reschedule-start" required>
                  <Input
                    id="reschedule-start"
                    type="time"
                    value={rescheduleStartTime}
                    onChange={(e) => setRescheduleStartTime(e.target.value)}
                    required
                  />
                </Field>
                <Field label="Giờ kết thúc (UTC+7)" htmlFor="reschedule-end" required>
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
                  disabled={submittingReschedule}
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
                  Lưu lịch học
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
