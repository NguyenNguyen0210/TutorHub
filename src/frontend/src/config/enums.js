/**
 * Single source of truth for backend enum values → UI label/color.
 *
 * The .NET API serialises every enum as a PascalCase string (System.Text.Json default),
 * e.g. "Active", "Unscheduled", "Attended" — the values mirror
 * `src/backend/TutorHub.Domain/Enums/*.cs` exactly.
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
  [ACCOUNT_STATUS.SUSPENDED]: { label: 'Tạm khóa', color: 'warning' },
  [ACCOUNT_STATUS.BANNED]: { label: 'Cấm vĩnh viễn', color: 'error' },
};

export const SESSION_STATUS = {
  UNSCHEDULED: 'Unscheduled',
  SCHEDULED: 'Scheduled',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export const SESSION_STATUS_META = {
  [SESSION_STATUS.UNSCHEDULED]: { label: 'Chưa xếp lịch', color: 'default' },
  [SESSION_STATUS.SCHEDULED]: { label: 'Đã xếp lịch', color: 'processing' },
  [SESSION_STATUS.COMPLETED]: { label: 'Hoàn thành', color: 'success' },
  [SESSION_STATUS.CANCELLED]: { label: 'Đã hủy', color: 'error' },
};

export const ATTENDANCE_STATUS = {
  ATTENDED: 'Attended',
  ABSENT: 'Absent',
};

export const ATTENDANCE_STATUS_META = {
  [ATTENDANCE_STATUS.ATTENDED]: { label: 'Có mặt', color: 'success' },
  [ATTENDANCE_STATUS.ABSENT]: { label: 'Vắng mặt', color: 'error' },
};

export const TUTOR_APPLICATION_STATUS = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

export const TUTOR_APPLICATION_STATUS_META = {
  [TUTOR_APPLICATION_STATUS.PENDING]: { label: 'Chờ xét duyệt', color: 'warning' },
  [TUTOR_APPLICATION_STATUS.APPROVED]: { label: 'Đã phê duyệt', color: 'success' },
  [TUTOR_APPLICATION_STATUS.REJECTED]: { label: 'Đã từ chối', color: 'error' },
};

export const WITHDRAWAL_STATUS = {
  PENDING: 'Pending',
  PROCESSING: 'Processing',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
};

export const WITHDRAWAL_STATUS_META = {
  [WITHDRAWAL_STATUS.PENDING]: { label: 'Chờ duyệt', color: 'warning' },
  [WITHDRAWAL_STATUS.PROCESSING]: { label: 'Đang xử lý', color: 'processing' },
  [WITHDRAWAL_STATUS.COMPLETED]: { label: 'Hoàn tất', color: 'success' },
  [WITHDRAWAL_STATUS.FAILED]: { label: 'Thất bại', color: 'error' },
};

export const TEACHING_MODE = {
  ONLINE: 'Online',
  OFFLINE: 'Offline',
  BOTH: 'Both',
};

export const TEACHING_MODE_META = {
  [TEACHING_MODE.ONLINE]: { label: 'Trực tuyến (Online)', color: 'blue' },
  [TEACHING_MODE.OFFLINE]: { label: 'Tại nhà (Offline)', color: 'green' },
  [TEACHING_MODE.BOTH]: { label: 'Online & Tại nhà', color: 'purple' },
};

/** Backend `DayOfWeek` enum name → Vietnamese label (used for availability). */
export const DAY_OF_WEEK_LABELS = {
  Monday: 'Thứ 2',
  Tuesday: 'Thứ 3',
  Wednesday: 'Thứ 4',
  Thursday: 'Thứ 5',
  Friday: 'Thứ 6',
  Saturday: 'Thứ 7',
  Sunday: 'Chủ Nhật',
};

/**
 * Resolve an enum value against a meta map without throwing on unknown input.
 * Unknown values are shown verbatim (so a new backend enum is visible, not hidden).
 */
export function enumMeta(metaMap, value, fallbackLabel = '—') {
  if (value === null || value === undefined || value === '') {
    return { label: fallbackLabel, color: 'default' };
  }
  return metaMap[value] ?? { label: String(value), color: 'default' };
}

export const getAccountStatusMeta = (value) => enumMeta(ACCOUNT_STATUS_META, value, 'Không rõ');
export const getSessionStatusMeta = (value) => enumMeta(SESSION_STATUS_META, value, 'Không rõ');
export const getAttendanceStatusMeta = (value) =>
  enumMeta(ATTENDANCE_STATUS_META, value, 'Chưa điểm danh');
export const getTutorApplicationStatusMeta = (value) =>
  enumMeta(TUTOR_APPLICATION_STATUS_META, value, 'Không rõ');
export const getWithdrawalStatusMeta = (value) => enumMeta(WITHDRAWAL_STATUS_META, value, 'Không rõ');
export const getTeachingModeMeta = (value) => enumMeta(TEACHING_MODE_META, value, 'Chưa xác định');
export const getDayOfWeekLabel = (dayOfWeekName) =>
  DAY_OF_WEEK_LABELS[dayOfWeekName] ?? dayOfWeekName ?? '';
