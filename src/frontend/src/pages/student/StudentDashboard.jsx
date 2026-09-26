import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import enrollmentService from '@/services/enrollment.service';
import sessionService from '@/services/session.service';
import { useAuthStore } from '@/store/authStore';
import { formatDateTime } from '@/utils/formatters';
import Money from '@/components/ui/Money';
import { StatsSkeleton } from '@/components/common/Skeleton';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import { Progress } from '@/components/ui/Callout';
import Icon from '@/components/ui/Icon';
import ActionQueue from '@/components/ledger/ActionQueue';
import LedgerStrip from '@/components/ledger/LedgerStrip';
import StateBadge from '@/components/ledger/StateBadge';

/**
 * Bàn học của học viên — Operational Ledger (SPEC §5.1).
 *
 * Nguyên tắc bố cục: thứ đang chờ mình nằm trên cùng. Cảnh báo đối soát điểm danh
 * 24h là thời điểm tiền học còn bị ký quỹ, nên nó phải là hàng đầu — trước đây nó
 * nằm ẩn sau 4 stat card.
 */
export default function StudentDashboard() {
  const { user } = useAuthStore();

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
          enrollmentService.getMyEnrollments({ pageSize: 20 }),
          sessionService.getMySessions(),
        ]);
        if (isMounted) {
          setEnrollments(enrollmentRes?.items || []);
          setSessions(Array.isArray(sessionList) ? sessionList : []);
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

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const now = useMemo(() => dayjs(), []);

  const activeEnrollments = useMemo(
    () => enrollments.filter((e) => e.status === 'Active'),
    [enrollments]
  );

  const upcomingSessions = useMemo(
    () =>
      sessions
        .filter((s) => s.status === 'Scheduled' && s.startAt && dayjs(s.startAt).isAfter(now))
        .sort((a, b) => dayjs(a.startAt).valueOf() - dayjs(b.startAt).valueOf()),
    [sessions, now]
  );
  const nextSession = upcomingSessions[0] || null;

  // Escrow còn giữ: tổng học phí × tỉ lệ buổi chưa hoàn thành.
  // Tiền theo trạng thái: phần còn ký quỹ vs phần đã giải ngân (đã có buổi xác nhận).
  const { escrowRemaining, escrowReleased } = useMemo(() => {
    return activeEnrollments.reduce(
      (acc, e) => {
        const total = Number(e.totalPrice) || 0;
        const totalSess = Number(e.totalSessions) || 1;
        const completed = Number(e.completedSessions) || 0;
        const doneRatio = Math.min(1, Math.max(0, completed / totalSess));
        acc.escrowRemaining += total * (1 - doneRatio);
        acc.escrowReleased += total * doneRatio;
        return acc;
      },
      { escrowRemaining: 0, escrowReleased: 0 }
    );
  }, [activeEnrollments]);

  /**
   * Action queue — chỉ những việc học viên phải làm.
   * Ưu tiên buổi đã diễn ra chưa xác nhận điểm danh (tiền đang bị ký quỹ), sau
   * đó tới buổi sắp diễn ra. `deadlineAt` để ActionQueue tự sắp xếp tăng dần.
   */
  const queue = useMemo(() => {
    const items = [];

    sessions
      .filter(
        (s) =>
          s.status === 'Scheduled' &&
          s.endAt &&
          dayjs(s.endAt).isBefore(now) &&
          s.attendanceVerificationDueAt &&
          !s.studentAttendance
      )
      .forEach((s) => {
        items.push({
          key: `attendance-${s.id}`,
          title: `Buổi #${s.sessionNumber}${s.subjectName ? ` · ${s.subjectName}` : ''} — đối soát điểm danh`,
          detail: 'Cửa sổ 24h đang mở. Chưa xác nhận thì tiền buổi học chưa được giải ngân.',
          deadlineAt: s.attendanceVerificationDueAt,
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
              Xác nhận
            </Button>
          ),
        });
      });

    if (nextSession) {
      items.push({
        key: `next-${nextSession.id}`,
        title: `Buổi #${nextSession.sessionNumber}${
          nextSession.subjectName ? ` · ${nextSession.subjectName}` : ''
        } sắp bắt đầu`,
        detail: nextSession.tutorName ? `Gia sư: ${nextSession.tutorName}` : undefined,
        deadlineAt: nextSession.startAt,
        icon: 'calendar_clock',
        tone: 'info',
        action: (
          <Button
            as={Link}
            to={`/student/sessions/${nextSession.id}`}
            variant="outline"
            size="sm"
            className="whitespace-nowrap"
          >
            Xem buổi học
          </Button>
        ),
      });
    }

    return items;
  }, [sessions, nextSession, now]);

  /** Đang học trước, trong nhóm thì buổi gần nhất lên đầu. */
  const sortedEnrollments = useMemo(() => {
    const rank = (e) => (e.status === 'Active' ? 0 : e.status === 'Completed' ? 1 : 2);
    return [...enrollments].sort((a, b) => rank(a) - rank(b));
  }, [enrollments]);

  const strikes = user?.absentStrikes ?? 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-16 bg-neutral-200 rounded-brand-md animate-pulse" />
        <StatsSkeleton count={4} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12">
        <ErrorState
          error={error}
          title="Không thể tải Bàn học của bạn"
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-[30px] leading-[1.2] font-bold text-fg tracking-tight">
            Chào mừng trở lại, {user?.fullName || user?.name || 'bạn'}!
          </h1>
          <p className="text-body-reg text-fg-secondary mt-1">
            Hợp đồng, lịch học và học phí đang bảo chứng của bạn.
          </p>
        </div>
        <Button
          as={Link}
          to="/"
          variant="primary"
          size="md"
          icon={<Icon name="search" size="sm" />}
          className="shrink-0"
        >
          Tìm thêm gia sư
        </Button>
      </div>

      <ActionQueue items={queue} />

      <LedgerStrip
        figures={[
          {
            key: 'active',
            label: 'Hợp đồng đang học',
            value: <span>{activeEnrollments.length}</span>,
            hint: enrollments.length > 0 ? `Tổng ${enrollments.length} hợp đồng` : 'Chưa có hợp đồng',
          },
          {
            key: 'escrow',
            label: 'Học phí trong Escrow',
            value: <Money value={escrowRemaining} />,
            hint: 'Bảo chứng an toàn trong ví sàn',
            tone: 'holding',
          },
          {
            key: 'next',
            label: 'Buổi học sắp tới',
            value: nextSession?.startAt ? (
              <span className="text-[20px]">
                {formatDateTime(nextSession.startAt, 'DD/MM HH:mm')}
              </span>
            ) : (
              <span className="text-[20px] text-fg-muted">Chưa có lịch</span>
            ),
            hint: nextSession?.tutorName || (nextSession?.subjectName || '—'),
          },
          {
            key: 'strike',
            label: 'Chỉ số tín nhiệm',
            value: (
              <span className={strikes > 0 ? 'text-danger-strong' : undefined}>
                {strikes} / 3
              </span>
            ),
            hint: strikes === 0 ? 'Chưa vi phạm vắng mặt' : 'Đã ghi nhận vắng mặt',
            tone: strikes > 0 ? 'danger' : 'default',
          },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Hợp đồng: sổ cái dòng ───────────────────────────── */}
        <section className="lg:col-span-2 space-y-3" aria-labelledby="enrollments-title">
          <div className="flex items-center justify-between gap-3">
            <h2 id="enrollments-title" className="text-[20px] font-semibold text-fg tracking-tight">
              Hợp đồng học tập
            </h2>
            <span className="text-caption text-fg-muted tabular-nums">
              {enrollments.length} hợp đồng
            </span>
          </div>

          {enrollments.length === 0 ? (
            <EmptyState
              icon="school"
              title="Bạn chưa có hợp đồng học tập nào"
              description="Tìm kiếm gia sư phù hợp và đặt mua gói học để bắt đầu hành trình học tập có bảo chứng."
              actionLabel="Khám phá gia sư ngay"
              actionPath="/"
            />
          ) : (
            <ul className="space-y-2.5">
              {sortedEnrollments.map((enr) => {
                const total = Number(enr.totalSessions) || 1;
                const done = Number(enr.completedSessions) || 0;
                const pct = Math.min(100, Math.round((done / total) * 100));
                return (
                  <li key={enr.id}>
                    <Card
                      as={Link}
                      to={`/student/enrollments/${enr.id}`}
                      padding="md"
                      className="block hover:border-brand-primary-200 hover:shadow-brand-md transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <Avatar
                          src={enr.tutorAvatarUrl}
                          name={enr.tutorName}
                          size="md"
                          className="rounded-brand-md shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-[15px] font-semibold text-fg leading-snug truncate">
                                {enr.serviceTitle || enr.subjectName}
                              </p>
                              <p className="text-caption text-fg-muted mt-0.5 truncate">
                                {enr.tutorName ? `Gia sư ${enr.tutorName}` : 'Gia sư'}
                                {enr.sessionDurationMinutes
                                  ? ` · ${enr.sessionDurationMinutes} phút/buổi`
                                  : ''}
                              </p>
                            </div>
                            <StateBadge status={enr.status} domain="enrollment" />
                          </div>

                          <div className="flex items-center gap-3 mt-3">
                            <Progress
                              value={pct}
                              label={`Tiến độ hợp đồng ${enr.serviceTitle || ''}`}
                              className="flex-1"
                            />
                            <span className="text-caption text-fg-secondary tabular-nums whitespace-nowrap">
                              {done}/{total} buổi
                            </span>
                            <span className="text-caption font-semibold text-fg whitespace-nowrap">
                              <Money value={enr.totalPrice} />
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* ── Rail: tiền đang ở đâu + buổi tới ─────────────────── */}
        <aside className="space-y-4">
          <div className="lg:sticky lg:top-24 space-y-4">
            <Card padding="md" className="space-y-3">
              <h2 className="text-caption font-semibold uppercase tracking-wide text-fg-secondary">
                Tiền của bạn đang ở đâu
              </h2>
              <dl className="space-y-2.5">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-caption text-fg-secondary">Đang ký quỹ</dt>
                  <dd className="text-caption font-semibold text-holding-strong tabular-nums">
                    <Money value={escrowRemaining} />
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-caption text-fg-secondary">Đã giải ngân</dt>
                  <dd className="text-caption font-semibold text-success-strong tabular-nums">
                    <Money value={escrowReleased} />
                  </dd>
                </div>
              </dl>
              <p className="text-[12px] text-fg-muted leading-relaxed border-t border-border pt-2.5 m-0">
                Tiền chỉ chuyển từ ký quỹ sang đã giải ngân sau khi cả hai bên xác nhận điểm danh.
              </p>
              <Button
                as={Link}
                to="/student/wallet"
                variant="outline"
                size="sm"
                fullWidth
                className="whitespace-nowrap"
              >
                Mở Ví Học Viên
              </Button>
            </Card>

            {nextSession && (
              <Card padding="md" className="space-y-2">
                <h2 className="text-caption font-semibold uppercase tracking-wide text-fg-secondary">
                  Buổi học tới
                </h2>
                <p className="text-[15px] font-semibold text-fg">
                  {nextSession.subjectName || `Buổi #${nextSession.sessionNumber}`}
                </p>
                <p className="text-caption text-fg-secondary tabular-nums">
                  {formatDateTime(nextSession.startAt, 'DD/MM/YYYY · HH:mm')}
                </p>
                {nextSession.tutorName && (
                  <p className="text-caption text-fg-muted">Gia sư {nextSession.tutorName}</p>
                )}
                <Button
                  as={Link}
                  to={`/student/sessions/${nextSession.id}`}
                  variant="ghost"
                  size="sm"
                  fullWidth
                  className="whitespace-nowrap"
                >
                  Chi tiết buổi học
                </Button>
              </Card>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
