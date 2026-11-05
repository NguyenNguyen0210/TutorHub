/** Mirrors the reset-request email shape and length rules enforced by the API. */
export function getResetEmailError(value) {
  const email = typeof value === 'string' ? value.trim() : '';
  if (!email) return 'Vui lòng nhập địa chỉ email của bạn.';
  if (value.length > 256) return 'Email không được vượt quá 256 ký tự.';
  if (!/^[^\s@]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/i.test(email)) return 'Vui lòng nhập địa chỉ email hợp lệ, ví dụ: ban@example.com.';
  return '';
}
