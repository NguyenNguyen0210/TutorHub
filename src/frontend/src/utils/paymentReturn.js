import { userFacingError } from './userFacingError.js';

const PAYMENT_MESSAGES = {
  'Payment completed successfully and is being confirmed.': 'Thanh toán đã hoàn tất. Hệ thống đang xác nhận giao dịch của bạn.',
  'Payment was not completed at the payment gateway.': 'Giao dịch chưa được hoàn tất tại cổng thanh toán VNPAY.',
  'Invalid security checksum signature.': 'Không thể xác thực thông tin giao dịch. Vui lòng kiểm tra lại hoặc liên hệ hỗ trợ.',
  'Invalid payment callback parameters.': "Thông tin thanh toán chưa hợp lệ. Vui lòng kiểm tra lịch sử thanh toán hoặc liên hệ hỗ trợ.",
};

export function getPaymentReturnMessage(result, isTopUp) {
  const message = result?.message?.trim();
  if (PAYMENT_MESSAGES[message]) return PAYMENT_MESSAGES[message];
  if (message && /[\u00c0-\u1ef9\u0110\u0111]/u.test(message)) return userFacingError(message, 'Vui lòng kiểm tra thông tin thanh toán trong lịch sử giao dịch.');
  if (result?.success) {
    return isTopUp
      ? "Nạp tiền thành công. Số dư khả dụng trong Ví học viên đã được cập nhật."
      : 'Thanh toán đã hoàn tất. Hệ thống đang xác nhận giao dịch của bạn.';
  }
  return 'Chưa thể xác nhận giao dịch thanh toán. Vui lòng kiểm tra thông tin giao dịch hoặc liên hệ hỗ trợ.';
}
