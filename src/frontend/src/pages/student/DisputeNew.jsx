import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import dayjs from 'dayjs';
import { cn } from '@/lib/cn';
import disputeService from '@/services/dispute.service';
import sessionService from '@/services/session.service';
import { formatDateTime } from '@/utils/formatters';
import Money from '@/components/ui/Money';
import { useToast } from '@/components/ui/Toast';
import { DetailSkeleton } from '@/components/common/Skeleton';
import ErrorState from '@/components/common/ErrorState';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Callout from '@/components/ui/Callout';
import Icon from '@/components/ui/Icon';
import { Textarea } from '@/components/ui/Input';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'text/plain',
];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB per DEC-S8-018
const MIN_DESCRIPTION_LENGTH = 20;

const REASONS = [
  { key: 'TutorNoShow', title: 'Gia sư vắng mặt không báo trước', desc: 'Học viên vào lớp đúng giờ nhưng gia sư không xuất hiện.' },
  { key: 'IncompleteSession', title: 'Buổi học không trọn vẹn thời lượng', desc: 'Gia sư kết thúc buổi học sớm hơn thời gian quy định.' },
  { key: 'QualityIssue', title: 'Nội dung không đúng cam kết', desc: 'Gia sư không chuẩn bị bài hoặc dạy không đúng lộ trình.' },
  { key: 'TutorLate', title: 'Gia sư vào lớp muộn quá 15 phút', desc: 'Không bù giờ hoặc làm ảnh hưởng nghiêm trọng đến việc học.' },
  { key: 'InappropriateBehavior', title: 'Hành vi không phù hợp', desc: 'Gia sư có thái độ, lời nói hoặc hành vi thiếu chuẩn mực.' },
  { key: 'TechnicalFailure', title: 'Sự cố kỹ thuật từ gia sư', desc: 'Mất kết nối hoặc thiết bị hỏng khiến buổi học bị gián đoạn kéo dài.' },
  { key: 'Other', title: 'Lý do khác', desc: 'Các vấn đề phát sinh khác cần ban trọng tài can thiệp đối soát.' },
];

/**
 * StepHeading — tiêu đề bước 15/600 kèm số thứ tự (SPEC §5.6).
 *
 * Mở khiếu nại là việc có hậu quả tài chính, nên đánh số bước để người dùng thấy
 * còn bao nhiêu việc thay vì một form dài. `aside` là meta căn phải (bộ đếm ký
 * tự của bước 2).
 */
function StepHeading({ step, title, id, aside }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 id={id} className="flex items-center gap-2.5 text-[15px] font-semibold text-fg">
        <span
          aria-hidden="true"
          className="w-6 h-6 shrink-0 rounded-full bg-brand-primary-100 text-brand-primary-700 flex items-center justify-center text-caption font-bold"
        >
          {step}
        </span>
        {title}
      </h2>
      {aside && <div className="shrink-0">{aside}</div>}
    </div>
  );
}

