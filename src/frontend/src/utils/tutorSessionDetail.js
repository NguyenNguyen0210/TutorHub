import { sessionTime } from './tutorSchedule.js';

/** Mirror existing permissions: no meeting-room feature, completed-only write-once records. */
export function tutorSessionPermissions(session, enrollment, record, now = Date.now()) {
  const active = enrollment?.status === 'Active';
  const start = sessionTime(session.startAt);
  const end = sessionTime(session.endAt);
  return {
    canSchedule: active && (session.status === 'Unscheduled' || (session.status === 'Scheduled' && start >= now + 2 * 3600000)),
    canCreateRecord: session.status === 'Completed' && !record,
    currentWindow: session.status === 'Scheduled' && start <= now && end > now,
    pastWindow: session.status === 'Scheduled' && end <= now,
  };
}
