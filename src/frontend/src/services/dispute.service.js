/**
 * Dispute Service — /api/v1/disputes
 *
 * Contract (DisputesController):
 * - POST /disputes                    body { sessionId: Guid, reason: DisputeReason, description } → 201 DisputeDto
 * - POST /disputes/{id}/evidence     multipart/form-data with file OR application/json metadata → 201 DisputeEvidenceDto
 * - GET  /disputes/my                 → List<DisputeDto>
 */
import { api } from './api';

export const disputeService = {
  /** POST /disputes → DisputeDto */
  async createDispute({ sessionId, reason, description }) {
    const res = await api.post('/disputes', { sessionId, reason, description });
    return res;
  },

  /**
   * POST /disputes/{id}/evidence (multipart/form-data)
   * Upload binary evidence file directly.
   */
  async uploadEvidence(disputeId, file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post(`/disputes/${disputeId}/evidence`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res;
  },

  /**
   * GET /disputes/my → DisputeDto[]
   */
  async getMyDisputes() {
    const res = await api.get('/disputes/my');
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.items)) return res.items;
    return [];
  },
};

export default disputeService;
