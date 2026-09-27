import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import tutorService from '@/services/tutor.service';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/components/ui/Toast';
import Icon from '@/components/ui/Icon';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Callout from '@/components/ui/Callout';
import ApplicationStepper, { SupportCard } from '@/components/tutor/application/ApplicationStepper';
import {
  PersonalInfoStep,
  EducationStep,
  ExperienceStep,
  SubjectsStep,
  MethodologyStep,
  ReviewStep,
} from '@/components/tutor/application/ApplicationSteps';
import {
  STEP_COUNT,
  avatarFileError,
  buildApplicationPayload,
  createInitialFormData,
  degreeFileError,
  makeDegreeFile,
  mergeRejectedApplication,
  validateApplicationStep,
} from '@/components/tutor/application/applicationFormUtils';

const PERKS = [
  'Tiếp cận hàng ngàn học viên tiềm năng',
  'Linh hoạt thời gian giảng dạy',
  'Được hỗ trợ marketing và công cụ dạy học',
  'Thanh toán an toàn qua hệ thống Escrow',
  'Đồng hành cùng đội ngũ chuyên nghiệp',
];

/**
 * TutorApplication — coordinator của wizard hồ sơ gia sư 6 bước.
 * Chỉ giữ state, gọi API, điều hướng bước và submit. Mọi rule nằm ở
 * `applicationFormUtils`; mọi markup nằm ở `ApplicationSteps` / `ApplicationStepper`.
 */
