/**
 * Tutor Service — Khám phá gia sư, danh mục, gói học và lịch rảnh.
 *
 * Contract:
 * - GET /categories                 → CategoryDto[]
 * - GET /subjects                   → SubjectDto[]
 * - GET /tutors                     → PagedResult<TutorSummaryDto>
 * - GET /tutors/{id}                → TutorProfileDto
 * - GET /tutors/{id}/availability   → TutorAvailabilityDto { days: DailyAvailabilityDto[] }
 * - GET /tutors/{id}/services       → ServiceSummaryDto[]
 * - GET /tutors/{id}/reviews        → PagedResult<TutorPublicReviewDto>
 * - GET /tutors/me/services         → ServiceDto[]
 * - GET /tutors/me/availability-slots → AvailabilitySlotDto[]
 * - POST /tutors/me/application     → TutorApplicationDto
 * - GET /tutors/me/application      → TutorApplicationDto
 */
import { api } from './api';
import { getDayOfWeekLabel } from '@/config/enums';

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toNullableNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

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

export function normalizeServiceSummary(raw = {}) {
  return {
    id: raw.id,
    title: raw.title || '',
    subjectName: raw.subjectName || '',
    totalSessions: toNumber(raw.totalSessions, 0),
    sessionDurationMinutes: toNumber(raw.sessionDurationMinutes, 0),
    price: toNullableNumber(raw.price),
    teachingMode: raw.teachingMode || null,
    hasTrialLesson: Boolean(raw.hasTrialLesson),
  };
}

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
    reviews: Array.isArray(raw.reviews) ? raw.reviews.map(normalizeTutorReview) : [],
    availabilitySlots: Array.isArray(raw.availabilitySlots) ? raw.availabilitySlots : [],
  };
}

export function normalizeAvailabilityDay(raw = {}) {
  const dayOfWeek = raw.dayOfWeek || '';
  return {
    date: raw.date ?? null,
    dayOfWeek,
    dayOfWeekName: raw.dayOfWeekName || getDayOfWeekLabel(dayOfWeek),
    hasAvailableSlots: Boolean(raw.hasAvailableSlots),
    availableSlots: Array.isArray(raw.availableSlots)
      ? raw.availableSlots.map(normalizeTimeRange)
      : [],
    bookedSlots: Array.isArray(raw.bookedSlots)
      ? raw.bookedSlots.map(normalizeTimeRange)
      : [],
  };
}

export function normalizeTutorReview(raw = {}) {
  return {
    id: raw.id,
    enrollmentId: raw.enrollmentId ?? null,
    studentName: raw.studentName || 'Học viên ẩn danh',
    studentAvatarUrl: raw.studentAvatarUrl || null,
    rating: toNumber(raw.rating, 5),
    comment: raw.comment || '',
    createdAt: raw.createdAt ?? null,
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
  /** GET /categories → CategoryDto[] */
  async getCategories() {
    const res = await api.get('/categories');
    return Array.isArray(res) ? res : [];
  },

  /** GET /subjects → SubjectDto[] */
  async getSubjects(params = {}) {
    const res = await api.get('/subjects', { params });
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.items)) return res.items;
    return [];
  },

  /**
   * GET /tutors → PagedResult<TutorSummaryDto>
   */
  async getTutors(filters = {}) {
    const {
      categoryId = null,
      subjectId = null,
      minPrice = null,
      maxPrice = null,
      teachingMode = null,
      minRating = null,
      search = '',
      sortBy = null,
      pageNumber = 1,
      pageSize = 12,
    } = filters;

    const params = { pageNumber, pageSize };
    if (categoryId) params.categoryId = categoryId;
    if (subjectId) params.subjectId = subjectId;
    if (minPrice != null) params.minPrice = minPrice;
    if (maxPrice != null) params.maxPrice = maxPrice;
    if (teachingMode && teachingMode !== 'All') params.teachingMode = teachingMode;
    if (minRating != null) params.minRating = minRating;
    if (search && search.trim()) params.search = search.trim();
    if (sortBy) params.sortBy = sortBy;

    const res = await api.get('/tutors', { params });
    return normalizePaged(res, normalizeTutorSummary);
  },

  /** GET /tutors/{id} → TutorProfileDto */
  async getTutorById(id) {
    const res = await api.get(`/tutors/${id}`);
    return normalizeTutorProfile(res);
  },

  /**
   * GET /tutors/{id}/availability → TutorAvailabilityDto { days: DailyAvailabilityDto[] }
   */
  async getTutorAvailability(id, fromDate = null, toDate = null) {
    const params = {};
    if (fromDate) params.fromDate = fromDate;
    if (toDate) params.toDate = toDate;
    const res = await api.get(`/tutors/${id}/availability`, { params });
    if (Array.isArray(res?.days)) return res.days.map(normalizeAvailabilityDay);
    return [];
  },

  /** GET /tutors/{id}/services → ServiceSummaryDto[] */
  async getTutorServices(id) {
    const res = await api.get(`/tutors/${id}/services`);
    if (Array.isArray(res)) return res.map(normalizeServiceSummary);
    if (Array.isArray(res?.items)) return res.items.map(normalizeServiceSummary);
    return [];
  },

  /** GET /tutors/me/services → ServiceDto[] (Tutor workspace) */
  async getMyServices() {
    const res = await api.get('/tutors/me/services');
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.items)) return res.items;
    return [];
  },

  /** POST /tutors/me/services → ServiceDto */
  async createService(data) {
    const res = await api.post('/tutors/me/services', data);
    return res;
  },

  /** PATCH /tutors/me/services/{serviceId} → ServiceDto */
  async updateService(serviceId, data) {
    const res = await api.patch(`/tutors/me/services/${serviceId}`, data);
    return res;
  },

  /** POST /tutors/me/services/{serviceId}/publish → ServiceDto */
  async publishService(serviceId) {
    const res = await api.post(`/tutors/me/services/${serviceId}/publish`);
    return res;
  },

  /** POST /tutors/me/services/{serviceId}/unpublish → ServiceDto */
  async unpublishService(serviceId) {
    const res = await api.post(`/tutors/me/services/${serviceId}/unpublish`);
    return res;
  },

  /** GET /tutors/me/availability-slots → AvailabilitySlotDto[] (Tutor workspace) */
  async getMyAvailabilitySlots() {
    const res = await api.get('/tutors/me/availability-slots');
    if (Array.isArray(res)) return res;
    return [];
  },

  /** POST /tutors/me/application → TutorApplicationDto */
  async submitTutorApplication(payload) {
    return api.post('/tutors/me/application', payload);
  },

  /** GET /tutors/me/application → TutorApplicationDto */
  async getMyTutorApplication() {
    return api.get('/tutors/me/application');
  },

  /**
   * GET /tutors/{id}/reviews → PagedResult<TutorPublicReviewDto>
   */
  async getTutorReviews(id, pageNumber = 1, pageSize = 10) {
    const res = await api.get(`/tutors/${id}/reviews`, { params: { pageNumber, pageSize } });
    return normalizePaged(res, normalizeTutorReview);
  },
};

export default tutorService;
