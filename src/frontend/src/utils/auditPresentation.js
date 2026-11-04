const TYPES = {
  access: { label: 'Truy cập dữ liệu', icon: 'visibility', tone: 'bg-brand-primary-50 text-brand-primary-700' },
  confirmation: { label: 'Xác nhận', icon: 'check_circle', tone: 'bg-success-subtle text-success-strong' },
  change: { label: 'Cập nhật', icon: 'edit', tone: 'bg-holding-subtle text-holding-strong' },
  resolution: { label: 'Xử lý vụ việc', icon: 'gavel', tone: 'bg-insight-subtle text-insight-strong' },
  risk: { label: 'Cảnh báo / thất bại', icon: 'warning', tone: 'bg-danger-subtle text-danger-strong' },
  other: { label: 'Hoạt động khác', icon: 'history', tone: 'bg-neutral-100 text-fg-secondary' },
};
const ACTIONS = {
  ADMIN_CONVERSATION_INSPECTED: ['Quản trị viên xem hội thoại', 'access'],
  TutorApplicationApproved: ['Phê duyệt hồ sơ gia sư', 'confirmation'],
  TutorApplicationRejected: ['Từ chối hồ sơ gia sư', 'resolution'],
  TutorApproved: ['Phê duyệt gia sư', 'confirmation'], TutorRejected: ['Từ chối hồ sơ gia sư', 'resolution'],
  WithdrawalProcessingStarted: ['Tiếp nhận yêu cầu rút tiền', 'change'],
  WithdrawalCompleted: ['Ghi nhận chi trả hoàn tất', 'confirmation'], WithdrawalFailed: ['Ghi nhận chi trả thất bại', 'risk'],
  DisputeCreated: ['Mở tranh chấp', 'change'], DisputeResolved: ['Ra quyết định tranh chấp', 'resolution'],
  RefundSettlementSucceeded: ['Xác nhận đối soát hoàn tiền', 'confirmation'], RefundSettlementFailed: ['Đối soát hoàn tiền thất bại', 'risk'],
  PlatformFeeUpdated: ['Cập nhật phí nền tảng', 'change'],
  USER_SUSPENDED: ['Tạm khóa tài khoản', 'change'], USER_BANNED: ['Cấm truy cập tài khoản', 'change'],
  USER_REACTIVATED: ['Mở lại tài khoản', 'confirmation'], USER_UNBANNED: ['Gỡ cấm tài khoản', 'confirmation'],
  CATEGORY_SOFT_DELETED: ['Chuyển danh mục vào thùng rác', 'change'], CATEGORY_RESTORED: ['Khôi phục danh mục', 'change'],
  SUBJECT_SOFT_DELETED: ['Chuyển môn học vào thùng rác', 'change'], SUBJECT_RESTORED: ['Khôi phục môn học', 'change'],
  SERVICE_FORCE_UNPUBLISHED: ['Gỡ gói học khỏi sàn', 'resolution'], REVIEW_MODERATED: ['Kiểm duyệt đánh giá', 'resolution'],
  ENROLLMENT_CANCELLED: ['Hủy hợp đồng học tập', 'change'], ENROLLMENT_ADMIN_CANCELLED: ['Quản trị viên hủy hợp đồng', 'resolution'],
  ENROLLMENT_TUTOR_CANNOT_CONTINUE: ['Gia sư dừng giảng dạy hợp đồng', 'change'], SESSION_CANCELLED: ['Hủy buổi học', 'change'],
  VNPayConfirmed: ['Xác nhận thanh toán VNPAY', 'confirmation'], VNPayFailed: ['Thanh toán VNPAY thất bại', 'risk'],
  LateIpnRefundRequired: ['Thanh toán đến muộn cần hoàn tiền', 'risk'],
};
export function auditAction(action) {
  const [label, kind] = ACTIONS[action] || (String(action).startsWith('TrustReportResolved_') ? ['Xử lý báo cáo vi phạm', 'resolution'] : ['Hoạt động quản trị khác', 'other']);
  return { ...TYPES[kind], title: label, kind };
}
const ENTITIES = { Conversation: 'Hội thoại', Dispute: 'Tranh chấp', TutorProfile: 'Hồ sơ gia sư', TutorApplication: 'Đơn đăng ký gia sư', PlatformSetting: 'Thiết lập nền tảng', Withdrawal: 'Yêu cầu rút tiền', User: 'Tài khoản', Report: 'Báo cáo vi phạm', Category: 'Danh mục', Subject: 'Môn học', Service: 'Gói học', Enrollment: 'Hợp đồng', Session: 'Buổi học', Review: 'Đánh giá', Wallet: 'Ví', StudentWallet: 'Ví học viên', Transaction: 'Giao dịch', Booking: 'Đơn đặt chỗ' };
export const auditEntity = value => ENTITIES[value] || 'Đối tượng khác';
export const auditEntityOption = value => ENTITIES[value] || `Loại khác (${value})`;
export const shortenAuditId = value => !value ? '—' : String(value).length > 20 ? `${String(value).slice(0, 10)}…${String(value).slice(-6)}` : String(value);
export function auditTime(value, timezone = 'vn') {
  if (!value) return 'Chưa có thời gian';
  const date = new Date(/(?:Z|[+-]\d{2}:\d{2})$/i.test(value) ? value : `${value}Z`);
  if (!Number.isFinite(date.getTime())) return 'Chưa có thời gian';
  return new Intl.DateTimeFormat('vi-VN', { timeZone: timezone === 'utc' ? 'UTC' : 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).format(date);
}
export function parseAuditPayload(raw) {
  const original = raw == null ? '' : typeof raw === 'string' ? raw : JSON.stringify(raw);
  try { const value = JSON.parse(original); return { original, value, valid: true, pretty: JSON.stringify(value, null, 2) }; }
  catch { return { original, value: null, valid: false, pretty: original }; }
}
export function auditRecordedFields(raw) {
  const { value } = parseAuditPayload(raw);
  if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
  const fields = [['operationalReason', 'Lý do truy cập'], ['returnedCount', 'Số kết quả trả về'], ['reason', 'Lý do ghi nhận'], ['adminNotes', 'Căn cứ và kết luận'], ['bankTransferReference', 'Mã chuyển khoản'], ['reconciliationNote', 'Ghi chú đối soát'], ['failureReason', 'Lý do thất bại']];
  return fields.flatMap(([key, label]) => { const entry = value[key] ?? value[key[0].toUpperCase() + key.slice(1)]; return typeof entry === 'string' || typeof entry === 'number' || typeof entry === 'boolean' ? [{ key, label, value: String(entry) }] : []; });
}
const guid = value => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value || '');
export function auditTarget(log) {
  const id = log.entityId;
  if (log.entityName === 'Conversation') {
    const data = parseAuditPayload(log.newValuesJson).value;
    if (guid(data?.disputeId)) return `/admin/conversations?disputeId=${data.disputeId}`;
    if (guid(data?.reportId)) return `/admin/conversations?reportId=${data.reportId}`;
    return null;
  }
  if (!guid(id)) return null;
  const paths = { Dispute: `/admin/disputes/${id}`, Enrollment: `/admin/enrollments/${id}`, Withdrawal: `/admin/withdrawals?withdrawalId=${id}`, User: `/admin/users?userId=${id}`, TutorApplication: `/admin/tutor-applications?applicationId=${id}`, Report: `/admin/trust-reports/${id}` };
  return paths[log.entityName] || null;
}

// Tokens are rendered as React text nodes, never as HTML.
export function auditJsonTokens(raw) {
  const parsed = parseAuditPayload(raw);
  if (!parsed.valid) return [{ text: parsed.pretty, kind: 'plain' }];
  const text = parsed.pretty, tokens = []; let offset = 0;
  for (const match of text.matchAll(/"(?:\\.|[^"\\])*"|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g)) {
    if (match.index > offset) tokens.push({ text: text.slice(offset, match.index), kind: 'plain' });
    const quoted = match[0].startsWith('"');
    tokens.push({ text: match[0], kind: quoted ? text.slice(match.index + match[0].length).trimStart().startsWith(':') ? 'key' : 'string' : /^(true|false|null)$/.test(match[0]) ? 'literal' : 'number' });
    offset = match.index + match[0].length;
  }
  if (offset < text.length) tokens.push({ text: text.slice(offset), kind: 'plain' });
  return tokens;
}
