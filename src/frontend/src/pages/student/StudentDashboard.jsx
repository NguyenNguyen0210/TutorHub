import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
import Badge from '@/components/ui/Badge';
import StatCard, { PageHeader } from '@/components/ui/StatCard';
import Callout from '@/components/ui/Callout';
import Icon from '@/components/ui/Icon';
import Avatar from '@/components/ui/Avatar';
import { Progress } from '@/components/ui/Callout';

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

  const activeEnrollments = enrollments.filter((e) => e.status === 'Active');
  const now = new Date();

  const upcomingSessions = sessions
    .filter((s) => s.status === 'Scheduled' && s.startAt && new Date(s.startAt) > now)
    .sort((a, b) => new Date(a.startAt) - new Date(b.startAt));
  const nextSession = upcomingSessions[0] || null;

  const pastSessions = sessions
    .filter((s) => s.status === 'Scheduled' && s.endAt && new Date(s.endAt) <= now)
    .sort((a, b) => new Date(b.endAt) - new Date(a.endAt));
  const actionableSession = pastSessions[0] || null;

  const escrowRemaining = activeEnrollments.reduce((sum, e) => {
    const total = Number(e.totalPrice) || 0;
    const totalSess = Number(e.totalSessions) || 1;
    const completed = Number(e.completedSessions) || 0;
    const remainingRatio = Math.max(0, (totalSess - completed) / totalSess);
    return sum + total * remainingRatio;
  }, 0);

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
      <PageHeader
        title={`Chào mừng trở lại, ${user?.fullName || user?.name || 'học viên'}!`}
        subtitle="Không gian học tập bảo chứng Escrow hai chiều • An tâm chất lượng"
        actions={
          <Button as={Link} to="/" variant="primary" icon={<Icon name="search" size="sm" />}>
            Tìm thêm gia sư
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Hợp đồng đang học"
          value={`${activeEnrollments.length}`}
          mono={false}
          hint={activeEnrollments.length > 0 ? 'Đang triển khai giảng dạy' : 'Chưa có hợp đồng nào'}
          icon={<Icon name="school" size="md" />}
          tone="primary"
        />
        <StatCard
          label="Học phí trong Escrow"
          value={<Money value={escrowRemaining} />}
          hint="Bảo chứng an toàn trong ví sàn"
          icon={<Icon name="shield" size="md" />}
          tone="success"
        />
        <StatCard
          label="Buổi học sắp tới"
          value={
            nextSession?.startAt ? formatDateTime(nextSession.startAt, 'DD/MM HH:mm') : 'Chưa có lịch'
          }
          mono={false}
          hint={
            nextSession?.tutorName ||
            (nextSession?.subjectName ? `Môn: ${nextSession.subjectName}` : '—')
          }
          icon={<Icon name="calendar_clock" size="md" />}
          tone="info"
        />
        <StatCard
          label="Chỉ số tín nhiệm"
          value={`${strikes} / 3`}
          hint={strikes === 0 ? 'Uy tín 100% • Không vi phạm vắng mặt' : 'Đã ghi nhận vắng mặt'}
          icon={<Icon name="verified" size="md" />}
          tone={strikes > 0 ? 'danger' : 'success'}
        />
      </div>

      {actionableSession && (
        <Callout
          variant="holding"
          title={`Buổi học #${actionableSession.sessionNumber} (${actionableSession.subjectName}) đã diễn ra — vui lòng đối soát điểm danh!`}
          icon={<Icon name="pending_actions" size="md" />}
          action={
            <Button
              as={Link}
              to={`/student/sessions/${actionableSession.id}`}
              variant="secondary"
              size="sm"
              icon={<Icon name="check_circle" size="sm" />}
            >
              Xác nhận điểm danh ngay
            </Button>
          }
        >
          Cửa sổ đối soát 24h đang mở để bảo vệ quyền lợi học viên trước khi giải ngân.
        </Callout>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-headline-2 text-fg">Danh sách hợp đồng học tập</h2>
          <span className="text-caption text-fg-muted font-mono">
            Tổng: {enrollments.length} hợp đồng
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {enrollments.map((enr) => {
              const pct = Math.min(
                100,
                Math.round(((enr.completedSessions || 0) / (enr.totalSessions || 1)) * 100)
              );
              return (
                <Card key={enr.id} hoverable className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar
                        src={enr.tutorAvatarUrl}
                        name={enr.tutorName}
                        size="lg"
                        className="rounded-brand-md"
                      />
                      <div className="min-w-0">
                        <h3 className="text-headline-3 text-fg truncate">
                          {enr.serviceTitle || enr.subjectName}
                        </h3>
                        <p className="text-caption text-brand-primary-700 font-semibold mt-0.5">
                          Gia sư: {enr.tutorName}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        enr.status === 'Active'
                          ? 'success'
                          : enr.status === 'Completed'
                            ? 'info'
                            : 'neutral'
                      }
                      size="sm"
                    >
                      {enr.status === 'Active'
                        ? 'Đang học'
                        : enr.status === 'Completed'
                          ? 'Hoàn thành'
                          : enr.status}
                    </Badge>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-caption text-fg-secondary">
                      <span>Tiến độ học tập:</span>
                      <span className="font-bold tabular-nums">
                        {enr.completedSessions} / {enr.totalSessions} buổi
                      </span>
                    </div>
                    <Progress value={pct} label={`Tiến độ hợp đồng ${enr.id}`} />
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border text-caption">
                    <span className="font-bold text-fg">
                      <Money value={enr.totalPrice} />
                    </span>
                    <Link
                      to={`/student/enrollments/${enr.id}`}
                      className="font-semibold text-brand-primary-700 hover:underline flex items-center gap-1"
                    >
                      Chi tiết hợp đồng
                      <Icon name="arrow_forward" size="sm" />
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
