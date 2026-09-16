/**
 * Tutor Service — Khám phá gia sư, danh mục, gói học và lịch rảnh.
 *
 * Contract: mọi method bóc tách `ApiResponse<T>.data` đã xảy ra ở tầng `api.js`,
 * nên ở đây `res` CHÍNH LÀ payload (PagedResult<T> / TutorProfileDto / ...).
 * Dữ liệu trả về được chuẩn hoá về đúng field name của backend DTO để component
 * chỉ đọc field thật (`ratingAvg`, `totalReviews`, `subjects: string[]`, `days`, ...).
 *
 * Mock: chỉ dùng khi VITE_USE_MOCK === 'true'. Ngoài mock mode, lỗi được ném lại
 * (ApiError) để UI hiển thị lỗi thật thay vì âm thầm hiển thị dữ liệu giả.
 */
import { api } from './api';
import { USE_MOCK } from '@/config/constants';
import { getDayOfWeekLabel } from '@/config/enums';
import { MOCK_CATEGORIES, MOCK_SUBJECTS, MOCK_TUTORS } from '@/config/mockData';

/** Giá trị `sortBy` mà GetTutorsQueryHandler thực sự hiểu (xem GetTutorsQueryHandler.cs). */
const SORT_BY_WHITELIST = ['price_asc', 'price_desc', 'reviews'];

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/** `decimal?` / `int?` của backend có thể null — giữ null thay vì biến thành 0. */
function toNullableNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/** TutorSummaryDto.Subjects là List<string>; mockData dùng [{ id, name }]. */
function normalizeSubjectNames(subjects) {
  if (!Array.isArray(subjects)) return [];
  return subjects
    .map((subject) => {
      if (typeof subject === 'string') return subject;
      return subject?.subjectName ?? subject?.name ?? null;
    })
    .filter(Boolean);
}

function normalizeTimeRange(range) {
  return {
    startTime: range?.startTime ?? null,
    endTime: range?.endTime ?? null,
  };
}

/**
 * TutorSummaryDto → view model.
 * `minPrice` / `isVerified` đang được bổ sung ở backend: đọc defensive để payload
 * cũ (chưa có field) không làm vỡ UI (`undefined.toFixed` / formatCurrency(undefined)).
 */
export function normalizeTutorSummary(raw = {}) {
  return {
    id: raw.id,
    userId: raw.userId ?? null,
    fullName: raw.fullName || '',
    avatarUrl: raw.avatarUrl || null,
    bio: raw.bio || '',
    education: raw.education || '',
    experienceYears: toNumber(raw.experienceYears, 0),
    teachingMode: raw.teachingMode || null,
    address: raw.address || null,
    ratingAvg: toNumber(raw.ratingAvg ?? raw.rating, 0),
    totalReviews: toNumber(raw.totalReviews, 0),
    subjects: normalizeSubjectNames(raw.subjects),
    minPrice: toNullableNumber(raw.minPrice),
    isVerified: Boolean(raw.isVerified),
  };
}

/** ServiceSummaryDto [+ mock shape có trialLessonUrl] → view model. */
export function normalizeServiceSummary(raw = {}) {
  return {
    id: raw.id,
    title: raw.title || '',
    subjectName: raw.subjectName || '',
    totalSessions: toNumber(raw.totalSessions, 0),
    sessionDurationMinutes: toNumber(raw.sessionDurationMinutes, 0),
    price: toNullableNumber(raw.price),
    teachingMode: raw.teachingMode || null,
    hasTrialLesson: raw.hasTrialLesson ?? Boolean(raw.trialLessonUrl),
  };
}

/** TutorProfileDto → view model (Subjects là object, Services nhúng sẵn). */
export function normalizeTutorProfile(raw = {}) {
  return {
    ...normalizeTutorSummary(raw),
    latitude: toNullableNumber(raw.latitude),
    longitude: toNullableNumber(raw.longitude),
    subjects: Array.isArray(raw.subjects)
      ? raw.subjects.map((subject) => ({
          id: subject?.id ?? null,
          subjectId: subject?.subjectId ?? null,
          subjectName: subject?.subjectName ?? subject?.name ?? '',
        }))
      : [],
    services: Array.isArray(raw.services) ? raw.services.map(normalizeServiceSummary) : [],
  };
}

/** TutorPublicReviewDto + mock shape (date/studentAvatar) → view model. */
export function normalizeTutorReview(raw = {}) {
  return {
    id: raw.id,
    studentName: raw.studentName || '',
    studentAvatarUrl: raw.studentAvatarUrl ?? raw.studentAvatar ?? null,
    rating: toNumber(raw.rating, 0),
    comment: raw.comment || '',
    tutorReply: raw.tutorReply || null,
    createdAt: raw.createdAt ?? raw.date ?? null,
  };
}

