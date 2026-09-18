import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
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
import { Textarea, Field } from '@/components/ui/Input';

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

  const reasonsList = [
    { key: 'TutorNoShow', title: 'Gia sư vắng mặt không báo trước', desc: 'Học viên vào lớp đúng giờ nhưng gia sư không xuất hiện.' },
    { key: 'IncompleteSession', title: 'Buổi học không trọn vẹn thời lượng', desc: 'Gia sư kết thúc buổi học sớm hơn thời gian quy định.' },
    { key: 'QualityIssue', title: 'Nội dung không đúng cam kết', desc: 'Gia sư không chuẩn bị bài hoặc dạy không đúng lộ trình.' },
    { key: 'TutorLate', title: 'Gia sư vào lớp muộn quá 15 phút', desc: 'Không bù giờ hoặc làm ảnh hưởng nghiêm trọng đến việc học.' },
    { key: 'InappropriateBehavior', title: 'Hành vi không phù hợp', desc: 'Gia sư có thái độ, lời nói hoặc hành vi thiếu chuẩn mực.' },
    { key: 'TechnicalFailure', title: 'Sự cố kỹ thuật từ gia sư', desc: 'Mất kết nối hoặc thiết bị hỏng khiến buổi học bị gián đoạn kéo dài.' },
    { key: 'Other', title: 'Lý do khác', desc: 'Các vấn đề phát sinh khác cần ban trọng tài can thiệp đối soát.' },
  ];

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim() || description.trim().length < 20) {
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
        to="/student/dashboard"
        className="inline-flex items-center gap-1.5 text-caption font-semibold text-fg-secondary hover:text-brand-primary-700 transition-colors"
      >
        <Icon name="arrow_back" size="sm" />
        Quay lại bàn học
      </Link>

      <Card padding="lg" className="space-y-5">
        <div className="space-y-1">
          <h1 className="text-headline-1 text-fg">Mở đơn khiếu nại tranh chấp buổi học</h1>
          <p className="text-caption text-fg-muted">
            Hệ thống bàn trọng tài bảo vệ quyền lợi tài chính minh bạch cho cả học viên và gia sư
          </p>
        </div>

        {session && (
          <div className="p-4 rounded-brand-md bg-neutral-50 border border-border flex items-center justify-between text-caption">
            <div>
              <span className="font-bold text-fg block">
                Buổi #{session.sessionNumber} {session.subjectName ? `• ${session.subjectName}` : ''}
              </span>
              <span className="text-fg-muted">
                {session.tutorName ? `Gia sư: ${session.tutorName}` : ''}
                {session.startAt ? ` • Giờ học: ${formatDateTime(session.startAt)}` : ''}
              </span>
            </div>
            <span className="font-bold text-success-strong text-body-reg">
              <Money value={session.earningAmount || 0} />
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-3">
            <span
              id="dispute-reason-label"
              className="text-caption font-semibold text-fg-secondary uppercase tracking-wide block"
            >
              Chọn lý do khiếu nại chính
            </span>
            <div
              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
              role="radiogroup"
              aria-labelledby="dispute-reason-label"
            >
              {reasonsList.map((r) => {
                const selected = reason === r.key;
                return (
                  <button
                    key={r.key}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setReason(r.key)}
                    className={cn(
                      'p-4 rounded-brand-md border-2 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger',
                      selected
                        ? 'border-danger bg-danger-subtle'
                        : 'border-border hover:bg-neutral-50'
                    )}
                  >
                    <span className="flex items-center justify-between">
                      <span className="font-semibold text-body-reg text-fg">{r.title}</span>
                      {selected && <Icon name="radio_button_checked" size="sm" className="text-danger" />}
                    </span>
                    <span className="text-[11px] text-fg-muted mt-1 leading-normal block">
                      {r.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <Field
            label="Mô tả chi tiết vụ việc (tối thiểu 20 ký tự, bắt buộc)"
            htmlFor="dispute-description"
            required
          >
            <Textarea
              id="dispute-description"
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả diễn biến cụ thể (thời gian vào lớp, sự cố phát sinh...) để trọng tài có đầy đủ cơ sở đối soát..."
            />
          </Field>

          <Field
            label="Tệp bằng chứng minh họa (Ảnh chụp màn hình, tài liệu PDF, văn bản...)"
            htmlFor="dispute-evidence-input"
          >
            <div className="p-4 rounded-brand-md border-2 border-dashed border-border text-center space-y-2 bg-neutral-50">
              <Icon name="cloud_upload" size="lg" strokeWidth={1.5} className="text-fg-muted mx-auto" />
              <div>
                <input
                  id="dispute-evidence-input"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf,text/plain"
                  onChange={(e) => setEvidenceFile(e.target.files?.[0] || null)}
                  className="text-caption text-fg-secondary file:mr-3 file:py-1.5 file:px-3 file:rounded-brand-md file:border-0 file:text-caption file:font-semibold file:bg-brand-primary-50 file:text-brand-primary-700 hover:file:bg-brand-primary-100 cursor-pointer"
                />
              </div>
              {evidenceFile && (
                <p className="text-caption text-success-strong font-semibold m-0">
                  Đã chọn: {evidenceFile.name} ({Math.round(evidenceFile.size / 1024)} KB)
                </p>
              )}
              <p className="text-[11px] text-fg-muted m-0">
                Hỗ trợ JPG, PNG, WEBP, PDF, TXT (tối đa 10 MB)
              </p>
            </div>
          </Field>

          <Callout
            variant="danger"
            title="Quy tắc bảo chứng tài chính"
            icon={<Icon name="lock" size="md" />}
          >
            Sau khi gửi khiếu nại thành công, học phí buổi học sẽ được bảo chứng trong Escrow và
            chỉ được giải ngân hoặc hoàn trả theo phán quyết phân xử của Admin.
          </Callout>

          <div className="flex gap-3 pt-1">
            <Button
              type="submit"
              variant="danger"
              size="lg"
              loading={loading}
              icon={!loading && <Icon name="send" size="sm" />}
            >
              Gửi đơn khiếu nại lên Admin
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => navigate('/student/dashboard')}
            >
              Hủy bỏ
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
