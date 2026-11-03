export const DISPUTE_REASONS = {
  TutorNoShow: 'Gia sư không tham gia buổi học', TutorLate: 'Gia sư vào muộn',
  IncompleteSession: 'Buổi học không đủ thời lượng', ShortDuration: 'Buổi học không đủ thời lượng',
  QualityIssue: 'Chất lượng buổi học', InappropriateBehavior: 'Hành vi không phù hợp',
  TechnicalFailure: 'Sự cố kỹ thuật', Other: 'Lý do khác',
};
export const CLOSED_DISPUTES = ['Resolved', 'Dismissed'];
export const REVIEW_DISPUTES = ['UnderReview', 'RequiresAdminFinancialIntervention', 'RequiresAdminRefundSettlement'];
export const DISPUTE_FILTERS = [
  ['all', 'Tất cả'], ['Open', 'Đã tiếp nhận'], ['review', 'Đang xử lý'], ['closed', 'Đã kết thúc'],
];
export function lastDisputeActivity(item) {
  const dates = [item.createdAt, item.updatedAt, item.resolvedAt,
    ...(item.responses || []).map(value => value.createdAt), ...(item.evidences || []).map(value => value.createdAt)];
  return dates.filter(value => value && Number.isFinite(Date.parse(value)))
    .sort((a, b) => Date.parse(b) - Date.parse(a))[0] || null;
}
const searchable = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase().trim();
export function filterDisputes(items, status, search) {
  const term = searchable(search);
  return items.filter(item => (status === 'all' || (status === 'active' ? !CLOSED_DISPUTES.includes(item.status)
    : status === 'closed' ? CLOSED_DISPUTES.includes(item.status) : status === 'review' ? REVIEW_DISPUTES.includes(item.status) : item.status === status))
    && searchable([item.studentName, item.tutorName, item.serviceTitle, item.subjectName,
      DISPUTE_REASONS[item.reason], item.initiatorName, item.respondentName].join(' ')).includes(term))
    .sort((a, b) => (Date.parse(lastDisputeActivity(b)) || 0) - (Date.parse(lastDisputeActivity(a)) || 0) || String(a.id).localeCompare(String(b.id)));
}