export default function DisputeNew() {
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('sessionId');

  const [session, setSession] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(Boolean(sessionId));
  const [sessionError, setSessionError] = useState(null);

  const [reason, setReason] = useState('TutorNoShow');
  const [description, setDescription] = useState('');
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function fetchSession() {
      if (!sessionId) return;
      try {
        setSessionLoading(true);
        setSessionError(null);
        const data = await sessionService.getSessionById(sessionId);
        if (!cancelled) setSession(data);
      } catch (err) {
        if (!cancelled) setSessionError(err);
      } finally {
        if (!cancelled) setSessionLoading(false);
      }
    }

    fetchSession();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    if (!file) {
      setEvidenceFile(null);
      return;
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      toast.error('Định dạng tệp không hợp lệ (DEC-S8-018). Chỉ chấp nhận JPG, PNG, WEBP, PDF hoặc TXT.');
      e.target.value = '';
      setEvidenceFile(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error('Dung lượng tệp vượt quá 10MB theo quy định bảo mật.');
      e.target.value = '';
      setEvidenceFile(null);
      return;
    }

    setEvidenceFile(file);
  };

  if (!sessionId) {
    return (
      <div className="max-w-3xl mx-auto py-12">
        <ErrorState
          title="Không tìm thấy thông tin buổi học"
          error={new Error('Đường dẫn thiếu mã buổi học (sessionId). Vui lòng chọn buổi học từ trang chi tiết khóa học.')}
          backPath="/student/dashboard"
          backLabel="Quay lại bàn học"
        />
      </div>
    );
  }

  if (sessionLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <DetailSkeleton />
      </div>
    );
  }

  if (sessionError) {
    return (
      <div className="max-w-3xl mx-auto py-12">
        <ErrorState
          error={sessionError}
          title="Không tải được thông tin buổi học"
          onRetry={() => window.location.reload()}
          backPath="/student/dashboard"
          backLabel="Quay lại bàn học"
        />
      </div>
    );
  }

  const isFutureSession = session?.endAt && dayjs(session.endAt).isAfter(dayjs());
  const isUnscheduled = session?.status === 'Unscheduled';
  const isCancelled = session?.status === 'Cancelled';
  const cannotDispute = isFutureSession || isUnscheduled || isCancelled;

  const descriptionLength = description.trim().length;
  const descriptionTooShort = descriptionLength < MIN_DESCRIPTION_LENGTH;

  const sessionTitle = session
    ? `Buổi #${session.sessionNumber}${session.subjectName ? ` · ${session.subjectName}` : ''}`
    : '';
  const sessionMeta = session
    ? [
        session.tutorName ? `Gia sư: ${session.tutorName}` : null,
        session.startAt ? `Giờ học: ${formatDateTime(session.startAt)}` : null,
      ]
        .filter(Boolean)
        .join(' · ')
    : '';

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (cannotDispute) {
      toast.error('Không thể mở khiếu nại cho buổi học chưa diễn ra hoặc đã bị hủy.');
      return;
    }

    if (!description.trim() || description.trim().length < MIN_DESCRIPTION_LENGTH) {
      toast.error('Mô tả chi tiết phải từ 20 ký tự trở lên để trọng tài có đủ căn cứ.');
      return;
    }

    try {
      setLoading(true);
      const created = await disputeService.createDispute({
        sessionId,
        reason,
        description: description.trim(),
      });

      if (evidenceFile && created?.id) {
        try {
          await disputeService.uploadEvidence(created.id, evidenceFile);
        } catch (uploadErr) {
          console.warn('Lỗi tải tệp bằng chứng:', uploadErr);
          toast.warning('Đã tạo đơn khiếu nại nhưng tệp bằng chứng tải lên thất bại. Bạn có thể bổ sung sau.');
        }
      }

      toast.success('Đã gửi đơn khiếu nại thành công! Tiền học buổi này đã được bảo chứng trong Escrow.');
      navigate('/student/dashboard');
    } catch (err) {
      toast.error(err?.message || 'Không thể gửi đơn khiếu nại. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        to={session ? `/student/sessions/${session.id}` : '/student/dashboard'}
        className="inline-flex items-center gap-1.5 text-caption font-semibold text-fg-secondary hover:text-brand-primary-700 transition-colors"
      >
        <Icon name="arrow_back" size="sm" />
        Quay lại chi tiết buổi học
      </Link>

      <header className="space-y-1.5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
          <h1 className="text-headline-page text-fg tracking-tight">
            Mở đơn khiếu nại tranh chấp buổi học
          </h1>
          <p className="text-[13px] text-fg-secondary sm:pt-2 sm:text-right shrink-0">
            Tiền sẽ được giữ an toàn
          </p>
        </div>
        <p className="text-body-reg text-fg-secondary">
          Mô tả điều xảy ra để Ban Trọng Tài có căn cứ đối soát.
        </p>
        <p className="text-[13px] text-fg-muted">
          Hệ thống bàn trọng tài bảo vệ quyền lợi tài chính minh bạch cho cả học viên và gia sư theo chuẩn DEC-S8-025.
        </p>
      </header>

      {/* Bối cảnh buổi học — dữ liệu đối soán, không tô màu cảnh báo. */}
      {session && (
        <div className="rounded-brand-lg border border-border bg-neutral-50 sm:flex sm:items-center sm:justify-between">
          <div className="px-4 py-3.5 min-w-0">
            <p className="text-[15px] font-semibold text-fg">{sessionTitle}</p>
            {sessionMeta && <p className="text-caption text-fg-secondary mt-0.5">{sessionMeta}</p>}
          </div>
          <div className="px-4 pb-3.5 sm:py-3.5 sm:pl-5 sm:border-l sm:border-border sm:text-right">
            <p className="text-caption text-fg-muted">Học phí bảo chứng</p>
            <p className="text-[20px] leading-tight font-bold text-fg mt-0.5">
              <Money value={session.earningAmount || 0} />
            </p>
          </div>
        </div>
      )}

      {/* Cannot dispute future or unscheduled session banner */}
      {cannotDispute && (
        <Callout
          variant="danger"
          title="Không thể mở khiếu nại cho buổi học này"
          icon={<Icon name="warning" size="md" />}
        >
          {isFutureSession && (
            <p className="m-0">
              Theo quy chế sàn (FR-DISPUTE-001), khiếu nại tranh chấp chỉ áp dụng cho buổi học đã diễn ra trong quá khứ. Với buổi học sắp diễn ra, bạn có thể thực hiện <strong>Hủy buổi học</strong> (hoàn 100% học phí về ví ký quỹ) hoặc <strong>Dời lịch học</strong> trên trang chi tiết buổi học.
            </p>
          )}
          {isUnscheduled && (
            <p className="m-0">
              Buổi học chưa được xếp lịch cụ thể. Bạn có thể chọn ngày giờ học hoặc hủy buổi học để nhận lại tiền cọc.
            </p>
          )}
          {isCancelled && (
            <p className="m-0">
              Buổi học này đã được hủy trước đó và tiền ký quỹ đã được hoàn trả.
            </p>
          )}
          <div className="pt-2">
            <Button
              as={Link}
              to={`/student/sessions/${session?.id}`}
              variant="outline"
              size="sm"
              icon={<Icon name="arrow_back" size="xs" />}
            >
              Về trang chi tiết buổi học
            </Button>
          </div>
        </Callout>
      )}

      <form onSubmit={handleSubmit}>
        <Card padding="lg" className="space-y-6">
          {/* ── Bước 1 · chọn lý do (chọn lý do không phải lỗi → brand, không đỏ) ── */}
          <div className="space-y-3">
            <StepHeading step={1} id="dispute-step-1" title="Chọn lý do chính" />
            <div className="space-y-2" role="radiogroup" aria-labelledby="dispute-step-1">
              {REASONS.map((r) => {
                const selected = reason === r.key;
                return (
                  <button
                    key={r.key}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    disabled={cannotDispute}
                    onClick={() => setReason(r.key)}
                    className={cn(
                      'w-full flex items-start gap-3 p-3.5 rounded-brand-md border text-left transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary-600 focus-visible:ring-offset-2',
                      selected
                        ? 'border-brand-primary-600 bg-brand-primary-50'
                        : 'border-border hover:bg-neutral-50',
                      cannotDispute && 'opacity-60 cursor-not-allowed'
                    )}
                  >
                    <Icon
                      name={selected ? 'radio_button_checked' : 'radio_button_unchecked'}
                      size="md"
                      className={cn('mt-0.5', selected ? 'text-brand-primary-600' : 'text-fg-muted')}
                    />
                    <span className="min-w-0">
                      <span
                        className={cn(
                          'block text-[15px] font-semibold leading-snug',
                          selected ? 'text-brand-primary-700' : 'text-fg'
                        )}
                      >
                        {r.title}
                      </span>
                      <span className="block text-caption text-fg-secondary mt-0.5 leading-normal">
                        {r.desc}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Bước 2 · mô tả chi tiết (đếm ký tự trực tiếp cạnh tiêu đề) ── */}
          <div className="space-y-2">
            <StepHeading
              step={2}
              id="dispute-step-2"
              title="Mô tả chi tiết"
              aside={
                <p
                  id="dispute-description-count"
                  className={cn(
                    'text-caption tabular-nums',
                    descriptionTooShort ? 'text-danger-strong' : 'text-fg-secondary'
                  )}
                >
                  {descriptionLength} / {MIN_DESCRIPTION_LENGTH} tối thiểu
                </p>
              }
            />
            <Textarea
              id="dispute-description"
              rows={5}
              required
              disabled={cannotDispute}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              aria-labelledby="dispute-step-2"
              aria-describedby="dispute-description-count"
              placeholder="Mô tả diễn biến cụ thể (thời gian vào lớp, sự cố phát sinh...) để trọng tài có đầy đủ cơ sở đối soát..."
            />
          </div>

          {/* ── Bước 3 · bằng chứng (tùy chọn) ── */}
          <div className="space-y-2">
            <StepHeading step={3} id="dispute-step-3" title="Bằng chứng (tùy chọn)" />
            <div className="p-5 rounded-brand-md border-2 border-dashed border-border bg-neutral-50 text-center space-y-3">
              <Icon name="cloud_upload" size="lg" strokeWidth={1.5} className="text-fg-muted mx-auto" />
              <p id="dispute-evidence-hint" className="text-caption text-fg-secondary m-0">
                Tệp minh họa: ảnh chụp màn hình, tài liệu PDF hoặc văn bản.
              </p>
              <input
                id="dispute-evidence-input"
                type="file"
                disabled={cannotDispute}
                accept="image/jpeg,image/png,image/webp,application/pdf,text/plain"
                onChange={handleFileChange}
                aria-labelledby="dispute-step-3 dispute-evidence-hint"
                className="text-caption text-fg-secondary file:mr-3 file:py-1.5 file:px-3 file:rounded-brand-md file:border-0 file:text-caption file:font-semibold file:bg-brand-primary-50 file:text-brand-primary-700 hover:file:bg-brand-primary-100 cursor-pointer disabled:opacity-50"
              />
              {evidenceFile && (
                <p className="text-caption text-fg font-medium m-0">
                  Đã chọn: {evidenceFile.name} ({Math.round(evidenceFile.size / 1024)} KB)
                </p>
              )}
              <p className="text-caption text-fg-muted m-0">
                Chuẩn DEC-S8-018: Hỗ trợ JPG, PNG, WEBP, PDF, TXT (tối đa 10 MB)
              </p>
            </div>
          </div>

          {/* ── Hậu quả tiền + hành động ── */}
          <div className="space-y-4 border-t border-border pt-5">
            <Callout
              variant="danger"
              title="Quy tắc bảo chứng tài chính Escrow"
              icon={<Icon name="lock" size="md" />}
            >
              Sau khi gửi khiếu nại thành công, học phí buổi học sẽ được bảo chứng trong Escrow và
              chỉ được giải ngân hoặc hoàn trả theo phán quyết phân xử của Ban Trọng Tài (Admin).
            </Callout>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                type="submit"
                variant="danger"
                size="lg"
                loading={loading}
                disabled={cannotDispute}
                icon={!loading && <Icon name="send" size="sm" />}
              >
                Gửi đơn khiếu nại lên Admin
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => navigate(session ? `/student/sessions/${session.id}` : '/student/dashboard')}
              >
                Hủy bỏ
              </Button>
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
}
