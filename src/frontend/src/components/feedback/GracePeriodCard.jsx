import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
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
  { value: 'ShortDuration', label: 'Thời lượng buổi học không đủ' },
  { value: 'QualityIssue', label: 'Vấn đề chất lượng dạy / kết nối' },
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
      toast.error('Vui lòng chọn lý do báo cáo sự cố.');
      return;
    }
    if (description.trim().length < 20) {
      toast.error('Mô tả phải có ít nhất 20 ký tự.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onIssueReported(reason, description.trim());
      setShowForm(false);
      toast.success('Đã gửi báo cáo sự cố. Tiền buổi học đã được đóng băng chờ giải quyết.');
    } catch (err) {
      toast.error(err?.message || 'Không thể gửi báo cáo. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

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

  // Has issue report
  if (hasIssueReport) {
    return (
      <Card padding="none" className="border-t-4 border-t-rose-500 border-border shadow-brand-sm overflow-hidden">
        <div className="p-4 sm:p-5 space-y-4">
          <CardHeader
            className="mb-0"
            title="Buổi học đang khiếu nại / Báo cáo sự cố"
            subtitle="Tiền thanh toán đang được hệ thống đóng băng để bảo vệ quyền lợi"
            icon={<Icon name="gavel" size="md" className="text-danger-strong" />}
          />

          <Callout variant="danger" icon={<Icon name="warning" size="sm" />}>
            Đã có báo cáo sự cố cho buổi học này. Khoản tiền học phí đang được tạm giữ trong Escrow chờ Quản trị viên xử lý.
          </Callout>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-brand-md bg-neutral-50 border border-border text-caption">
            <div>
              <span className="text-[11px] font-semibold text-fg-muted uppercase tracking-wide block">
                Lý do báo cáo
              </span>
              <p className="font-semibold text-fg mt-0.5">
                {ISSUE_REASONS.find((r) => r.value === session.issueReportReason)?.label || session.issueReportReason || 'Không xác định'}
              </p>
            </div>
            {session.issueReportedAt && (
              <div>
                <span className="text-[11px] font-semibold text-fg-muted uppercase tracking-wide block">
                  Thời gian ghi nhận
                </span>
                <p className="font-mono text-fg mt-0.5 tabular-nums">
                  {formatDateTime(session.issueReportedAt)}
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  }

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

            {!showForm ? (
              <div className="pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowForm(true)}
                  className="text-danger-strong border-danger/40 hover:bg-danger-subtle hover:border-danger active:scale-[0.98]"
                  icon={<Icon name="report_problem" size="xs" />}
                >
                  Báo cáo sự cố buổi học
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-4 rounded-brand-md bg-neutral-50/80 border border-border space-y-3.5 animate-fadeIn">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <h4 className="text-[14px] font-bold text-fg flex items-center gap-2">
                    <Icon name="report" size="xs" className="text-danger-strong" />
                    Biểu mẫu báo cáo sự cố buổi học
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="text-fg-muted hover:text-fg text-caption cursor-pointer"
                  >
                    Đóng
                  </button>
                </div>

                <div>
                  <label htmlFor="issue-reason" className="block text-caption font-semibold text-fg mb-1.5">
                    Lý do báo cáo <span className="text-danger-strong">*</span>
                  </label>
                  <select
                    id="issue-reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full h-10 px-3 rounded-brand-md border border-border bg-surface text-caption text-fg focus:outline-none focus:ring-2 focus:ring-brand-primary-600 cursor-pointer"
                  >
                    <option value="">— Vui lòng chọn lý do chính xác —</option>
                    {ISSUE_REASONS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="issue-description" className="block text-caption font-semibold text-fg">
                      Mô tả chi tiết sự cố <span className="text-danger-strong">*</span>
                    </label>
                    <span className="text-[11px] text-fg-muted tabular-nums">
                      {description.trim().length} / 2000 ký tự (tối thiểu 20)
                    </span>
                  </div>
                  <textarea
                    id="issue-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    maxLength={2000}
                    className="w-full p-3 rounded-brand-md border border-border bg-surface text-caption text-fg placeholder:text-fg-muted focus:outline-none focus:ring-2 focus:ring-brand-primary-600 resize-y"
                    placeholder="Mô tả cụ thể những gì đã xảy ra (ví dụ: gia sư vắng mặt bao nhiêu phút, chất lượng giảng dạy, vấn đề kết nối...)"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Button
                    type="submit"
                    variant="danger"
                    size="sm"
                    loading={isSubmitting}
                    disabled={isSubmitting || description.trim().length < 20 || !reason}
                    icon={<Icon name="send" size="xs" />}
                  >
                    Gửi báo cáo sự cố
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isSubmitting}
                    onClick={() => setShowForm(false)}
                  >
                    Hủy bỏ
                  </Button>
                </div>
              </form>
            )}
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
  onIssueReported: PropTypes.func,
  isTutor: PropTypes.bool,
};
