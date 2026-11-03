import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import dayjs from 'dayjs';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Callout from '@/components/ui/Callout';
import Icon from '@/components/ui/Icon';
import Card, { CardHeader } from '@/components/ui/Card';
import { Link } from 'react-router-dom';
import SessionDisputeAccess from './SessionDisputeAccess';
import { formatDateTime } from '@/utils/formatters';

export default function GracePeriodCard({ session = {}, isTutor = false }) {
  const [timeLeft, setTimeLeft] = useState('');

  const isAwaitingPayout = session.status === 'AwaitingPayout';
  const isCompleted = session.status === 'Completed';
  const hasIssueReport = session.hasIssueReport;
  const gracePeriodEndsAt = session.gracePeriodEndsAt;

  useEffect(() => {
    if (!gracePeriodEndsAt || !isAwaitingPayout || hasIssueReport) return;

    const updateCountdown = () => {
      const now = dayjs();
      const end = dayjs(gracePeriodEndsAt);
      const diff = end.diff(now, 'second');

      if (diff <= 0) {
        setTimeLeft('Đã hết hạn');
        return;
      }

      const hours = Math.floor(diff / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      const seconds = diff % 60;
      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [gracePeriodEndsAt, isAwaitingPayout, hasIssueReport]);

  if (hasIssueReport) return <SessionDisputeAccess session={session} isTutor={isTutor} />;

  // Completed + payout released
  if (isCompleted && session.isPayoutReleased) {
    return (
      <Card padding="none" className="border border-success/30 shadow-brand-sm overflow-hidden">
        <div className="p-4 sm:p-5">
          <CardHeader
            className="mb-3"
            title="Giải ngân học phí"
            icon={<Icon name="check_circle" size="md" className="text-success-strong" />}
          />
          <Callout variant="success" icon={<Icon name="verified" size="sm" />}>
            Buổi học đã hoàn thành và học phí đã được giải ngân an toàn vào ví gia sư.
          </Callout>
        </div>
      </Card>
    );
  }

  // Not in a relevant state
  if (!isAwaitingPayout) return null;

  // AwaitingPayout — no issue — active countdown
  return (
    <Card
      padding="none"
      className="border-t-4 border-t-amber-500 border-border shadow-brand-sm overflow-hidden bg-gradient-to-b from-amber-50/15 via-surface to-surface"
    >
      <div className="p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-brand-md bg-amber-50 text-amber-600 border border-amber-200/60 flex items-center justify-center shrink-0">
              <Icon name="timer" size="md" />
            </div>
            <div className="min-w-0">
              <h3 className="text-headline-3 text-fg truncate">
                Cửa sổ bảo vệ học phí 12 giờ
              </h3>
              <p className="text-caption text-fg-muted mt-0.5 truncate">
                Cơ chế tự động giải ngân nếu không phát sinh khiếu nại
              </p>
            </div>
          </div>

          <div className="shrink-0 self-start sm:self-auto">
            <Badge variant="holding" size="md" className="gap-1.5 px-3 py-1 font-mono font-bold tabular-nums">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              {timeLeft || '12h 00m 00s'}
            </Badge>
          </div>
        </div>

        {isTutor ? (
          <Callout variant="info" icon={<Icon name="schedule" size="sm" />}>
            Buổi học đã hoàn thành. Tiền học phí sẽ được tự động giải ngân vào{' '}
            <strong className="font-mono tabular-nums text-fg">{formatDateTime(gracePeriodEndsAt)}</strong>{' '}
            nếu học viên không gửi báo cáo sự cố trong thời gian chờ.
          </Callout>
        ) : (
          <div className="space-y-4">
            <Callout variant="holding" icon={<Icon name="shield" size="sm" />}>
              Bạn có <strong className="font-mono tabular-nums text-holding-strong">{timeLeft}</strong> để kiểm tra và báo cáo nếu buổi học gặp sự cố. Hết thời gian này, học phí sẽ được tự động giải ngân cho gia sư.
            </Callout>

            <Button as={Link} to={`/student/disputes/new?sessionId=${encodeURIComponent(session.id)}`} variant="outline" size="sm" icon={<Icon name="report_problem" size="sm" />}>Báo cáo sự cố & đính kèm bằng chứng</Button>
          </div>
        )}
      </div>
    </Card>
  );
}

GracePeriodCard.propTypes = {
  session: PropTypes.shape({
    id: PropTypes.string,
    status: PropTypes.string,
    isPayoutReleased: PropTypes.bool,
    hasIssueReport: PropTypes.bool,
    issueReportReason: PropTypes.string,
    issueReportedAt: PropTypes.string,
    gracePeriodEndsAt: PropTypes.string,
  }),
  isTutor: PropTypes.bool,
};
