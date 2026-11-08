import { parseTags, splitLines } from '../components/tutor/services/serviceFormUtils.js';
import { validImageLink } from './trialLessonMedia.js';
import { validateServiceDemoVideo } from './serviceDemoVideo.js';

export const EDITOR_SECTIONS = [
  ['basics', 'Thông tin cơ bản'], ['subject', 'Môn học & thẻ'], ['terms', 'Học phí & thời lượng'],
  ['curriculum', 'Nội dung từng buổi'], ['audience', 'Đối tượng & điều kiện'], ['faq', 'Câu hỏi thường gặp'],
];

/** Point to the actual field, including fields inside collapsed lesson/FAQ editors. */
export function validateServiceEditor(form, service) {
  const fail = (section, fieldId, message) => ({ section, fieldId, message });
  if (form.title.trim().length < 5 || form.title.trim().length > 200) return fail('basics', 'service-title', 'Tên gói học cần từ 5 đến 200 ký tự.');
  if (form.description.trim().length < 20 || form.description.length > 5000) return fail('basics', 'service-desc', 'Mô tả chi tiết cần từ 20 đến 5.000 ký tự.');
  if (form.shortDescription.length > 200) return fail('basics', 'service-short', 'Mô tả ngắn tối đa 200 ký tự.');
  if (form.learningScope.length > 2000) return fail('basics', 'service-scope', 'Phạm vi kiến thức tối đa 2.000 ký tự.');
  if (form.expectedOutcome.length > 2000) return fail('basics', 'service-outcome', 'Cam kết đầu ra tối đa 2.000 ký tự.');
  if (service.status !== 'Published' && !form.coverImageFile && (!validImageLink(form.coverImageUrl) || form.coverImageUrl.length > 1000)) return fail('basics', 'service-cover', 'Ảnh bìa hiện tại không hợp lệ. Vui lòng chọn ảnh khác hoặc xóa ảnh.');
  const videoError = validateServiceDemoVideo(form.trialVideoFile);
  if (videoError) return fail('basics', 'service-demo-video', videoError);
  if (service.status !== 'Published') {
    if (!Number.isInteger(Number(form.totalSessions)) || Number(form.totalSessions) < 1) return fail('terms', 'service-sessions', 'Số buổi phải là số nguyên từ 1 trở lên.');
    if (!Number.isInteger(Number(form.sessionDurationMinutes)) || Number(form.sessionDurationMinutes) < 1) return fail('terms', 'service-duration', 'Thời lượng mỗi buổi phải là số phút nguyên lớn hơn 0.');
    if (!Number.isFinite(Number(form.price)) || Number(form.price) <= 0) return fail('terms', 'service-price', 'Học phí gói phải lớn hơn 0 ₫.');
    if (parseTags(form.tags).length > 10 || parseTags(form.tags).some(tag => tag.length > 30)) return fail('subject', 'service-tags', 'Tối đa 10 thẻ, mỗi thẻ không quá 30 ký tự.');
  }
  if (form.sessions.length > Number(form.totalSessions)) return fail('curriculum', 'curriculum-heading', 'Số nội dung buổi vượt quá số buổi của gói.');
  for (const [index, item] of form.sessions.entries()) {
    if (!item.title.trim() || item.title.length > 200) return fail('curriculum', `service-session-${index}-title`, `Nhập tiêu đề buổi ${index + 1} (tối đa 200 ký tự).`);
    if (item.description.length > 2000) return fail('curriculum', `service-session-${index}-desc`, `Mô tả buổi ${index + 1} tối đa 2.000 ký tự.`);
    const topics = parseTags(item.keyTopicsText);
    if (topics.length > 8 || topics.some(topic => topic.length > 100)) return fail('curriculum', `service-session-${index}-topics`, 'Tối đa 8 trọng tâm, mỗi mục không quá 100 ký tự.');
    if (item.durationMinutes !== '' && (!Number.isInteger(Number(item.durationMinutes)) || Number(item.durationMinutes) < 30 || Number(item.durationMinutes) > 240)) return fail('curriculum', `service-session-${index}-duration`, 'Thời lượng nội dung từ 30 đến 240 phút.');
  }
  for (const [key, id] of [['targetAudienceText', 'service-audience'], ['prerequisitesText', 'service-prereq']]) {
    const items = splitLines(form[key]);
    if (items.length > 8 || items.some(item => item.length > 200)) return fail('audience', id, 'Tối đa 8 mục, mỗi mục không quá 200 ký tự.');
  }
  if (form.faqs.length > 10) return fail('faq', 'faq-heading', 'Tối đa 10 câu hỏi thường gặp.');
  for (const [index, item] of form.faqs.entries()) {
    if (!item.question.trim() || item.question.length > 300) return fail('faq', `service-faq-${index}-q`, `Nhập câu hỏi ${index + 1} (tối đa 300 ký tự), hoặc xóa mục không dùng.`);
    if (!item.answer.trim() || item.answer.length > 2000) return fail('faq', `service-faq-${index}-a`, `Nhập câu trả lời ${index + 1} (tối đa 2.000 ký tự).`);
  }
  return null;
}
