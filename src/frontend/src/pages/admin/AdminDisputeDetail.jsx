import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import adminService from '@/services/admin.service';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import Money from '@/components/ui/Money';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/Dialog';
import { DetailSkeleton } from '@/components/common/Skeleton';
import ErrorState from '@/components/common/ErrorState';
import Card, { CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Callout from '@/components/ui/Callout';
import Icon from '@/components/ui/Icon';
import Avatar from '@/components/ui/Avatar';
import { Textarea, Field } from '@/components/ui/Input';
import { PageHeader } from '@/components/ui/StatCard';

const STATUS_BADGES = {
  Open: { label: 'Mới mở', variant: 'danger' },
  UnderReview: { label: 'Đang điều tra', variant: 'info' },
  Resolved: { label: 'Đã phân xử', variant: 'success' },
  Dismissed: { label: 'Đã bác bỏ', variant: 'neutral' },
  RequiresAdminFinancialIntervention: {
    label: 'Cần can thiệp tài chính (INV-DISP-008)',
    variant: 'holding',
  },
};

const DECISION_TRANSLATIONS = {
  StudentWinsFullRefund: 'Học viên thắng — Hoàn tiền 100% học phí',
  StudentWinsPartialRefund: 'Học viên thắng một phần — Hoàn tiền theo tỷ lệ',
  TutorWinsReleaseEarning: 'Gia sư thắng — Giải ngân thu nhập buổi học',
  DismissedNoFinancialChange: 'Bác bỏ khiếu nại — Giữ nguyên hiện trạng tài chính',
};

const REASON_TRANSLATIONS = {
  TutorNoShow: 'Gia sư vắng mặt (No-Show)',
  TutorLate: 'Gia sư vào muộn / Về sớm',
  QualityIssue: 'Chất lượng không đạt cam kết',
  IncompleteSession: 'Buổi học bị gián đoạn / Thiếu giờ',
  StudentNoShow: 'Học viên vắng mặt',
  Other: 'Lý do khác',
};

const ATTENDANCE_LABELS = {
  Present: { label: 'Có mặt', variant: 'success' },
  Absent: { label: 'Vắng mặt', variant: 'danger' },
  Late: { label: 'Đi muộn', variant: 'holding' },
  LeftEarly: { label: 'Về sớm', variant: 'holding' },
};

export default function AdminDisputeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [investigation, setInvestigation] = useState(null);

  const [refundAmount, setRefundAmount] = useState(0);
  const [adminNote, setAdminNote] = useState('');
  const [resolving, setResolving] = useState(false);
  const [markingReview, setMarkingReview] = useState(false);

  const fetchInvestigation = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getDisputeDetail(id);
      setInvestigation(data);
      const gross = Number(data?.financialSummary?.disputedGrossAmount ?? data?.dispute?.heldAmount ?? 0);
      setRefundAmount(gross);
      setAdminNote(data?.dispute?.adminNotes || '');
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchInvestigation();
    } else {
      setError(new Error('Mã khiếu nại không hợp lệ.'));
      setLoading(false);
    }
  }, [id, fetchInvestigation]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <DetailSkeleton />
      </div>
    );
  }

  if (error || !investigation) {
    return (
      <div className="max-w-5xl mx-auto py-12">
        <ErrorState
          error={error}
          title="Không thể tải hồ sơ điều tra tranh chấp"
          onRetry={fetchInvestigation}
          backPath="/admin/disputes"
          backLabel="Quay lại danh sách tranh chấp"
        />
      </div>
    );
  }

  const { dispute, session, enrollment, financialSummary, conversationSnippet = [] } = investigation;
  const originalSessionFee = Number(financialSummary?.disputedGrossAmount ?? session?.earningAmount ?? 0);
  const platformFeeRate = Number(enrollment?.platformFeeRate ?? 0.10);
  const isPayoutReleased = Boolean(session?.isPayoutReleased || financialSummary?.isPayoutReleased);

  // Financial Breakdown depending on Pre-release vs Post-release
  const tutorTheoreticalNet = Math.round(originalSessionFee * (1 - platformFeeRate));
  const platformTheoreticalFee = Math.round(originalSessionFee * platformFeeRate);

  const tutorReceivedOriginal = isPayoutReleased
    ? Number(financialSummary?.originalTutorNet ?? tutorTheoreticalNet)
    : tutorTheoreticalNet;
  const originalPlatformFee = isPayoutReleased
    ? Number(financialSummary?.originalPlatformFee ?? platformTheoreticalFee)
    : platformTheoreticalFee;

  const refundRatio = originalSessionFee > 0 ? refundAmount / originalSessionFee : 0;
  const tutorClawback = Math.round(tutorReceivedOriginal * refundRatio);
  const platformFeeRefund = Math.max(0, refundAmount - tutorClawback);

  // Remaining to release if pre-release
  const remainingGross = Math.max(0, originalSessionFee - refundAmount);
  const tutorRemainingPayout = Math.round(remainingGross * (1 - platformFeeRate));
  const platformRemainingFee = Math.max(0, remainingGross - tutorRemainingPayout);

  const isClosed = dispute?.status === 'Resolved' || dispute?.status === 'Dismissed';
  const evidences = dispute?.evidences || investigation?.evidences || [];
  const hasNoEvidence = evidences.length === 0;

  const handleMoveUnderReview = async () => {
    try {
      setMarkingReview(true);
      await adminService.moveDisputeUnderReview(id);
      toast.success('Đã chuyển tranh chấp sang trạng thái Đang điều tra.');
      await fetchInvestigation();
    } catch (err) {
      toast.error(err?.message || 'Không thể chuyển trạng thái tranh chấp.');
    } finally {
      setMarkingReview(false);
    }
  };

  const handleResolve = async (decisionType) => {
    if (!adminNote || adminNote.trim().length < 10) {
      toast.error('Vui lòng nhập căn cứ trọng tài chi tiết (tối thiểu 10 ký tự).');
      return;
    }

    if (decisionType !== 'dismiss' && hasNoEvidence) {
      toast.error(
        'Quy chế Q3: Bắt buộc phải có ít nhất một tài liệu bằng chứng để ra phán quyết có biến động tài chính.'
      );
      return;
    }

    let decision;
    let customRefund = null;
    let confirmTitle = '';
    let confirmContent = '';

    if (decisionType === 'refund') {
      decision = refundAmount >= originalSessionFee ? 'StudentWinsFullRefund' : 'StudentWinsPartialRefund';
      customRefund = refundAmount < originalSessionFee ? refundAmount : null;
      confirmTitle = 'Xác nhận phán quyết hoàn tiền cho học viên';
      confirmContent = `Hoàn trả ${formatCurrency(refundAmount)} cho học viên. Thu hồi từ gia sư: ${formatCurrency(tutorClawback)}, hoàn phí sàn: ${formatCurrency(platformFeeRefund)}.`;
    } else if (decisionType === 'release') {
      decision = 'TutorWinsReleaseEarning';
      confirmTitle = 'Xác nhận giải ngân cho gia sư (Gia sư thắng)';
      confirmContent = `Giải ngân toàn bộ thu nhập buổi học (${formatCurrency(tutorReceivedOriginal)}) cho gia sư sau khi khấu trừ phí sàn ${formatCurrency(originalPlatformFee)}.`;
    } else {
      decision = 'DismissedNoFinancialChange';
      confirmTitle = 'Xác nhận bác bỏ khiếu nại (Không thay đổi tài chính)';
      confirmContent = 'Tiền học sẽ giữ nguyên hiện trạng và vụ việc tranh chấp được đóng lại.';
    }

    const ok = await confirm({
      title: confirmTitle,
      content: confirmContent,
      confirmText: 'Xác nhận phán quyết',
      cancelText: 'Hủy bỏ',
      danger: decisionType === 'dismiss',
    });
    if (!ok) return;

    try {
      setResolving(true);
      await adminService.applyDisputeVerdict(id, {
        decision,
        customRefundAmount: customRefund,
        adminNotes: adminNote.trim(),
      });
      toast.success('Đã ban hành phán quyết trọng tài thành công!');
      navigate('/admin/disputes');
    } catch (err) {
      toast.error(err?.message || 'Không thể thực hiện phán quyết phân xử.');
    } finally {
      setResolving(false);
    }
  };

  const statusInfo = STATUS_BADGES[dispute?.status] || {
    label: dispute?.status,
    variant: 'neutral',
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between gap-4">
        <Link
          to="/admin/disputes"
          className="inline-flex items-center gap-1.5 text-caption font-semibold text-fg-secondary hover:text-brand-primary-700 transition-colors"
        >
          <Icon name="arrow_back" size="sm" />
          Quay lại bàn trọng tài
        </Link>

        {dispute?.status === 'Open' && (
          <Button
            variant="outline"
            size="sm"
            loading={markingReview}
            onClick={handleMoveUnderReview}
            icon={!markingReview && <Icon name="search" size="xs" />}
          >
            Chuyển sang Đang điều tra (Under Review)
          </Button>
        )}
      </div>

      {/* Header */}
      <PageHeader
        title={
          <span className="flex items-center gap-2.5 flex-wrap">
            <span>Hồ sơ điều tra & Bàn trọng tài tranh chấp</span>
            <Badge variant={statusInfo.variant} size="md">
              {statusInfo.label}
            </Badge>
          </span>
        }
        subtitle={`Mã vụ việc: ${id} • Hợp đồng #${enrollment?.id?.substring(0, 8) || '—'}`}
      />

      {/* Invariant Trust Banner */}
      <div className="p-4 rounded-brand-lg bg-surface border border-border shadow-brand-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-caption">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-brand-md bg-brand-primary-50 text-brand-primary-600 flex items-center justify-center shrink-0 border border-brand-primary-100">
            <Icon name="gavel" size="xs" />
          </div>
          <div className="space-y-0.5">
            <span className="font-bold text-fg block">
              Quy chuẩn phán quyết trọng tài & Bảo toàn sổ cái
            </span>
            <p className="text-fg-secondary text-[12px] m-0">
              Chế độ giải ngân: <strong>{isPayoutReleased ? 'Sau giải ngân (Post-Release Hold)' : 'Bảo chứng ký quỹ (Pre-Release Escrow Hold)'}</strong>. Phí sàn cố định tại hợp đồng: <strong>{(platformFeeRate * 100).toFixed(0)}%</strong> (FeePolicy v{enrollment?.feePolicyVersion || 1}).
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Pre-Release Escrow = tiền nằm trong ký quỹ → `info`; Post-Release = tiền
              đang bị giữ để phân xử → `holding`. Không dùng màu CTA cho trạng thái tiền. */}
          <Badge variant={isPayoutReleased ? 'holding' : 'info'} size="sm">
            {isPayoutReleased ? 'Post-Release Balance' : 'Pre-Release Escrow'}
          </Badge>
        </div>
      </div>

      {/* Intervention Warning if applicable */}
      {dispute?.status === 'RequiresAdminFinancialIntervention' && (
        <Callout variant="holding" title="Cảnh báo can thiệp tài chính (INV-DISP-008)">
          Số dư khả dụng trong ví của gia sư không đủ để tạm giữ toàn bộ số tiền tranh chấp tối đa ({formatCurrency(tutorReceivedOriginal)}). Theo quy chuẩn bảo vệ hạn mức, hệ thống đã giữ 0₫ và chuyển vụ việc sang diện Admin can thiệp tài chính thủ công ngoài sàn.
        </Callout>
      )}

      {/* Overview Card: Session & Participants */}
      <Card padding="lg" className="space-y-5 shadow-brand-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4 border-b border-border text-caption">
          <div className="space-y-1">
            <span className="text-fg-muted block font-semibold text-[11px] uppercase">Buổi học phát sinh</span>
            <div className="text-fg font-bold text-body-reg">
              Buổi #{session?.sessionNumber || '—'}
            </div>
            <div className="text-brand-primary-700 font-bold text-[13px]">
              <Money value={originalSessionFee} />
            </div>
            {session?.startAt && (
              <span className="text-[11px] text-fg-muted block">
                {formatDateTime(session.startAt, 'DD/MM/YYYY HH:mm')}
              </span>
            )}
          </div>

          <div className="space-y-1">
            <span className="text-fg-muted block font-semibold text-[11px] uppercase">Bên khiếu nại (Học viên)</span>
            <div className="flex items-center gap-2">
              <Avatar name={dispute?.initiatorName || 'Học viên'} size="sm" />
              <div>
                <span className="text-fg font-bold block">{dispute?.initiatorName || 'Học viên'}</span>
                <span className="text-[11px] text-fg-muted font-mono block">
                  ID: {dispute?.initiatorUserId?.substring(0, 8)}...
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-fg-muted block font-semibold text-[11px] uppercase">Bên giải trình (Gia sư)</span>
            <div className="flex items-center gap-2">
              <Avatar name={dispute?.respondentName || 'Gia sư'} size="sm" />
              <div>
                <span className="text-fg font-bold block">{dispute?.respondentName || 'Gia sư'}</span>
                <span className="text-[11px] text-fg-muted font-mono block">
                  ID: {dispute?.respondentUserId?.substring(0, 8)}...
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Dispute Reason & Details */}
        <div className="p-4 rounded-brand-md bg-danger-subtle border border-danger/25 space-y-2 text-caption">
          <div className="flex items-center justify-between gap-2">
            <span className="text-danger-strong font-bold flex items-center gap-1.5">
              <Icon name="report_problem" size="xs" />
              Lý do: {REASON_TRANSLATIONS[dispute?.reason] || dispute?.reason}
            </span>
            <span className="text-[11px] text-fg-muted font-mono">
              Mở lúc: {formatDateTime(dispute?.createdAt, 'DD/MM/YYYY HH:mm')}
            </span>
          </div>
          <p className="text-fg leading-relaxed m-0 whitespace-pre-line bg-surface/70 p-3 rounded-brand-sm border border-danger/15">
            {dispute?.description || 'Không có mô tả chi tiết từ bên khiếu nại.'}
          </p>
        </div>

        {/* Bilateral Attendance Comparison */}
        <div className="space-y-3 pt-1">
          <h3 className="text-caption font-bold text-fg flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Icon name="fact_check" size="xs" className="text-brand-primary-600" />
              Đối soát điểm danh 2 chiều (Attendance Window 24h)
            </span>
            {session?.hasAttendanceConflict && (
              <Badge variant="danger" size="sm">
                Xung đột điểm danh phát hiện
              </Badge>
            )}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-caption">
            <div className="p-3.5 rounded-brand-md bg-neutral-50 border border-border space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-fg-secondary">Xác nhận của Học viên</span>
                {session?.studentAttendance ? (
                  <Badge variant={ATTENDANCE_LABELS[session.studentAttendance]?.variant || 'neutral'} size="sm">
                    {ATTENDANCE_LABELS[session.studentAttendance]?.label || session.studentAttendance}
                  </Badge>
                ) : (
                  <span className="text-fg-muted font-mono text-[11px]">Chưa xác nhận</span>
                )}
              </div>
              <p className="text-[11px] text-fg-muted m-0 font-mono">
                {session?.studentAttendanceSubmittedAt
                  ? `Thời điểm gửi: ${formatDateTime(session.studentAttendanceSubmittedAt, 'DD/MM/YYYY HH:mm')}`
                  : 'Học viên không gửi điểm danh trong 24h'}
              </p>
            </div>

            <div className="p-3.5 rounded-brand-md bg-neutral-50 border border-border space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-fg-secondary">Xác nhận của Gia sư</span>
                {session?.tutorAttendance ? (
                  <Badge variant={ATTENDANCE_LABELS[session.tutorAttendance]?.variant || 'neutral'} size="sm">
                    {ATTENDANCE_LABELS[session.tutorAttendance]?.label || session.tutorAttendance}
                  </Badge>
                ) : (
                  <span className="text-fg-muted font-mono text-[11px]">Chưa xác nhận</span>
                )}
              </div>
              <p className="text-[11px] text-fg-muted m-0 font-mono">
                {session?.tutorAttendanceSubmittedAt
                  ? `Thời điểm gửi: ${formatDateTime(session.tutorAttendanceSubmittedAt, 'DD/MM/YYYY HH:mm')}`
                  : 'Gia sư không gửi điểm danh trong 24h'}
              </p>
            </div>
          </div>
        </div>

        {/* Uploaded Evidence Documents */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-caption font-bold text-fg flex items-center gap-1.5 m-0">
              <Icon name="attach_file" size="xs" className="text-brand-primary-600" />
              Tài liệu & Bằng chứng xác minh ({evidences.length})
            </h3>
            {hasNoEvidence && (
              <span className="text-[11px] text-danger-strong font-medium">
                Chưa có bằng chứng (Quy chế Q3 chặn phán quyết tài chính)
              </span>
            )}
          </div>

          {evidences.length === 0 ? (
            <div className="p-4 rounded-brand-md bg-neutral-50 border border-dashed border-border text-center text-caption text-fg-muted">
              Chưa có tài liệu minh chứng (ảnh chụp màn hình, biên bản) nào được gửi kèm.
            </div>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-0 m-0 list-none">
              {evidences.map((ev, idx) => (
                <li key={ev.id || idx}>
                  <a
                    href={ev.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-brand-md bg-neutral-50 border border-border hover:border-brand-primary-500 hover:bg-neutral-100/60 transition-all flex items-center justify-between text-caption group"
                  >
                    <div className="truncate pr-2 space-y-0.5">
                      <span className="font-semibold block truncate text-fg group-hover:text-brand-primary-700">
                        {ev.fileName}
                      </span>
                      <span className="text-[11px] text-fg-muted font-mono block">
                        {ev.fileSizeBytes ? `${Math.round(ev.fileSizeBytes / 1024)} KB` : ''} • {ev.contentType || 'file'}
                      </span>
                    </div>
                    <Icon name="open_in_new" size="sm" className="text-brand-primary-600 shrink-0" />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Conversation Snippet */}
        {conversationSnippet && conversationSnippet.length > 0 && (
          <div className="space-y-3 pt-2 border-t border-border">
            <h3 className="text-caption font-bold text-fg flex items-center gap-1.5 m-0">
              <Icon name="chat" size="xs" className="text-brand-primary-600" />
              Trích lục trao đổi giữa hai bên ({conversationSnippet.length} tin nhắn gần nhất)
            </h3>
            <div className="space-y-2.5 max-h-64 overflow-y-auto p-3.5 rounded-brand-md bg-neutral-50 border border-border text-caption">
              {conversationSnippet.map((msg) => {
                const isStudent = msg.senderUserId === dispute?.initiatorUserId;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isStudent ? 'items-start' : 'items-end'}`}
                  >
                    <div className="flex items-center gap-1.5 text-[11px] text-fg-muted mb-0.5">
                      <span className="font-semibold text-fg">{msg.senderName}</span>
                      <span>•</span>
                      <span className="font-mono">{formatDateTime(msg.sentAt, 'HH:mm DD/MM')}</span>
                    </div>
                    <div
                      className={`max-w-[85%] p-2.5 rounded-brand-md text-caption leading-relaxed ${
                        isStudent
                          ? 'bg-white border border-border text-fg'
                          : 'bg-brand-primary-600 text-white'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      {/* Closed Verdict Certificate */}
      {isClosed ? (
        <Card padding="lg" className="space-y-4 border-2 border-success/50 shadow-brand-md bg-success-subtle/40">
          <div className="flex items-center justify-between pb-3 border-b border-success/20">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-brand-md bg-success-subtle text-success-strong flex items-center justify-center">
                <Icon name="verified" size="sm" />
              </div>
              <div>
                <h3 className="text-fg m-0">
                  Biên bản phán quyết trọng tài có hiệu lực
                </h3>
                <span className="text-[12px] text-fg-muted font-mono">
                  Phán quyết ngày: {formatDateTime(dispute?.resolvedAt, 'DD/MM/YYYY HH:mm')}
                </span>
              </div>
            </div>
            <Badge variant="success" size="md">
              {dispute?.status}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-caption">
            <div className="p-3 rounded-brand-md bg-surface border border-border">
              <span className="text-fg-muted block text-[11px] font-semibold uppercase">Loại phán quyết</span>
              <span className="font-bold text-fg block text-body-reg mt-0.5">
                {DECISION_TRANSLATIONS[dispute?.resolutionDecision] || dispute?.resolutionDecision || 'Đã đóng'}
              </span>
            </div>
            <div className="p-3 rounded-brand-md bg-surface border border-border">
              <span className="text-fg-muted block text-[11px] font-semibold uppercase">Trọng tài viên phê duyệt</span>
              <span className="font-bold text-fg block text-body-reg mt-0.5 font-mono">
                Admin #{dispute?.resolvedByAdminId?.substring(0, 8) || 'System'}
              </span>
            </div>
          </div>

          {dispute?.adminNotes && (
            <div className="space-y-1">
              <span className="text-caption font-bold text-fg">Căn cứ phán quyết trọng tài:</span>
              <p className="text-caption text-fg leading-relaxed bg-surface p-3.5 rounded-brand-md border border-border whitespace-pre-line m-0">
                {dispute.adminNotes}
              </p>
            </div>
          )}
        </Card>
      ) : (
        /* Active Arbitration Balancing & Resolution Form */
        <Card padding="lg" className="space-y-5 border-2 border-brand-primary-500 shadow-brand-md">
          <CardHeader
            title="Bộ cân bằng tài chính trọng tài DEC-S8-025"
            icon={<Icon name="calculate" size="sm" />}
            action={
              /* Phí sàn là dòng tiền trung tính — không tô xanh (SPEC §4.2). */
              <Badge variant="neutral" size="sm">
                Bảo toàn phí sàn {(platformFeeRate * 100).toFixed(0)}%
              </Badge>
            }
          />

          <div className="space-y-4">
            {/* Quick Presets */}
            <div className="flex items-center justify-between flex-wrap gap-2 text-caption">
              <label htmlFor="dispute-refund-slider" className="font-bold text-fg">
                Số tiền hoàn trả cho học viên:
              </label>
              <div className="flex items-center gap-1.5">
                {[
                  { label: '0% (Gia sư thắng)', val: 0 },
                  { label: '50% (Chia đôi)', val: Math.round(originalSessionFee * 0.5) },
                  { label: '100% (Hoàn toàn bộ)', val: originalSessionFee },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setRefundAmount(preset.val)}
                    className="px-2.5 py-1 text-[11px] font-semibold rounded-brand-sm border border-border bg-neutral-50 hover:bg-neutral-100 text-fg cursor-pointer transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Slider & Value Display */}
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-headline-1 text-success-strong font-bold tabular-nums">
                  <Money value={refundAmount} />
                </span>
                <span className="text-caption text-fg-muted">
                  Tối đa: {formatCurrency(originalSessionFee)}
                </span>
              </div>

              <input
                id="dispute-refund-slider"
                type="range"
                aria-label="Số tiền hoàn trả học viên"
                min="0"
                max={Math.max(originalSessionFee, 10000)}
                step="5000"
                value={refundAmount}
                onChange={(e) => setRefundAmount(parseInt(e.target.value, 10) || 0)}
                className="w-full accent-brand-primary-600 cursor-pointer h-2 bg-neutral-200 rounded-lg"
              />
            </div>

            {/* Visual Balance Split (Tutor Clawback + Platform Reversal or Escrow Split) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-caption">
              {isPayoutReleased ? (
                <>
                  <div className="p-4 rounded-brand-md bg-neutral-50 border border-border space-y-1">
                    <span className="text-fg-muted block font-semibold text-[11px] uppercase">
                      Thu hồi từ gia sư (Max: {formatCurrency(tutorReceivedOriginal)})
                    </span>
                    <span className="text-headline-3 text-danger-strong font-semibold tabular-nums">
                      -<Money value={tutorClawback} />
                    </span>
                    <p className="text-[11px] text-fg-muted m-0">
                      Khấu trừ theo tỷ lệ thu nhập thực nhận của buổi học
                    </p>
                  </div>

                  <div className="p-4 rounded-brand-md bg-neutral-50 border border-border space-y-1">
                    <span className="text-fg-muted block font-semibold text-[11px] uppercase">
                      Hoàn phí sàn TutorHub ({(platformFeeRate * 100).toFixed(0)}%)
                    </span>
                    <span className="text-headline-3 text-fg font-semibold tabular-nums">
                      -<Money value={platformFeeRefund} />
                    </span>
                    <p className="text-[11px] text-fg-muted m-0">
                      Sàn tự động thoái hoàn phí dịch vụ tương ứng
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-4 rounded-brand-md bg-neutral-50 border border-border space-y-1">
                    <span className="text-fg-muted block font-semibold text-[11px] uppercase">
                      Hoàn trả học viên từ Escrow
                    </span>
                    <span className="text-headline-3 text-success-strong font-semibold tabular-nums">
                      <Money value={refundAmount} />
                    </span>
                    <p className="text-[11px] text-fg-muted m-0">
                      Trích hoàn từ quỹ ký quỹ tạm giữ của buổi học
                    </p>
                  </div>

                  <div className="p-4 rounded-brand-md bg-neutral-50 border border-border space-y-1">
                    <span className="text-fg-muted block font-semibold text-[11px] uppercase">
                      Giải ngân phần còn lại cho Gia sư
                    </span>
                    <span className="text-headline-3 text-brand-primary-700 font-semibold tabular-nums">
                      <Money value={tutorRemainingPayout} />
                    </span>
                    <p className="text-[11px] text-fg-muted m-0">
                      Đã trừ phí sàn: {formatCurrency(platformRemainingFee)} ({(platformFeeRate * 100).toFixed(0)}%)
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Conservation Math Identity Banner — số tiền KHÔNG dùng font-mono
                (SPEC §2.4), chỉ `tabular-nums` để dọc thẳng cột. */}
            <div className="p-3 rounded-brand-md bg-brand-navy-900 text-center text-caption text-neutral-300 tabular-nums">
              {isPayoutReleased ? (
                <>
                  {formatCurrency(tutorClawback)} (Thu hồi từ Gia sư) + {formatCurrency(platformFeeRefund)} (Phí sàn hoàn) ≡{' '}
                  <strong className="text-success">{formatCurrency(refundAmount)}</strong> (Học viên nhận)
                </>
              ) : (
                <>
                  Ký quỹ Escrow {formatCurrency(originalSessionFee)} ≡{' '}
                  <strong className="text-success">{formatCurrency(refundAmount)}</strong> (Hoàn học viên) +{' '}
                  <strong className="text-info">{formatCurrency(tutorRemainingPayout)}</strong> (Gia sư nhận) +{' '}
                  <span className="text-neutral-400">{formatCurrency(platformRemainingFee)} (Phí sàn)</span>
                </>
              )}
            </div>
          </div>

          {/* Admin Arbitration Notes */}
          <Field
            label="Căn cứ phán quyết trọng tài (Bắt buộc tối thiểu 10 ký tự)"
            htmlFor="dispute-admin-note"
            required
          >
            <Textarea
              id="dispute-admin-note"
              rows={3}
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="Ghi rõ lý do căn cứ vào biên bản đối soát điểm danh, trích lục chat và tài liệu xác minh..."
            />
            <div className="flex justify-end pt-1">
              <span className={`text-[11px] tabular-nums ${adminNote.trim().length >= 10 ? 'text-success-strong' : 'text-danger-strong'}`}>
                {adminNote.trim().length} / 10 ký tự tối thiểu
              </span>
            </div>
          </Field>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2 border-t border-border">
            {hasNoEvidence && (
              <p className="text-[12px] text-danger-strong font-medium m-0 flex items-center gap-1.5">
                <Icon name="info" size="xs" />
                Vụ việc chưa có tài liệu bằng chứng: Chỉ được phép chọn &ldquo;Bác bỏ khiếu nại&rdquo;. Cần có tài liệu xác minh để thực hiện hoàn tiền hoặc giải ngân.
              </p>
            )}

            <div className="flex flex-wrap gap-3">
              <Button
                variant="success"
                size="md"
                loading={resolving}
                disabled={hasNoEvidence || resolving || adminNote.trim().length < 10}
                onClick={() => handleResolve('refund')}
                icon={!resolving && <Icon name="verified" size="sm" />}
              >
                Phán quyết hoàn tiền ({formatCurrency(refundAmount)})
              </Button>

              <Button
                variant="primary"
                size="md"
                disabled={hasNoEvidence || resolving || adminNote.trim().length < 10}
                onClick={() => handleResolve('release')}
                icon={<Icon name="payments" size="sm" />}
              >
                Giải ngân cho gia sư (Gia sư thắng)
              </Button>

              <Button
                variant="danger-outline"
                size="md"
                disabled={resolving || adminNote.trim().length < 10}
                onClick={() => handleResolve('dismiss')}
                icon={<Icon name="close" size="sm" />}
              >
                Bác bỏ khiếu nại (Không đổi tiền)
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
