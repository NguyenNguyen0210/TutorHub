/**
 * Session Service — /api/v1/sessions
 *
 * Contract (SessionsController):
 * - GET  /sessions                    → List<SessionCalendarDto> (mảng, KHÔNG paged)
 *   { id, enrollmentId, sessionNumber, subjectName, studentName, tutorName, startAt,
 *     endAt, durationMinutes, teachingMode, status }
 * - GET  /sessions/{id}               → SessionDto
 *   { id, enrollmentId, sessionNumber, earningAmount, startAt, endAt, status,
 *     isPayoutReleased, createdAt, completedAt, cancelledAt, studentAttendance,
 *     tutorAttendance, hasAttendanceConflict, attendanceVerificationDueAt }
 * - POST /sessions/{id}/attendance    body { outcome: 'Attended' | 'Absent' } → SessionDto
 * - POST /sessions/{id}/schedule      body { startAt, endAt } → SessionDto
 *
 * Mock: chỉ khi VITE_USE_MOCK === 'true'; lỗi khác được ném lại (ApiError).
 */
import { api } from './api';
import { USE_MOCK } from '@/config/constants';

const MOCK_SESSIONS = [
  {
    id: 's3s3s3s3-0001-0000-0000-000000000003',
    enrollmentId: 'e1e1e1e1-0001-0000-0000-000000000001',
    sessionNumber: 3,
    subjectName: 'Toán THPT',
    studentName: 'Phạm Minh Tuấn',
    tutorName: 'ThS. Nguyễn Văn An',
    startAt: '2026-09-14T18:00:00Z',
    endAt: '2026-09-14T19:00:00Z',
    durationMinutes: 60,
    teachingMode: 'Both',
    status: 'Scheduled',
  },
];

const MOCK_SESSION_DETAIL = {
  id: 's3s3s3s3-0001-0000-0000-000000000003',
  enrollmentId: 'e1e1e1e1-0001-0000-0000-000000000001',
  sessionNumber: 3,
  earningAmount: 180000,
  startAt: '2026-09-14T18:00:00Z',
  endAt: '2026-09-14T19:00:00Z',
  status: 'Scheduled',
  isPayoutReleased: false,
  createdAt: '2026-09-08T09:00:00Z',
  completedAt: null,
  cancelledAt: null,
  studentAttendance: null,
  tutorAttendance: null,
  hasAttendanceConflict: false,
  attendanceVerificationDueAt: '2026-09-15T19:00:00Z',
};

export const sessionService = {
  /**
   * GET /sessions → SessionCalendarDto[]
   * @returns {Promise<object[]>}
   */
  async getMySessions(params = {}) {
    try {
      const res = await api.get('/sessions', { params });
      if (Array.isArray(res)) return res;
      if (Array.isArray(res?.items)) return res.items;
      return [];
    } catch (err) {
      if (!USE_MOCK) throw err;
      console.warn('[sessionService] /sessions lỗi, dùng mock (VITE_USE_MOCK=true).', err.message);
      return MOCK_SESSIONS;
    }
  },

  /** GET /sessions/{id} → SessionDto */
  async getSessionById(id) {
    try {
      const res = await api.get(`/sessions/${id}`);
      return res;
    } catch (err) {
      if (!USE_MOCK) throw err;
      console.warn(`[sessionService] /sessions/${id} lỗi, dùng mock (VITE_USE_MOCK=true).`, err.message);
      return { ...MOCK_SESSION_DETAIL, id: id || MOCK_SESSION_DETAIL.id };
    }
  },

  /**
   * POST /sessions/{id}/attendance → SessionDto
   * @param {'Attended'|'Absent'} outcome AttendanceStatus enum của backend
   */
  async submitAttendance(id, outcome) {
    try {
      const res = await api.post(`/sessions/${id}/attendance`, { outcome });
      return res;
    } catch (err) {
      if (!USE_MOCK) throw err;
      console.warn(`[sessionService] /sessions/${id}/attendance lỗi, dùng mock (VITE_USE_MOCK=true).`, err.message);
      return { ...MOCK_SESSION_DETAIL, id, studentAttendance: outcome };
    }
  },

  /** POST /sessions/{id}/schedule body { startAt, endAt } → SessionDto */
  async scheduleSession(id, startAt, endAt) {
    try {
      const res = await api.post(`/sessions/${id}/schedule`, { startAt, endAt });
      return res;
    } catch (err) {
      if (!USE_MOCK) throw err;
      console.warn(`[sessionService] /sessions/${id}/schedule lỗi, dùng mock (VITE_USE_MOCK=true).`, err.message);
      return { ...MOCK_SESSION_DETAIL, id, startAt, endAt, status: 'Scheduled' };
    }
  },
};

export default sessionService;
