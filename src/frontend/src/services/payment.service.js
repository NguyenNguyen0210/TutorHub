import { api } from './api';

export const paymentService = {
  /**
   * Tạo đường link thanh toán bảo mật qua VNPay Sandbox
   */
  async createVnPayUrl(bookingId) {
    try {
      const res = await api.post('/payments/vnpay/create-url', { bookingId });
      if (res && res.paymentUrl) {
        return res.paymentUrl;
      }
      return null;
    } catch (err) {
      console.warn('[paymentService] Backend /payments/vnpay/create-url offline, using mock payment simulation.', err.message);
      return null;
    }
  },

  /**
   * Xử lý kết quả trả về từ cổng VNPay sau khi khách hàng hoàn tất hoặc hủy
   */
  async processPaymentReturn(searchParams) {
    try {
      const params = Object.fromEntries(searchParams.entries());
      const res = await api.get('/payments/vnpay/return', { params });
      return res;
    } catch (err) {
      console.warn('[paymentService] Backend /payments/vnpay/return offline, parsing parameters locally.', err.message);
      const code = searchParams.get('vnp_ResponseCode') || '00';
      const txnRef = searchParams.get('vnp_TxnRef') || 'THB-TEST-001';
      const amount = Number(searchParams.get('vnp_Amount') || '200000000') / 100;
      const bankCode = searchParams.get('vnp_BankCode') || 'NCB';

      return {
        isSuccess: code === '00',
        code,
        message: code === '00' ? 'Giao dịch thanh toán thành công qua VNPay' : 'Giao dịch thanh toán không thành công hoặc bị hủy',
        transactionId: txnRef,
        amount,
        bankCode,
        payDate: new Date().toISOString(),
      };
    }
  },
};

export default paymentService;
