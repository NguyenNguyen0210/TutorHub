import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import chatService from '@/services/chat.service';
import { useToast } from '@/components/ui/Toast';
import { summarizeTuition } from '@/utils/studentDashboard';
import dayjs from 'dayjs';
import enrollmentService from '@/services/enrollment.service';
import sessionService from '@/services/session.service';
import { useAuthStore } from '@/store/authStore';
import { formatDateTime } from '@/utils/formatters';
import Money from '@/components/ui/Money';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import { Progress } from '@/components/ui/Callout';
import Icon from '@/components/ui/Icon';
import ActionQueue from '@/components/common/ActionQueue';
import StateBadge from '@/components/common/StateBadge';
import StretchedCardLink from '@/components/ui/StretchedCardLink';

/** Bàn học của học viên — lớp học, lịch sắp tới và tiến độ học tập. */
export default function StudentDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const toast = useToast();
  const [openingTutorId, setOpeningTutorId] = useState(null);

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
          enrollmentService.getAllMyEnrollments(),
          sessionService.getMySessions(),
        ]);
        if (!isMounted) return;

        const calendar = Array.isArray(sessionList) ? sessionList : [];
        setEnrollments(enrollmentRes?.items || []);
        setError(null);

        // `GET /sessions` trả `SessionCalendarDto` — KHÔNG có
        // `gracePeriodEndsAt` / `hasIssueReport`.
        // Để hiển thị các buổi trong thời gian chờ giải ngân (AwaitingPayout),
        // ta hydrate các buổi có status === 'AwaitingPayout'.
        const candidates = calendar.filter((s) => s.status === 'AwaitingPayout');
        if (candidates.length === 0) {
          setSessions(calendar);
          return;
        }

        const details = await Promise.all(
          candidates.map((s) =>
            sessionService.getSessionById(s.id).catch(() => null)
          )
        );
        if (isMounted) {
          const byId = new Map();
          details.filter(Boolean).forEach((d) => byId.set(d.id, d));
          setSessions(calendar.map((s) => ({ ...s, ...(byId.get(s.id) || {}) })));
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

  const [clock, setClock] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), 60000);
    return () => window.clearInterval(timer);
  }, []);
  const now = useMemo(() => dayjs(clock), [clock]);

  const activeEnrollments = useMemo(
    () => enrollments.filter((e) => e.status === 'Active'),
    [enrollments]
  );

  const upcomingSessions = useMemo(
    () =>
      sessions
        .filter((s) => s.status === 'Scheduled' && s.startAt && dayjs.utc(s.startAt).isAfter(now))
        .sort((a, b) => dayjs(a.startAt).valueOf() - dayjs(b.startAt).valueOf()),
    [sessions, now]
  );
  const nextSession = upcomingSessions[0] || null;
  const { totalTuition, escrowRemaining, escrowReleased, escrowRefunded } = useMemo(
    () => summarizeTuition(enrollments), [enrollments]
  );
  const releasedPercent = totalTuition > 0 ? Math.round(100 * escrowReleased / totalTuition) : 0;
  const currentSession = sessions.find(session => session.status === 'Scheduled' && session.startAt && session.endAt
    && !dayjs.utc(session.startAt).isAfter(now) && dayjs.utc(session.endAt).isAfter(now));
  const featuredSession = currentSession || nextSession;
  const featuredEnrollment = featuredSession ? enrollments.find(item => item.id === featuredSession.enrollmentId) : null;
  const schedulingEnrollment = activeEnrollments.find(enrollment =>
    Number(enrollment.completedSessions) < Number(enrollment.totalSessions)
    && !sessions.some(session => session.enrollmentId === enrollment.id && session.status === 'Scheduled'
      && session.endAt && dayjs.utc(session.endAt).isAfter(now)));
  const schedulingHasStarted = schedulingEnrollment && (Number(schedulingEnrollment.completedSessions) > 0
    || sessions.some(session => session.enrollmentId === schedulingEnrollment.id && !['Unscheduled', 'Cancelled'].includes(session.status)));
  const completedCourses = enrollments.filter(item => item.status === 'Completed').length;
  const greetingName = (user?.fullName || user?.name || '').trim().split(/\s+/).slice(-2).join(' ') || 'bạn';

  const handleScheduleChat = async (enrollment) => {
    if (!enrollment?.tutorUserId || openingTutorId) return;
    setOpeningTutorId(enrollment.tutorUserId);
    try {
      const conversation = await chatService.getOrCreateConversation(enrollment.tutorUserId);
      if (!conversation?.id) throw new Error('Không thể mở cuộc trò chuyện.');
      navigate(`/app/messages?conversationId=${conversation.id}`);
    } catch (err) {
      toast.error(err?.message || 'Không thể mở cuộc trò chuyện. Vui lòng thử lại.');
    } finally {
      setOpeningTutorId(null);
    }
  };

  /**
   * Những buổi vừa kết thúc cần học viên xem lại trước thời hạn giải ngân.
   * Lịch sắp tới được trình bày riêng ở cột phải.
   */
  const queue = useMemo(() => {
    const items = [];

    sessions
      .filter(
        (s) =>
          s.status === 'AwaitingPayout' &&
          !s.hasIssueReport &&
          s.gracePeriodEndsAt &&
          dayjs.utc(s.gracePeriodEndsAt).isAfter(now)
      )
      .forEach((s) => {
        items.push({
          key: `grace-period-${s.id}`,
          priority: 0,
          title: `Xem lại buổi #${s.sessionNumber}${s.subjectName ? ` · ${s.subjectName}` : ''} vừa kết thúc`,
          detail: 'Kiểm tra buổi học và báo cáo sự cố trước khi học phí được giải ngân.',
          deadlineAt: s.gracePeriodEndsAt,
          icon: 'timer',
          tone: 'holding',
          action: (
            <Button
              as={Link}
              to={`/student/sessions/${s.id}`}
              variant="primary"
              size="sm"
              className="whitespace-nowrap"
            >
              Chi tiết buổi học
            </Button>
          ),
        });
      });

    return items;
  }, [sessions, now]);

  /** Ưu tiên lớp đang học, tiếp theo là những lộ trình đã hoàn thành. */
  const sortedEnrollments = useMemo(() => {
    const rank = (e) => (e.status === 'Active' ? 0 : e.status === 'Completed' ? 1 : 2);
    return [...enrollments].sort((a, b) => rank(a) - rank(b));
  }, [enrollments]);


  if (loading) {
    return (
      <div role="status" aria-label="Đang tải bàn học" className="mx-auto max-w-[1200px] space-y-6">
        <div className="space-y-3"><div className="h-8 w-56 rounded-xl bg-neutral-200 motion-safe:animate-pulse" /><div className="h-4 w-72 max-w-full rounded bg-neutral-100 motion-safe:animate-pulse" /></div>
        <div className="h-40 rounded-2xl bg-[rgb(var(--learning-soft-blue))] motion-safe:animate-pulse" />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.8fr)_minmax(280px,1fr)]">
          <Card padding="lg" variant="outlined" className="space-y-5 rounded-2xl"><div className="h-6 w-3/4 rounded bg-neutral-100 motion-safe:animate-pulse" /><div className="h-12 rounded bg-neutral-100 motion-safe:animate-pulse" /><div className="h-24 rounded-xl bg-neutral-100 motion-safe:animate-pulse" /><div className="h-11 w-40 rounded-lg bg-neutral-100 motion-safe:animate-pulse" /></Card>
          <div className="space-y-6">{[0, 1].map(key => <Card key={key} padding="lg" variant="outlined" className="h-44 rounded-2xl"><div className="h-5 w-1/2 rounded bg-neutral-100 motion-safe:animate-pulse" /></Card>)}</div>
        </div>
      </div>
    );
  }
  if (error) {
    return <div className="py-12"><ErrorState error={error} title="Không thể tải Bàn học của bạn" onRetry={() => window.location.reload()} /></div>;
  }

  return (
    <div className="mx-auto max-w-[1200px] space-y-6 lg:space-y-8">
      <nav aria-label="Đường dẫn bàn học" className="text-caption font-medium text-fg-secondary"><ol><li aria-current="page">Bàn học</li></ol></nav>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[28px] font-semibold leading-tight text-fg">Chào {greetingName}! <span aria-hidden="true">👋</span></h1>
          <p className="mt-2 text-body-reg leading-relaxed text-fg-secondary">Cùng tiếp tục hành trình học tập của bạn nhé.</p>
        </div>
        <Button as={Link} to="/student/schedule" variant="outline" icon={<Icon name="calendar_month" size="sm" />}>Xem lịch học</Button>
      </header>

      <ActionQueue items={queue} title="Buổi học cần xem lại" />

      {enrollments.length > 0 && (
        <section aria-labelledby="next-action-title" className="flex flex-col gap-5 rounded-2xl bg-[rgb(var(--learning-soft-blue))] p-6 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div className="flex min-w-0 items-start gap-4">
            <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-surface/80 text-primary sm:flex"><Icon name={featuredSession ? 'calendar_month' : schedulingEnrollment ? 'chat' : 'menu_book'} size="lg" /></span>
            <div className="min-w-0">
              <h2 id="next-action-title" className="text-[18px] font-semibold leading-snug text-fg">
                {featuredSession ? currentSession ? 'Buổi học theo lịch hiện tại' : 'Buổi học tiếp theo'
                  : schedulingEnrollment ? schedulingHasStarted ? 'Cùng lên lịch cho buổi học tiếp theo' : 'Sẵn sàng cho buổi học đầu tiên?'
                  : activeEnrollments.length > 0 ? 'Tiếp tục theo dõi lộ trình của bạn' : 'Khám phá lộ trình học tiếp theo'}
              </h2>
              {featuredSession ? (
                <div className="mt-2 space-y-1 text-body-reg text-fg-secondary">
                  <p className="font-semibold text-fg">{formatDateTime(featuredSession.startAt, 'HH:mm')} · {formatDateTime(featuredSession.startAt, 'DD/MM/YYYY')}</p>
                  <p className="break-words">{featuredEnrollment?.serviceTitle || featuredSession.subjectName || `Buổi học #${featuredSession.sessionNumber}`}</p>
                  {(featuredSession.tutorName || featuredEnrollment?.tutorName) && <p>Gia sư {featuredSession.tutorName || featuredEnrollment.tutorName}</p>}
                </div>
              ) : <p className="mt-2 max-w-2xl text-body-reg leading-relaxed text-fg-secondary">
                {schedulingEnrollment ? `Lớp ${schedulingEnrollment.subjectName || schedulingEnrollment.serviceTitle || 'của bạn'} chưa có lịch học sắp tới. Hãy trao đổi với gia sư để thống nhất thời gian phù hợp.`
                  : activeEnrollments.length > 0 ? 'Xem lại nội dung từng buổi học và các cập nhật trong lớp của bạn.'
                  : 'Tìm một gia sư và gói học phù hợp với mục tiêu tiếp theo của bạn.'}
              </p>}
            </div>
          </div>
          <div className="shrink-0 sm:max-w-[220px]">
            {featuredSession ? <Button as={Link} to={`/student/sessions/${featuredSession.id}`} className="w-full rounded-[10px]" iconRight={<Icon name="arrow_forward" size="sm" />}>Xem buổi học</Button>
              : schedulingEnrollment?.tutorUserId ? <Button onClick={() => handleScheduleChat(schedulingEnrollment)} disabled={Boolean(openingTutorId)} loading={openingTutorId === schedulingEnrollment.tutorUserId} icon={<Icon name="chat" size="sm" />} className="w-full rounded-[10px]">Nhắn tin gia sư</Button>
              : activeEnrollments.length > 0 ? <Button as={Link} to={`/student/enrollments/${schedulingEnrollment?.id || activeEnrollments[0].id}`} className="w-full rounded-[10px]">Xem lộ trình</Button>
              : <Button as={Link} to="/tutors" className="w-full rounded-[10px]">Khám phá gia sư</Button>}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1.8fr)_minmax(280px,1fr)]">
        <section className="min-w-0 space-y-4" aria-labelledby="enrollments-title">
          <div className="flex items-center justify-between gap-3">
            <h2 id="enrollments-title" className="text-[18px] font-semibold text-fg">Lớp học của tôi</h2>
            <span className="text-caption text-fg-secondary">{enrollments.length} lớp học</span>
          </div>
          {enrollments.length === 0 ? (
            <EmptyState icon="school" title="Bắt đầu lớp học đầu tiên của bạn" description="Tìm một gia sư phù hợp, chọn gói học và cùng xây dựng lộ trình cho mục tiêu của bạn."
              actionLabel="Khám phá gia sư" actionPath="/tutors" className="max-w-none rounded-2xl shadow-[var(--learning-card-shadow)] [&_p]:text-fg-secondary" />
          ) : (
            <ul className="space-y-6">
              {sortedEnrollments.map(enrollment => {
                const total = Number(enrollment.totalSessions) || 0;
                const completed = Number(enrollment.completedSessions) || 0;
                const percent = total > 0 ? Math.min(100, Math.round(completed / total * 100)) : 0;
                return (
                  <li key={enrollment.id}>
                    <Card padding="lg" variant="outlined" className="interactive-card rounded-2xl shadow-[var(--learning-card-shadow)]">
                      <StretchedCardLink to={`/student/enrollments/${enrollment.id}`} label={`Xem lộ trình ${enrollment.serviceTitle || enrollment.subjectName || 'lớp học'}`} />
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className="inline-flex items-center gap-2 text-caption font-medium text-fg-secondary"><Icon name="menu_book" size="sm" className="text-primary" />{enrollment.subjectName || 'Lớp học'}</span>
                        <StateBadge status={enrollment.status} domain="enrollment" />
                      </div>
                      <h3 className="mt-4 text-[18px] font-semibold leading-relaxed text-fg">
                        {enrollment.serviceTitle || enrollment.subjectName || 'Lộ trình học'}
                      </h3>
                      <div className="mt-5 flex items-center gap-3">
                        <Avatar key={enrollment.tutorAvatarUrl || enrollment.tutorName} src={enrollment.tutorAvatarUrl} name={enrollment.tutorName} />
                        <div className="min-w-0">
                          <p className="text-body-reg font-medium text-fg">{enrollment.tutorName || 'Gia sư'}</p>
                          {enrollment.sessionDurationMinutes > 0 && <p className="mt-1 text-caption text-fg-secondary">{enrollment.sessionDurationMinutes} phút/buổi</p>}
                        </div>
                      </div>
                      <div className="mt-6">
                        <div className="mb-3 flex items-center justify-between gap-3 text-caption">
                          <span className="font-medium text-fg-secondary">Tiến độ học tập</span>
                          <span className="font-semibold tabular-nums text-fg">{completed}/{total} buổi</span>
                        </div>
                        <Progress value={percent} label={`Tiến độ lớp học ${enrollment.serviceTitle || enrollment.subjectName || ''}`} />
                        <p className="mt-3 text-caption leading-relaxed text-fg-secondary">
                          {enrollment.status === 'Completed' ? 'Bạn đã hoàn thành lộ trình này.'
                            : enrollment.status === 'Cancelled' ? 'Lộ trình này đã dừng. Bạn vẫn có thể xem lại các buổi học.'
                            : enrollment.status === 'Pending' ? 'Lớp học đang chờ được kích hoạt.'
                            : completed === 0 ? 'Hành trình học tập của bạn vừa bắt đầu.'
                            : 'Cùng tiếp tục từng bước để tiến gần hơn đến mục tiêu của bạn.'}
                        </p>
                      </div>
                      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <Button as="span" aria-hidden="true" variant="outline" iconRight={<Icon name="arrow_forward" size="sm" />} className="rounded-[10px]">Xem lộ trình</Button>
                        {enrollment.status === 'Active' && enrollment.tutorUserId && <Button variant="ghost" icon={<Icon name="chat" size="sm" />} className="relative z-20 rounded-[10px] text-primary"
                          loading={openingTutorId === enrollment.tutorUserId} disabled={Boolean(openingTutorId)} onClick={() => handleScheduleChat(enrollment)}>Nhắn tin gia sư</Button>}
                      </div>
                    </Card>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <aside className="min-w-0 space-y-6 lg:sticky lg:top-24">
          <section aria-labelledby="overview-title">
            <h2 id="overview-title" className="mb-4 text-[18px] font-semibold text-fg">Tổng quan</h2>
            <Card padding="lg" variant="outlined" className="rounded-2xl shadow-[var(--learning-card-shadow)]">
              <dl className="space-y-5">
                <div className="flex items-center gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[rgb(var(--learning-mint))] text-success-strong"><Icon name="school" size="md" /></span>
                  <div><dt className="text-caption text-fg-secondary">Lớp đang học</dt><dd className="mt-1 text-2xl font-semibold tabular-nums text-fg">{activeEnrollments.length}</dd></div>
                </div>
                {completedCourses > 0 && <div className="flex items-center gap-4"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-fg-secondary"><Icon name="check_circle" size="md" /></span><div><dt className="text-caption text-fg-secondary">Lộ trình đã hoàn thành</dt><dd className="mt-1 text-2xl font-semibold tabular-nums text-fg">{completedCourses}</dd></div></div>}
              </dl>
              <p className="mt-5 text-caption leading-relaxed text-fg-secondary">{activeEnrollments.length ? 'Theo dõi từng buổi học và nội dung đã học trong lộ trình của mỗi lớp.' : 'Các lớp đang học của bạn sẽ xuất hiện tại đây sau khi được kích hoạt.'}</p>
            </Card>
          </section>

          <Card as="section" aria-labelledby="tuition-title" padding="lg" variant="outlined" className="rounded-2xl shadow-[var(--learning-card-shadow)]">
            <div className="flex items-center justify-between gap-3"><h2 id="tuition-title" className="text-[18px] font-semibold text-fg">Học phí của bạn</h2><Icon name="shield" size="md" className="text-fg-secondary" /></div>
            <dl className="mt-5 space-y-4">
              <div><dt className="text-caption text-fg-secondary">Học phí đang ký quỹ</dt><dd className="mt-2 text-[24px] font-semibold text-holding-strong"><Money value={escrowRemaining} /></dd></div>
              <div className="flex flex-wrap items-center justify-between gap-2"><dt className="text-caption text-fg-secondary">Tổng học phí ban đầu</dt><dd className="text-caption font-medium text-fg"><Money value={totalTuition} /></dd></div>
              <div className="flex flex-wrap items-center justify-between gap-2"><dt className="text-caption text-fg-secondary">Đã giải ngân</dt><dd className="text-caption font-medium text-success-strong"><Money value={escrowReleased} /></dd></div>
              {escrowRefunded > 0 && <div className="flex flex-wrap items-center justify-between gap-2"><dt className="text-caption text-fg-secondary">Đã hoàn tiền</dt><dd className="text-caption font-medium text-fg"><Money value={escrowRefunded} /></dd></div>}
            </dl>
            {totalTuition > 0 && <div className="mt-5 space-y-3"><Progress value={releasedPercent} variant="success" label="Tỷ lệ học phí đã giải ngân" /><p className="text-caption leading-relaxed text-fg-secondary">{escrowReleased === 0 ? 'Chưa có học phí nào được giải ngân.' : `Đã giải ngân ${releasedPercent}% tổng học phí.`}</p></div>}
            <p className="mt-4 text-caption leading-relaxed text-fg-secondary">Học phí được giữ an toàn và giải ngân sau 12 giờ nếu buổi học không có khiếu nại.</p>
            <Button as={Link} to="/student/wallet" variant="ghost" fullWidth className="mt-3 rounded-[10px] text-primary" icon={<Icon name="account_balance_wallet" size="sm" />}>Xem Ví học viên</Button>
          </Card>
        </aside>
      </div>
    </div>
  );
}
