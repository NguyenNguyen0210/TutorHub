import React, { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import tutorService from '@/services/tutor.service';
import { mediaService } from '@/services/media.service';
import { userService } from '@/services/user.service';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/components/ui/Toast';
import Icon from '@/components/ui/Icon';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Callout from '@/components/ui/Callout';
import ErrorState from '@/components/common/ErrorState';
import ApplicationStatusPage from '@/components/tutor/application/ApplicationStatusPage';
import { useTutorApplication, tutorApplicationKey } from '@/hooks/useTutorApplication';
import WorkspacePageHeader from '@/components/layout/WorkspacePageHeader';
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
  "TutorHub giữ học phí và trả theo từng buổi học",
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
  const queryClient = useQueryClient();
  const applicationQuery = useTutorApplication(user?.id || user?.userId, user?.role === 'Tutor');
  const existingApp = applicationQuery.data || null;
  const loadingApp = applicationQuery.isLoading;

  const [currentStep, setCurrentStep] = useState(1);
  const [editingRejected, setEditingRejected] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  // File upload drag states & refs
  const [isDraggingDegree, setIsDraggingDegree] = useState(false);
  const [isDraggingAvatar, setIsDraggingAvatar] = useState(false);
  const degreeInputRef = useRef(null);
  const avatarInputRef = useRef(null);
  const avatarUpload = useRef(null);

  // Form State
  const [formData, setFormData] = useState(() => createInitialFormData(user));
  useEffect(() => () => {
    if (formData.avatarPreview?.startsWith('blob:')) URL.revokeObjectURL(formData.avatarPreview);
  }, [formData.avatarPreview]);

  const hydratedApplication = useRef(null);
  useEffect(() => {
    if (existingApp?.status === 'Rejected' && hydratedApplication.current !== existingApp.id) {
      setFormData(previous => mergeRejectedApplication(previous, existingApp));
      hydratedApplication.current = existingApp.id;
    }
  }, [existingApp]);

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  /* ── Avatar file handling ─────────────────────────────────────────────── */

  const processAvatarFile = (file) => {
    if (!file || submittingRef.current) return;

    const rejected = avatarFileError(file);
    if (rejected) {
      toast.error(rejected);
      return;
    }

    setFormData(prev => ({ ...prev, avatarPreview: URL.createObjectURL(file), avatarFile: file }));
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
    if (!files || files.length === 0 || submittingRef.current) return;

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
      toast.success(`Đã chọn ${newFiles.length} tệp minh chứng bằng cấp.`);
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
    if (submittingRef.current) return;
    if (!formData.agreed) {
      toast.error('Bạn cần đánh dấu đồng ý cam kết điều khoản trước khi nộp hồ sơ.');
      return;
    }

    submittingRef.current = true;
    try {
      setSubmitting(true);
      for (let step = 1; step < STEP_COUNT; step++) {
        const error = validateApplicationStep(step, formData);
        if (error) { setCurrentStep(step); toast.error(error); return; }
      }
      let avatarUrl = formData.avatarUrl;
      if (formData.avatarFile) {
        if (avatarUpload.current?.file !== formData.avatarFile) {
          avatarUpload.current = { file: formData.avatarFile, url: await mediaService.uploadAvatar(formData.avatarFile) };
        }
        avatarUrl = avatarUpload.current.url;
      }
      const profile = await userService.updateMyProfile({
        fullName: formData.fullName.trim(), phone: formData.phone.trim(), avatarUrl: avatarUrl || null,
      });
      const auth = useAuthStore.getState();
      if (auth.user?.id === user?.id && auth.accessToken) {
        auth.login({ ...auth.user, ...profile, name: profile.fullName }, {
          accessToken: auth.accessToken, refreshToken: auth.refreshToken,
        }, auth.rememberMe);
      }
      setFormData(prev => ({ ...prev, avatarUrl: profile.avatarUrl || '', avatarFile: null, avatarPreview: null }));
      const documentIds = [];
      for (const document of formData.degreeFiles) {
        if (document.mediaId) {
          documentIds.push(document.mediaId);
        } else {
          const uploaded = await mediaService.uploadCertificate(document.file);
          if (!uploaded?.id) throw new Error('Không thể tải tài liệu lên. Vui lòng thử lại.');
          // Preserve successful uploads if the next file or submission fails.
          setFormData(prev => ({ ...prev, degreeFiles: prev.degreeFiles.map(item =>
            item.id === document.id ? { ...item, mediaId: uploaded.id } : item) }));
          documentIds.push(uploaded.id);
        }
      }
      const payload = buildApplicationPayload(formData, documentIds);
      const updated = existingApp?.status === 'Rejected'
        ? await tutorService.resubmitTutorApplication(payload)
        : await tutorService.submitTutorApplication(payload);

      toast.success('Nộp hồ sơ gia sư thành công! Ban quản trị sẽ xét duyệt trong 1–3 ngày làm việc.');
      queryClient.setQueryData(tutorApplicationKey(user?.id || user?.userId), updated);
      setEditingRejected(false);
    } catch {
      toast.error('Chưa thể gửi hồ sơ gia sư. Vui lòng kiểm tra thông tin và thử lại.');
    } finally {
      setSubmitting(false);
      submittingRef.current = false;
    }
  };

  /* ── 1. Loading state ─────────────────────────────────────────────────── */

  if (user?.role !== 'Tutor') return <ErrorState title="Hồ sơ giảng dạy dành cho tài khoản gia sư" message="Vui lòng sử dụng tài khoản gia sư để gửi và theo dõi hồ sơ xét duyệt." backPath="/" backLabel="Về trang khám phá" />;

  if (loadingApp) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-brand-primary-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-body-reg font-medium text-fg-muted">Đang tải thông tin hồ sơ gia sư...</p>
      </div>
    );
  }

  if (applicationQuery.isError && !existingApp) {
    return <ErrorState error={applicationQuery.error} title="Chưa tải được trạng thái hồ sơ" onRetry={applicationQuery.refetch} />;
  }
  if (existingApp && (existingApp.status !== 'Rejected' || !editingRejected)) {
    return <ApplicationStatusPage application={existingApp} onRefresh={applicationQuery.refetch} refreshing={applicationQuery.isFetching}
      onEdit={() => { setEditingRejected(true); setCurrentStep(1); window.scrollTo({ top: 0, behavior: 'instant' }); }} />;
  }

  /* ── 4. Default: 6-step wizard (stepper · step body · perks rail) ─────── */

  return (
    <div className="w-full">
      <div className="space-y-6 lg:space-y-8">
        {/* Top action */}
        <button
          type="button"
          onClick={() => editingRejected ? setEditingRejected(false) : navigate(-1)}
          className="inline-flex items-center gap-1.5 text-body-reg font-semibold text-brand-primary-700 hover:text-brand-primary-800 transition-colors mb-4 group cursor-pointer"
        >
          <Icon name="chevron_left" size="sm" className="transition-transform group-hover:-translate-x-0.5" />
          {editingRejected ? 'Về trạng thái hồ sơ' : 'Quay lại'}
        </button>

        {/* Page title & subtitle */}
        <WorkspacePageHeader title="Hồ sơ giảng dạy" description="Chia sẻ thông tin cá nhân, chuyên môn và phương pháp giảng dạy để TutorHub xét duyệt hồ sơ của bạn." />

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
          <section className="lg:col-span-6" aria-label="Thông tin hồ sơ gia sư">
            <Card as="fieldset" disabled={submitting} padding="none" className="p-6 sm:p-8 space-y-6">
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
          </section>

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
                  alt="TutorHub"
                  className="w-48 h-auto object-contain drop-shadow-md"
                />
                <span className="absolute top-2 left-2 px-2.5 py-1 rounded-pill bg-surface backdrop-blur-sm border border-border shadow-brand-sm">
                  <span className="text-[11px] font-bold text-brand-primary-700 tracking-wide">
                    Học tốt hơn. Tương lai rộng mở.
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