export default function TutorApplication() {
  const toast = useToast();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [currentStep, setCurrentStep] = useState(1);
  const [existingApp, setExistingApp] = useState(null);
  const [loadingApp, setLoadingApp] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // File upload drag states & refs
  const [isDraggingDegree, setIsDraggingDegree] = useState(false);
  const [isDraggingAvatar, setIsDraggingAvatar] = useState(false);
  const degreeInputRef = useRef(null);
  const avatarInputRef = useRef(null);

  // Form State
  const [formData, setFormData] = useState(() => createInitialFormData(user));

  // Check current tutor application on mount
  useEffect(() => {
    let mounted = true;
    async function loadCurrentApplication() {
      try {
        setLoadingApp(true);
        const app = await tutorService.getMyTutorApplication();
        if (mounted && app) {
          setExistingApp(app);
          // If rejected, prefill with previous data so tutor can edit & resubmit
          if (app.status === 'Rejected') {
            setFormData((prev) => mergeRejectedApplication(prev, app));
          }
        }
      } catch (err) {
        console.warn('[TutorApplication] Could not fetch application status:', err.message);
      } finally {
        if (mounted) setLoadingApp(false);
      }
    }

    loadCurrentApplication();
    return () => {
      mounted = false;
    };
  }, []);

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  /* ── Avatar file handling ─────────────────────────────────────────────── */

  const processAvatarFile = (file) => {
    if (!file) return;

    const rejected = avatarFileError(file);
    if (rejected) {
      toast.error(rejected);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData((prev) => ({
        ...prev,
        avatarPreview: event.target.result,
        avatarUrl: event.target.result,
      }));
      toast.success('Đã tải ảnh đại diện thành công!');
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    processAvatarFile(file);
  };

  const handleAvatarDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingAvatar(false);
    const file = e.dataTransfer.files?.[0];
    processAvatarFile(file);
  };

  const handleAvatarDragOver = (e) => {
    e.preventDefault();
    setIsDraggingAvatar(true);
  };

  /* ── Degree / Certificate file handling ───────────────────────────────── */

  const processDegreeFiles = (files) => {
    if (!files || files.length === 0) return;

    const newFiles = [];
    Array.from(files).forEach((file) => {
      const rejected = degreeFileError(file);
      if (rejected) {
        toast.error(rejected);
        return;
      }
      newFiles.push(makeDegreeFile(file));
    });

    if (newFiles.length > 0) {
      setFormData((prev) => ({
        ...prev,
        degreeFiles: [...prev.degreeFiles, ...newFiles],
      }));
      toast.success(`Đã tải lên ${newFiles.length} tệp minh chứng bằng cấp.`);
    }
  };

  const handleDegreeInputChange = (e) => {
    processDegreeFiles(e.target.files);
    // reset input so selecting the same file triggers change
    if (e.target) e.target.value = '';
  };

  const handleDegreeDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingDegree(false);
    processDegreeFiles(e.dataTransfer.files);
  };

  const handleDegreeDragOver = (e) => {
    e.preventDefault();
    setIsDraggingDegree(true);
  };

  const handleDegreeDragEnter = (e) => {
    e.preventDefault();
    setIsDraggingDegree(true);
  };

  const removeDegreeFile = (id) => {
    setFormData((prev) => ({
      ...prev,
      degreeFiles: prev.degreeFiles.filter((f) => f.id !== id),
    }));
  };

  /* ── Step navigation ──────────────────────────────────────────────────── */

  const handleNext = () => {
    const error = validateApplicationStep(currentStep, formData);
    if (error) {
      toast.error(error);
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, STEP_COUNT));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    if (!formData.agreed) {
      toast.error('Bạn cần đánh dấu đồng ý cam kết điều khoản trước khi nộp hồ sơ.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = buildApplicationPayload(formData);

      await tutorService.submitTutorApplication(payload);

      toast.success('Nộp hồ sơ gia sư thành công! Ban quản trị sẽ xét duyệt trong 1–3 ngày làm việc.');
      // Refresh status
      const updated = await tutorService.getMyTutorApplication();
      setExistingApp(updated || { status: 'Pending' });
    } catch (err) {
      toast.error(err?.message || 'Không thể nộp hồ sơ gia sư. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  /* ── 1. Loading state ─────────────────────────────────────────────────── */

  if (loadingApp) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-brand-primary-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-body-reg font-medium text-fg-muted">Đang tải thông tin hồ sơ gia sư...</p>
      </div>
    );
  }

  /* ── 2. Already Pending state ─────────────────────────────────────────── */

  if (existingApp && existingApp.status === 'Pending') {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card padding="none" className="p-8 sm:p-10 text-center space-y-6 border-brand-primary-100">
          <span className="w-16 h-16 rounded-full bg-brand-primary-50 border border-brand-primary-200 text-brand-primary-600 ring-1 ring-inset ring-brand-primary-200 flex items-center justify-center mx-auto">
            <Icon name="hourglass_top" size="xl" />
          </span>

          <div className="space-y-2 max-w-lg mx-auto">
            <Badge variant="holding" className="px-3 py-1">
              <span aria-hidden="true" className="w-2 h-2 rounded-full bg-holding animate-pulse" />
              Đang chờ kiểm duyệt
            </Badge>
            <h1 className="text-headline-1 font-bold text-fg">Hồ sơ của bạn đang được xét duyệt</h1>
            <p className="text-body-reg text-fg-secondary leading-relaxed">
              Cảm ơn bạn đã gửi hồ sơ đăng ký trở thành gia sư tại TutorHub. Ban quản trị đang thẩm định văn bằng và thông tin giảng dạy của bạn.
            </p>
          </div>

          <dl className="p-4 rounded-brand-lg bg-neutral-50 border border-border max-w-md mx-auto text-left text-caption space-y-2 text-fg-secondary">
            <div className="flex justify-between">
              <dt className="text-fg-muted">Thời gian gửi:</dt>
              <dd className="font-semibold text-fg-secondary">
                {new Date(existingApp.submittedAt || Date.now()).toLocaleDateString('vi-VN')}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-fg-muted">Hình thức dạy:</dt>
              <dd className="font-semibold text-fg-secondary">{existingApp.teachingMode}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-fg-muted">Thời gian dự kiến:</dt>
              <dd className="font-semibold text-success">1 – 3 ngày làm việc</dd>
            </div>
          </dl>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button as={Link} to="/" variant="outline" size="md">
              Khám phá gia sư khác
            </Button>
            <Button
              as="a"
              href="mailto:support@tutorhub.vn"
              variant="ghost"
              size="md"
              icon={<Icon name="call" size="sm" />}
            >
              Liên hệ hỗ trợ
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  /* ── 3. Already Approved state ────────────────────────────────────────── */

  if (existingApp && existingApp.status === 'Approved') {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card padding="none" className="p-8 sm:p-10 text-center space-y-6 border-success/20">
          <span className="w-16 h-16 rounded-full bg-success-subtle border border-success/25 text-success ring-1 ring-inset ring-success/25 flex items-center justify-center mx-auto">
            <Icon name="verified" size="xl" />
          </span>

          <div className="space-y-2 max-w-lg mx-auto">
            <Badge variant="success" icon={<Icon name="check" size="xs" />}>
              Đã phê duyệt
            </Badge>
            <h1 className="text-headline-1 font-bold text-fg">Chúc mừng! Bạn đã là Gia sư TutorHub</h1>
            <p className="text-body-reg text-fg-secondary leading-relaxed">
              Hồ sơ giảng dạy của bạn đã được kiểm duyệt thành công. Bạn đã có thể thiết lập lịch rảnh và mở các gói khóa học trên sàn.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button as={Link} to="/tutor/dashboard" variant="primary" size="lg">
              Đến Bảng điều khiển Gia sư →
            </Button>
            <Button as={Link} to="/tutor/services" variant="outline" size="lg">
              Tạo gói dịch vụ dạy học
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  /* ── 4. Default: 6-step wizard (stepper · step body · perks rail) ─────── */

  return (
    <div className="w-full bg-canvas min-h-screen py-8">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top action */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-body-reg font-semibold text-brand-primary-700 hover:text-brand-primary-800 transition-colors mb-4 group cursor-pointer"
        >
          <Icon name="chevron_left" size="sm" className="transition-transform group-hover:-translate-x-0.5" />
          Quay lại
        </button>

        {/* Page title & subtitle */}
        <div className="mb-8">
          <h1 className="text-headline-page font-extrabold text-fg tracking-tight">
            Đăng ký hồ sơ giảng dạy TutorHub
          </h1>
          <p className="text-body-reg sm:text-body-lg text-fg-muted mt-1.5 max-w-3xl leading-relaxed">
            Chia sẻ thông tin của bạn để trở thành gia sư trên TutorHub. Sau khi gửi hồ sơ, đội ngũ của chúng tôi sẽ xét duyệt và phản hồi trong 1–3 ngày làm việc.
          </p>
        </div>

        {/* Rejection alert if resubmitting */}
        {existingApp && existingApp.status === 'Rejected' && (
          <Callout
            variant="danger"
            className="mb-6"
            title="Hồ sơ trước đó bị từ chối xét duyệt"
          >
            Lý do:{' '}
            {existingApp.rejectionReason ||
              'Vui lòng bổ sung đầy đủ văn bằng và cập nhật rõ thông tin kinh nghiệm giảng dạy.'}
          </Callout>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: stepper + support */}
          <aside className="lg:col-span-3 space-y-6">
            <ApplicationStepper currentStep={currentStep} onSelect={setCurrentStep} />
            <SupportCard />
          </aside>

          {/* MIDDLE: step body */}
          <main className="lg:col-span-6">
            <Card padding="none" className="p-6 sm:p-8 space-y-6">
              {currentStep === 1 && (
                <PersonalInfoStep
                  formData={formData}
                  onFieldChange={updateField}
                  isDraggingAvatar={isDraggingAvatar}
                  avatarInputRef={avatarInputRef}
                  onAvatarActivate={() => avatarInputRef.current?.click()}
                  onAvatarDragOver={handleAvatarDragOver}
                  onAvatarDragLeave={() => setIsDraggingAvatar(false)}
                  onAvatarDrop={handleAvatarDrop}
                  onAvatarChange={handleAvatarChange}
                />
              )}

              {currentStep === 2 && (
                <EducationStep
                  formData={formData}
                  onFieldChange={updateField}
                  isDraggingDegree={isDraggingDegree}
                  degreeInputRef={degreeInputRef}
                  onDegreeActivate={() => degreeInputRef.current?.click()}
                  onDegreeDragOver={handleDegreeDragOver}
                  onDegreeDragEnter={handleDegreeDragEnter}
                  onDegreeDragLeave={() => setIsDraggingDegree(false)}
                  onDegreeDrop={handleDegreeDrop}
                  onDegreeChange={handleDegreeInputChange}
                  onRemoveDegreeFile={removeDegreeFile}
                />
              )}

              {currentStep === 3 && <ExperienceStep formData={formData} onFieldChange={updateField} />}

              {currentStep === 4 && <SubjectsStep formData={formData} onFieldChange={updateField} />}

              {currentStep === 5 && <MethodologyStep formData={formData} onFieldChange={updateField} />}

              {currentStep === 6 && <ReviewStep formData={formData} onFieldChange={updateField} />}

              {/* Form navigation */}
              <div className="flex items-center justify-between pt-4 border-t border-border">
                {currentStep > 1 ? (
                  <Button
                    variant="outline"
                    size="md"
                    onClick={handleBack}
                    icon={<Icon name="arrow_back" size="xs" />}
                  >
                    Quay lại
                  </Button>
                ) : (
                  <div />
                )}

                {currentStep < STEP_COUNT ? (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleNext}
                    iconRight={<Icon name="arrow_forward" size="xs" />}
                  >
                    Tiếp tục
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleSubmit}
                    loading={submitting}
                    disabled={!formData.agreed}
                    icon={<Icon name="send" size="sm" />}
                  >
                    {submitting ? 'Đang gửi hồ sơ...' : 'Nộp hồ sơ xét duyệt'}
                  </Button>
                )}
              </div>
            </Card>
          </main>

          {/* RIGHT: perks & review process */}
          <aside className="lg:col-span-3 space-y-5">
            <Card padding="none" className="p-6 space-y-5">
              <div className="flex items-center gap-3">
                <span className="w-11 h-11 rounded-brand-lg bg-brand-primary-100 text-brand-primary-700 flex items-center justify-center shrink-0">
                  <Icon name="school" size="lg" />
                </span>
                <div>
                  <h3 className="font-extrabold text-body-lg text-fg leading-tight">
                    Trở thành gia sư cùng TutorHub
                  </h3>
                  <span className="text-[11px] text-fg-muted block mt-0.5">
                    Chia sẻ tri thức – Truyền cảm hứng – Tạo ra giá trị
                  </span>
                </div>
              </div>

              <ul className="space-y-3 pt-1">
                {PERKS.map((perk, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-caption text-fg-secondary font-medium">
                    <span className="text-brand-primary-600 shrink-0 mt-0.5">
                      <Icon name="check_circle" size="sm" filled />
                    </span>
                    <span className="leading-snug">{perk}</span>
                  </li>
                ))}
              </ul>

              <div className="p-4 rounded-brand-lg bg-surface border border-border shadow-brand-sm space-y-1.5">
                <div className="flex items-start gap-2">
                  <span className="text-headline-1 font-serif text-brand-primary-700 leading-none select-none">
                    “
                  </span>
                  <p className="text-caption text-fg-secondary italic leading-relaxed">
                    Dạy học không chỉ là truyền đạt kiến thức, mà còn là gieo mầm cho những ước mơ.
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-fg-muted block text-right">
                  — TutorHub
                </span>
              </div>

              <div className="relative rounded-brand-lg overflow-hidden pt-2 bg-surface flex items-end justify-center">
                <img
                  src="/images/transparent-student-clean.png"
                  alt="TutorHub Learning"
                  className="w-48 h-auto object-contain drop-shadow-md"
                />
                <span className="absolute top-2 left-2 px-2.5 py-1 rounded-pill bg-surface backdrop-blur-sm border border-border shadow-brand-sm">
                  <span className="text-[11px] font-bold text-brand-primary-700 tracking-wide">
                    Better Learning. Brighter Future.
                  </span>
                </span>
              </div>
            </Card>

            <Card padding="none" className="p-5 flex items-start gap-3.5 border-success/20 bg-success-subtle">
              <span className="w-10 h-10 rounded-full bg-success/15 text-success flex items-center justify-center shrink-0">
                <Icon name="shield" size="md" />
              </span>
              <div className="space-y-1">
                <h4 className="font-bold text-success-strong text-caption">Quy trình xét duyệt</h4>
                <p className="text-caption text-success-strong leading-relaxed">
                  Hồ sơ của bạn sẽ được đội ngũ TutorHub xem xét trong 1–3 ngày làm việc. Chúng tôi sẽ liên hệ qua email hoặc số điện thoại đã đăng ký.
                </p>
              </div>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
