/**
 * Single source of truth for backend enum values → UI label/variant.
 *
 * The .NET API serialises every enum as a PascalCase string (System.Text.Json default),
 * e.g. "Active", "Unscheduled", "Attended" — the values mirror
 * `src/backend/TutorHub.Domain/Enums/*.cs` exactly.
 *
 * `color` is a `Badge` variant (neutral | primary | secondary | success | holding
 * | danger | info) from `components/ui/Badge.jsx` — never an AntD colour name.
 *
 * Never invent variants such as 'ACTIVE', 'SUSPENDED_7D' or 'PENDING_VERIFICATION':
 * a lookup against an invented value silently falls through the map and renders the
 * wrong badge instead of throwing.
 */

export const ACCOUNT_STATUS = {
  ACTIVE: 'Active',
  SUSPENDED: 'Suspended',
  BANNED: 'Banned',
};

export const ACCOUNT_STATUS_META = {
  [ACCOUNT_STATUS.ACTIVE]: { label: 'Đang hoạt động', color: 'success' },
  [ACCOUNT_STATUS.SUSPENDED]: { label: 'Tạm khóa', color: 'holding' },
  [ACCOUNT_STATUS.BANNED]: { label: 'Cấm vĩnh viễn', color: 'danger' },
};

export const SESSION_STATUS = {
  UNSCHEDULED: 'Unscheduled',
  SCHEDULED: 'Scheduled',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export const SESSION_STATUS_META = {
  [SESSION_STATUS.UNSCHEDULED]: { label: 'Chưa xếp lịch', color: 'neutral' },
  [SESSION_STATUS.SCHEDULED]: { label: 'Đã xếp lịch', color: 'info' },
  [SESSION_STATUS.COMPLETED]: { label: 'Hoàn thành', color: 'success' },
  [SESSION_STATUS.CANCELLED]: { label: 'Đã hủy', color: 'danger' },
};

export const ATTENDANCE_STATUS = {
  ATTENDED: 'Attended',
  ABSENT: 'Absent',
};

export const ATTENDANCE_STATUS_META = {
  [ATTENDANCE_STATUS.ATTENDED]: { label: 'Có mặt', color: 'success' },
  [ATTENDANCE_STATUS.ABSENT]: { label: 'Vắng mặt', color: 'danger' },
};

export const TUTOR_APPLICATION_STATUS = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

export const TUTOR_APPLICATION_STATUS_META = {
  [TUTOR_APPLICATION_STATUS.PENDING]: { label: 'Chờ xét duyệt', color: 'holding' },
  [TUTOR_APPLICATION_STATUS.APPROVED]: { label: 'Đã phê duyệt', color: 'success' },
  [TUTOR_APPLICATION_STATUS.REJECTED]: { label: 'Đã từ chối', color: 'danger' },
};

export const WITHDRAWAL_STATUS = {
  PENDING: 'Pending',
  PROCESSING: 'Processing',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
};

export const WITHDRAWAL_STATUS_META = {
  [WITHDRAWAL_STATUS.PENDING]: { label: 'Chờ duyệt', color: 'holding' },
  [WITHDRAWAL_STATUS.PROCESSING]: { label: 'Đang xử lý', color: 'info' },
  [WITHDRAWAL_STATUS.COMPLETED]: { label: 'Hoàn tất', color: 'success' },
  [WITHDRAWAL_STATUS.FAILED]: { label: 'Thất bại', color: 'danger' },
};

export const TEACHING_MODE = {
  ONLINE: 'Online',
  OFFLINE: 'Offline',
  BOTH: 'Both',
};

export const TEACHING_MODE_META = {
  [TEACHING_MODE.ONLINE]: { label: 'Trực tuyến (Online)', color: 'info' },
  [TEACHING_MODE.OFFLINE]: { label: 'Tại nhà (Offline)', color: 'success' },
  [TEACHING_MODE.BOTH]: { label: 'Online & Tại nhà', color: 'primary' },
};

/**
 * Resolve an enum value against a meta map without throwing on unknown input.
 * Unknown values are shown verbatim (so a new backend enum is visible, not hidden).
 */
export function enumMeta(metaMap, value, fallbackLabel = '—') {
  if (value === null || value === undefined || value === '') {
    return { label: fallbackLabel, color: 'neutral' };
  }
  return metaMap[value] ?? { label: String(value), color: 'neutral' };
}

export const getAccountStatusMeta = (value) => enumMeta(ACCOUNT_STATUS_META, value, 'Không rõ');
export const getSessionStatusMeta = (value) => enumMeta(SESSION_STATUS_META, value, 'Không rõ');
export const getAttendanceStatusMeta = (value) =>
  enumMeta(ATTENDANCE_STATUS_META, value, 'Chưa điểm danh');
export const getTutorApplicationStatusMeta = (value) =>
  enumMeta(TUTOR_APPLICATION_STATUS_META, value, 'Không rõ');
export const getWithdrawalStatusMeta = (value) => enumMeta(WITHDRAWAL_STATUS_META, value, 'Không rõ');
export const getTeachingModeMeta = (value) => enumMeta(TEACHING_MODE_META, value, 'Chưa xác định');
