export function coursePaymentSource(payment) {
  if (payment.paymentSource === 'StudentWallet') return 'Ví học viên';
  if (payment.paymentSource === 'VnPay') return 'VNPAY';
  const reference = payment.paymentGatewayRef || '';
  if (reference.startsWith('STUDENT_WALLET:')) return 'Ví học viên';
  if (/^THB\d{12}[A-Z0-9]{6}(?:\||$)/.test(reference) || reference.startsWith('VNPAY')) return 'VNPAY';
  return 'Chưa có thông tin';
}
