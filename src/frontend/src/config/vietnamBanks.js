/**
 * Danh sách ngân hàng nội địa dùng chung cho mọi form nhận tiền
 * (rút tiền học viên, tài khoản nhận tiền của gia sư).
 *
 * `code` gửi lên backend dưới dạng `bankCode`; `name` là `bankName`.
 */
export const VIETNAM_BANKS = [
  { code: 'VCB', name: 'Vietcombank' },
  { code: 'TCB', name: 'Techcombank' },
  { code: 'MB', name: 'MBBank' },
  { code: 'ACB', name: 'ACB' },
  { code: 'BIDV', name: 'BIDV' },
  { code: 'VTB', name: 'VietinBank' },
  { code: 'VPB', name: 'VPBank' },
  { code: 'TPB', name: 'TPBank' },
  { code: 'HDB', name: 'HDBank' },
  { code: 'STB', name: 'Sacombank' },
];

export const DEFAULT_BANK_CODE = VIETNAM_BANKS[0].code;

/** Tìm ngân hàng theo mã hoặc theo tên (không phân biệt hoa thường). */
export function findBank(identifier) {
  const value = String(identifier ?? '').trim().toLowerCase();
  if (!value) return null;
  return VIETNAM_BANKS.find(bank => bank.code.toLowerCase() === value)
    ?? VIETNAM_BANKS.find(bank => bank.name.toLowerCase() === value)
    ?? null;
}

export default VIETNAM_BANKS;
