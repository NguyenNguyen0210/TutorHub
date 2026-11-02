import React from 'react';
import { Link } from 'react-router-dom';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Progress } from '@/components/ui/Callout';
import StateBadge from '@/components/common/StateBadge';
import { formatDateTime } from '@/utils/formatters';
import { classSchedulePath } from '@/utils/tutorDashboard';

export default function TeachingClassCard({ enrollment }) {
  const completed = Number(enrollment.completedSessions) || 0;
  const total = Number(enrollment.totalSessions) || 0;
  return (
    <Card variant="outlined" padding="lg" className="space-y-5 rounded-2xl shadow-[var(--learning-card-shadow)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={enrollment.studentName} />
          <div className="min-w-0">
            <h3 className="break-words text-body-reg font-semibold text-fg">{enrollment.studentName || 'Học viên'}</h3>
            <p className="mt-1 text-caption text-fg-secondary">{enrollment.subjectName}</p>
          </div>
        </div>
        <StateBadge status={enrollment.status} domain="enrollment" />
      </div>
      <p className="text-[17px] font-semibold leading-relaxed text-fg">{enrollment.serviceTitle || enrollment.subjectName || 'Gói học'}</p>
      <div className="space-y-2">
        <div className="flex flex-wrap justify-between gap-2 text-caption text-fg-secondary"><span>Tiến độ lớp học</span><span>{completed}/{total} buổi hoàn thành</span></div>
        <Progress value={total ? Math.min(100, completed / total * 100) : 0} label={`Tiến độ lớp của ${enrollment.studentName || 'học viên'}`} />
      </div>
      <div className="flex flex-col gap-4 border-t border-border pt-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2 text-caption text-fg-secondary">
          {enrollment.unscheduledCount > 0 && <Badge variant="neutral">{enrollment.unscheduledCount} buổi chưa xếp lịch</Badge>}
          {enrollment.nextSession ? <p>Buổi tiếp theo: {formatDateTime(enrollment.nextSession.startAt, 'HH:mm · DD/MM/YYYY')}</p>
            : enrollment.nextUnscheduled ? <p>Có thể bắt đầu với buổi #{enrollment.nextUnscheduled.sessionNumber}.</p> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {enrollment.nextUnscheduled && <Button as={Link} to={classSchedulePath(enrollment.id)} size="sm" variant="outline">Xếp lịch buổi tiếp theo</Button>}
          <Button as={Link} to={`/tutor/enrollments/${enrollment.id}`} size="sm" variant="ghost">Xem lớp</Button>
        </div>
      </div>
    </Card>
  );
}
