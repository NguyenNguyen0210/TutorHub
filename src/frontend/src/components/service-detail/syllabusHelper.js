// Display stored curriculum without inventing lessons, topics or qualifications.
export function getDetailedSyllabus(curriculum, sessionDurationMinutes = 0) {
  if (!Array.isArray(curriculum)) return [];
  return curriculum.map(item => ({
    ...item,
    sessionIndex: item.sessionIndex ?? item.session,
    title: item.title || item.topic || '',
    description: item.description || '',
    keyTopics: Array.isArray(item.keyTopics) ? item.keyTopics : [],
    durationMinutes: Number(item.durationMinutes ?? item.duration ?? sessionDurationMinutes) || 0,
  }));
}
