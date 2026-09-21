/**
 * Enrollment Service — /api/v1/enrollments
 *
 * Contract (EnrollmentsController):
 * - GET  /enrollments        → PagedResult<EnrollmentSummaryDto>
 * - GET  /enrollments/{id}   → EnrollmentDto (kèm `sessions`)
 * - POST /enrollments/{id}/cancel body { reason } → EnrollmentDto
 */
import { api } from './api';

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizePaged(raw) {
  const items = Array.isArray(raw?.items) ? raw.items : [];
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

export const enrollmentService = {
  /**
   * GET /enrollments → PagedResult<EnrollmentSummaryDto>
   */
  async getMyEnrollments({ status = null, pageNumber = 1, pageSize = 10 } = {}) {
    const params = { pageNumber, pageSize };
    if (status) params.status = status;
    const res = await api.get('/enrollments', { params });
    return normalizePaged(res);
  },

  /** GET /enrollments/{id} → EnrollmentDto (kèm danh sách `sessions`) */
  async getEnrollmentById(id) {
    const res = await api.get(`/enrollments/${id}`);
    return res;
  },

  /** POST /enrollments/{id}/cancel body { reason } → EnrollmentDto */
  async cancelEnrollment(id, reason = 'Học viên yêu cầu dừng khóa học') {
    const res = await api.post(`/enrollments/${id}/cancel`, { reason });
    return res;
  },

  /** POST /enrollments/{id}/reviews body { rating, comment } → ReviewDto */
  async createReview(id, rating, comment) {
    const res = await api.post(`/enrollments/${id}/reviews`, { rating, comment });
    return res;
  },

  /** GET /enrollments/{id}/reviews → ReviewDto */
  async getReview(id) {
    const res = await api.get(`/enrollments/${id}/reviews`);
    return res;
  },
};

export default enrollmentService;
