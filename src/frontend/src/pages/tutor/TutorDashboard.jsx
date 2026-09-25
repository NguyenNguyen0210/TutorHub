import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import sessionService from '@/services/session.service';
import walletService from '@/services/wallet.service';
import tutorService from '@/services/tutor.service';
import { useAuthStore } from '@/store/authStore';
import { formatDateTime } from '@/utils/formatters';
import Money from '@/components/ui/Money';
import { StatsSkeleton } from '@/components/common/Skeleton';
import ErrorState from '@/components/common/ErrorState';
import EmptyState from '@/components/common/EmptyState';
import Card, { CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import StatCard, { PageHeader } from '@/components/ui/StatCard';
import Icon from '@/components/ui/Icon';

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
        if (isMounted) {
          setWallet(walletData);
          setSessions(Array.isArray(sessionList) ? sessionList : []);
          setApplication(appData);
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

    loadTutorData();
    return () => {
      isMounted = false;
    };
  }, []);

  const now = new Date();
  const upcomingSessions = sessions
    .filter((s) => s.status === 'Scheduled' && s.startAt && new Date(s.startAt) > now)
    .sort((a, b) => new Date(a.startAt) - new Date(b.startAt));
  const nextSession = upcomingSessions[0] || null;

  const activeStudents = new Set(sessions.map((s) => s.studentName).filter(Boolean)).size;

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
          title="Không thể tải Bảng điều hành gia sư"
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          <span className="flex items-center gap-2 flex-wrap">
            {user?.fullName || user?.name || 'Gia sư'}
            {!application ? (
              <Badge variant="warning" icon={<Icon name="info" size="xs" />}>
                Chưa nộp hồ sơ
              </Badge>
            ) : application.status === 'Pending' ? (
              <Badge variant="warning" icon={<Icon name="hourglass_top" size="xs" />}>
                Đang chờ xét duyệt
              </Badge>
            ) : application.status === 'Rejected' ? (
              <Badge variant="danger" icon={<Icon name="error" size="xs" />}>
                Hồ sơ bị từ chối
              </Badge>
            ) : (
              <Badge variant="success" icon={<Icon name="verified" size="sm" filled />}>
                Verified Tutor
              </Badge>
            )}
          </span>
        }
        subtitle="Quản trị giảng dạy, theo dõi lịch dạy và doanh thu đối soát theo từng buổi học"
        actions={
          <>
            <Button
              as={Link}
              to="/tutor/application"
              variant="outline"
              icon={<Icon name="verified_user" size="sm" />}
            >
              Hồ sơ gia sư
            </Button>
            <Button
              as={Link}
              to="/tutor/schedule"
              variant="outline"
              icon={<Icon name="calendar_month" size="sm" />}
            >
              Lịch dạy
            </Button>
            <Button
              as={Link}
              to="/tutor/wallet/withdraw"
              variant="success"
              icon={<Icon name="payments" size="sm" />}
            >
              Rút tiền ví
            </Button>
          </>
        }
      />

      {/* Onboarding Guidance Banners */}
      {!application && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-blue-500/5 border-2 border-blue-300 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#2563EB] text-white flex items-center justify-center shrink-0 shadow-md">
              <Icon name="verified_user" size="lg" />
            </div>
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#2563EB] bg-blue-100/80 px-2.5 py-0.5 rounded-full">
                Bước quan trọng tiếp theo
              </span>
              <h2 className="text-lg font-bold text-slate-900">
                Hoàn tất hồ sơ đăng ký giảng dạy TutorHub
              </h2>
              <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
                Tài khoản của bạn chưa nộp hồ sơ giảng dạy. Vui lòng hoàn thành 6 bước kê khai thông tin, văn bằng và môn học để được cấp huy hiệu <strong>Verified Tutor</strong> và mở lớp nhận học viên.
              </p>
            </div>
          </div>
          <Button
            as={Link}
            to="/tutor/application"
            variant="primary"
            size="lg"
            className="shrink-0 whitespace-nowrap shadow-sm"
            icon={<Icon name="arrow_forward" size="sm" />}
          >
            Nộp hồ sơ ngay
          </Button>
        </div>
      )}

      {application && application.status === 'Pending' && (
        <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
              <Icon name="hourglass_top" size="md" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Hồ sơ gia sư của bạn đang chờ kiểm duyệt</h3>
              <p className="text-xs text-slate-600 mt-0.5">Đội ngũ TutorHub đang thẩm định văn bằng và sẽ phản hồi trong 1–3 ngày làm việc.</p>
            </div>
          </div>
          <Button as={Link} to="/tutor/application" variant="outline" size="sm" className="shrink-0">
            Xem tiến độ hồ sơ
          </Button>
        </div>
      )}

      {application && application.status === 'Rejected' && (
        <div className="p-4 rounded-2xl bg-rose-50/90 border border-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <Icon name="error" size="md" />
            </div>
            <div>
              <h3 className="font-bold text-rose-900 text-sm">Hồ sơ bị từ chối xét duyệt: {application.rejectionReason || 'Cần bổ sung thông tin'}</h3>
              <p className="text-xs text-rose-700 mt-0.5">Bạn có thể cập nhật lại văn bằng, kinh nghiệm và nộp lại hồ sơ để được phê duyệt.</p>
            </div>
          </div>
          <Button as={Link} to="/tutor/application" variant="primary" size="sm" className="bg-rose-600 hover:bg-rose-700 shrink-0">
            Cập nhật & Nộp lại
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Học viên đang dạy"
          value={`${activeStudents}`}
          mono={false}
          hint={`${sessions.length} buổi học ghi nhận`}
          icon={<Icon name="group" size="md" />}
          tone="primary"
        />
        <StatCard
          label="Ký quỹ chờ giải ngân"
          value={<Money value={wallet?.pendingBalance || 0} />}
          hint="Đang bảo toàn trong Escrow"
          icon={<Icon name="hourglass_top" size="md" />}
          tone="holding"
        />
        <StatCard
          label="Thu nhập khả dụng"
          value={<Money value={wallet?.availableBalance || 0} />}
          hint="Đã giải ngân sau đối soát (trừ 10% phí)"
          icon={<Icon name="account_balance_wallet" size="md" />}
          tone="success"
        />
        <StatCard
          label="Chỉ số kỷ luật"
          value={`${strikes} / 3`}
          hint={strikes === 0 ? 'Không có vi phạm vắng mặt' : 'Đã ghi nhận vắng mặt'}
          icon={<Icon name="verified_user" size="md" />}
          tone={strikes > 0 ? 'danger' : 'success'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card padding="lg" className="lg:col-span-2 space-y-5">
          <CardHeader
            title="Buổi dạy sắp tới"
            icon={<Icon name="notifications_active" size="sm" />}
            action={nextSession && <Badge variant="info">Đã xếp lịch</Badge>}
          />

          {nextSession ? (
            <div className="p-5 rounded-brand-md bg-neutral-50 border border-border space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-headline-3 text-fg">
                    {nextSession.subjectName || 'Buổi dạy chuyên đề'}
                  </h3>
                  <p className="text-caption text-brand-primary-700 font-semibold mt-0.5">
                    Học viên: {nextSession.studentName || 'Học viên đăng ký'}
                  </p>
                </div>
                <div className="text-caption font-mono font-bold text-fg-secondary">
                  {formatDateTime(nextSession.startAt, 'HH:mm')} -{' '}
                  {formatDateTime(nextSession.endAt, 'HH:mm')} (
                  {formatDateTime(nextSession.startAt, 'DD/MM/YYYY')})
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Button
                  as="a"
                  href="https://meet.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="primary"
                  icon={<Icon name="video_camera_front" size="sm" />}
                >
                  Vào phòng dạy Google Meet
                </Button>
              </div>
            </div>
          ) : (
            <EmptyState
              icon="event_available"
              title="Không có buổi dạy nào trong thời gian tới"
              description="Vào mục Lịch dạy để sắp xếp thời khóa biểu cho các lớp học."
            />
          )}
        </Card>

        <Card padding="md" className="space-y-3">
          <h3 className="text-headline-3 text-fg">Thao tác nhanh</h3>
          <nav className="space-y-2" aria-label="Thao tác nhanh gia sư">
            {[
              { to: '/tutor/schedule', icon: 'calendar_month', label: 'Quản lý lịch dạy' },
              { to: '/tutor/services', icon: 'inventory_2', label: 'Quản lý gói dịch vụ' },
              { to: '/tutor/wallet', icon: 'account_balance_wallet', label: 'Sao kê & Ví bảo chứng' },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="p-3.5 rounded-brand-md border border-border hover:bg-neutral-50 flex items-center justify-between text-body-reg font-semibold text-fg transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Icon name={item.icon} size="sm" className="text-brand-primary-600" />
                  {item.label}
                </span>
                <Icon name="chevron_right" size="sm" className="text-fg-muted" />
              </Link>
            ))}
          </nav>
        </Card>
      </div>
    </div>
  );
}
