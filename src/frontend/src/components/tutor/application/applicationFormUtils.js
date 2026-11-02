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
  { id: 4, title: 'Môn học & lớp dạy', sub: 'Chọn môn và khối lớp' },
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

export const GENDER_OPTIONS = ['Nam', 'Nữ', 'Khác'];

export const BIO_MAX = 500;

/* ── Upload rules ─────────────────────────────────────────────────────────── */

export const AVATAR_ACCEPT = 'image/png,image/jpeg';
export const AVATAR_MAX_BYTES = 5 * 1024 * 1024; // 5MB
export const DEGREE_ACCEPT = 'image/png,image/jpeg,image/webp,application/pdf';
export const DEGREE_MAX_BYTES = 5 * 1024 * 1024; // Matches the media API limit.
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
    dob: '',
    gender: 'Nam',
    phone: user?.phone || '',
    email: user?.email || '',
    avatarUrl: user?.avatarUrl || '',
    avatarPreview: null,
    bio: '',

    // Step 2: Education & Certs
    university: '',
    major: '',
    degreeLevel: 'Cử nhân',
    certifications: '',
    degreeFiles: [], // Array of { id, name, size, type, previewUrl }

    // Step 3: Experience
    experienceYears: 0,
    targetStudents: [],
    achievements: '',

    // Step 4: Subjects
    subjects: [],
    grades: [],

    // Step 5: Methodology
    methodology: '',
    curriculum: '',
    commitments: '',

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
    experienceYears: app.experienceYears ?? formData.experienceYears,
    university: app.university || '', major: app.major || '',
    degreeLevel: app.degreeLevel || 'Cử nhân', certifications: app.certifications || '',
    methodology: app.methodology || '', achievements: app.achievements || '',
    subjects: app.subject ? app.subject.split(', ') : [],
    grades: app.subjectSub ? app.subjectSub.split(', ') : [],
    degreeFiles: (() => {
      try { return JSON.parse(app.documentsJson || '[]').filter(d => d.mediaId).map(d => ({
        id: d.mediaId, mediaId: d.mediaId, name: d.title, type: d.format,
        size: ((d.sizeBytes || 0) / (1024 * 1024)).toFixed(2),
      })); } catch { return []; }
    })(),
  };
}

/* ── Generic list helper (subjects / grades / target students) ────────────── */

/** Toggle `value` inside `list`: remove when present, append when absent. */
export function toggleListValue(list, value) {
  const items = Array.isArray(list) ? list : [];
  return items.includes(value) ? items.filter((item) => item !== value) : [...items, value];
}

/* ── Per-step validation ──────────────────────────────────────────────────── */

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
    return `Tệp "${file.name}" vượt quá kích thước tối đa 5MB.`;
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

/** Display summary; certifications and uploaded documents are sent separately. */
export function buildEducationSummary(formData) {
  return `${formData.degreeLevel} - ${formData.major.trim()} (${formData.university.trim()})`;
}

/** Personal introduction; methodology and achievements have their own fields. */
export function buildApplicationBio(formData) {
  return formData.bio.trim();
}

/**
 * Body for `tutorService.submitTutorApplication(payload)`.
 * Payload keys are a backend contract — do not rename or drop.
 */
export function buildApplicationPayload(formData, documentIds = []) {
  return {
    bio: buildApplicationBio(formData),
    education: buildEducationSummary(formData),
    experienceYears: Number(formData.experienceYears) || 0,
    university: formData.university.trim(),
    major: formData.major.trim(),
    degreeLevel: formData.degreeLevel,
    certifications: formData.certifications.trim() || null,
    subject: formData.subjects.join(', '),
    subjectSub: formData.grades.join(', '),
    methodology: formData.methodology.trim(),
    achievements: formData.achievements.trim() || null,
    documentIds,
  };
}
