export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
export const AVATAR_ACCEPT = 'image/jpeg,image/png,image/webp';

export function profileValues(data = {}) {
  return Object.fromEntries(['fullName', 'email', 'phone', 'avatarUrl', 'bio', 'education'].map(key => [key, data[key] ?? '']).concat([['experienceYears', Number(data.experienceYears) || 0]]));
}

export function profilePayload(draft, teaching = false) {
  const payload = { fullName: draft.fullName.trim(), phone: draft.phone.trim() || null, avatarUrl: draft.avatarUrl.trim() || null };
  // Tutor PATCH treats null as omitted; an empty string explicitly clears a field.
  if (teaching) Object.assign(payload, { phone: draft.phone.trim(), avatarUrl: draft.avatarUrl.trim(), bio: draft.bio.trim(), education: draft.education.trim(), experienceYears: Number(draft.experienceYears) });
  return payload;
}

export function validateProfile(draft, teaching = false) {
  const errors = {};
  if (draft.fullName.trim().length < 2 || draft.fullName.length > 100) errors.fullName = 'Họ tên cần từ 2 đến 100 ký tự.';
  let phone = draft.phone.trim().replace(/[ .-]/g, '');
  if (phone.startsWith('+84')) phone = '0' + phone.slice(3);
  else if (phone.startsWith('84') && phone.length === 11) phone = '0' + phone.slice(2);
  if (phone && !/^0[35789]\d{8}$/.test(phone)) errors.phone = 'Nhập số di động Việt Nam hợp lệ, ví dụ 0912345678.';
  if (draft.avatarUrl.trim()) {
    try {
      const url = new URL(draft.avatarUrl.trim());
      if (!['http:', 'https:'].includes(url.protocol) || draft.avatarUrl.trim().length > 500) throw new Error();
    } catch { errors.avatarUrl = 'Đường dẫn ảnh cần bắt đầu bằng http:// hoặc https://, tối đa 500 ký tự.'; }
  }
  if (teaching && (!Number.isInteger(Number(draft.experienceYears)) || Number(draft.experienceYears) < 0 || Number(draft.experienceYears) > 60)) errors.experienceYears = 'Số năm kinh nghiệm cần là số nguyên từ 0 đến 60.';
  return errors;
}

export function validateAvatar(file) {
  if (!file || !AVATAR_ACCEPT.split(',').includes(file.type)) return 'Chọn ảnh JPG, PNG hoặc WebP.';
  if (file.size <= 0 || file.size > AVATAR_MAX_BYTES) return 'Ảnh cần có dung lượng lớn hơn 0 và không quá 5 MB.';
  return '';
}

export function squareCrop(width, height, zoom = 1, x = 50, y = 50) {
  const side = Math.min(width, height) / Math.max(1, zoom);
  return { side, x: (width - side) * x / 100, y: (height - side) * y / 100 };
}