/** DailyAvailabilityDto → view model (backend trả `days`, KHÔNG phải `slots`). */
export function normalizeAvailabilityDay(raw = {}) {
  return {
    date: raw.date ?? null,
    dayOfWeek: raw.dayOfWeek ?? null,
    dayOfWeekName: raw.dayOfWeekName ?? raw.dayOfWeek ?? null,
    hasAvailableSlots: Boolean(raw.hasAvailableSlots),
    availableSlots: Array.isArray(raw.availableSlots)
      ? raw.availableSlots.map(normalizeTimeRange)
      : [],
    bookedSlots: Array.isArray(raw.bookedSlots) ? raw.bookedSlots.map(normalizeTimeRange) : [],
  };
}

function normalizePaged(raw, normalizeItem) {
  const source = Array.isArray(raw?.items) ? raw.items : [];
  const items = source.map(normalizeItem);
  return {
    items,
    totalCount: toNumber(raw?.totalCount, items.length),
    pageNumber: toNumber(raw?.pageNumber, 1),
    pageSize: toNumber(raw?.pageSize, items.length),
    totalPages: toNumber(raw?.totalPages, items.length > 0 ? 1 : 0),
    hasPreviousPage: Boolean(raw?.hasPreviousPage),
    hasNextPage: Boolean(raw?.hasNextPage),
  };
}

export const tutorService = {
  /** GET /categories → PublicCategoryDto[] */
  async getCategories() {
    try {
      const res = await api.get('/categories');
      if (Array.isArray(res)) return res;
      if (Array.isArray(res?.items)) return res.items;
      return [];
    } catch (err) {
      if (!USE_MOCK) throw err;
      console.warn('[tutorService] /categories lỗi, dùng mock (VITE_USE_MOCK=true).', err.message);
      return MOCK_CATEGORIES;
    }
  },

  /** GET /subjects → PagedResult<PublicSubjectDto> (đọc `items`) */
  async getSubjects(categoryId = null, search = '') {
    try {
      const params = {};
      if (categoryId) params.categoryId = categoryId;
      if (search) params.search = search;
      const res = await api.get('/subjects', { params });
      if (Array.isArray(res?.items)) return res.items;
      if (Array.isArray(res)) return res;
      return [];
    } catch (err) {
      if (!USE_MOCK) throw err;
      console.warn('[tutorService] /subjects lỗi, dùng mock (VITE_USE_MOCK=true).', err.message);
      return filterMockSubjects(categoryId, search);
    }
  },

  /**
   * GET /tutors → PagedResult<TutorSummaryDto>
   * @returns {Promise<{items: object[], totalCount: number, pageNumber: number, pageSize: number, totalPages: number, hasPreviousPage: boolean, hasNextPage: boolean}>}
   */
  async getTutors({
    subjectId = null,
    minPrice = null,
    maxPrice = null,
    teachingMode = null,
    minRating = null,
    search = '',
    sortBy = null,
    pageNumber = 1,
    pageSize = 9,
  } = {}) {
    const filters = { subjectId, minPrice, maxPrice, teachingMode, minRating, search, sortBy, pageNumber, pageSize };
    try {
      const params = { pageNumber, pageSize };
      if (subjectId) params.subjectId = subjectId;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;
      if (teachingMode && teachingMode !== 'All') params.teachingMode = teachingMode;
      if (minRating) params.minRating = minRating;
      if (search) params.search = search;
      // `rating_desc` không phải giá trị backend hiểu — bỏ trống để dùng default (rating giảm dần).
      if (SORT_BY_WHITELIST.includes(sortBy)) params.sortBy = sortBy;

      const res = await api.get('/tutors', { params });
      return normalizePaged(res, normalizeTutorSummary);
    } catch (err) {
      if (!USE_MOCK) throw err;
      console.warn('[tutorService] /tutors lỗi, dùng mock (VITE_USE_MOCK=true).', err.message);
      return normalizePaged(
        filterMockTutors(filters),
        normalizeTutorSummary,
      );
    }
  },

  /** GET /tutors/{id} → TutorProfileDto */
  async getTutorById(id) {
    try {
      const res = await api.get(`/tutors/${id}`);
      return normalizeTutorProfile(res ?? {});
    } catch (err) {
      if (!USE_MOCK) throw err;
      console.warn(`[tutorService] /tutors/${id} lỗi, dùng mock (VITE_USE_MOCK=true).`, err.message);
      return normalizeTutorProfile(findMockTutor(id) ?? {});
    }
  },

  /**
   * GET /tutors/{id}/availability → TutorAvailabilityDto { days: DailyAvailabilityDto[] }
   * @returns {Promise<object[]>} mảng `days` (mỗi ngày gồm availableSlots/bookedSlots)
   */
  async getTutorAvailability(id, fromDate = null, toDate = null) {
    try {
      const params = {};
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;
      const res = await api.get(`/tutors/${id}/availability`, { params });
      if (Array.isArray(res?.days)) return res.days.map(normalizeAvailabilityDay);
      return [];
    } catch (err) {
      if (!USE_MOCK) throw err;
      console.warn(`[tutorService] /tutors/${id}/availability lỗi, dùng mock (VITE_USE_MOCK=true).`);
      return (findMockTutor(id)?.availability ?? []).map(mockWeeklySlotToDay);
    }
  },

  /** GET /tutors/{id}/services → ServiceSummaryDto[] */
  async getTutorServices(id) {
    try {
      const res = await api.get(`/tutors/${id}/services`);
      if (Array.isArray(res)) return res.map(normalizeServiceSummary);
      if (Array.isArray(res?.items)) return res.items.map(normalizeServiceSummary);
      return [];
    } catch (err) {
      if (!USE_MOCK) throw err;
      console.warn(`[tutorService] /tutors/${id}/services lỗi, dùng mock (VITE_USE_MOCK=true).`);
      return (findMockTutor(id)?.services ?? []).map(normalizeServiceSummary);
    }
  },

  /**
   * GET /tutors/{id}/reviews → PagedResult<TutorPublicReviewDto>
   * @returns {Promise<{items: object[], totalCount: number, pageNumber: number, pageSize: number, totalPages: number, hasPreviousPage: boolean, hasNextPage: boolean}>}
   */
  async getTutorReviews(id, pageNumber = 1, pageSize = 10) {
    try {
      const res = await api.get(`/tutors/${id}/reviews`, { params: { pageNumber, pageSize } });
      return normalizePaged(res, normalizeTutorReview);
    } catch (err) {
      if (!USE_MOCK) throw err;
      console.warn(`[tutorService] /tutors/${id}/reviews lỗi, dùng mock (VITE_USE_MOCK=true).`);
      const reviews = findMockTutor(id)?.reviews ?? [];
      return normalizePaged(
        { items: reviews, totalCount: reviews.length, pageNumber, pageSize },
        normalizeTutorReview,
      );
    }
  },
};

