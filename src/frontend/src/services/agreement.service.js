/**
 * Agreement Service — /api/v1/agreements
 *
 * Contract (AgreementsController):
 * - GET  /agreements/my       → List<CustomAgreementDto>
 * - GET  /agreements/{id}     → CustomAgreementDto
 * - POST /agreements          → CustomAgreementDto
 * - POST /agreements/{id}/accept → CustomAgreementDto
 * - POST /agreements/{id}/reject → CustomAgreementDto
 * - POST /agreements/{id}/cancel → CustomAgreementDto
 * - POST /agreements/{id}/checkout → BookingDto
 */
import api from './api';

export const agreementService = {
  /** GET /agreements/my → CustomAgreementDto[] */
  async getMyAgreements() {
    const res = await api.get('/agreements/my');
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.items)) return res.items;
    return [];
  },

  /** GET /agreements/{id} → CustomAgreementDto */
  async getAgreementById(id) {
    return api.get(`/agreements/${id}`);
  },

  /** POST /agreements body { studentUserId, subjectId, title, description, totalPrice, totalSessions, sessionDurationMinutes, teachingMode } */
  async createAgreement(payload) {
    return api.post('/agreements', payload);
  },

  /** POST /agreements/{id}/accept */
  async acceptAgreement(id) {
    return api.post(`/agreements/${id}/accept`);
  },

  /** POST /agreements/{id}/reject { reason } */
  async rejectAgreement(id, reason) {
    return api.post(`/agreements/${id}/reject`, { reason });
  },

  /** POST /agreements/{id}/cancel { reason } */
  async cancelAgreement(id, reason) {
    return api.post(`/agreements/${id}/cancel`, { reason });
  },

  /** POST /agreements/{id}/checkout → BookingDto */
  async checkoutAgreement(id) {
    return api.post(`/agreements/${id}/checkout`);
  },
};

export default agreementService;
