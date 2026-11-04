import test from 'node:test';
import assert from 'node:assert/strict';
import { userFacingError } from '../src/utils/userFacingError.js';
import { ACCOUNT_STATUS, SESSION_STATUS, getSessionStatusMeta } from '../src/config/enums.js';
import { getPaymentReturnMessage } from '../src/utils/paymentReturn.js';

test('known account and financial errors retain actionable, accurate reasons', () => {
  assert.match(userFacingError({ message: 'Invalid email or password.' }), /Email hoặc mật khẩu chưa đúng/);
  assert.match(userFacingError({ message: 'Current password is incorrect.' }), /Mật khẩu hiện tại/);
  assert.match(userFacingError({ message: 'Withdrawal amount must be at least 50,000 VND.' }), /50\.000/);
  assert.match(userFacingError({ message: 'Top-up amount must be at least 10,000 VND.' }), /10\.000/);
  assert.equal(userFacingError({ message: 'Số dư đã thay đổi. Vui lòng kiểm tra lại ví.' }), 'Số dư đã thay đổi. Vui lòng kiểm tra lại ví.');
});
test('presentation hides diagnostics without changing the error used by business logic', () => {
  const error = Object.freeze({ message: 'Request failed with status code 500', status: 500, errors: Object.freeze(['System.InvalidOperationException at Microsoft.EntityFrameworkCore']) });
  const fallback = 'Chưa lưu được gói học. Vui lòng thử lại.';
  assert.equal(userFacingError(error, fallback), fallback);
  assert.equal(error.message, 'Request failed with status code 500');
  assert.equal(error.status, 500);
  assert.equal(userFacingError('Dữ liệu payload không hợp lệ', fallback), fallback);
  assert.equal(userFacingError('Cannot update record', fallback), fallback);
  assert.equal(userFacingError('constructor', fallback), fallback);
  for (const term of ['Entity', 'DTO', 'Payload', 'Endpoint', 'Null', 'Undefined', 'Enum', 'Boolean', 'Fetch', 'Execute', 'Trigger', 'Process'])
    assert.equal(userFacingError(`Lỗi ${term} khi xử lý`, fallback), fallback);
  assert.equal(userFacingError('ID của đơn hàng chưa hợp lệ.'), 'Mã của đơn hàng chưa hợp lệ.');
});
test('validation details are translated when the envelope only contains a generic error', () => {
  assert.equal(userFacingError({ message: 'Validation failed', errors: ['Email is required.'] }), 'Vui lòng nhập email.');
  assert.equal(userFacingError({ message: 'Lỗi xử lý nghiệp vụ', errors: ['Số dư ví không đủ để rút tiền.'] }), 'Số dư ví không đủ để rút tiền.');
  assert.equal(userFacingError({ response: { status: 400, data: { message: 'Validation failed', errors: ['Full name is required.'] } } }), 'Vui lòng nhập họ và tên.');
  assert.match(userFacingError({ status: 429 }), /chờ một chút/);
  assert.equal(userFacingError('Mã OTP phải có đúng 6 chữ số.'), 'Mã xác nhận phải có đúng 6 chữ số.');
});
test('an unknown status has a neutral label while API enum values remain unchanged', () => {
  assert.deepEqual(getSessionStatusMeta('UnknownBackendStatus'), { label: 'Chưa rõ trạng thái', color: 'neutral' });
  assert.equal(SESSION_STATUS.AWAITING_PAYOUT, 'AwaitingPayout');
  assert.equal(ACCOUNT_STATUS.BANNED, 'Banned');
});
test('payment copy keeps the verified result while hiding diagnostic content', () => {
  const result = Object.freeze({ success: true, status: 'Completed', message: 'Lỗi payload tại callback', amount: 100000 });
  assert.match(getPaymentReturnMessage(result, false), /lịch sử giao dịch/);
  assert.equal(result.success, true);
  assert.equal(result.status, 'Completed');
  assert.match(getPaymentReturnMessage({ message: 'Payment completed successfully and is being confirmed.' }, false), /Thanh toán đã hoàn tất/);
});
