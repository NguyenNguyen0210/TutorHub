import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import sessionService from '@/services/session.service';
import walletService from '@/services/wallet.service';
import tutorService from '@/services/tutor.service';
import enrollmentService from '@/services/enrollment.service';
import { useAuthStore } from '@/store/authStore';
import { formatDateTime } from '@/utils/formatters';
import { buildTeachingSummary } from '@/utils/tutorDashboard';
import Money from '@/components/ui/Money';
import { StatsSkeleton } from '@/components/common/Skeleton';
import ErrorState from '@/components/common/ErrorState';
import EmptyState from '@/components/common/EmptyState';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Callout from '@/components/ui/Callout';
import Icon from '@/components/ui/Icon';
import StatStrip from '@/components/common/StatStrip';
import StateBadge from '@/components/common/StateBadge';
import TeachingClassCard from '@/components/tutor/TeachingClassCard';

/** Teaching overview uses contract identities, real progress and the tutor's own calendar. */
export default function TutorDashboard() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [application, setApplication] = useState(null);
  const [applicationUnavailable, setApplicationUnavailable] = useState(false);
  const [retry, setRetry] = useState(0);
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true); setError(null);
      try {
        const [funds, calendar, contracts, review] = await Promise.all([
          walletService.getMyWallet(), sessionService.getMySessions(), enrollmentService.getAllMyEnrollments(),
          tutorService.getMyTutorApplication().then(data => ({ data })).catch(err => err.status === 404 ? { data: null } : { unavailable: true }),
        ]);
        if (!cancelled) {
          setWallet(funds); setSessions(Array.isArray(calendar) ? calendar : []);
          setEnrollments(contracts.items); setApplication(review.data || null); setApplicationUnavailable(Boolean(review.unavailable));
          setNow(Date.now());
        }
      } catch (err) { if (!cancelled) setError(err); }
      finally { if (!cancelled) setLoading(false); }
    };
    load();
    return () => { cancelled = true; };
  }, [retry]);
  const summary = useMemo(() => buildTeachingSummary(enrollments, sessions, now), [enrollments, sessions, now]);
  const next = summary.upcoming[0];
  const greetingName = (user?.fullName || user?.name || '').trim().split(/\s+/).slice(-2).join(' ') || 'bạn';

  if (loading) return <div role="status" aria-label="Đang tải tổng quan giảng dạy" className="space-y-6"><div className="h-16 rounded-xl bg-neutral-100 motion-safe:animate-pulse" /><StatsSkeleton count={3} /><div className="h-64 rounded-2xl bg-neutral-100 motion-safe:animate-pulse" /></div>;
  if (error) return <ErrorState error={error} title="Chưa tải được tổng quan giảng dạy" onRetry={() => setRetry(value => value + 1)} />;

  const classCards = items => items.map(enrollment => <TeachingClassCard key={enrollment.id} enrollment={enrollment} />);
  return (
    <div className="space-y-6 lg:space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[28px] font-semibold leading-tight text-fg">Chào {greetingName}! <span aria-hidden="true">👋</span></h1>
            {application && <StateBadge status={application.status} domain="application" />}
          </div>
          <p className="mt-2 text-body-reg leading-relaxed text-fg-secondary">Quản lý lớp học và theo dõi lịch giảng dạy của bạn.</p>
        </div>
        <Button as={Link} to="/tutor/services/new" icon={<Icon name="add" size="sm" />}>Tạo gói học</Button>
      </header>

      <StatStrip appearance="soft" columns={3} figures={[
        { key: 'students', icon: 'school', label: 'Học viên đang học', value: summary.activeStudentCount, hint: `${summary.classes.length} lớp đang hoạt động` },
        { key: 'today', icon: 'calendar_month', label: 'Buổi dạy hôm nay', value: summary.todayCount, hint: next ? `Buổi tiếp theo: ${formatDateTime(next.startAt, 'HH:mm DD/MM')}` : 'Chưa có lịch dạy sắp tới' },
        { key: 'available', icon: 'account_balance_wallet', label: 'Số dư khả dụng', value: <Money value={wallet.availableBalance} />, hint: 'Thu nhập có thể rút về ngân hàng', tone: 'success' },
      ]} />

      {applicationUnavailable ? <Callout variant="neutral" title="Chưa tải được trạng thái hồ sơ" action={<Button as={Link} to="/tutor/application" variant="outline" size="sm">Xem hồ sơ</Button>}>Bạn có thể xem lại hồ sơ giảng dạy trong menu tài khoản.</Callout>
        : (!application || application.status !== 'Approved') && <Callout variant={application?.status === 'Rejected' ? 'danger' : 'neutral'}
          title={!application ? 'Hoàn tất hồ sơ giảng dạy' : application.status === 'Pending' ? 'Hồ sơ giảng dạy đang được xét duyệt' : 'Cập nhật hồ sơ giảng dạy'}
          action={<Button as={Link} to="/tutor/application" variant="outline" size="sm">{application?.status === 'Rejected' ? 'Cập nhật hồ sơ' : 'Xem hồ sơ'}</Button>}>
          {!application ? 'Bổ sung thông tin chuyên môn để TutorHub xét duyệt và mở gói học.' : application.status === 'Rejected' ? application.rejectionReason || 'Xem nội dung cần bổ sung trước khi gửi lại hồ sơ.' : 'Theo dõi kết quả xét duyệt trong hồ sơ của bạn.'}
        </Callout>}

      {summary.pendingClasses.length > 0 && <section aria-labelledby="scheduling-title" className="flex flex-col gap-4 rounded-2xl bg-[rgb(var(--learning-soft-blue))] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-start gap-3"><Icon name="calendar_month" size="lg" className="mt-0.5 shrink-0 text-primary" /><div>
          <h2 id="scheduling-title" className="text-[18px] font-semibold text-fg">{summary.pendingClasses.length} lớp có buổi học chưa xếp lịch</h2>
          <p className="mt-2 text-body-reg leading-relaxed text-fg-secondary">Trao đổi với học viên và ưu tiên lên lịch buổi tiếp theo. Bạn có thể xếp dần {summary.unscheduledCount} buổi còn lại.</p>
        </div></div>
        <Button as={Link} to="/tutor/schedule?tab=unscheduled" variant="outline" className="shrink-0">Xem các buổi cần xếp lịch</Button>
      </section>}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.8fr)_minmax(280px,1fr)]">
        <section aria-labelledby="teaching-classes-title" className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3"><h2 id="teaching-classes-title" className="text-[18px] font-semibold text-fg">Lớp học đang quản lý</h2><span className="text-caption text-fg-secondary">{summary.classes.length} lớp đang học</span></div>
          {summary.classes.length ? <>
            {classCards(summary.classes.slice(0, 4))}
            {summary.classes.length > 4 && <details className="rounded-2xl border border-border bg-surface p-5"><summary className="cursor-pointer rounded text-sm font-medium text-primary focus-visible:ring-2 focus-visible:ring-ring">Xem thêm {summary.classes.length - 4} lớp đang học</summary><div className="mt-5 space-y-4">{classCards(summary.classes.slice(4))}</div></details>}
          </> : <EmptyState icon="school" title="Chưa có lớp đang học" description="Các lớp sẽ xuất hiện tại đây khi học viên đăng ký và hợp đồng được kích hoạt." actionLabel="Xem gói học của tôi" actionPath="/tutor/services" className="max-w-none rounded-2xl shadow-none" />}
          {summary.pastClasses.length > 0 && <details className="rounded-2xl border border-border bg-surface p-5"><summary className="cursor-pointer rounded text-sm font-medium text-fg-secondary focus-visible:ring-2 focus-visible:ring-ring">Xem {summary.pastClasses.length} lớp đã kết thúc</summary><div className="mt-5 space-y-4">{classCards(summary.pastClasses)}</div></details>}
        </section>

        <aside className="min-w-0 space-y-6">
          <Card padding="lg" variant="outlined" className="space-y-5 rounded-2xl">
            <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-[18px] font-semibold text-fg">Lịch dạy sắp tới</h2><Link to="/tutor/schedule" className="inline-flex min-h-11 items-center text-caption font-medium text-primary">Xem lịch dạy</Link></div>
            {summary.upcoming.length ? <ul className="space-y-3">{summary.upcoming.slice(0, 4).map(session => <li key={session.id}>
              <Link to={`/tutor/sessions/${session.id}`} className="block space-y-2 rounded-xl border border-border p-4 transition-colors hover:border-brand-primary-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <p className="text-caption font-semibold text-primary">{formatDateTime(session.startAt, 'HH:mm · DD/MM/YYYY')}</p>
                <p className="text-body-reg font-semibold text-fg">{session.subjectName || 'Buổi dạy'} · Buổi #{session.sessionNumber}</p>
                <p className="text-caption text-fg-secondary">{session.studentName || 'Học viên'}</p>
                <Badge variant="primary">{new Date(session.startAt).getTime() <= now ? 'Theo lịch hiện tại' : 'Đã lên lịch'}</Badge>
              </Link>
            </li>)}</ul> : <div className="rounded-xl bg-neutral-50 p-4"><p className="font-medium text-fg">Chưa có lịch dạy</p><p className="mt-2 text-caption leading-relaxed text-fg-secondary">Các buổi học đã được xếp lịch sẽ xuất hiện tại đây.</p></div>}
          </Card>
          <Card padding="lg" variant="outlined" className="space-y-4 rounded-2xl">
            <div className="flex items-center gap-2"><Icon name="account_balance_wallet" size="md" className="text-primary" /><h2 className="text-[18px] font-semibold text-fg">Học phí và thu nhập</h2></div>
            <dl className="space-y-3 text-body-reg"><div className="flex flex-wrap justify-between gap-2"><dt className="text-fg-secondary">Chờ giải ngân</dt><dd className="font-semibold text-holding-strong"><Money value={wallet.pendingBalance} /></dd></div><div className="flex flex-wrap justify-between gap-2"><dt className="text-fg-secondary">Đang xử lý rút</dt><dd className="font-medium text-fg"><Money value={wallet.pendingWithdrawal} /></dd></div></dl>
            <p className="border-t border-border pt-4 text-caption leading-relaxed text-fg-secondary">Theo dõi giải ngân sau buổi học và yêu cầu rút tiền trong Ví gia sư.</p>
            <Button as={Link} to="/tutor/wallet" variant="outline" fullWidth>Xem ví gia sư</Button>
          </Card>
        </aside>
      </div>
    </div>
  );
}
