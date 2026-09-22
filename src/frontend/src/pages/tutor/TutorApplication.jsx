import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { cn } from '@/lib/cn';
import tutorService from '@/services/tutor.service';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/components/ui/Toast';
import Icon from '@/components/ui/Icon';
import Button from '@/components/ui/Button';

const STEPS = [
  { id: 1, title: 'Thông tin cá nhân', sub: 'Giới thiệu bản thân' },
  { id: 2, title: 'Học vấn & chứng chỉ', sub: 'Trình độ chuyên môn' },
  { id: 3, title: 'Kinh nghiệm giảng dạy', sub: 'Kinh nghiệm & thành tích' },
  { id: 4, title: 'Môn học & lớp dạy', sub: 'Chọn môn và hình thức dạy' },
  { id: 5, title: 'Giáo trình & phương pháp', sub: 'Cách bạn giảng dạy' },
  { id: 6, title: 'Xem lại & gửi hồ sơ', sub: 'Hoàn tất đăng ký' },
];

const POPULAR_SUBJECTS = [
  'Toán học',
  'Vật lý',
  'Hóa học',
  'Tiếng Anh',
  'Ngữ văn',
  'Sinh học',
  'Lập trình / Tin học',
  'IELTS / TOEFL',
];

const GRADE_LEVELS = [
  'Tiểu học (Lớp 1-5)',
  'THCS (Lớp 6-9)',
  'THPT (Lớp 10-12)',
  'Luyện thi Đại học',
  'Sinh viên & Người đi làm',
];

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
  const [formData, setFormData] = useState({
    // Step 1: Personal info
    fullName: user?.fullName || user?.name || '',
    dob: '2000-05-15',
    gender: 'Nam',
    phone: user?.phone || '0901234567',
    email: user?.email || '',
    address: 'Quận Cầu Giấy, Hà Nội',
    avatarUrl: user?.avatarUrl || '',
    avatarPreview: null,
    bio: '',

    // Step 2: Education & Certs
    university: 'Đại học Sư phạm Hà Nội',
    major: 'Sư phạm Toán',
    degreeLevel: 'Cử nhân',
    certifications: 'Chứng chỉ Nghiệp vụ Sư phạm Giỏi, Chứng nhận bồi dưỡng HSG',
    degreeFiles: [], // Array of { id, name, size, type, previewUrl }

    // Step 3: Experience
    experienceYears: 3,
    targetStudents: ['THCS (Lớp 6-9)', 'THPT (Lớp 10-12)'],
    achievements: 'Giúp 15+ học sinh nâng điểm từ 6 lên 8.5+ môn Toán trong kỳ thi vào 10 và THPT Quốc gia.',

    // Step 4: Subjects & Modes
    teachingMode: 'Both', // Online | Offline | Both
    offlineArea: 'Quận Cầu Giấy, Nam Từ Liêm, Đống Đa - Hà Nội',
    subjects: ['Toán học', 'Vật lý'],
    grades: ['THCS (Lớp 6-9)', 'THPT (Lớp 10-12)'],

    // Step 5: Methodology
    methodology: 'Cá nhân hóa theo năng lực từng học sinh, kết hợp sơ đồ tư duy (Mindmap) và bài tập thực hành theo chuyên đề.',
    curriculum: 'Bộ SGK Kết nối tri thức mới, kết hợp tài liệu nâng cao và ngân hàng đề thi chọn lọc.',
    commitments: 'Cam kết nắm vững kiến thức căn bản sau 4 tuần học và tiến bộ rõ rệt sau 1 khóa.',

    // Step 6: Review & Agreement
    agreed: false,
  });

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
            setFormData((prev) => ({
              ...prev,
              bio: app.bio || prev.bio,
              address: app.address || prev.address,
              experienceYears: app.experienceYears ?? prev.experienceYears,
              teachingMode: app.teachingMode || prev.teachingMode,
            }));
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

  // Avatar file handling
  const processAvatarFile = (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chỉ chọn tệp hình ảnh (JPG, PNG).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ảnh đại diện tải lên không được vượt quá 5MB.');
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

  // Degree / Certificate file handling
  const processDegreeFiles = (files) => {
    if (!files || files.length === 0) return;

    const newFiles = [];
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

    Array.from(files).forEach((file) => {
      if (!allowedTypes.includes(file.type) && !file.name.endsWith('.pdf')) {
        toast.error(`Tệp "${file.name}" không hợp lệ. Chỉ chấp nhận PDF, JPG, PNG.`);
        return;
      }

      if (file.size > maxFileSize) {
        toast.error(`Tệp "${file.name}" vượt quá kích thước tối đa 10MB.`);
        return;
      }

      const fileObj = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2), // MB
        type: file.type,
        file,
        previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      };

      newFiles.push(fileObj);
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

  const removeDegreeFile = (id) => {
    setFormData((prev) => ({
      ...prev,
      degreeFiles: prev.degreeFiles.filter((f) => f.id !== id),
    }));
  };

  const toggleSubject = (subj) => {
    setFormData((prev) => {
      const exists = prev.subjects.includes(subj);
      return {
        ...prev,
        subjects: exists ? prev.subjects.filter((s) => s !== subj) : [...prev.subjects, subj],
      };
    });
  };

  const toggleGrade = (grade) => {
    setFormData((prev) => {
      const exists = prev.grades.includes(grade);
      return {
        ...prev,
        grades: exists ? prev.grades.filter((g) => g !== grade) : [...prev.grades, grade],
      };
    });
  };

  const validateStep = (step) => {
    if (step === 1) {
      if (!formData.fullName.trim()) {
        toast.error('Vui lòng nhập họ và tên của bạn.');
        return false;
      }
      if (!formData.phone.trim()) {
        toast.error('Vui lòng nhập số điện thoại liên hệ.');
        return false;
      }
      if (!formData.email.trim()) {
        toast.error('Vui lòng nhập địa chỉ email.');
        return false;
      }
      if (!formData.address.trim()) {
        toast.error('Vui lòng nhập địa chỉ hiện tại.');
        return false;
      }
      if (!formData.bio || formData.bio.trim().length < 20) {
        toast.error('Vui lòng nhập phần giới thiệu bản thân tối thiểu 20 ký tự.');
        return false;
      }
      return true;
    }

    if (step === 2) {
      if (!formData.university.trim() || !formData.major.trim()) {
        toast.error('Vui lòng nhập trường đào tạo và chuyên ngành.');
        return false;
      }
      return true;
    }

    if (step === 3) {
      if (formData.experienceYears === '' || formData.experienceYears < 0) {
        toast.error('Vui lòng nhập số năm kinh nghiệm hợp lệ.');
        return false;
      }
      return true;
    }

    if (step === 4) {
      if (formData.subjects.length === 0) {
        toast.error('Vui lòng chọn ít nhất một môn học bạn có thể dạy.');
        return false;
      }
      if (
        (formData.teachingMode === 'Offline' || formData.teachingMode === 'Both') &&
        !formData.offlineArea.trim()
      ) {
        toast.error('Vui lòng nhập khu vực bạn có thể đến dạy trực tiếp.');
        return false;
      }
      return true;
    }

    if (step === 5) {
      if (!formData.methodology.trim()) {
        toast.error('Vui lòng chia sẻ đôi nét về phương pháp giảng dạy.');
        return false;
      }
      return true;
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 6));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
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

      const filesNote =
        formData.degreeFiles.length > 0
          ? ` [Đính kèm ${formData.degreeFiles.length} tệp minh chứng: ${formData.degreeFiles.map((f) => f.name).join(', ')}]`
          : '';

      const educationString = `${formData.degreeLevel} - ${formData.major.trim()} (${formData.university.trim()})${
        formData.certifications ? ` | Chứng chỉ: ${formData.certifications.trim()}` : ''
      }${filesNote}`;

      const fullBio = `${formData.bio.trim()}\n\n[Phương pháp giảng dạy]: ${formData.methodology.trim()}${
        formData.achievements ? `\n[Thành tích tiêu biểu]: ${formData.achievements.trim()}` : ''
      }`;

      const payload = {
        bio: fullBio,
        education: educationString,
        experienceYears: Number(formData.experienceYears) || 0,
        teachingMode: formData.teachingMode,
        address: formData.address.trim() || null,
      };

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

  // 1. Loading State
  if (loadingApp) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-500">Đang tải thông tin hồ sơ gia sư...</p>
      </div>
    );
  }

  // 2. Already Pending State
  if (existingApp && existingApp.status === 'Pending') {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl border border-blue-100 shadow-brand-md p-8 sm:p-10 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
            <Icon name="hourglass_top" size="xl" />
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              Đang chờ kiểm duyệt
            </span>
            <h1 className="text-2xl font-bold text-slate-900">Hồ sơ của bạn đang được xét duyệt</h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              Cảm ơn bạn đã gửi hồ sơ đăng ký trở thành gia sư tại TutorHub. Ban quản trị đang thẩm định văn bằng và thông tin giảng dạy của bạn.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 max-w-md mx-auto text-left text-xs space-y-2 text-slate-600">
            <div className="flex justify-between">
              <span className="text-slate-400">Thời gian gửi:</span>
              <span className="font-semibold text-slate-700">
                {new Date(existingApp.submittedAt || Date.now()).toLocaleDateString('vi-VN')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Hình thức dạy:</span>
              <span className="font-semibold text-slate-700">{existingApp.teachingMode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Thời gian dự kiến:</span>
              <span className="font-semibold text-emerald-600">1 – 3 ngày làm việc</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button as={Link} to="/tutors" variant="outline" size="md">
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
        </div>
      </div>
    );
  }

  // 3. Already Approved State
  if (existingApp && existingApp.status === 'Approved') {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl border border-emerald-100 shadow-brand-md p-8 sm:p-10 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <Icon name="verified" size="xl" />
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Icon name="check" size="xs" />
              Đã phê duyệt
            </span>
            <h1 className="text-2xl font-bold text-slate-900">Chúc mừng! Bạn đã là Gia sư TutorHub</h1>
            <p className="text-sm text-slate-600 leading-relaxed">
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
        </div>
      </div>
    );
  }

  // Default: Render 6-Step Registration Layout (Matching Reference Image)
  return (
    <div className="w-full bg-[#f8fafc] min-h-screen py-8">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Action & Breadcrumb */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#2563EB] hover:text-[#1D4ED8] transition-colors mb-4 group cursor-pointer"
        >
          <Icon name="chevron_left" size="sm" className="transition-transform group-hover:-translate-x-0.5" />
          Quay lại
        </button>

        {/* Page Title & Subtitle */}
        <div className="mb-8">
          <h1 className="text-[26px] sm:text-[32px] font-extrabold text-slate-900 tracking-tight">
            Đăng ký hồ sơ giảng dạy TutorHub
          </h1>
          <p className="text-[14px] sm:text-[15px] text-slate-500 mt-1.5 max-w-3xl leading-relaxed">
            Chia sẻ thông tin của bạn để trở thành gia sư trên TutorHub. Sau khi gửi hồ sơ, đội ngũ của chúng tôi sẽ xét duyệt và phản hồi trong 1–3 ngày làm việc.
          </p>
        </div>

        {/* Rejection Alert if Resubmitting */}
        {existingApp && existingApp.status === 'Rejected' && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3">
            <Icon name="error" size="md" className="text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-rose-900 text-sm block">Hồ sơ trước đó bị từ chối xét duyệt</span>
              <p className="text-xs text-rose-700 leading-relaxed">
                Lý do: {existingApp.rejectionReason || 'Vui lòng bổ sung đầy đủ văn bằng và cập nhật rõ thông tin kinh nghiệm giảng dạy.'}
              </p>
            </div>
          </div>
        )}

        {/* 3-Column Layout: Left Stepper (260px) · Middle Form (Flex-1) · Right Trust Cards (320px) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ========================================================
              LEFT COLUMN: 6-Step Vertical Stepper & Support Card
             ======================================================== */}
          <aside className="lg:col-span-3 space-y-6">
            <nav aria-label="Các bước đăng ký" className="relative pl-1">
              {/* Connecting line */}
              <div
                className="absolute left-[19px] top-4 bottom-8 w-[2px] bg-slate-200/80 -z-0"
                aria-hidden="true"
              />

              <ol className="space-y-3 relative z-10">
                {STEPS.map((s) => {
                  const isActive = currentStep === s.id;
                  const isDone = currentStep > s.id;

                  return (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => {
                          // Allow clicking completed steps or step 1
                          if (isDone || s.id === 1) setCurrentStep(s.id);
                        }}
                        className={cn(
                          'w-full flex items-center gap-3.5 p-2 rounded-xl text-left transition-all cursor-pointer',
                          isActive
                            ? 'bg-blue-50/80 border border-blue-100 shadow-2xs'
                            : 'hover:bg-slate-100/60'
                        )}
                      >
                        {/* Circle Indicator */}
                        <div
                          className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-all',
                            isActive
                              ? 'bg-[#2563EB] text-white shadow-sm ring-4 ring-blue-100'
                              : isDone
                              ? 'bg-[#2563EB] text-white'
                              : 'bg-white border-2 border-slate-200 text-slate-400'
                          )}
                        >
                          {isDone ? <Icon name="check" size="xs" /> : s.id}
                        </div>

                        {/* Step Title & Subtitle */}
                        <div className="min-w-0 flex-1">
                          <span
                            className={cn(
                              'block text-[13.5px] font-bold leading-snug truncate',
                              isActive
                                ? 'text-[#2563EB]'
                                : isDone
                                ? 'text-slate-800'
                                : 'text-slate-600'
                            )}
                          >
                            {s.title}
                          </span>
                          <span
                            className={cn(
                              'block text-[11.5px] truncate',
                              isActive ? 'text-blue-500 font-medium' : 'text-slate-400'
                            )}
                          >
                            {s.sub}
                          </span>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </nav>

            {/* Support Card: "Cần hỗ trợ?" */}
            <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100/80 flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-[#2563EB] flex items-center justify-center shrink-0">
                <Icon name="support_agent" size="md" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <span className="font-bold text-slate-800 text-[13.5px] block">Cần hỗ trợ?</span>
                <p className="text-[12px] text-slate-500">Liên hệ đội ngũ TutorHub</p>
                <a
                  href="mailto:support@tutorhub.vn"
                  className="text-[12px] font-medium text-[#2563EB] hover:underline block truncate"
                >
                  support@tutorhub.vn
                </a>
              </div>
            </div>
          </aside>

          {/* ========================================================
              MIDDLE COLUMN: Main Application Form Card
             ======================================================== */}
          <main className="lg:col-span-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
              {/* STEP 1: THÔNG TIN CÁ NHÂN */}
              {currentStep === 1 && (
                <div className="space-y-5">
                  <div className="border-b border-slate-100 pb-4">
                    <h2 className="text-[20px] font-bold text-slate-900">1. Thông tin cá nhân</h2>
                    <p className="text-[13.5px] text-slate-500 mt-1">
                      Hãy chia sẻ một số thông tin cơ bản để chúng tôi hiểu rõ hơn về bạn.
                    </p>
                  </div>

                  {/* Row 1: Họ và tên + Ngày sinh */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="tutor-name" className="block text-[13px] font-semibold text-slate-700">
                        Họ và tên <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                          <Icon name="person" size="md" />
                        </span>
                        <input
                          id="tutor-name"
                          type="text"
                          value={formData.fullName}
                          onChange={(e) => updateField('fullName', e.target.value)}
                          placeholder="Nguyễn Văn A"
                          className="w-full h-11 pl-10 pr-3 rounded-xl border border-slate-200 text-[14px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="tutor-dob" className="block text-[13px] font-semibold text-slate-700">
                        Ngày sinh <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                          <Icon name="calendar_month" size="md" />
                        </span>
                        <input
                          id="tutor-dob"
                          type="date"
                          value={formData.dob}
                          onChange={(e) => updateField('dob', e.target.value)}
                          className="w-full h-11 pl-10 pr-3 rounded-xl border border-slate-200 text-[14px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Giới tính + Số điện thoại */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-[13px] font-semibold text-slate-700">
                        Giới tính <span className="text-rose-500">*</span>
                      </label>
                      <div className="flex items-center gap-4 h-11">
                        {['Nam', 'Nữ', 'Khác'].map((g) => {
                          const isChecked = formData.gender === g;
                          return (
                            <button
                              key={g}
                              type="button"
                              onClick={() => updateField('gender', g)}
                              className="flex items-center gap-2 cursor-pointer group"
                            >
                              <span
                                className={cn(
                                  'w-4 h-4 rounded-full border flex items-center justify-center transition-all',
                                  isChecked
                                    ? 'border-[#2563EB] bg-[#2563EB]'
                                    : 'border-slate-300 bg-white group-hover:border-slate-400'
                                )}
                              >
                                {isChecked && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                              </span>
                              <span className="text-[13.5px] font-medium text-slate-700">{g}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="tutor-phone" className="block text-[13px] font-semibold text-slate-700">
                        Số điện thoại <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                          <Icon name="call" size="md" />
                        </span>
                        <input
                          id="tutor-phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => updateField('phone', e.target.value)}
                          placeholder="0901 234 567"
                          className="w-full h-11 pl-10 pr-3 rounded-xl border border-slate-200 text-[14px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Row 3: Email */}
                  <div className="space-y-1.5">
                    <label htmlFor="tutor-email" className="block text-[13px] font-semibold text-slate-700">
                      Email <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                        <Icon name="mail" size="md" />
                      </span>
                      <input
                        id="tutor-email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => updateField('email', e.target.value)}
                        placeholder="nguyenvana@example.com"
                        className="w-full h-11 pl-10 pr-3 rounded-xl border border-slate-200 text-[14px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  {/* Row 4: Địa chỉ hiện tại */}
                  <div className="space-y-1.5">
                    <label htmlFor="tutor-address" className="block text-[13px] font-semibold text-slate-700">
                      Địa chỉ hiện tại <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                        <Icon name="location_on" size="md" />
                      </span>
                      <input
                        id="tutor-address"
                        type="text"
                        value={formData.address}
                        onChange={(e) => updateField('address', e.target.value)}
                        placeholder="Quận Cầu Giấy, Hà Nội"
                        className="w-full h-11 pl-10 pr-3 rounded-xl border border-slate-200 text-[14px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  {/* Row 5: Ảnh đại diện */}
                  <div className="space-y-1.5">
                    <label className="block text-[13px] font-semibold text-slate-700">
                      Ảnh đại diện <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex items-center gap-5">
                      {/* Avatar preview circle */}
                      <div className="w-20 h-20 rounded-full border-2 border-slate-200 shadow-sm overflow-hidden shrink-0 bg-slate-100 flex items-center justify-center">
                        {formData.avatarPreview || formData.avatarUrl ? (
                          <img
                            src={formData.avatarPreview || formData.avatarUrl}
                            alt="Ảnh xem trước"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Icon name="person" size="xl" className="text-slate-400" />
                        )}
                      </div>

                      {/* Dropzone upload box with drag & drop */}
                      <div
                        onClick={() => avatarInputRef.current?.click()}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDraggingAvatar(true);
                        }}
                        onDragLeave={() => setIsDraggingAvatar(false)}
                        onDrop={handleAvatarDrop}
                        className={cn(
                          'flex-1 border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all text-center group',
                          isDraggingAvatar
                            ? 'border-[#2563EB] bg-blue-100/50 ring-2 ring-blue-200 scale-[1.01]'
                            : 'border-blue-200 bg-blue-50/20 hover:bg-blue-50/40'
                        )}
                      >
                        <Icon
                          name="file_upload"
                          size="md"
                          className="text-[#2563EB] mb-1 group-hover:scale-110 transition-transform"
                        />
                        <span className="text-[13px] font-semibold text-[#2563EB]">Tải ảnh lên</span>
                        <span className="text-[11.5px] text-slate-400 mt-0.5">JPG, PNG (tối đa 5MB)</span>
                        <input
                          ref={avatarInputRef}
                          type="file"
                          accept="image/png,image/jpeg"
                          onChange={handleAvatarChange}
                          className="hidden"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Row 6: Giới thiệu bản thân */}
                  <div className="space-y-1.5">
                    <label htmlFor="tutor-bio" className="block text-[13px] font-semibold text-slate-700">
                      Giới thiệu bản thân <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      id="tutor-bio"
                      rows={4}
                      maxLength={500}
                      value={formData.bio}
                      onChange={(e) => updateField('bio', e.target.value)}
                      placeholder="Hãy giới thiệu ngắn gọn về bản thân, thế mạnh, phong cách giảng dạy và lý do bạn muốn trở thành gia sư trên TutorHub..."
                      className="w-full p-3 rounded-xl border border-slate-200 text-[14px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all resize-none leading-relaxed"
                    />
                    <div className="flex justify-between items-center text-[11.5px] text-slate-400">
                      <span>Tối thiểu 20 ký tự</span>
                      <span>{formData.bio.length}/500</span>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: HỌC VẤN & CHỨNG CHỈ */}
              {currentStep === 2 && (
                <div className="space-y-5">
                  <div className="border-b border-slate-100 pb-4">
                    <h2 className="text-[20px] font-bold text-slate-900">2. Học vấn & chứng chỉ</h2>
                    <p className="text-[13.5px] text-slate-500 mt-1">
                      Cung cấp thông tin bằng cấp và chứng chỉ chuyên môn để xác minh hồ sơ.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="tutor-uni" className="block text-[13px] font-semibold text-slate-700">
                        Trường Đại học / Học viện <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="tutor-uni"
                        type="text"
                        value={formData.university}
                        onChange={(e) => updateField('university', e.target.value)}
                        placeholder="ĐH Sư phạm Hà Nội, ĐH Ngoại thương..."
                        className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-[14px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB] transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="tutor-major" className="block text-[13px] font-semibold text-slate-700">
                        Chuyên ngành đào tạo <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="tutor-major"
                        type="text"
                        value={formData.major}
                        onChange={(e) => updateField('major', e.target.value)}
                        placeholder="Sư phạm Toán, Ngôn ngữ Anh..."
                        className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-[14px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB] transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="tutor-degree" className="block text-[13px] font-semibold text-slate-700">
                      Học vị cao nhất <span className="text-rose-500">*</span>
                    </label>
                    <select
                      id="tutor-degree"
                      value={formData.degreeLevel}
                      onChange={(e) => updateField('degreeLevel', e.target.value)}
                      className="w-full h-11 px-3 rounded-xl border border-slate-200 text-[14px] text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB] transition-all cursor-pointer"
                    >
                      <option value="Cử nhân">Cử nhân (Đã tốt nghiệp Đại học)</option>
                      <option value="Thạc sĩ">Thạc sĩ</option>
                      <option value="Tiến sĩ">Tiến sĩ</option>
                      <option value="Sinh viên năm 3-4">Sinh viên năm 3 hoặc năm cuối</option>
                      <option value="Giảng viên Đại học">Giảng viên Đại học / Cao đẳng</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="tutor-certs" className="block text-[13px] font-semibold text-slate-700">
                      Chứng chỉ chuyên môn bổ trợ
                    </label>
                    <input
                      id="tutor-certs"
                      type="text"
                      value={formData.certifications}
                      onChange={(e) => updateField('certifications', e.target.value)}
                      placeholder="Ví dụ: IELTS 8.0, TOEIC 950, Chứng chỉ Nghiệp vụ Sư phạm..."
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-[14px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB] transition-all"
                    />
                  </div>

                  {/* Upload Degree Image Proof with Click + Drag-and-Drop */}
                  <div className="space-y-2">
                    <label className="block text-[13px] font-semibold text-slate-700">
                      Tải lên ảnh bằng cấp / thẻ sinh viên minh chứng
                    </label>

                    <div
                      onClick={() => degreeInputRef.current?.click()}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDraggingDegree(true);
                      }}
                      onDragEnter={(e) => {
                        e.preventDefault();
                        setIsDraggingDegree(true);
                      }}
                      onDragLeave={() => setIsDraggingDegree(false)}
                      onDrop={handleDegreeDrop}
                      className={cn(
                        'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all group',
                        isDraggingDegree
                          ? 'border-[#2563EB] bg-blue-50/80 ring-4 ring-blue-100 scale-[1.01]'
                          : 'border-slate-300 hover:border-blue-400 bg-slate-50/60 hover:bg-blue-50/30'
                      )}
                    >
                      <Icon
                        name="cloud_upload"
                        size="xl"
                        className={cn(
                          'mx-auto mb-2 transition-transform group-hover:scale-110',
                          isDraggingDegree ? 'text-[#2563EB]' : 'text-slate-400'
                        )}
                      />
                      <span className="text-[13.5px] font-bold text-[#2563EB] block">
                        Chọn tệp văn bằng hoặc kéo thả vào đây
                      </span>
                      <span className="text-[12px] text-slate-400 mt-1 block">
                        Hỗ trợ PDF, JPG, PNG tối đa 10MB mỗi tệp
                      </span>

                      {/* Hidden multi-file input */}
                      <input
                        ref={degreeInputRef}
                        type="file"
                        multiple
                        accept="image/png,image/jpeg,image/webp,application/pdf"
                        onChange={handleDegreeInputChange}
                        className="hidden"
                      />
                    </div>

                    {/* Uploaded Files Preview List */}
                    {formData.degreeFiles && formData.degreeFiles.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <span className="text-[12px] font-semibold text-slate-600 block">
                          Tệp đã đính kèm ({formData.degreeFiles.length}):
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {formData.degreeFiles.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 bg-white shadow-2xs group hover:border-slate-300 transition-colors"
                            >
                              {/* Preview thumbnail or PDF icon */}
                              {item.previewUrl ? (
                                <img
                                  src={item.previewUrl}
                                  alt={item.name}
                                  className="w-10 h-10 rounded-lg object-cover border border-slate-100 shrink-0"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 font-bold text-xs border border-rose-100">
                                  PDF
                                </div>
                              )}

                              {/* File info */}
                              <div className="min-w-0 flex-1">
                                <span className="text-[12.5px] font-semibold text-slate-800 truncate block">
                                  {item.name}
                                </span>
                                <span className="text-[11px] text-slate-400 block">{item.size} MB</span>
                              </div>

                              {/* Remove button */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeDegreeFile(item.id);
                                }}
                                className="w-7 h-7 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                                title="Xóa tệp"
                              >
                                <Icon name="close" size="sm" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 3: KINH NGHIỆM GIẢNG DẠY */}
              {currentStep === 3 && (
                <div className="space-y-5">
                  <div className="border-b border-slate-100 pb-4">
                    <h2 className="text-[20px] font-bold text-slate-900">3. Kinh nghiệm giảng dạy</h2>
                    <p className="text-[13.5px] text-slate-500 mt-1">
                      Chia sẻ về thâm niên, đối tượng học sinh và những thành tựu bạn đã đạt được.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="tutor-exp" className="block text-[13px] font-semibold text-slate-700">
                      Số năm kinh nghiệm giảng dạy / gia sư <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        id="tutor-exp"
                        type="number"
                        min="0"
                        max="40"
                        value={formData.experienceYears}
                        onChange={(e) => updateField('experienceYears', e.target.value)}
                        className="w-32 h-11 px-3.5 rounded-xl border border-slate-200 text-[14px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB] transition-all"
                      />
                      <span className="text-[13.5px] text-slate-600 font-medium">năm kinh nghiệm</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[13px] font-semibold text-slate-700">
                      Đối tượng học viên bạn từng kèm cặp nhiều nhất
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {GRADE_LEVELS.map((g) => {
                        const checked = formData.targetStudents.includes(g);
                        return (
                          <button
                            key={g}
                            type="button"
                            onClick={() => {
                              const exists = formData.targetStudents.includes(g);
                              updateField(
                                'targetStudents',
                                exists
                                  ? formData.targetStudents.filter((x) => x !== g)
                                  : [...formData.targetStudents, g]
                              );
                            }}
                            className={cn(
                              'p-3 rounded-xl border text-left text-[13px] font-medium transition-all flex items-center justify-between cursor-pointer',
                              checked
                                ? 'border-[#2563EB] bg-blue-50/60 text-[#2563EB] font-semibold'
                                : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                            )}
                          >
                            <span>{g}</span>
                            {checked && <Icon name="check" size="xs" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="tutor-achievements" className="block text-[13px] font-semibold text-slate-700">
                      Thành tích tiêu biểu của học sinh hoặc giải thưởng chuyên môn
                    </label>
                    <textarea
                      id="tutor-achievements"
                      rows={3}
                      value={formData.achievements}
                      onChange={(e) => updateField('achievements', e.target.value)}
                      placeholder="Ví dụ: Giúp học sinh đậu trường chuyên, điểm thi tăng từ 5 lên 8.5+, đạt giải HSG cấp thành phố..."
                      className="w-full p-3 rounded-xl border border-slate-200 text-[14px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB] transition-all resize-none"
                    />
                  </div>
                </div>
              )}

              {/* STEP 4: MÔN HỌC & LỚP DẠY */}
              {currentStep === 4 && (
                <div className="space-y-5">
                  <div className="border-b border-slate-100 pb-4">
                    <h2 className="text-[20px] font-bold text-slate-900">4. Môn học & lớp dạy</h2>
                    <p className="text-[13.5px] text-slate-500 mt-1">
                      Chọn hình thức bạn có thể đáp ứng và môn học sở trường.
                    </p>
                  </div>

                  {/* Teaching mode selection cards */}
                  <div className="space-y-2">
                    <label className="block text-[13px] font-semibold text-slate-700">
                      Hình thức giảng dạy <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { key: 'Online', label: 'Dạy trực tuyến', desc: 'Google Meet / Zoom' },
                        { key: 'Offline', label: 'Dạy tại nhà', desc: 'Gặp trực tiếp học viên' },
                        { key: 'Both', label: 'Cả hai hình thức', desc: 'Linh hoạt theo yêu cầu' },
                      ].map((m) => {
                        const selected = formData.teachingMode === m.key;
                        return (
                          <button
                            key={m.key}
                            type="button"
                            onClick={() => updateField('teachingMode', m.key)}
                            className={cn(
                              'p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer',
                              selected
                                ? 'border-[#2563EB] bg-blue-50/50 shadow-2xs'
                                : 'border-slate-200 hover:bg-slate-50'
                            )}
                          >
                            <span className="font-bold text-[13.5px] text-slate-900 block">{m.label}</span>
                            <span className="text-[11.5px] text-slate-500 mt-0.5 block">{m.desc}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Offline area if relevant */}
                  {(formData.teachingMode === 'Offline' || formData.teachingMode === 'Both') && (
                    <div className="space-y-1.5">
                      <label htmlFor="tutor-area" className="block text-[13px] font-semibold text-slate-700">
                        Khu vực nhận dạy trực tiếp (Quận/Huyện) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="tutor-area"
                        type="text"
                        value={formData.offlineArea}
                        onChange={(e) => updateField('offlineArea', e.target.value)}
                        placeholder="Ví dụ: Quận Cầu Giấy, Nam Từ Liêm, Hà Nội"
                        className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-[14px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB] transition-all"
                      />
                    </div>
                  )}

                  {/* Subjects pills */}
                  <div className="space-y-2">
                    <label className="block text-[13px] font-semibold text-slate-700">
                      Môn học thế mạnh <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {POPULAR_SUBJECTS.map((s) => {
                        const active = formData.subjects.includes(s);
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => toggleSubject(s)}
                            className={cn(
                              'px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all border cursor-pointer',
                              active
                                ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-2xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                            )}
                          >
                            {s}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Grades selection */}
                  <div className="space-y-2">
                    <label className="block text-[13px] font-semibold text-slate-700">
                      Khối lớp sẵn sàng nhận dạy
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {GRADE_LEVELS.map((g) => {
                        const active = formData.grades.includes(g);
                        return (
                          <button
                            key={g}
                            type="button"
                            onClick={() => toggleGrade(g)}
                            className={cn(
                              'p-2.5 rounded-xl border text-left text-[12.5px] transition-all flex items-center justify-between cursor-pointer',
                              active
                                ? 'border-[#2563EB] bg-blue-50/50 text-[#2563EB] font-semibold'
                                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                            )}
                          >
                            <span>{g}</span>
                            {active && <Icon name="check" size="xs" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 5: GIÁO TRÌNH & PHƯƠNG PHÁP */}
              {currentStep === 5 && (
                <div className="space-y-5">
                  <div className="border-b border-slate-100 pb-4">
                    <h2 className="text-[20px] font-bold text-slate-900">5. Giáo trình & phương pháp</h2>
                    <p className="text-[13.5px] text-slate-500 mt-1">
                      Phong cách giảng dạy đặc trưng giúp phụ huynh và học sinh tin tưởng lựa chọn bạn.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="tutor-method" className="block text-[13px] font-semibold text-slate-700">
                      Phương pháp giảng dạy chủ đạo <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      id="tutor-method"
                      rows={3}
                      value={formData.methodology}
                      onChange={(e) => updateField('methodology', e.target.value)}
                      placeholder="Ví dụ: Cá nhân hóa lộ trình, học qua ví dụ thực tế, luyện phản xạ và chữa lỗi chi tiết..."
                      className="w-full p-3 rounded-xl border border-slate-200 text-[14px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB] transition-all resize-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="tutor-curriculum" className="block text-[13px] font-semibold text-slate-700">
                      Giáo trình & Tài liệu học tập sử dụng
                    </label>
                    <input
                      id="tutor-curriculum"
                      type="text"
                      value={formData.curriculum}
                      onChange={(e) => updateField('curriculum', e.target.value)}
                      placeholder="Bộ SGK mới, Cambridge, Oxford, bộ đề tự soạn..."
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-[14px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB] transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="tutor-commitment" className="block text-[13px] font-semibold text-slate-700">
                      Cam kết chất lượng đầu ra cho học viên
                    </label>
                    <textarea
                      id="tutor-commitment"
                      rows={2}
                      value={formData.commitments}
                      onChange={(e) => updateField('commitments', e.target.value)}
                      placeholder="Ví dụ: Cam kết tiến bộ sau 1 tháng, hỗ trợ giải đáp thắc mắc bài tập ngoài giờ qua tin nhắn..."
                      className="w-full p-3 rounded-xl border border-slate-200 text-[14px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB] transition-all resize-none"
                    />
                  </div>
                </div>
              )}

              {/* STEP 6: XEM LẠI & GỬI HỒ SƠ */}
              {currentStep === 6 && (
                <div className="space-y-5">
                  <div className="border-b border-slate-100 pb-4">
                    <h2 className="text-[20px] font-bold text-slate-900">6. Xem lại & gửi hồ sơ</h2>
                    <p className="text-[13.5px] text-slate-500 mt-1">
                      Vui lòng kiểm tra lại toàn bộ thông tin đăng ký trước khi gửi đến ban kiểm duyệt.
                    </p>
                  </div>

                  {/* Summary Details */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 divide-y divide-slate-200 text-[13px] space-y-2.5">
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Họ và tên:</span>
                      <span className="font-semibold text-slate-800">{formData.fullName}</span>
                    </div>
                    <div className="flex justify-between pt-2">
                      <span className="text-slate-500">Số điện thoại / Email:</span>
                      <span className="font-semibold text-slate-800">
                        {formData.phone} • {formData.email}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2">
                      <span className="text-slate-500">Trường đào tạo & Học vị:</span>
                      <span className="font-semibold text-slate-800 text-right">
                        {formData.degreeLevel} - {formData.major} ({formData.university})
                      </span>
                    </div>
                    {formData.degreeFiles.length > 0 && (
                      <div className="flex justify-between pt-2">
                        <span className="text-slate-500">Tệp minh chứng:</span>
                        <span className="font-semibold text-emerald-600 text-right">
                          {formData.degreeFiles.length} tệp đã đính kèm
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2">
                      <span className="text-slate-500">Kinh nghiệm:</span>
                      <span className="font-semibold text-slate-800">{formData.experienceYears} năm</span>
                    </div>
                    <div className="flex justify-between pt-2">
                      <span className="text-slate-500">Hình thức giảng dạy:</span>
                      <span className="font-semibold text-slate-800">{formData.teachingMode}</span>
                    </div>
                    <div className="flex justify-between pt-2">
                      <span className="text-slate-500">Môn học nhận dạy:</span>
                      <span className="font-semibold text-[#2563EB] text-right">
                        {formData.subjects.join(', ')}
                      </span>
                    </div>
                  </div>

                  {/* Escrow Agreement Callout */}
                  <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200/80 space-y-3">
                    <div className="flex items-start gap-3">
                      <input
                        id="tutor-agreed"
                        type="checkbox"
                        checked={formData.agreed}
                        onChange={(e) => updateField('agreed', e.target.checked)}
                        className="mt-1 w-4 h-4 rounded border-slate-300 text-[#2563EB] accent-[#2563EB] focus:ring-[#2563EB] cursor-pointer shrink-0"
                      />
                      <label htmlFor="tutor-agreed" className="text-[12.5px] text-slate-700 leading-relaxed cursor-pointer">
                        Tôi cam kết mọi thông tin cung cấp về bằng cấp, kinh nghiệm và chứng chỉ là hoàn toàn chính xác. Tôi đồng ý tuân thủ quy chế giải ngân học phí bảo chứng Escrow của TutorHub và chịu hoàn toàn trách nhiệm trước quy định của pháp luật.
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Form Navigation Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="inline-flex items-center gap-2 px-5 h-11 rounded-xl border border-slate-300 text-[14px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <Icon name="arrow_back" size="sm" />
                    Quay lại
                  </button>
                ) : (
                  <div />
                )}

                {currentStep < 6 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="inline-flex items-center gap-2 px-6 h-11 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[14px] font-semibold shadow-sm transition-all cursor-pointer"
                  >
                    Tiếp tục
                    <Icon name="arrow_forward" size="sm" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting || !formData.agreed}
                    className="inline-flex items-center gap-2 px-7 h-11 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 disabled:cursor-not-allowed text-white text-[14px] font-semibold shadow-sm transition-all cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Đang gửi hồ sơ...
                      </>
                    ) : (
                      <>
                        Nộp hồ sơ xét duyệt
                        <Icon name="send" size="sm" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </main>

          {/* ========================================================
              RIGHT COLUMN: Perks Sidebar & Review Process
             ======================================================== */}
          <aside className="lg:col-span-3 space-y-5">
            {/* Card 1: Trở thành gia sư cùng TutorHub */}
            <div className="rounded-2xl border border-blue-100 bg-gradient-to-b from-blue-50/70 via-blue-50/30 to-slate-50/50 p-6 space-y-5 shadow-2xs">
              {/* Header Badge */}
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-blue-100 text-[#2563EB] flex items-center justify-center shrink-0">
                  <Icon name="school" size="lg" />
                </div>
                <div>
                  <h3 className="font-extrabold text-[15.5px] text-slate-900 leading-tight">
                    Trở thành gia sư cùng TutorHub
                  </h3>
                  <span className="text-[11.5px] text-slate-500 block mt-0.5">
                    Chia sẻ tri thức – Truyền cảm hứng – Tạo ra giá trị
                  </span>
                </div>
              </div>

              {/* 5 Perks Checklist */}
              <ul className="space-y-3 pt-1">
                {[
                  'Tiếp cận hàng ngàn học viên tiềm năng',
                  'Linh hoạt thời gian giảng dạy',
                  'Được hỗ trợ marketing và công cụ dạy học',
                  'Thanh toán an toàn qua hệ thống Escrow',
                  'Đồng hành cùng đội ngũ chuyên nghiệp',
                ].map((perk, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-[12.5px] text-slate-700 font-medium">
                    <span className="text-[#2563EB] shrink-0 mt-0.5">
                      <Icon name="check_circle" size="sm" filled />
                    </span>
                    <span className="leading-snug">{perk}</span>
                  </li>
                ))}
              </ul>

              {/* Inspiring Quote */}
              <div className="p-4 rounded-xl bg-white/90 border border-blue-100 shadow-2xs space-y-1.5">
                <div className="flex items-start gap-2">
                  <span className="text-[24px] font-serif text-[#2563EB] leading-none select-none">“</span>
                  <p className="text-[12px] text-slate-600 italic leading-relaxed">
                    Dạy học không chỉ là truyền đạt kiến thức, mà còn là gieo mầm cho những ước mơ.
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-slate-400 block text-right">
                  — TutorHub
                </span>
              </div>

              {/* Illustration graphic */}
              <div className="relative rounded-2xl overflow-hidden pt-2 bg-gradient-to-t from-blue-100/60 to-transparent flex items-end justify-center">
                <img
                  src="/images/transparent-student-clean.png"
                  alt="TutorHub Learning"
                  className="w-48 h-auto object-contain drop-shadow-md"
                />
                <div className="absolute top-2 left-2 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-xs border border-blue-100 shadow-2xs">
                  <span className="text-[10.5px] font-bold text-[#2563EB] tracking-wide">
                    Better Learning. Brighter Future.
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: Quy trình xét duyệt (Mint/Emerald card) */}
            <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/70 p-5 flex items-start gap-3.5 shadow-2xs">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <Icon name="shield" size="md" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-emerald-950 text-[13.5px]">Quy trình xét duyệt</h4>
                <p className="text-[12px] text-emerald-800/90 leading-relaxed">
                  Hồ sơ của bạn sẽ được đội ngũ TutorHub xem xét trong 1–3 ngày làm việc. Chúng tôi sẽ liên hệ qua email hoặc số điện thoại đã đăng ký.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
