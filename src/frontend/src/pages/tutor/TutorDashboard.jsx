import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import sessionService from '@/services/session.service';
import walletService from '@/services/wallet.service';
import tutorService from '@/services/tutor.service';
import { useAuthStore } from '@/store/authStore';
import { formatDateTime } from '@/utils/formatters';
import Money from '@/components/ui/Money';
import { StatsSkeleton } from '@/components/common/Skeleton';
import ErrorState from '@/components/common/ErrorState';
import EmptyState from '@/components/common/EmptyState';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Callout from '@/components/ui/Callout';
import Icon from '@/components/ui/Icon';
import ActionQueue from '@/components/ledger/ActionQueue';
import LedgerStrip from '@/components/ledger/LedgerStrip';
import StateBadge from '@/components/ledger/StateBadge';

/**
 * Bảng điều hành gia sư — Operational Ledger (SPEC §4.1).
 *
 * Mirror của Bàn học Học viên nhưng ưu tiên khác: gia sư bán thời gian, nên việc
 * chờ nằm ở tiền hợp đồng đang ký quỹ (buổi chưa xếp lịch, buổi chờ giải ngân)
 * chứ không phải ở hợp đồng. Action Queue dùng chung component,
 * cùng một cách render với vùng Học viên.
 *
 * Nguồn dữ liệu: `GET /sessions` trả về SessionCalendarDto phẳng cho tutor —
 * đã gồm cả buổi `Unscheduled`, nên phần lớn hàng việc chờ chỉ cần MỘT request,
 * không cần gọi `getEnrollmentById` theo từng enrollment như `TutorSchedule`.
 *
 * Lưu ý quan trọng: `SessionCalendarDto` **không có** `gracePeriodEndsAt`
 * hay `hasIssueReport` (những field này chỉ nằm ở `GET /sessions/{id}`).
 * Ta hydrate riêng các buổi có trạng thái AwaitingPayout.
 */
