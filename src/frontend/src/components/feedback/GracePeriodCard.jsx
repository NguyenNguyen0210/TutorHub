import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Callout from '@/components/ui/Callout';
import Icon from '@/components/ui/Icon';
import Card, { CardHeader } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { formatDateTime } from '@/utils/formatters';

const ISSUE_REASONS = [
  { value: 'TutorNoShow', label: 'Gia sư không đến (>15 phút)' },
  { value: 'ShortDuration', label: 'Thời lượng buổi học ngắn' },
  { value: 'QualityIssue', label: 'Vấn đề chất lượng / kết nối' },
];

export default function GracePeriodCard({ session = {}, onIssueReported, isTutor = false }) {
  const toast = useToast();
  const [showForm, setShowForm] = useState(false);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason) {
      toast.error('Vui lòng chọn lý do báo cáo.');
      return;
    }
    if (description.length < 20) {
      toast.error('Mô tả phải có ít nhất 20 ký tự.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onIssueReported(reason, description);
      setShowForm(false);
      toast.success('Đã gửi báo cáo sự cố. Tiền buổi học đã được đóng băng chờ xử lý.');
    } catch (err) {
      toast.error(err?.message || 'Không thể gửi báo cáo. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Completed + payout released
  if (isCompleted && session.isPayoutReleased) {
    return (
      <Card>
        <CardHeader title="Giải ngân" />
        <div className="p-4">
          <Callout variant="success" icon={<Icon name="check-circle" size="md" />}>
            Buổi học đã hoàn thành và tiền đã được giải ngân cho gia sư.
          </Callout>
        </div>
      </Card>
    );
  }

  // Not in a relevant state
  if (!isAwaitingPayout) return null;

  // Has issue report
  if (hasIssueReport) {
    return (
      <Card>
        <CardHeader title="Báo cáo sự cố" />
        <div className="p-4 space-y-3">
          <Callout variant="danger" icon={<Icon name="alert-triangle" size="md" />}>
            Đã có báo cáo sự cố cho buổi học này. Tiền đang được đóng băng chờ Admin xử lý.
          </Callout>
          {session.issueReportReason && (
            <div className="text-sm text-text-secondary">
              <span className="font-medium">Lý do:</span>{' '}
              {ISSUE_REASONS.find(r => r.value === session.issueReportReason)?.label || session.issueReportReason}
            </div>
          )}
          {session.issueReportedAt && (
            <div className="text-sm text-text-secondary">
              <span className="font-medium">Thời gian báo cáo:</span>{' '}
              <span className="font-mono tabular-nums">{formatDateTime(session.issueReportedAt)}</span>
            </div>
          )}
        </div>
      </Card>
    );
  }

  // AwaitingPayout — no issue — show countdown
  return (
    <Card>
      <CardHeader
        title="Cửa sổ bảo vệ 12 giờ"
        action={
          <Badge variant="holding">
            <Icon name="timer" size="sm" className="mr-1" />
            {timeLeft}
          </Badge>
        }
      />
      <div className="p-4 space-y-4">
        {isTutor ? (
          <Callout variant="info" icon={<Icon name="clock" size="md" />}>
            Tiền sẽ được tự động giải ngân vào{' '}
            <strong className="font-mono tabular-nums">{formatDateTime(gracePeriodEndsAt)}</strong>{' '}
            nếu học viên không báo cáo sự cố.
          </Callout>
        ) : (
          <>
            <Callout variant="holding" icon={<Icon name="shield" size="md" />}>
              Bạn có <strong>{timeLeft}</strong> để báo cáo nếu có vấn đề với buổi học.
              Sau thời gian này, tiền sẽ tự động được chuyển cho gia sư.
            </Callout>

            {!showForm ? (
              <Button variant="danger" size="sm" onClick={() => setShowForm(true)}>
                <Icon name="alert-triangle" size="sm" className="mr-1" />
                Báo cáo sự cố
              </Button>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3 border-t pt-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Lý do báo cáo *</label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full rounded-md border border-border bg-bg-primary px-3 py-2 text-sm"
                  >
                    <option value="">— Chọn lý do —</option>
                    {ISSUE_REASONS.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Mô tả chi tiết * <span className="text-text-tertiary font-normal">(tối thiểu 20 ký tự)</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="w-full rounded-md border border-border bg-bg-primary px-3 py-2 text-sm"
                    placeholder="Mô tả vấn đề bạn gặp phải..."
                  />
                  <div className="text-xs text-text-tertiary mt-1">{description.length}/2000 ký tự</div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" variant="danger" size="sm" disabled={isSubmitting}>
                    {isSubmitting ? 'Đang gửi...' : 'Gửi báo cáo'}
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                    Hủy
                  </Button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </Card>
  );
}
