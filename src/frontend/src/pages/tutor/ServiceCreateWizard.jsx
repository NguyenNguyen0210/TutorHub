import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import tutorService from '@/services/tutor.service';
import Money from '@/components/ui/Money';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import { CardSkeleton } from '@/components/common/Skeleton';
import ErrorState from '@/components/common/ErrorState';
import { useToast } from '@/components/ui/Toast';
import { getTeachingModeMeta } from '@/config/enums';
import {
  BasicInfoFields,
  ScopeOutcomeFields,
  TrialFields,
  SubjectFields,
  PackageTermsFields,
  ModeFields,
  CurriculumFields,
  FaqFields,
  SectionTitle,
} from '@/components/tutor/services/ServiceFormSections';
import {
  createInitialFormState,
  validateServiceForm,
  collectFaqs,
  buildServicePayload,
  splitLines,
  parseTags,
} from '@/components/tutor/services/serviceFormUtils';

const STEPS = [
  { id: 1, label: 'Thông tin cơ bản' },
  { id: 2, label: 'Nội dung & mục tiêu' },
  { id: 3, label: 'Gói học & học phí' },
  { id: 4, label: 'Hình thức dạy' },
  { id: 5, label: 'Học thử' },
  { id: 6, label: 'Xem trước & xuất bản' },
];

/** Per-step gate: returns an error message or null. Final step reuses full validation. */
function validateStep(step, formData) {
  const title = (formData.title || '').trim();
  const description = (formData.description || '').trim();
  const shortDescription = (formData.shortDescription || '').trim();
  const tags = parseTags(formData.tags);
  const audience = splitLines(formData.targetAudienceText);
  const prereqs = splitLines(formData.prerequisitesText);
  const faqRows = Array.isArray(formData.faqs) ? formData.faqs : [];

  switch (step) {
    case 1:
      if (!formData.subjectId) return 'Vui lòng chọn môn học cho gói dịch vụ.';
      if (!title || title.length < 5) return 'Tiêu đề gói học cần tối thiểu 5 ký tự.';
      if (!description || description.length < 20) return 'Mô tả gói học cần tối thiểu 20 ký tự.';
      if (shortDescription.length > 200) return 'Mô tả ngắn tối đa 200 ký tự.';
      if (tags.length > 10) return 'Tối đa 10 thẻ liên quan cho mỗi gói học.';
      return null;
    case 2:
      if (audience.length > 8) return 'Đối tượng phù hợp tối đa 8 mục (mỗi mục một dòng).';
      if (prereqs.length > 8) return 'Điều kiện tiên quyết tối đa 8 mục (mỗi mục một dòng).';
      if (faqRows.length > 10) return 'Câu hỏi thường gặp tối đa 10 mục.';
      return null;
    case 3:
      if (Number(formData.totalSessions) < 1) return 'Số buổi học phải từ 1 buổi trở lên.';
      if (Number(formData.price) <= 0) return 'Học phí gói học phải lớn hơn 0 ₫.';
      return null;
    default:
      return null;
  }
}

