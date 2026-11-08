/**
 * Pure helpers cho "Tài khoản nhận tiền" của gia sư.
 *
 * Tách khỏi component để test được bằng `node --test` (không cần bundler JSX)
 * và để quy tắc validate khớp với `UpdatePayoutAccountCommandValidator` ở backend:
 * bankName ≤ 100, bankCode ≤ 20, accountNumber ≤ 50, accountHolderName ≤ 150.
 */
// Đường dẫn tương đối (không dùng alias @) để `node --test` cũng resolve được.
import { findBank } from '../config/vietnamBanks.js';

export const PAYOUT_ACCOUNT_LIMITS = {
  bankName: 100,
  bankCode: 20,
  accountNumber: 50,
  accountHolderName: 150,
};

/** Đủ cả 3 trường bắt buộc mới được coi là đã cấu hình (backend cũng yêu cầu cả 3). */
export function isPayoutAccountComplete(account) {
  return Boolean(
    String(account?.bankName ?? '').trim()
    && String(account?.accountNumber ?? '').trim()
    && String(account?.accountHolderName ?? '').trim(),
  );
}

export function normalizeAccountNumber(value) {
  return String(value ?? '').replace(/\s+/g, '');
}

export function normalizeAccountHolder(value) {
  return String(value ?? '').trim().toUpperCase();
}

/** Trả về object lỗi rỗng khi hợp lệ. */
export function validatePayoutAccount(draft = {}) {
  const errors = {};
  const bankName = String(draft.bankName ?? '').trim();
  const accountNumber = normalizeAccountNumber(draft.accountNumber);
  const accountHolderName = normalizeAccountHolder(draft.accountHolderName);

  if (!bankName) {
    errors.bankName = 'Chọn ngân hàng nhận tiền.';
  } else if (bankName.length > PAYOUT_ACCOUNT_LIMITS.bankName) {
    errors.bankName = `Tên ngân hàng tối đa ${PAYOUT_ACCOUNT_LIMITS.bankName} ký tự.`;
  }

  if (!accountNumber) {
    errors.accountNumber = 'Nhập số tài khoản nhận tiền.';
  } else if (!/^\d{6,50}$/.test(accountNumber)) {
    errors.accountNumber = 'Số tài khoản gồm 6–50 chữ số.';
  }

  if (!accountHolderName) {
    errors.accountHolderName = 'Nhập tên chủ tài khoản.';
  } else if (accountHolderName.length > PAYOUT_ACCOUNT_LIMITS.accountHolderName) {
    errors.accountHolderName = `Tên chủ tài khoản tối đa ${PAYOUT_ACCOUNT_LIMITS.accountHolderName} ký tự.`;
  } else if (!/^[\p{L}\s.'-]+$/u.test(accountHolderName)) {
    errors.accountHolderName = 'Tên chủ tài khoản chỉ gồm chữ cái, khoảng trắng và dấu . \' -.';
  }

  return errors;
}

/**
 * Chuẩn hoá payload gửi `PUT /tutors/me/wallet/payout-account`.
 * Ưu tiên mã ngân hàng trong danh sách để `bankName` và `bankCode` luôn khớp nhau.
 */
export function payoutAccountPayload(draft = {}) {
  const bank = findBank(draft.bankCode) ?? findBank(draft.bankName);
  const rawName = String(draft.bankName ?? '').trim();
  const rawCode = String(draft.bankCode ?? '').trim();
  return {
    // Mã lạ (dữ liệu cũ) vẫn phải giữ nguyên thay vì gửi bankName rỗng.
    bankName: String(bank?.name ?? (rawName || rawCode)).trim(),
    bankCode: bank?.code ?? (rawCode || null),
    accountNumber: normalizeAccountNumber(draft.accountNumber),
    accountHolderName: normalizeAccountHolder(draft.accountHolderName),
  };
}
