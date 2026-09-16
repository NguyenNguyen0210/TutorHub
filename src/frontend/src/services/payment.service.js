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
   * GET /payments/vnpay/return → PaymentResultDto
   * VNPay redirect về kèm query params; backend tự verify chữ ký và trả kết quả.
   */
  async processPaymentReturn(searchParams) {
    try {
      const params = Object.fromEntries(searchParams.entries());
      const res = await api.get('/payments/vnpay/return', { params });
      return res;
    } catch (err) {
      if (!USE_MOCK) throw err;
      console.warn('[paymentService] /payments/vnpay/return lỗi, dùng mock (VITE_USE_MOCK=true).', err.message);
      const code = searchParams.get('vnp_ResponseCode') || '00';
      const txnRef = searchParams.get('vnp_TxnRef') || 'THB-TEST-001';
      return {
        isSuccess: code === '00',
        code,
        message:
          code === '00'
            ? 'Giao dịch thanh toán thành công qua VNPay (mock)'
            : 'Giao dịch thanh toán không thành công hoặc bị hủy (mock)',
        transactionId: txnRef,
        amount: Number(searchParams.get('vnp_Amount') || '200000000') / 100,
        bankCode: searchParams.get('vnp_BankCode') || 'NCB',
        payDate: new Date().toISOString(),
      };
    }
  },
};

export default paymentService;