function WizardPreview({ formData, subjects }) {
  const subjectName = subjects.find((s) => s.id === formData.subjectId)?.name || '—';
  const modeMeta = getTeachingModeMeta(formData.teachingMode);
  const sessions = Array.isArray(formData.sessions) ? formData.sessions : [];
  const audience = splitLines(formData.targetAudienceText);
  const prereqs = splitLines(formData.prerequisitesText);
  const { faqs } = collectFaqs(formData);
  const total = Number(formData.totalSessions) || 0;
  const perSession = total > 0 ? Math.round((Number(formData.price) || 0) / total) : 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-4">
        {formData.coverImageUrl?.trim() && (
          <img
            src={formData.coverImageUrl.trim()}
            alt=""
            aria-hidden="true"
            className="w-full sm:w-44 h-36 sm:h-auto sm:min-h-[148px] object-cover rounded-brand-md border border-border shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-caption font-semibold uppercase tracking-[0.12em] text-brand-primary-600">{subjectName}</p>
          <h3 className="text-headline-2 text-fg mt-1">{formData.title || 'Chưa đặt tên'}</h3>
          {formData.shortDescription?.trim() && (
            <p className="text-body-reg text-fg-secondary mt-1">{formData.shortDescription.trim()}</p>
          )}
          <p className="text-[13px] text-fg-secondary mt-2">
            {total} buổi · {formData.sessionDurationMinutes} phút/buổi · {modeMeta.label}
          </p>
        </div>
        <div className="sm:text-right shrink-0">
          <p className="text-[20px] font-bold tabular-nums tracking-tight text-fg leading-none">
            <Money value={Number(formData.price) || 0} />
          </p>
          <p className="text-[13px] text-fg-secondary mt-1.5">Gói {total} buổi</p>
          <p className="text-[12px] text-fg-muted tabular-nums">≈ {perSession.toLocaleString('vi-VN')}đ/buổi</p>
        </div>
      </div>

      {formData.description?.trim() && (
        <div>
          <SectionTitle step={2}>Mô tả</SectionTitle>
          <p className="text-body-reg text-fg-secondary whitespace-pre-line mt-2">{formData.description.trim()}</p>
        </div>
      )}

      {(formData.learningScope?.trim() || formData.expectedOutcome?.trim()) && (
        <div className="grid sm:grid-cols-2 gap-3">
          {formData.learningScope?.trim() && (
            <div className="bg-neutral-50 border border-border rounded-brand-md p-3.5">
              <p className="text-caption font-bold text-fg">Phạm vi kiến thức</p>
              <p className="text-body-reg text-fg-secondary mt-1">{formData.learningScope.trim()}</p>
            </div>
          )}
          {formData.expectedOutcome?.trim() && (
            <div className="bg-neutral-50 border border-border rounded-brand-md p-3.5">
              <p className="text-caption font-bold text-fg">Cam kết đầu ra</p>
              <p className="text-body-reg text-fg-secondary mt-1">{formData.expectedOutcome.trim()}</p>
            </div>
          )}
        </div>
      )}

      {sessions.length > 0 && (
        <div>
          <SectionTitle step={3}>Lộ trình {sessions.length} buổi</SectionTitle>
          <ol className="mt-2 space-y-2">
            {sessions.map((s, i) => (
              <li key={i} className="flex items-start gap-3 text-body-reg">
                <span className="w-6 h-6 rounded-full bg-brand-primary-50 text-brand-primary-700 flex items-center justify-center text-caption font-bold shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-fg">{(s.title || '').trim() || `Buổi ${i + 1}`}</p>
                  {s.description?.trim() && <p className="text-fg-secondary">{s.description.trim()}</p>}
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      {(audience.length > 0 || prereqs.length > 0) && (
        <div className="grid sm:grid-cols-2 gap-3">
          {audience.length > 0 && (
            <div>
              <p className="text-caption font-bold text-fg mb-1.5">Đối tượng phù hợp</p>
              <ul className="list-disc pl-5 space-y-1 text-body-reg text-fg-secondary">
                {audience.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            </div>
          )}
          {prereqs.length > 0 && (
            <div>
              <p className="text-caption font-bold text-fg mb-1.5">Điều kiện tiên quyết</p>
              <ul className="list-disc pl-5 space-y-1 text-body-reg text-fg-secondary">
                {prereqs.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      {faqs.length > 0 && (
        <div>
          <p className="text-caption font-bold text-fg mb-1.5">Câu hỏi thường gặp ({faqs.length})</p>
          <div className="space-y-2">
            {faqs.map((f, i) => (
              <div key={i} className="border border-border rounded-brand-md p-3">
                <p className="text-body-reg font-semibold text-fg">{f.question}</p>
                <p className="text-body-reg text-fg-secondary mt-0.5">{f.answer}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ServiceCreateWizard() {
  const toast = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(() => createInitialFormState());
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [reached, setReached] = useState(1);

  useEffect(() => {
    document.title = 'Tạo dịch vụ mới — TutorHub';
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await tutorService.getSubjects();
        if (cancelled) return;
        const arr = Array.isArray(list) ? list : [];
        setSubjects(arr);
        setFormData((prev) => (prev.subjectId ? prev : { ...prev, subjectId: arr[0]?.id || '' }));
      } catch (err) {
        if (!cancelled) setLoadError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleFieldChange = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const goNext = () => {
    const err = validateStep(step, formData);
    if (err) {
      toast.error(err);
      return;
    }
    const next = Math.min(step + 1, STEPS.length);
    setStep(next);
    setReached((r) => Math.max(r, next));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = () => {
    setStep((s) => Math.max(s - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submit = async (publishAfterCreate) => {
    const err = validateServiceForm(formData, 'create') || collectFaqs(formData).error;
    if (err) {
      toast.error(err);
      return;
    }
    try {
      setSubmitting(true);
      const payload = buildServicePayload(formData, { mode: 'create' });
      const created = await tutorService.createService(payload);
      if (publishAfterCreate && created?.id) {
        await tutorService.publishService(created.id);
        toast.success('Gói dịch vụ đã được xuất bản công khai.');
      } else {
        toast.success('Đã tạo gói dịch vụ mới ở trạng thái Bản nháp (Draft).');
      }
      navigate('/tutor/services');
    } catch (e) {
      toast.error(e?.message || 'Không thể lưu gói dịch vụ.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-[880px] mx-auto space-y-5">
        <CardSkeleton count={2} />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-[880px] mx-auto">
        <ErrorState
          error={loadError}
          title="Không thể tải dữ liệu tạo dịch vụ"
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  const finalError = step === STEPS.length
    ? validateServiceForm(formData, 'create') || collectFaqs(formData).error
    : null;

  return (
    <div className="max-w-[880px] mx-auto space-y-5">
      {/* Header */}
      <div>
        <Link
          to="/tutor/services"
          className="inline-flex items-center gap-1.5 text-caption font-medium text-fg-secondary hover:text-brand-primary-600 transition-colors"
        >
          <Icon name="arrow_back" size="xs" />
          Quay lại danh sách dịch vụ
        </Link>
        <h1 className="text-[30px] leading-[1.2] font-bold text-fg tracking-tight mt-2">
          Tạo dịch vụ mới
        </h1>
        <p className="text-body-reg text-fg-secondary mt-1">
          Hoàn thành {STEPS.length} bước để thiết kế gói học của bạn.
        </p>
      </div>

      {/* Stepper */}
      <ol className="flex items-center gap-1 sm:gap-2" aria-label="Tiến trình tạo dịch vụ">
        {STEPS.map((s, i) => {
          const current = s.id === step;
          const reachable = s.id <= reached;
          return (
            <li key={s.id} className="flex-1 min-w-0">
              <button
                type="button"
                disabled={!reachable}
                onClick={() => reachable && setStep(s.id)}
                aria-current={current ? 'step' : undefined}
                className="w-full text-left group cursor-pointer disabled:cursor-default"
              >
                <span
                  className={`block h-1 rounded-full transition-colors ${
                    s.id < step ? 'bg-brand-primary-500' : current ? 'bg-brand-primary-500' : 'bg-neutral-200'
                  }`}
                  aria-hidden="true"
                />
                <span className={`mt-1.5 hidden sm:flex items-center gap-1.5 text-caption font-medium truncate ${
                  current ? 'text-brand-primary-700' : s.id < step ? 'text-fg' : 'text-fg-muted'
                }`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                    s.id < step
                      ? 'bg-brand-primary-500 text-white'
                      : current
                        ? 'bg-brand-primary-100 text-brand-primary-700'
                        : 'bg-neutral-100 text-fg-muted'
                  }`}>
                    {s.id < step ? <Icon name="check" size="xs" /> : s.id}
                  </span>
                  <span className="truncate">{s.label}</span>
                </span>
                <span className={`mt-1 block sm:hidden text-center text-[11px] font-bold ${current ? 'text-brand-primary-700' : 'text-fg-muted'}`}>
                  {s.id}/{STEPS.length}
                </span>
              </button>
              {i < STEPS.length - 1 && <span className="sr-only">, tiếp theo: </span>}
            </li>
          );
        })}
      </ol>

      {/* Step body */}
      <div className="bg-surface border border-border rounded-brand-lg shadow-brand-sm p-4 sm:p-6">
        {step === 1 && (
          <section className="space-y-4" aria-label="Thông tin cơ bản">
            <SectionTitle step={1}>Thông tin cơ bản</SectionTitle>
            <SubjectFields formData={formData} onFieldChange={handleFieldChange} subjects={subjects} editingService={null} />
            <BasicInfoFields formData={formData} onFieldChange={handleFieldChange} />
          </section>
        )}

        {step === 2 && (
          <section className="space-y-4" aria-label="Nội dung và mục tiêu">
            <SectionTitle step={2}>Nội dung &amp; mục tiêu</SectionTitle>
            <ScopeOutcomeFields formData={formData} onFieldChange={handleFieldChange} />
            <CurriculumFields formData={formData} onFieldChange={handleFieldChange} step={2} />
            <FaqFields formData={formData} onFieldChange={handleFieldChange} />
          </section>
        )}

        {step === 3 && (
          <section className="space-y-4" aria-label="Gói học và học phí">
            <SectionTitle step={3}>Gói học &amp; học phí</SectionTitle>
            <PackageTermsFields formData={formData} onFieldChange={handleFieldChange} locked={false} />
          </section>
        )}

        {step === 4 && (
          <section className="space-y-4" aria-label="Hình thức giảng dạy">
            <SectionTitle step={4}>Hình thức giảng dạy</SectionTitle>
            <ModeFields formData={formData} onFieldChange={handleFieldChange} locked={false} />
            <p className="text-caption text-fg-secondary">
              Lịch từng buổi sẽ do bạn xếp sau khi học viên đăng ký gói học.
            </p>
          </section>
        )}

        {step === 5 && (
          <section className="space-y-4" aria-label="Video học thử">
            <SectionTitle step={5}>Video học thử</SectionTitle>
            <TrialFields formData={formData} onFieldChange={handleFieldChange} />
          </section>
        )}

        {step === 6 && (
          <section className="space-y-4" aria-label="Xem trước và xuất bản">
            <SectionTitle step={6}>Xem trước &amp; xuất bản</SectionTitle>
            <p className="text-caption text-fg-secondary">
              Đây là cách học viên sẽ thấy gói học của bạn trên sàn giao dịch.
            </p>
            <WizardPreview formData={formData} subjects={subjects} />
            {finalError && (
              <div className="p-3 bg-danger-subtle text-danger-strong rounded-brand-md text-caption" role="alert">
                <strong>Chưa thể xuất bản:</strong> {finalError} Quay lại các bước trước để bổ sung.
              </div>
            )}
          </section>
        )}

        {/* Nav */}
        <div className="mt-6 pt-4 border-t border-border flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="md"
            onClick={goBack}
            disabled={step === 1 || submitting}
            icon={<Icon name="arrow_back" size="xs" />}
          >
            Quay lại
          </Button>
          {step < STEPS.length ? (
            <Button variant="primary" size="md" onClick={goNext} iconRight={<Icon name="arrow_forward" size="xs" />}>
              Tiếp tục
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="md" onClick={() => submit(false)} loading={submitting} disabled={Boolean(finalError)}>
                Lưu bản nháp
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => submit(true)}
                loading={submitting}
                disabled={Boolean(finalError)}
                icon={<Icon name="rocket_launch" size="xs" />}
              >
                Xuất bản ngay
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
