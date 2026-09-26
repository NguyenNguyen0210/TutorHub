/**
 * Quy tắc bất biến: lịch học phải báo trước tối thiểu 24 giờ.
 *
 * Trước đây chỉ `EnrollmentDetail` và `SessionDetail` kiểm tra điều này, còn
 * `TutorSchedule` dựa vào thuộc tính `min` của `datetime-local` — thứ có thể bị bỏ
 * qua dễ dàng. Đây là bất biến nghiệp vụ nên mọi luồng xếp lịch phải kiểm tra ở
 * client, không chỉ dựa vào backend từ chối.
 */

export const MIN_NOTICE_HOURS = 24;

/** Chuỗi `datetime-local` tối thiểu: now + 24h (+5 phút đệm cho trễ thao tác). */
export function getMinNoticeDateTimeLocal() {
  const minDate = new Date(
    Date.now() + MIN_NOTICE_HOURS * 60 * 60 * 1000 + 5 * 60 * 1000
  );
  const year = minDate.getFullYear();
  const month = String(minDate.getMonth() + 1).padStart(2, '0');
  const day = String(minDate.getDate()).padStart(2, '0');
  const hours = String(minDate.getHours()).padStart(2, '0');
  const minutes = String(minDate.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Kiểm tra một mốc bắt đầu có đủ thời gian báo trước không.
 * @param {Date|string|number} startAt
 * @returns {string|null} thông báo lỗi tiếng Việt, hoặc `null` nếu hợp lệ.
 */
export function assertMinNotice(startAt) {
  const start = startAt instanceof Date ? startAt : new Date(startAt);
  if (Number.isNaN(start.getTime())) {
    return 'Thời gian bắt đầu không hợp lệ.';
  }
  if (start.getTime() < Date.now() + MIN_NOTICE_HOURS * 60 * 60 * 1000) {
    return 'Lịch mới phải được xếp trước giờ bắt đầu ít nhất 24 giờ.';
  }
  return null;
}
