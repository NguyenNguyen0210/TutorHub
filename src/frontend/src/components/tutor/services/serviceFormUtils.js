import { TEACHING_MODE } from '@/config/enums';

export const SHORT_DESCRIPTION_MAX = 200;
export const DESCRIPTION_MAX = 2000;
export const TAGS_MAX = 10;
export const AUDIENCE_MAX = 8;
export const FAQ_MAX = 10;

export const EMPTY_SESSION = { title: '', description: '', keyTopicsText: '', durationMinutes: '' };
export const EMPTY_FAQ = { question: '', answer: '' };

/**
 * Parse a comma-separated tags string into a trimmed, deduped array
 * (case-insensitive dedupe, first occurrence wins).
 */
export function parseTags(raw) {
  if (!raw) return [];
  const seen = new Set();
  const out = [];
  String(raw)
    .split(',')
    .forEach((part) => {
      const tag = part.trim();
      if (!tag) return;
      const key = tag.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      out.push(tag);
    });
  return out;
}

/** Split a textarea value into trimmed non-empty lines. */
export function splitLines(raw) {
  return String(raw || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

export function createInitialFormState(subjectId = '') {
  return {
    subjectId,
    title: '',
    shortDescription: '',
    description: '',
    learningScope: '',
    expectedOutcome: '',
    totalSessions: 10,
    sessionDurationMinutes: 60,
    price: 2000000,
    teachingMode: TEACHING_MODE.ONLINE,
    trialLessonUrl: '',
    tags: '',
    coverImageUrl: '',
    // Section 4 — editor-local shapes (converted to backend payload on submit).
    sessions: [],
    targetAudienceText: '',
    prerequisitesText: '',
    faqs: [],
  };
}

/**
 * Validate the service form. Returns an error message (vi) or null when valid.
 * `mode: 'create'` additionally requires a subject.
 */
export function validateServiceForm(formData, mode = 'update') {
  if (!formData.title.trim() || formData.title.trim().length < 5) {
    return 'Tiêu đề gói học cần tối thiểu 5 ký tự.';
  }

  if (!formData.description.trim() || formData.description.trim().length < 20) {
    return 'Mô tả gói học cần tối thiểu 20 ký tự để học viên nắm rõ lộ trình.';
  }

  const shortDescription = (formData.shortDescription || '').trim();
  if (shortDescription.length > SHORT_DESCRIPTION_MAX) {
    return `Mô tả ngắn tối đa ${SHORT_DESCRIPTION_MAX} ký tự.`;
  }

  const tags = parseTags(formData.tags);
  if (tags.length > TAGS_MAX) {
    return `Tối đa ${TAGS_MAX} thẻ liên quan cho mỗi gói học.`;
  }

  if (Number(formData.totalSessions) < 1) {
    return 'Số buổi học phải từ 1 buổi trở lên.';
  }

  if (Number(formData.price) <= 0) {
    return 'Học phí gói học phải lớn hơn 0 ₫.';
  }

  const totalSessionsNum = Number(formData.totalSessions) || 0;
  const sessions = Array.isArray(formData.sessions) ? formData.sessions : [];
  if (sessions.length > totalSessionsNum) {
    return `Số buổi chi tiết (${sessions.length}) vượt quá tổng số buổi của gói (${totalSessionsNum}).`;
  }
  for (let i = 0; i < sessions.length; i += 1) {
    if (!(sessions[i]?.title || '').trim()) {
      return `Buổi ${i + 1} chưa có tiêu đề. Vui lòng nhập tiêu đề cho từng buổi.`;
    }
  }

  const targetAudience = splitLines(formData.targetAudienceText);
  if (targetAudience.length > AUDIENCE_MAX) {
    return `Đối tượng phù hợp tối đa ${AUDIENCE_MAX} mục (mỗi mục một dòng).`;
  }

  const prerequisites = splitLines(formData.prerequisitesText);
  if (prerequisites.length > AUDIENCE_MAX) {
    return `Điều kiện tiên quyết tối đa ${AUDIENCE_MAX} mục (mỗi mục một dòng).`;
  }

  const faqRows = Array.isArray(formData.faqs) ? formData.faqs : [];
  if (faqRows.length > FAQ_MAX) {
    return `Câu hỏi thường gặp tối đa ${FAQ_MAX} mục.`;
  }

  if (mode === 'create' && !formData.subjectId) {
    return 'Vui lòng chọn môn học cho gói dịch vụ.';
  }

  return null;
}

/**
 * Collect FAQ rows into backend shape. Returns { faqs } or { error }.
 * Split out because empty rows are skipped silently while half-filled rows
 * are a validation error.
 */
export function collectFaqs(formData) {
  const faqRows = Array.isArray(formData.faqs) ? formData.faqs : [];
  const faqs = [];
  for (let i = 0; i < faqRows.length; i += 1) {
    const question = (faqRows[i]?.question || '').trim();
    const answer = (faqRows[i]?.answer || '').trim();
    if (!question && !answer) continue;
    if (!question || !answer) {
      return { error: `Mục hỏi đáp số ${i + 1} cần cả câu hỏi và câu trả lời.` };
    }
    faqs.push({ question, answer });
  }
  return { faqs };
}

/**
 * Convert editor-local shapes back to the backend payload shape.
 * sessionIndex is auto-assigned by position (1-based).
 * `mode: 'create'` includes subjectId + commercial terms.
 * `mode: 'update'` includes commercial terms only when not locked (non-Published).
 */
export function buildServicePayload(formData, { mode = 'create', lockCommercialTerms = false } = {}) {
  const sessions = Array.isArray(formData.sessions) ? formData.sessions : [];
  const curriculum = sessions.map((s, i) => {
    const item = { sessionIndex: i + 1, title: (s.title || '').trim() };
    const desc = (s.description || '').trim();
    if (desc) item.description = desc;
    const topics = parseTags(s.keyTopicsText);
    if (topics.length) item.keyTopics = topics;
    const dur = Number(s.durationMinutes);
    if (dur > 0) item.durationMinutes = dur;
    return item;
  });

  const targetAudience = splitLines(formData.targetAudienceText);
  const prerequisites = splitLines(formData.prerequisitesText);
  const { faqs } = collectFaqs(formData);

  const shortDescription = (formData.shortDescription || '').trim();
  const tags = parseTags(formData.tags);
  const coverImageUrl = (formData.coverImageUrl || '').trim();

  const payload = {
    title: formData.title.trim(),
    description: formData.description.trim(),
    learningScope: formData.learningScope.trim() || null,
    expectedOutcome: formData.expectedOutcome.trim() || null,
    trialLessonUrl: formData.trialLessonUrl.trim() || null,
    ...(shortDescription ? { shortDescription } : {}),
    ...(tags.length ? { tags } : {}),
    ...(coverImageUrl ? { coverImageUrl } : {}),
    ...(curriculum.length ? { curriculum } : {}),
    ...(targetAudience.length ? { targetAudience } : {}),
    ...(prerequisites.length ? { prerequisites } : {}),
    ...(faqs.length ? { faqs } : {}),
  };

  // NOTE: the original drawer comment claims new optional keys are omitted when
  // unused so older backends ignore them safely.
  if (mode === 'create' || !lockCommercialTerms) {
    payload.totalSessions = Number(formData.totalSessions);
    payload.sessionDurationMinutes = Number(formData.sessionDurationMinutes);
    payload.price = Number(formData.price);
    payload.teachingMode = formData.teachingMode;
  }
  if (mode === 'create') {
    payload.subjectId = formData.subjectId;
  }

  return payload;
}
