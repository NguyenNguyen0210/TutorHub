import { sessionTime, shiftDay, validCalendarDay } from './tutorSchedule.js';

export function recurringDates(startDay, time, weekdays, count) {
  const days = [...new Set(weekdays)].filter(day => Number.isInteger(day) && day >= 1 && day <= 7);
  if (!validCalendarDay(startDay) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time) || !days.length || !Number.isInteger(count) || count < 1 || count > 100) return [];
  const result = [];
  for (let offset = 0; result.length < count; offset += 1) {
    const day = shiftDay(startDay, offset);
    const weekday = new Date(`${day}T00:00:00Z`).getUTCDay() || 7;
    if (days.includes(weekday)) result.push(`${day}T${time}`);
  }
  return result;
}

export function scheduleConflicts(items, existing, now = Date.now()) {
  const errors = {};
  const overlap = (a, b) => sessionTime(a.startAt) < sessionTime(b.endAt) && sessionTime(b.startAt) < sessionTime(a.endAt);
  const display = value => new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Ho_Chi_Minh' }).format(sessionTime(value));
  for (const item of items) {
    if (sessionTime(item.startAt) < now + 2 * 3600000) { errors[item.sessionId] = 'Lịch học phải bắt đầu sau ít nhất 2 giờ.'; continue; }
    const conflict = existing.find(session => session.status === 'Scheduled' && session.id !== item.sessionId && overlap(item, session));
    if (conflict) { errors[item.sessionId] = `Bạn đã có lịch từ ${display(conflict.startAt)} đến ${display(conflict.endAt)}. Vui lòng chọn thời gian khác.`; continue; }
    if (items.some(other => other.sessionId !== item.sessionId && overlap(item, other))) errors[item.sessionId] = 'Thời gian bị trùng với một buổi khác trong lịch đang chọn.';
  }
  return errors;
}
