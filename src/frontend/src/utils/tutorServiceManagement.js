/** Only return to the tutor's own service listing, preserving its filters. */
export function serviceListingReturn(state) {
  const value = state?.serviceReturn;
  if (!value || typeof value.path !== 'string' || !/^\/tutor\/services(?:\?[^#]*)?$/.test(value.path)) {
    return { path: '/tutor/services' };
  }
  return { path: value.path, key: typeof value.key === 'string' ? value.key : undefined };
}

export function serviceToForm(service) {
  return {
    subjectId: service.subjectId || '',
    title: service.title || '',
    description: service.description || '',
    shortDescription: service.shortDescription || '',
    learningScope: service.learningScope || '',
    expectedOutcome: service.expectedOutcome || '',
    totalSessions: service.totalSessions ?? 1,
    sessionDurationMinutes: service.sessionDurationMinutes ?? 60,
    price: service.price ?? 0,
    trialLessonUrl: service.trialLessonUrl || '',
    trialVideoUrl: service.trialVideoUrl || '',
    trialVideoFile: null,
    coverImageUrl: service.coverImageUrl || '',
    coverImageFile: null,
    tags: Array.isArray(service.tags) ? service.tags.join(', ') : service.tags || '',
    sessions: (service.curriculum || []).map(item => ({
      title: item.title || '', description: item.description || '',
      keyTopicsText: (item.keyTopics || []).join(', '), durationMinutes: item.durationMinutes ?? '',
    })),
    targetAudienceText: (service.targetAudience || []).join('\n'),
    prerequisitesText: (service.prerequisites || []).join('\n'),
    faqs: (service.faqs || []).map(item => ({ question: item.question || '', answer: item.answer || '' })),
  };
}
