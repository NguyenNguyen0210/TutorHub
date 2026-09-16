/**
 * Dispute Service — /api/v1/disputes
 *
 * Contract (DisputesController):
 * - POST /disputes           body { sessionId: Guid, reason: DisputeReason, description } → 201 DisputeDto
 *   DisputeReason ∈ TutorNoShow | TutorLate | IncompleteSession | QualityIssue |
 *   InappropriateBehavior | TechnicalFailure | Other
 * - GET  /disputes/my        → List<DisputeDto>
 *
 * Mock: chỉ khi VITE_USE_MOCK === 'true'; lỗi khác được ném lại (ApiError) để
 * trang khiếu nại hiển thị lỗi thật.
 */
import { api } from './api';
import { USE_MOCK } from '@/config/constants';

const MOCK_DISPUTE = {
  id: 'ba07ba07-0001-0000-0000-000000000001',
  sessionId: 's3s3s3s3-0001-0000-0000-000000000003',
  reason: 'TutorNoShow',
  description: '',
  status: 'Open',
  heldAmount: 200000,
  createdAt: '2026-09-14T19:00:00Z',
};

export const disputeService = {
  /** POST /disputes → DisputeDto */
  async createDispute({ sessionId, reason, description }) {
    try {
      const res = await api.post('/disputes', { sessionId, reason, description });
      return res;
    } catch (err) {
      if (!USE_MOCK) throw err;
      console.warn('[disputeService] /disputes lỗi, dùng mock (VITE_USE_MOCK=true).', err.message);
      return { ...MOCK_DISPUTE, sessionId, reason, description };
    }
  },

  /**
   * GET /disputes/my → DisputeDto[]
   * @returns {Promise<object[]>}
   */
  async getMyDisputes() {
    try {
      const res = await api.get('/disputes/my');
      if (Array.isArray(res)) return res;
      if (Array.isArray(res?.items)) return res.items;
      return [];
    } catch (err) {
      if (!USE_MOCK) throw err;
      console.warn('[disputeService] /disputes/my lỗi, dùng mock (VITE_USE_MOCK=true).', err.message);
      return [];
    }
  },
};

export default disputeService;
