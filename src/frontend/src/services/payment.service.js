/**
 * Payment Service — /api/v1/payments
 *
 * Contract (PaymentsController + PaymentRedirectDto/PaymentResultDto):
 * - POST /payments/vnpay/create-url  body { bookingId: Guid } → PaymentRedirectDto
 *   { paymentUrl, merchantReference, bookingId, expireAt }
 * - GET  /payments/vnpay/return      → PaymentResultDto (đọc-only, không mutate trạng thái)
 *
 * Mock: chỉ khi VITE_USE_MOCK === 'true'; lỗi khác được ném lại (ApiError) để
 * checkout hiển thị lỗi thật thay vì giả lập "thanh toán thành công".
 */
import { api } from './api';
import { USE_MOCK } from '@/config/constants';

function normalizeRedirect(raw = {}) {
  return {
    paymentUrl: raw.paymentUrl ?? null,
    merchantReference: raw.merchantReference ?? null,
    bookingId: raw.bookingId ?? null,
    expireAt: raw.expireAt ?? null,
  };
}

export const paymentService = {
  /**
   * POST /payments/vnpay/create-url → PaymentRedirectDto
   * @returns {Promise<{paymentUrl: string|null, merchantReference: string|null, bookingId: string|null, expireAt: string|null}>}
   */
  async createVnPayUrl(bookingId) {
    try {
      const res = await api.post('/payments/vnpay/create-url', { bookingId });
      return normalizeRedirect(res);
    } catch (err) {
      if (!USE_MOCK) throw err;
      console.warn('[paymentService] /payments/vnpay/create-url lỗi, dùng mock (VITE_USE_MOCK=true).', err.message);
      return {
        paymentUrl: null,
        merchantReference: `MOCK-${bookingId}`,
        bookingId,
        expireAt: null,
      };
    }
  },

  /**
   * POST /dev/payments/simulate-ipn body { bookingId, success } → SimulatedPaymentDto
   * Chỉ hoạt động ở Development (backend dev simulator).
   */
  async simulateIpn(bookingId, success = true) {
    const res = await api.post('/dev/payments/simulate-ipn', { bookingId, success });
    return res;
  },

  /**
   * GET /payments/vnpay/return → PaymentResultDto
   * { success, message, bookingId, merchantReference, transactionNo, amount }
   * VNPay redirect về kèm query params; backend tự verify chữ ký và trả kết quả thật.
   */
  async processPaymentReturn(searchParams) {
    const params = Object.fromEntries(searchParams.entries());
    if (Object.keys(params).length === 0) {
      return {
        success: false,
        message: 'Không tìm thấy thông tin giao dịch trong URL chuyển hướng.',
        bookingId: null,
        merchantReference: null,
        transactionNo: null,
        amount: 0,
      };
    }
    try {
      const res = await api.get('/payments/vnpay/return', { params });
      return res;
    } catch (err) {
      if (!USE_MOCK) throw err;
      console.warn('[paymentService] /payments/vnpay/return lỗi, dùng mock (VITE_USE_MOCK=true).', err.message);
      const code = searchParams.get('vnp_ResponseCode');
      const isOk = code === '00';
      return {
        success: isOk,
        message: isOk
          ? 'Giao dịch thanh toán thành công qua VNPay (mock).'
          : 'Giao dịch thanh toán không thành công hoặc bị hủy (mock).',
        bookingId: searchParams.get('vnp_TxnRef') || 'MOCK-BOOKING-001',
        merchantReference: searchParams.get('vnp_TxnRef') || 'THB-MOCK-001',
        transactionNo: searchParams.get('vnp_TransactionNo') || null,
        amount: Number(searchParams.get('vnp_Amount') || '0') / 100,
      };
    }
  },
};

export default paymentService;
