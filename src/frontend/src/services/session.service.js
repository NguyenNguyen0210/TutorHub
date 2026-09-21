/**
 * Session Service — /api/v1/sessions
 *
 * Contract (SessionsController):
 * - GET  /sessions                    → List<SessionCalendarDto>
 * - GET  /sessions/{id}               → SessionDto
 * - POST /sessions/{id}/attendance    body { outcome: 'Attended' | 'Absent' } → SessionDto
 * - POST /sessions/{id}/schedule      body { startAt, endAt } → SessionDto
 * - GET  /sessions/{id}/learning-record → LearningRecordDto
 * - POST /sessions/{id}/learning-record body { content } → LearningRecordDto
 */
import { api } from './api';

export const sessionService = {
  /**
   * GET /sessions → SessionCalendarDto[]
   */
  async getMySessions(params = {}) {
    const res = await api.get('/sessions', { params });
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.items)) return res.items;
    return [];
  },

  /** GET /sessions/{id} → SessionDto */
  async getSessionById(id) {
    const res = await api.get(`/sessions/${id}`);
    return res;
  },

  /**
   * POST /sessions/{id}/attendance → SessionDto
   * @param {'Attended'|'Absent'} outcome
   */
  async submitAttendance(id, outcome) {
    const res = await api.post(`/sessions/${id}/attendance`, { outcome });
    return res;
  },

  /** POST /sessions/{id}/schedule body { startAt, endAt } → SessionDto */
  async scheduleSession(id, startAt, endAt) {
    const res = await api.post(`/sessions/${id}/schedule`, { startAt, endAt });
    return res;
  },

  /** GET /sessions/{id}/learning-record → LearningRecordDto */
  async getLearningRecord(id) {
    const res = await api.get(`/sessions/${id}/learning-record`);
    return res;
  },

  /** POST /sessions/{id}/learning-record body { content } → LearningRecordDto */
  async createLearningRecord(id, content) {
    const res = await api.post(`/sessions/${id}/learning-record`, { content });
    return res;
  },

  /** GET /sessions/{id}/reschedule-requests → SessionRescheduleRequestDto[] */
  async getRescheduleRequests(id) {
    const res = await api.get(`/sessions/${id}/reschedule-requests`);
    return Array.isArray(res) ? res : [];
  },

  /** POST /sessions/{id}/reschedule-requests body { proposedStartAt, proposedEndAt, reason } → SessionRescheduleRequestDto */
  async proposeReschedule(id, proposedStartAt, proposedEndAt, reason = '') {
    const res = await api.post(`/sessions/${id}/reschedule-requests`, {
      proposedStartAt,
      proposedEndAt,
      reason,
    });
    return res;
  },

  /** POST /sessions/{id}/reschedule-requests/{requestId}/accept → SessionDto */
  async acceptReschedule(id, requestId) {
    const res = await api.post(`/sessions/${id}/reschedule-requests/${requestId}/accept`);
    return res;
  },

  /** POST /sessions/{id}/reschedule-requests/{requestId}/reject body { reason } → SessionRescheduleRequestDto */
  async rejectReschedule(id, requestId, reason = '') {
    const res = await api.post(`/sessions/${id}/reschedule-requests/${requestId}/reject`, {
      reason,
    });
    return res;
  },

  /** POST /sessions/{id}/cancel body { reason } → SessionDto */
  async cancelSession(id, reason) {
    const res = await api.post(`/sessions/${id}/cancel`, { reason });
    return res;
  },
};

export default sessionService;
