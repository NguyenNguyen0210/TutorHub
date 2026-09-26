/**
 * applicationFormUtils — the ONE place that knows the rules of the 6-step tutor
 * application wizard: initial state, per-step validation, list toggling, upload
 * acceptance rules, and backend payload construction.
 *
 * Rule of the project: components render, this file decides.
 */

/* ── Wizard metadata (order & content are a product contract — do not reorder) ── */

export const STEPS = [
  { id: 1, title: 'Thông tin cá nhân', sub: 'Giới thiệu bản thân' },
  { id: 2, title: 'Học vấn & chứng chỉ', sub: 'Trình độ chuyên môn' },
  { id: 3, title: 'Kinh nghiệm giảng dạy', sub: 'Kinh nghiệm & thành tích' },
  { id: 4, title: 'Môn học & lớp dạy', sub: 'Chọn môn và hình thức dạy' },
  { id: 5, title: 'Giáo trình & phương pháp', sub: 'Cách bạn giảng dạy' },
  { id: 6, title: 'Xem lại & gửi hồ sơ', sub: 'Hoàn tất đăng ký' },
];

export const STEP_COUNT = STEPS.length;

export const POPULAR_SUBJECTS = [
  'Toán học',
  'Vật lý',
  'Hóa học',
  'Tiếng Anh',
  'Ngữ văn',
  'Sinh học',
  'Lập trình / Tin học',
  'IELTS / TOEFL',
];

export const GRADE_LEVELS = [
  'Tiểu học (Lớp 1-5)',
  'THCS (Lớp 6-9)',
  'THPT (Lớp 10-12)',
  'Luyện thi Đại học',
  'Sinh viên & Người đi làm',
];

export const TEACHING_MODE_OPTIONS = [
  { key: 'Online', label: 'Dạy trực tuyến', desc: 'Google Meet / Zoom' },
  { key: 'Offline', label: 'Dạy tại nhà', desc: 'Gặp trực tiếp học viên' },
  { key: 'Both', label: 'Cả hai hình thức', desc: 'Linh hoạt theo yêu cầu' },
];

export const GENDER_OPTIONS = ['Nam', 'Nữ', 'Khác'];

export const BIO_MAX = 500;

/* ── Upload rules ─────────────────────────────────────────────────────────── */

export const AVATAR_ACCEPT = 'image/png,image/jpeg';
export const AVATAR_MAX_BYTES = 5 * 1024 * 1024; // 5MB
export const DEGREE_ACCEPT = 'image/png,image/jpeg,image/webp,application/pdf';
export const DEGREE_MAX_BYTES = 10 * 1024 * 1024; // 10MB
export const DEGREE_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

/* ── Initial form state ───────────────────────────────────────────────────── */

/**
 * Build the initial `formData` object. Field names are part of the payload
 * contract — do not rename.
 */
export function createInitialFormData(user) {
  return {
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
    achievements:
      'Giúp 15+ học sinh nâng điểm từ 6 lên 8.5+ môn Toán trong kỳ thi vào 10 và THPT Quốc gia.',

    // Step 4: Subjects & Modes
    teachingMode: 'Both', // Online | Offline | Both
    offlineArea: 'Quận Cầu Giấy, Nam Từ Liêm, Đống Đa - Hà Nội',
    subjects: ['Toán học', 'Vật lý'],
    grades: ['THCS (Lớp 6-9)', 'THPT (Lớp 10-12)'],

    // Step 5: Methodology
    methodology:
      'Cá nhân hóa theo năng lực từng học sinh, kết hợp sơ đồ tư duy (Mindmap) và bài tập thực hành theo chuyên đề.',
    curriculum:
      'Bộ SGK Kết nối tri thức mới, kết hợp tài liệu nâng cao và ngân hàng đề thi chọn lọc.',
    commitments:
      'Cam kết nắm vững kiến thức căn bản sau 4 tuần học và tiến bộ rõ rệt sau 1 khóa.',

    // Step 6: Review & Agreement
    agreed: false,
  };
}

/**
 * Prefill a rejected application so the tutor can edit & resubmit.
 * Only the fields the backend sends back for a rejection are touched.
 */
export function mergeRejectedApplication(formData, app) {
  return {
    ...formData,
    bio: app.bio || formData.bio,
    address: app.address || formData.address,
    experienceYears: app.experienceYears ?? formData.experienceYears,
    teachingMode: app.teachingMode || formData.teachingMode,
  };
}

/* ── Generic list helper (subjects / grades / target students) ────────────── */

/** Toggle `value` inside `list`: remove when present, append when absent. */
export function toggleListValue(list, value) {
  const items = Array.isArray(list) ? list : [];
  return items.includes(value) ? items.filter((item) => item !== value) : [...items, value];
}

/* ── Per-step validation ──────────────────────────────────────────────────── */