export default function TutorDashboard() {
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [application, setApplication] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadTutorData() {
      try {
        setLoading(true);
        const [walletData, sessionList, appData] = await Promise.all([
          walletService.getMyWallet(),
          sessionService.getMySessions(),
          tutorService.getMyTutorApplication().catch(() => null),
        ]);
        if (!isMounted) return;

        const calendar = Array.isArray(sessionList) ? sessionList : [];
        setWallet(walletData);
        setApplication(appData);
        setError(null);

        // Chỉ hydrate các buổi chờ giải ngân (AwaitingPayout) để lấy field gracePeriodEndsAt.
        const candidates = calendar.filter((s) => s.status === 'AwaitingPayout');
        if (candidates.length === 0) {
          setSessions(calendar);
          return;
        }
        const details = await Promise.all(
          candidates.map((s) => sessionService.getSessionById(s.id).catch(() => null))
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

    loadTutorData();
    return () => {
      isMounted = false;
    };
  }, []);

  const now = useMemo(() => dayjs(), []);

  const upcomingSessions = useMemo(
    () =>
      sessions
        .filter((s) => s.status === 'Scheduled' && s.startAt && dayjs(s.startAt).isAfter(now))
        .sort((a, b) => dayjs(a.startAt).valueOf() - dayjs(b.startAt).valueOf()),
    [sessions, now]
  );
  const nextSession = upcomingSessions[0] || null;

  const activeStudents = useMemo(
    () => new Set(sessions.map((s) => s.studentName).filter(Boolean)).size,
    [sessions]
  );

  /**
   * Hàng việc chờ — thứ tự ưu tiên (SPEC §4.1):
   *   1. Buổi chưa xếp lịch — tiền hợp đồng đang ký quỹ, học viên đang chờ.
   *   2. Buổi chờ giải ngân tự động — thông tin đếm ngược cho gia sư.
   *   3. Buổi sắp tới.
   * `ActionQueue` tự sắp xếp tăng dần theo `deadlineAt` — chỉ cần đưa đúng hạn.
   */
  const queue = useMemo(() => {
    const items = [];

    // (1) Buổi chưa xếp lịch — học viên đang chờ, tiền vẫn nằm trong Escrow.
    sessions
      .filter((s) => s.status === 'Unscheduled')
      .forEach((s) => {
        items.push({
          key: `unscheduled-${s.id}`,
          title: `Buổi #${s.sessionNumber}${s.subjectName ? ` · ${s.subjectName}` : ''} chưa có lịch`,
          detail: s.studentName
            ? `Học viên ${s.studentName} đang chờ. Tiền buổi học chưa được giải ngân.`
            : 'Tiền buổi học chưa được giải ngân, cần xếp lịch để bắt đầu.',
          // `startAt` null nên không có deadline; `priority` giữ nó ở đầu hàng đợi
          // theo SPEC §4.1 thay vì bị đẩy xuống cuối.
          priority: 0,
          deadlineAt: undefined,
          icon: 'calendar_month',
          tone: 'holding',
          action: (
            <Button
              as={Link}
              to="/tutor/schedule?tab=unscheduled"
              variant="primary"
              size="sm"
              className="whitespace-nowrap"
            >
              Xếp lịch
            </Button>
          ),
        });
      });

    // (2) Buổi chờ giải ngân tự động — thông tin đếm ngược cho gia sư (không cần thao tác)
    sessions
      .filter((s) => s.status === 'AwaitingPayout')
      .forEach((s) => {
        const payoutTime = s.gracePeriodEndsAt
          ? formatDateTime(s.gracePeriodEndsAt, 'HH:mm DD/MM/YYYY')
          : 'hết thời gian chờ';
        items.push({
          key: `payout-${s.id}`,
          title: `Buổi #${s.sessionNumber}${s.subjectName ? ` · ${s.subjectName}` : ''}`,
          detail: `Tiền sẽ được giải ngân vào ${payoutTime}`,
          priority: 1,
          deadlineAt: s.gracePeriodEndsAt ?? undefined,
          icon: 'timer',
          tone: 'holding',
          action: (
            <Button
              as={Link}
              to={`/tutor/sessions/${s.id}`}
              variant="outline"
              size="sm"
              className="whitespace-nowrap"
            >
              Chi tiết
            </Button>
          ),
        });
      });

    // (3) Buổi sắp tới — giữ cho gia sư nhìn thấy ngay kẻ tiếp theo trong ngày.
    if (nextSession) {
      items.push({
        key: `next-${nextSession.id}`,
        title: `Buổi #${nextSession.sessionNumber}${
          nextSession.subjectName ? ` · ${nextSession.subjectName}` : ''
        } sắp bắt đầu`,
        detail: nextSession.studentName ? `Học viên: ${nextSession.studentName}` : undefined,
        priority: 2,
        deadlineAt: nextSession.startAt,
        icon: 'calendar_clock',
        tone: 'info',
        action: (
          <Button
            as={Link}
            to={`/tutor/sessions/${nextSession.id}`}
            variant="outline"
            size="sm"
            className="whitespace-nowrap"
          >
            Xem buổi dạy
          </Button>
        ),
      });
    }

    return items;
  }, [sessions, nextSession]);

  /** Sổ buổi dạy — 5 buổi sắp tới gần nhất, sớm nhất lên đầu. */
  const ledgerSessions = useMemo(
    () =>
      sessions
        .filter((s) => s.status === 'Scheduled' && s.startAt)
        .sort((a, b) => dayjs(a.startAt).valueOf() - dayjs(b.startAt).valueOf())
        .slice(0, 5),
    [sessions]
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-16 bg-neutral-200 rounded-brand-md animate-pulse" />
        <StatsSkeleton count={3} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12">
        <ErrorState
          error={error}
          title="Không thể tải Bảng điều hành gia sư"
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-headline-page text-fg tracking-tight">
              {user?.fullName || user?.name || 'Gia sư'}
            </h1>
            {application ? (
              <StateBadge status={application.status} domain="application" size="md" />
            ) : (
              <Badge variant="neutral" size="md">
                Chưa nộp hồ sơ
              </Badge>
            )}
          </div>
          <p className="text-body-reg text-fg-secondary mt-1">
            Quản trị giảng dạy, theo dõi lịch dạy và doanh thu đối soát theo từng buổi học
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <Button
            as={Link}
            to="/tutor/services/new"
            variant="primary"
            size="md"
            icon={<Icon name="add" size="sm" />}
          >
            Tạo gói dịch vụ
          </Button>
          <Button
            as={Link}
            to="/tutor/schedule"
            variant="outline"
            size="md"
            icon={<Icon name="calendar_month" size="sm" />}
          >
            Lịch dạy
          </Button>
          <Button
            as={Link}
            to="/tutor/wallet/withdraw"
            variant="outline"
            size="md"
            icon={<Icon name="payments" size="sm" />}
          >
            Rút tiền ví
          </Button>
        </div>
      </div>

      {/* Onboarding — dựng lại bằng token: Callout thay cho div gradient + hex. */}
      {!application && (
        <Callout
          variant="info"
          icon={<Icon name="verified_user" size="md" />}
          className="items-center gap-4"
          action={
            <Button
              as={Link}
              to="/tutor/application"
              variant="primary"
              size="md"
              className="whitespace-nowrap"
              icon={<Icon name="arrow_forward" size="sm" />}
            >
              Nộp hồ sơ ngay
            </Button>
          }
        >
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-brand-primary-700 bg-brand-primary-50 border border-brand-primary-100 px-2 py-0.5 rounded-pill">
            Bước quan trọng tiếp theo
          </span>
          <p className="text-[15px] font-semibold text-fg leading-snug mt-1.5">
            Hoàn tất hồ sơ đăng ký giảng dạy TutorHub
          </p>
          <p className="text-caption text-fg-secondary mt-1 max-w-2xl">
            Tài khoản của bạn chưa nộp hồ sơ giảng dạy. Vui lòng hoàn thành 6 bước kê khai
            thông tin, văn bằng và môn học để được cấp huy hiệu <strong>Verified Tutor</strong>{' '}
            và mở lớp nhận học viên.
          </p>
        </Callout>
      )}

      {application && application.status === 'Pending' && (
        <Callout
          variant="warning"
          icon={<Icon name="hourglass_top" size="md" />}
          className="items-center"
          action={
            <Button
              as={Link}
              to="/tutor/application"
              variant="outline"
              size="sm"
              className="whitespace-nowrap"
            >
              Xem tiến độ hồ sơ
            </Button>
          }
        >
          <p className="text-[15px] font-semibold text-fg leading-snug">
            Hồ sơ gia sư của bạn đang chờ kiểm duyệt
          </p>
          <p className="text-caption text-fg-secondary mt-0.5">
            Đội ngũ TutorHub đang thẩm định văn bằng và sẽ phản hồi trong 1–3 ngày làm việc.
          </p>
        </Callout>
      )}

      {application && application.status === 'Rejected' && (
        <Callout
          variant="danger"
          icon={<Icon name="error" size="md" />}
          className="items-center"
          action={
            <Button
              as={Link}
              to="/tutor/application"
              variant="danger-outline"
              size="sm"
              className="whitespace-nowrap"
            >
              Cập nhật &amp; Nộp lại
            </Button>
          }
        >
          <p className="text-[15px] font-semibold text-danger-strong leading-snug">
            Hồ sơ bị từ chối xét duyệt:{' '}
            {application.rejectionReason || 'Cần bổ sung thông tin'}
          </p>
          <p className="text-caption text-fg-secondary mt-0.5">
            Bạn có thể cập nhật lại văn bằng, kinh nghiệm và nộp lại hồ sơ để được phê duyệt.
          </p>
        </Callout>
      )}

      <ActionQueue items={queue} />

      <LedgerStrip
        figures={[
          {
            key: 'students',
            label: 'Học viên đang dạy',
            value: <span>{activeStudents}</span>,
            hint: `${sessions.length} buổi học ghi nhận`,
          },
          {
            key: 'pending',
            label: 'Ký quỹ chờ giải ngân',
            value: <Money value={wallet?.pendingBalance || 0} />,
            hint: 'Đang bảo toàn trong Escrow',
            tone: 'holding',
          },
          {
            key: 'available',
            label: 'Thu nhập khả dụng',
            value: <Money value={wallet?.availableBalance || 0} />,
            hint: 'Đã giải ngân vào ví (trừ 10% phí)',
          },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Sổ buổi dạy: dòng sổ ──────────────────────────────── */}
        <section className="lg:col-span-2 space-y-3" aria-labelledby="session-ledger-title">
          <div className="flex items-center justify-between gap-3">
            <h2
              id="session-ledger-title"
              className="text-[20px] font-semibold text-fg tracking-tight"
            >
              Sổ buổi dạy
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-caption text-fg-muted tabular-nums">
                {ledgerSessions.length} buổi sắp tới
              </span>
              <Link
                to="/tutor/schedule"
                className="inline-flex items-center gap-0.5 text-caption font-semibold text-brand-primary-700 hover:text-brand-primary-800"
              >
                Lịch dạy
                <Icon name="chevron_right" size="sm" />
              </Link>
            </div>
          </div>

          {ledgerSessions.length === 0 ? (
            <EmptyState
              icon="event_available"
              title="Không có buổi dạy nào trong thời gian tới"
              description="Vào mục Lịch dạy để sắp xếp thời khóa biểu cho các lớp học."
              actionLabel="Mở Lịch dạy"
              actionPath="/tutor/schedule"
            />
          ) : (
            <ul className="space-y-2.5">
              {ledgerSessions.map((s) => (
                <li key={s.id}>
                  <Card
                    as={Link}
                    to={`/tutor/sessions/${s.id}`}
                    padding="md"
                    className="block hover:border-brand-primary-200 hover:shadow-brand-md transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[15px] font-semibold text-fg leading-snug truncate">
                          Buổi #{s.sessionNumber}
                          {s.subjectName ? ` · ${s.subjectName}` : ''}
                        </p>
                        <p className="text-caption text-fg-muted mt-0.5 truncate tabular-nums">
                          {formatDateTime(s.startAt, 'DD/MM/YYYY · HH:mm')}
                          {s.studentName ? ` · ${s.studentName}` : ''}
                        </p>
                      </div>
                      <StateBadge status={s.status} domain="session" />
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ── Rail: buổi dạy kế tiếp trong ngày ──────────────────── */}
        <aside className="space-y-4">
          <div className="lg:sticky lg:top-24 space-y-4">
            <Card padding="md" className="space-y-2">
              <h2 className="text-caption font-semibold uppercase tracking-wide text-fg-secondary">
                Buổi dạy tới
              </h2>
              {nextSession ? (
                <>
                  <p className="text-[15px] font-semibold text-fg">
                    {nextSession.subjectName || `Buổi #${nextSession.sessionNumber}`}
                  </p>
                  <p className="text-caption text-fg-secondary tabular-nums">
                    {formatDateTime(nextSession.startAt, 'DD/MM/YYYY · HH:mm')}
                  </p>
                  {nextSession.studentName && (
                    <p className="text-caption text-fg-muted">
                      Học viên {nextSession.studentName}
                    </p>
                  )}
                  <Button
                    as={Link}
                    to={`/tutor/sessions/${nextSession.id}`}
                    variant="ghost"
                    size="sm"
                    fullWidth
                    className="whitespace-nowrap"
                  >
                    Chi tiết buổi dạy
                  </Button>
                </>
              ) : (
                <p className="text-caption text-fg-muted">Chưa có buổi dạy nào đã xếp lịch.</p>
              )}
            </Card>
          </div>
        </aside>
      </div>
    </div>
  );
}
