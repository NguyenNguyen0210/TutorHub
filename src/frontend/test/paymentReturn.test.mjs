import test from 'node:test';
import assert from 'node:assert/strict';
import { getPaymentReturnMessage } from '../src/utils/paymentReturn.js';

test('gateway success awaiting confirmation is displayed in Vietnamese without claiming activation', () => {
  assert.equal(getPaymentReturnMessage({ success: true, message: 'Payment completed successfully and is being confirmed.' }, false), 'Thanh toán đã hoàn tất. Hệ thống đang xác nhận giao dịch của bạn.');
});

test('gateway verification failures keep their meaning in Vietnamese', () => {
  assert.match(getPaymentReturnMessage({ success: false, message: 'Invalid security checksum signature.' }, false), /Không thể xác thực/);
  assert.match(getPaymentReturnMessage({ success: false, message: 'Payment was not completed at the payment gateway.' }, false), /chưa được hoàn tất/);
});

test('Vietnamese messages are preserved and unknown English errors have a localized fallback', () => {
  const message = 'Giao dịch nạp tiền chưa được xác nhận hoặc không thành công.';
  assert.equal(getPaymentReturnMessage({ success: false, message }, true), message);
  assert.match(getPaymentReturnMessage({ success: false, message: 'Network Error' }, false), /Chưa thể xác nhận/);
});
