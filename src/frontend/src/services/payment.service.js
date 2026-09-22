/**
 * Payment Service — /api/v1/payments
 *
 * Contract (PaymentsController + PaymentRedirectDto/PaymentResultDto):
 * - POST /payments/vnpay/create-url  body { bookingId: Guid } → PaymentRedirectDto
 * - GET  /payments/vnpay/return      → PaymentResultDto (đọc-only, không mutate trạng thái)
 * - POST /dev/payments/simulate-ipn  body { bookingId, success } → SimulatedPaymentDto (chỉ ở Development)
 */
import { api } from './api';

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
   */
  async createVnPayUrl(bookingId) {
    const res = await api.post('/payments/vnpay/create-url', { bookingId });
    return normalizeRedirect(res);
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
    const res = await api.get('/payments/vnpay/return', { params });
    return res;
  },
};

export default paymentService;
