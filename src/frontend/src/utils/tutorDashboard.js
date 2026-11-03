/** Summaries use API contract identities, never learner display names. */
export function buildTeachingSummary(enrollments, sessions, now = Date.now()) {
  const active = enrollments.filter(enrollment => enrollment.status === 'Active');
  const activeIds = new Set(active.map(enrollment => enrollment.id));
  const timestamp = value => value ? new Date(value).getTime() : NaN;
  const upcoming = sessions.filter(session => {
    if (session.status !== 'Scheduled' || !activeIds.has(session.enrollmentId)) return false;
    const start = timestamp(session.startAt);
    const end = timestamp(session.endAt) || start + Number(session.durationMinutes || 0) * 60000;
    return Number.isFinite(start) && (start >= now || end > now);
  }).sort((a, b) => timestamp(a.startAt) - timestamp(b.startAt));
  const byEnrollment = new Map();
  sessions.forEach(session => {
    if (!byEnrollment.has(session.enrollmentId)) byEnrollment.set(session.enrollmentId, []);
    byEnrollment.get(session.enrollmentId).push(session);
  });
  const classes = active.map(enrollment => {
    const unscheduled = (byEnrollment.get(enrollment.id) || [])
      .filter(session => session.status === 'Unscheduled')
      .sort((a, b) => a.sessionNumber - b.sessionNumber);
    return { ...enrollment, unscheduledCount: unscheduled.length, nextUnscheduled: unscheduled[0] || null,
      nextSession: upcoming.find(session => session.enrollmentId === enrollment.id) || null };
  }).sort((a, b) => Number(b.unscheduledCount > 0) - Number(a.unscheduledCount > 0)
    || timestamp(b.createdAt) - timestamp(a.createdAt));
  const today = new Date(now).toDateString();
  const validIds = new Set(enrollments.filter(enrollment => ['Active', 'Completed'].includes(enrollment.status)).map(enrollment => enrollment.id));
  const todayCount = sessions.filter(session => validIds.has(session.enrollmentId)
    && ['Scheduled', 'AwaitingPayout', 'Completed'].includes(session.status)
    && session.startAt && new Date(session.startAt).toDateString() === today).length;
  const pendingClasses = classes.filter(enrollment => enrollment.unscheduledCount > 0);
  return { classes, pendingClasses, upcoming, todayCount,
    activeStudentCount: new Set(active.map(enrollment => enrollment.studentProfileId).filter(Boolean)).size,
    unscheduledCount: pendingClasses.reduce((sum, enrollment) => sum + enrollment.unscheduledCount, 0),
    pastClasses: enrollments.filter(enrollment => enrollment.status !== 'Active') };
}

export const classSchedulePath = id => `/tutor/schedule?tab=unscheduled&enrollmentId=${encodeURIComponent(id)}`;
