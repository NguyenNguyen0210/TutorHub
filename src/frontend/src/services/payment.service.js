/**
 * Payment Service — /api/v1/payments
 *
 * Contract (PaymentsController + PaymentRedirectDto/PaymentResultDto):
 * - POST /payments/vnpay/create-url  body { bookingId: Guid } → PaymentRedirectDto
 * - GET  /payments/vnpay/return      → PaymentResultDto (verified, idempotent settlement)
 * - POST /dev/payments/simulate-ipn  body { bookingId, success } → SimulatedPaymentDto (chỉ ở Development)
 */
import { api } from './api';
import { idempotencyHeaders } from './idempotency';

function normalizeRedirect(raw = {}) {
  return {
    paymentUrl: raw.paymentUrl ?? null,
    merchantReference: raw.merchantReference ?? null,
    bookingId: raw.bookingId ?? null,
    expireAt: raw.expireAt ?? null,
  };
}

export const paymentService = {
  /** Booking payment attempts only; refunds and payouts stay outside this history. */
  async getMyCoursePayments({ pageNumber = 1, pageSize = 15 } = {}) {
    return api.get('/transactions/me', { params: { type: 'BookingPayment', pageNumber, pageSize } });
  },
  /**
   * POST /payments/vnpay/create-url → PaymentRedirectDto
   */
  async createVnPayUrl(bookingId, idempotencyKey = null) {
    const headers = idempotencyHeaders(idempotencyKey);
    const res = await api.post('/payments/vnpay/create-url', { bookingId }, { headers });
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
   * { success, status, message, bookingId, merchantReference, transactionNo, amount }
   * Backend verifies and settles the signed callback; success requires committed activation.
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