const OFFLINE_MODES = ['Offline', 'Both'];

/**
 * Validate one wizard step. Returns the Vietnamese error message to toast, or
 * `null` when the step is valid. Messages and check order are a product
 * contract — keep them identical.
 */
export function validateApplicationStep(step, formData) {
  if (step === 1) {
    if (!formData.fullName.trim()) {
      return 'Vui lòng nhập họ và tên của bạn.';
    }
    if (!formData.phone.trim()) {
      return 'Vui lòng nhập số điện thoại liên hệ.';
    }
    if (!formData.email.trim()) {
      return 'Vui lòng nhập địa chỉ email.';
    }
    if (!formData.address.trim()) {
      return 'Vui lòng nhập địa chỉ hiện tại.';
    }
    if (!formData.bio || formData.bio.trim().length < 20) {
      return 'Vui lòng nhập phần giới thiệu bản thân tối thiểu 20 ký tự.';
    }
    return null;
  }

  if (step === 2) {
    if (!formData.university.trim() || !formData.major.trim()) {
      return 'Vui lòng nhập trường đào tạo và chuyên ngành.';
    }
    return null;
  }

  if (step === 3) {
    if (formData.experienceYears === '' || formData.experienceYears < 0) {
      return 'Vui lòng nhập số năm kinh nghiệm hợp lệ.';
    }
    return null;
  }

  if (step === 4) {
    if (formData.subjects.length === 0) {
      return 'Vui lòng chọn ít nhất một môn học bạn có thể dạy.';
    }
    if (OFFLINE_MODES.includes(formData.teachingMode) && !formData.offlineArea.trim()) {
      return 'Vui lòng nhập khu vực bạn có thể đến dạy trực tiếp.';
    }
    return null;
  }

  if (step === 5) {
    if (!formData.methodology.trim()) {
      return 'Vui lòng chia sẻ đôi nét về phương pháp giảng dạy.';
    }
    return null;
  }

  return null;
}

/** Step 4 shows the offline-area field only for these teaching modes. */
export function needsOfflineArea(teachingMode) {
  return OFFLINE_MODES.includes(teachingMode);
}

/* ── Upload acceptance rules ──────────────────────────────────────────────── */

/** Error message when an avatar file is rejected, or `null` when acceptable. */
export function avatarFileError(file) {
  if (!file.type.startsWith('image/')) {
    return 'Vui lòng chỉ chọn tệp hình ảnh (JPG, PNG).';
  }
  if (file.size > AVATAR_MAX_BYTES) {
    return 'Ảnh đại diện tải lên không được vượt quá 5MB.';
  }
  return null;
}

/** Error message when a degree/certificate file is rejected, or `null`. */
export function degreeFileError(file) {
  if (!DEGREE_ALLOWED_TYPES.includes(file.type) && !file.name.endsWith('.pdf')) {
    return `Tệp "${file.name}" không hợp lệ. Chỉ chấp nhận PDF, JPG, PNG.`;
  }
  if (file.size > DEGREE_MAX_BYTES) {
    return `Tệp "${file.name}" vượt quá kích thước tối đa 10MB.`;
  }
  return null;
}

/** Wrap an accepted File into the editor-local degreeFiles entry shape. */
export function makeDegreeFile(file) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: file.name,
    size: (file.size / (1024 * 1024)).toFixed(2), // MB
    type: file.type,
    file,
    previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
  };
}

/* ── Backend payload construction ─────────────────────────────────────────── */

/** "Cử nhân - Sư phạm Toán (ĐH…) | Chứng chỉ: …" + the attachment note. */
export function buildEducationSummary(formData) {
  const filesNote =
    formData.degreeFiles.length > 0
      ? ` [Đính kèm ${formData.degreeFiles.length} tệp minh chứng: ${formData.degreeFiles
          .map((f) => f.name)
          .join(', ')}]`
      : '';

  return `${formData.degreeLevel} - ${formData.major.trim()} (${formData.university.trim()})${
    formData.certifications ? ` | Chứng chỉ: ${formData.certifications.trim()}` : ''
  }${filesNote}`;
}

/** The single `bio` string the backend stores: intro + methodology + results. */
export function buildApplicationBio(formData) {
  return `${formData.bio.trim()}\n\n[Phương pháp giảng dạy]: ${formData.methodology.trim()}${
    formData.achievements ? `\n[Thành tích tiêu biểu]: ${formData.achievements.trim()}` : ''
  }`;
}

/**
 * Body for `tutorService.submitTutorApplication(payload)`.
 * Payload keys are a backend contract — do not rename or drop.
 */
export function buildApplicationPayload(formData) {
  return {
    bio: buildApplicationBio(formData),
    education: buildEducationSummary(formData),
    experienceYears: Number(formData.experienceYears) || 0,
    teachingMode: formData.teachingMode,
    address: formData.address.trim() || null,
  };
}
