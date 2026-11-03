export const TEACHING_ZONE = 'Asia/Ho_Chi_Minh';
const OFFSET = 7 * 60 * 60 * 1000;

// API timestamps without an offset are UTC, just like formatDateTime().
export function sessionTime(value) {
  if (!value) return NaN;
  return Date.parse(/(?:Z|[+-]\d{2}:\d{2})$/i.test(value) ? value : `${value}Z`);
}
export function vietnamDay(value = Date.now()) {
  const time = typeof value === 'string' ? sessionTime(value) : value;
  return Number.isFinite(time) ? new Date(time + OFFSET).toISOString().slice(0, 10) : '';
}
export function validCalendarDay(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
  const timestamp = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === value;
}
export function shiftDay(value, days) {
  return new Date(Date.parse(`${value}T00:00:00Z`) + days * 86400000).toISOString().slice(0, 10);
}
export function teachingWeek(day) {
  const weekday = new Date(`${day}T00:00:00Z`).getUTCDay();
  const start = shiftDay(day, -((weekday + 6) % 7));
  return Array.from({ length: 7 }, (_, index) => shiftDay(start, index));
}
export const minTeachingStart = (now = Date.now()) => new Date(now + OFFSET + 125 * 60000).toISOString().slice(0, 16);
export function schedulingItem(sessionId, localValue, durationMinutes) {
  const start = Date.parse(`${localValue}:00+07:00`);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(localValue || '') || !Number.isFinite(start)
    || new Date(start + OFFSET).toISOString().slice(0, 16) !== localValue) throw new Error('Vui lòng chọn ngày giờ hợp lệ.');
  return { sessionId, startAt: new Date(start).toISOString(), endAt: new Date(start + (Number(durationMinutes) || 60) * 60000).toISOString() };
}
export function classifyTeachingSessions(sessions, now = Date.now()) {
  const upcoming = [], past = [];
  sessions.filter(session => session.status === 'Scheduled').forEach(session => {
    const start = sessionTime(session.startAt);
    const end = sessionTime(session.endAt) || start + Number(session.durationMinutes || 0) * 60000;
    if (!Number.isFinite(start) || !Number.isFinite(end)) return;
    (end <= now ? past : upcoming).push(session);
  });
  upcoming.sort((a, b) => sessionTime(a.startAt) - sessionTime(b.startAt));
  past.sort((a, b) => sessionTime(b.startAt) - sessionTime(a.startAt));
  return { upcoming, past };
}
export function unscheduledGroups(enrollments, sessions) {
  const byClass = new Map();
  sessions.filter(session => session.status === 'Unscheduled').forEach(session => {
    if (!byClass.has(session.enrollmentId)) byClass.set(session.enrollmentId, []);
    byClass.get(session.enrollmentId).push(session);
  });
  return enrollments.filter(enrollment => enrollment.status === 'Active' && byClass.has(enrollment.id))
    .map(enrollment => ({ ...enrollment, unscheduledSessions: byClass.get(enrollment.id).sort((a, b) => a.sessionNumber - b.sessionNumber) }))
    .sort((a, b) => (a.studentName || '').localeCompare(b.studentName || '', 'vi') || a.id.localeCompare(b.id));
}
export function scheduleReturn(state) {
  const value = state?.scheduleReturn;
  return typeof value === 'string' && /^\/tutor\/schedule(?:\?[^#]*)?$/.test(value) ? value : null;
}