/** Mock availability là lịch tuần (không có ngày cụ thể) — chuyển về hình dạng `days`. */
function mockWeeklySlotToDay(slot) {
  return normalizeAvailabilityDay({
    date: null,
    dayOfWeek: slot.dayOfWeek,
    dayOfWeekName: slot.dayLabel ?? getDayOfWeekLabel(slot.dayOfWeek),
    hasAvailableSlots: true,
    availableSlots: [{ startTime: slot.startTime, endTime: slot.endTime }],
    bookedSlots: [],
  });
}

// ---------------------------------------------------------------------------
// MOCK HELPERS (chỉ chạy khi VITE_USE_MOCK === 'true')
// ---------------------------------------------------------------------------

function filterMockSubjects(categoryId, search) {
  return MOCK_SUBJECTS.filter((subject) => {
    if (categoryId && subject.categoryId !== categoryId) return false;
    if (search && !subject.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
}

function findMockTutor(id) {
  if (!id) return MOCK_TUTORS[0];
  const found = MOCK_TUTORS.find(
    (tutor) => tutor.id === id || tutor.profileId === id,
  );
  return found || MOCK_TUTORS[0];
}

function filterMockTutors({
  subjectId,
  minPrice,
  maxPrice,
  teachingMode,
  minRating,
  search,
  sortBy,
  pageNumber,
  pageSize,
}) {
  let list = [...MOCK_TUTORS];

  if (subjectId) {
    list = list.filter((tutor) => tutor.subjects.some((subject) => subject.id === subjectId));
  }
  if (teachingMode && teachingMode !== 'All') {
    list = list.filter(
      (tutor) => tutor.teachingMode === teachingMode || tutor.teachingMode === 'Both',
    );
  }
  if (minPrice != null) {
    list = list.filter((tutor) => tutor.minPrice >= minPrice);
  }
  if (maxPrice != null) {
    list = list.filter((tutor) => tutor.minPrice <= maxPrice);
  }
  if (minRating != null) {
    list = list.filter((tutor) => tutor.rating >= minRating);
  }
  if (search && search.trim()) {
    const keyword = search.trim().toLowerCase();
    list = list.filter(
      (tutor) =>
        tutor.fullName.toLowerCase().includes(keyword) ||
        tutor.education.toLowerCase().includes(keyword) ||
        tutor.bio.toLowerCase().includes(keyword) ||
        tutor.subjects.some((subject) => subject.name.toLowerCase().includes(keyword)),
    );
  }

  if (sortBy === 'price_asc') {
    list.sort((a, b) => a.minPrice - b.minPrice);
  } else if (sortBy === 'price_desc') {
    list.sort((a, b) => b.minPrice - a.minPrice);
  } else if (sortBy === 'reviews') {
    list.sort((a, b) => b.totalReviews - a.totalReviews);
  } else {
    list.sort((a, b) => b.rating - a.rating);
  }

  const totalCount = list.length;
  const startIndex = (pageNumber - 1) * pageSize;
  const items = list.slice(startIndex, startIndex + pageSize);

  return {
    items,
    totalCount,
    pageNumber,
    pageSize,
    totalPages: pageSize > 0 ? Math.ceil(totalCount / pageSize) : 0,
    hasPreviousPage: pageNumber > 1,
    hasNextPage: pageNumber * pageSize < totalCount,
  };
}

export default tutorService;
