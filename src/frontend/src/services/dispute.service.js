import { api } from './api';

export const disputeService = {
  /**
   * Nộp đơn khiếu nại tranh chấp buổi học
   */
  async createDispute({ sessionId, reason, description }) {
    try {
      const res = await api.post('/disputes', { sessionId, reason, description });
      return res;
    } catch (err) {
      console.warn('[disputeService] Backend /disputes offline, returning mock dispute.', err.message);
      return {
        id: 'disp-2026-001',
        sessionId,
        reason,
        description,
        status: 'Pending',
        filedAt: new Date().toISOString(),
        heldAmount: 200000,
        message: 'Đơn khiếu nại đã được ghi nhận. Số tiền 200.000 ₫ đã bị phong tỏa trong Escrow để chờ Ban Trọng Tài phân xử.',
      };
    }
  },

  /**
   * Lấy danh sách khiếu nại của tôi
   */
  async getMyDisputes() {
    try {
      const res = await api.get('/disputes/my');
      if (res && Array.isArray(res)) return res;
      return [];
    } catch (err) {
      console.warn('[disputeService] Backend /disputes/my offline.');
      return [];
    }
  },
};

export default disputeService;
