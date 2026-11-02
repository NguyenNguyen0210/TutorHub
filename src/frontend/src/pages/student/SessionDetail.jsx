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

  // Modal tự đóng bằng Escape, khớp hành vi `Dialog` dùng chung.
  useEffect(() => {
    if (!showRescheduleModal) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setShowRescheduleModal(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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
    loadSessionData();
    return () => { loadVersion.current += 1; };
  }, [loadSessionData]);

  const messageTutor = async () => {
    if (openingChat) return;
    setOpeningChat(true);
    try {
      const contract = enrollment || await enrollmentService.getEnrollmentById(session.enrollmentId);
      const tutorUserId = contract.tutorUserId
        || (await tutorService.getTutorById(contract.tutorProfileId)).userId;
      if (!tutorUserId) throw new Error('Không thể mở cuộc trò chuyện với gia sư.');
      const conversation = await chatService.getOrCreateConversation(tutorUserId);
      if (!conversation?.id) throw new Error('Không thể mở cuộc trò chuyện với gia sư.');
      navigate(`/app/messages?conversationId=${conversation.id}`);
    } catch (err) {
      toast.error(err?.message || 'Không thể mở tin nhắn. Vui lòng thử lại.');
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
    if (!recordInput.trim() || recordInput.trim().length < 10) {
      toast.error('Nội dung nhật ký buổi học cần tối thiểu 10 ký tự.');
      return;
    }
    try {
      setSubmittingRecord(true);
      const res = await sessionService.createLearningRecord(id, recordInput.trim());
      setLearningRecord(res);
      setRecordError(null);
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


  return (
    <div className="mx-auto max-w-[1100px] space-y-6">
      {scheduleContext && <Button as={Link} to={scheduleContext} variant="ghost" icon={<Icon name="arrow_back" size="sm" />}>Quay lại lịch dạy</Button>}
      <nav aria-label="Đường dẫn buổi học">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-caption text-fg-secondary">
          <li><Link to={backPath} className="hover:text-primary focus-visible:underline">{scheduleContext ? 'Lịch giảng dạy' : isTutor ? 'Bảng điều hành' : 'Bàn học'}</Link></li>
          <li aria-hidden="true">/</li>
          <li className="min-w-0"><Link to={enrollmentPath} className="break-words hover:text-primary focus-visible:underline">{courseTitle}</Link></li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="font-medium text-fg">Buổi #{number}</li>
        </ol>
      </nav>

      <Card as="header" padding="lg" variant="outlined" className="rounded-2xl">
        <p className="mb-2 text-body-reg text-fg-secondary break-words">{courseTitle}</p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-headline-1 font-bold text-fg">Buổi học #{number}</h1>
          <StateBadge status={session.status} domain="session" size="md" />
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border pt-5">
          <Avatar key={enrollment?.tutorAvatarUrl || tutorName} src={enrollment?.tutorAvatarUrl} name={tutorName} />
          <div className="min-w-0 flex-1">
            <p className="text-caption text-fg-secondary">Gia sư phụ trách</p>
            <p className="text-body-reg font-semibold text-fg break-words">{tutorName || 'Chưa có thông tin gia sư'}</p>
          </div>
          {!isTutor && <Button variant="outline" size="sm" onClick={messageTutor} loading={openingChat} icon={<Icon name="chat" size="xs" />}>Nhắn tin</Button>}
        </div>
      </Card>

      {isCancelled && (
        <Callout variant="neutral" icon={<Icon name="cancel" size="sm" />}>
          <p className="font-semibold">Buổi học đã hủy{session.cancelledAt ? ` · ${formatDateTime(session.cancelledAt)}` : ''}</p>
          <p className="mt-1">Buổi học này không còn trong lịch học của bạn. Bạn có thể xem lịch sử ví để kiểm tra giao dịch liên quan.</p>
        </Callout>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(280px,1fr)]">
        <div className="min-w-0 space-y-6">
          <Card as="section" padding="lg" variant="outlined" className="rounded-2xl" aria-labelledby="session-info-title">
            <h2 id="session-info-title" className="mb-2 text-headline-3 font-semibold text-fg">Thông tin buổi học</h2>
            <dl className="divide-y divide-border text-body-reg">
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
            <section id="session-protection" className="scroll-mt-24" aria-label="Bảo vệ học phí">
              <GracePeriodCard key={session.id} session={session} onIssueReported={handleIssueReported} isTutor={isTutor} />
            </section>
          )}

          <Card as="section" id="session-record" padding="lg" variant="outlined" className="scroll-mt-24 rounded-2xl" aria-labelledby="session-record-title">
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
            ) : (
              <div className="flex flex-col items-center px-2 py-8 text-center">
                <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-100 text-fg-secondary"><Icon name="menu_book" size="md" /></span>
                <p className="font-semibold text-fg">Chưa có nội dung buổi học</p>
                <p className="mt-2 max-w-sm text-body-reg leading-relaxed text-fg-secondary">Nội dung giảng dạy và ghi chú sẽ xuất hiện tại đây sau khi gia sư cập nhật.</p>
              </div>
            )}
            {isTutor && isCompleted && !learningRecord && !recordError && (
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
        </div>

        <Card as="aside" padding="lg" variant="outlined" className="rounded-2xl lg:sticky lg:top-24" aria-labelledby="session-action-title">
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
              <Button onClick={messageTutor} loading={openingChat} fullWidth icon={<Icon name="chat" size="sm" />}>Nhắn tin gia sư</Button>
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
        </Card>
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
            onClick={() => setShowRescheduleModal(false)}
            tabIndex={-1}
          />
          <div className="relative bg-surface rounded-brand-lg shadow-brand-xl border border-border w-full max-w-md flex flex-col z-10">
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
                aria-label="Đóng"
                className="text-fg-muted hover:text-fg p-1 rounded-brand-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary-600"
              >
                <Icon name="close" size="sm" />
              </button>
            </div>

            <form onSubmit={handleDirectReschedule} className="p-6 pt-5 space-y-4 text-caption">
              <div className="p-3 bg-holding-subtle rounded-brand-md border border-holding/30 text-xs text-holding-strong">
                <strong>Quy định đổi lịch:</strong> Lịch học mới phải cách thời điểm hiện tại ít nhất 2 giờ. Lịch học sẽ được cập nhật trực tiếp trên hệ thống ngay sau khi lưu.
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
