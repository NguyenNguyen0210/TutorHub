/**
 * Admin Governance Service — /api/v1/admin
 *
 * Contract notes (verified against the running API + backend DTOs):
 * - `admin.js` đã unwrap `ApiResponse<T>` một lần ⇒ `res` ở đây CHÍNH LÀ payload.
 * - GET /admin/dashboard/stats → AdminDashboardStatsDto **lồng nhau**
 *   (users / tutors / bookings / financials / actionQueue), KHÔNG phải phẳng.
 * - GET /admin/audit-logs → AdminAuditLogListResponseDto { items, totalCount, pageNumber, pageSize }.
 *   Field thật: userName, action, entityName, entityId, oldValuesJson, newValuesJson,
 *   correlationId, ipAddress, userAgent, createdAt. KHÔNG có integrity hash — không bịa.
 * - GET /admin/users → PagedResult<AdminUserSummaryDto>; `status` là chuỗi PascalCase
 *   ("Active" | "Suspended" | "Banned") — không upper-case thành 'ACTIVE'.
 * - GET /admin/tutor-applications → PagedResult<AdminTutorApplicationListItemDto>
 *   với các field `userFullName` / `userEmail` / `userAvatarUrl` / `submittedAt`.
 *
 * Mock: chỉ khi VITE_USE_MOCK === 'true'; mọi lỗi khác được ném lại (ApiError).
 */
import api from './api';
import { USE_MOCK } from '@/config/constants';
import { ACCOUNT_STATUS, TUTOR_APPLICATION_STATUS } from '@/config/enums';

const MOCK_ADMIN_STATS = {
  users: { totalUsers: 1248, totalStudents: 1180, totalTutors: 68, activeUsers: 1215 },
  tutors: { verifiedTutors: 60, pendingReviewTutors: 4, draftTutors: 2, rejectedTutors: 2, suspendedTutors: 2 },
  bookings: { totalBookings: 15, holdingBookings: 0, paidBookings: 10, cancelledBookings: 5, expiredBookings: 0 },
  financials: {
    totalGmv: 1420000000,
    netGmv: 1278000000,
    totalPlatformRevenue: 142000000,
    totalTutorPayouts: 1278000000,
    totalRefundedAmount: 0,
  },
  actionQueue: { pendingTutorsCount: 4, pendingWithdrawalsCount: 3, openReportsCount: 2 },
};

const MOCK_TUTOR_APPLICATIONS = [
  {
    id: '22222222-aaaa-aaaa-aaaa-000000000010',
    userId: '44444444-2222-1111-1111-111111111111',
    userFullName: 'ThS. Nguyễn Văn An',
    userEmail: 'tutor.an@tutorhub.com',
    userAvatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=an',
    status: TUTOR_APPLICATION_STATUS.PENDING,
    submittedAt: '2026-09-14T08:38:01.747215Z',
    reviewedAt: null,
    rejectionReason: null,
  },
  {
    id: '22222222-aaaa-aaaa-aaaa-000000000009',
    userId: '44444444-3333-1111-1111-111111111111',
    userFullName: 'Trần Thị Bích',
    userEmail: 'tutor.bich@tutorhub.com',
    userAvatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bich',
    status: TUTOR_APPLICATION_STATUS.PENDING,
    submittedAt: '2026-09-13T13:38:01.747215Z',
    reviewedAt: null,
    rejectionReason: null,
  },
];

const MOCK_DISPUTE_INVESTIGATION = {
  dispute: {
    id: 'ba07ba07-0001-0000-0000-000000000003',
    sessionId: 's3s3s3s3-0001-0000-0000-000000000003',
    reason: 'TutorNoShow',
    description: 'Học viên chờ 30 phút nhưng gia sư không vào phòng học.',
    status: 'Open',
    heldAmount: 200000,
    createdAt: '2026-09-14T19:00:00Z',
  },
  session: {
    id: 's3s3s3s3-0001-0000-0000-000000000003',
    sessionNumber: 3,
    status: 'Scheduled',
    startAt: '2026-09-14T18:00:00Z',
    endAt: '2026-09-14T19:00:00Z',
    earningAmount: 180000,
    isPayoutReleased: false,
    studentAttendance: 'Attended',
    tutorAttendance: 'Absent',
    hasAttendanceConflict: true,
  },
  enrollment: {
    id: 'e1e1e1e1-0001-0000-0000-000000000001',
    bookingId: 'b1b1b1b1-0001-0000-0000-000000000001',
    status: 'Active',
    totalAmount: 2000000,
    totalSessions: 10,
    completedSessions: 2,
    platformFeeRate: 0.1,
    feePolicyVersion: 1,
  },
  conversationSnippet: [],
  financialSummary: {
    disputedGrossAmount: 200000,
    originalPlatformFee: 20000,
    originalTutorNet: 180000,
    tutorAvailableBalance: 900000,
    tutorHeldBalance: 0,
    tutorWithdrawableBalance: 900000,
    isPayoutReleased: false,
  },
};

const MOCK_USERS = [
  {
    id: '55555555-6666-1111-1111-111111111111',
    email: 'student.tuan@tutorhub.com',
    fullName: 'Lê Hoàng Tuấn',
    phone: '0933 111 222',
    avatarUrl: null,
    role: 'Student',
    status: ACCOUNT_STATUS.ACTIVE,
    createdAt: '2026-08-15T13:38:01.747215Z',
    absentStrikes: 0,
    tutorApplicationStatus: null,
  },
  {
    id: '55555555-4444-1111-1111-111111111111',
    email: 'student.bad@tutorhub.com',
    fullName: 'Trần Văn Bùng',
    phone: '0944 222 333',
    avatarUrl: null,
    role: 'Student',
    status: ACCOUNT_STATUS.SUSPENDED,
    createdAt: '2026-07-10T13:38:01.747215Z',
    absentStrikes: 2,
    tutorApplicationStatus: null,
  },
];

const MOCK_AUDIT_LOGS = [
  {
    id: 'ba0dba0d-0001-0000-0000-000000000012',
    userId: '11111111-1111-1111-1111-111111111111',
    userName: 'Quản Trị Viên Hệ Thống',
    action: 'ResolveDispute',
    entityName: 'Dispute',
    entityId: 'ba07ba07-0001-0000-0000-000000000003',
    oldValuesJson: '{"Status":"UnderReview"}',
    newValuesJson: '{"Status":"Dismissed"}',
    correlationId: 'corr-admin-012',
    ipAddress: '127.0.0.1',
    userAgent: 'TutorHub Admin',
    createdAt: '2026-09-11T13:38:01.747215Z',
  },
];

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/** AdminDashboardStatsDto (nested) → object luôn có đủ 5 nhánh để UI không vỡ. */
function normalizeAdminStats(raw) {
  const source = raw ?? {};
  return {
    users: {
      totalUsers: toNumber(source.users?.totalUsers),
      totalStudents: toNumber(source.users?.totalStudents),
      totalTutors: toNumber(source.users?.totalTutors),
      activeUsers: toNumber(source.users?.activeUsers),
    },
    tutors: {
      verifiedTutors: toNumber(source.tutors?.verifiedTutors),
      pendingReviewTutors: toNumber(source.tutors?.pendingReviewTutors),
      draftTutors: toNumber(source.tutors?.draftTutors),
      rejectedTutors: toNumber(source.tutors?.rejectedTutors),
      suspendedTutors: toNumber(source.tutors?.suspendedTutors),
    },
    bookings: {
      totalBookings: toNumber(source.bookings?.totalBookings),
      holdingBookings: toNumber(source.bookings?.holdingBookings),
      paidBookings: toNumber(source.bookings?.paidBookings),
      cancelledBookings: toNumber(source.bookings?.cancelledBookings),
      expiredBookings: toNumber(source.bookings?.expiredBookings),
    },
    financials: {
      totalGmv: toNumber(source.financials?.totalGmv),
      netGmv: toNumber(source.financials?.netGmv),
      totalPlatformRevenue: toNumber(source.financials?.totalPlatformRevenue),
      totalTutorPayouts: toNumber(source.financials?.totalTutorPayouts),
      totalRefundedAmount: toNumber(source.financials?.totalRefundedAmount),
    },
    actionQueue: {
      pendingTutorsCount: toNumber(source.actionQueue?.pendingTutorsCount),
      pendingWithdrawalsCount: toNumber(source.actionQueue?.pendingWithdrawalsCount),
      openReportsCount: toNumber(source.actionQueue?.openReportsCount),
    },
  };
}

/** AdminUserSummaryDto → view model. `status` giữ nguyên PascalCase của backend. */
function normalizeAdminUser(raw = {}) {
  return {
    id: raw.id,
    email: raw.email || '',
    fullName: raw.fullName || raw.email || '',
    phone: raw.phone ?? null,
    avatarUrl: raw.avatarUrl ?? null,
    role: raw.role ?? null,
    status: raw.status ?? null,
    absentStrikes: toNumber(raw.absentStrikes, 0),
    tutorApplicationStatus: raw.tutorApplicationStatus ?? null,
    createdAt: raw.createdAt ?? null,
  };
}

/** AdminTutorApplicationListItemDto → view model (field `user*`). */
function normalizeTutorApplication(raw = {}) {
  return {
    id: raw.id,
    userId: raw.userId,
    userFullName: raw.userFullName || raw.userEmail || '',
    userEmail: raw.userEmail || '',
    userAvatarUrl: raw.userAvatarUrl ?? null,
    status: raw.status ?? null,
    submittedAt: raw.submittedAt ?? null,
    reviewedAt: raw.reviewedAt ?? null,
    rejectionReason: raw.rejectionReason ?? null,
  };
}

function safeParseJson(value) {
  if (!value) return null;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

/** AuditLogDto → view model: giữ nguyên field thật, bỏ mọi giá trị bịa (vd. hash). */
function normalizeAuditLog(raw = {}) {
  return {
    ...raw,
    userName: raw.userName ?? null,
    action: raw.action || '',
    entityName: raw.entityName || '',
    entityId: raw.entityId || '',
    correlationId: raw.correlationId || '',
    createdAt: raw.createdAt ?? null,
    oldValues: safeParseJson(raw.oldValuesJson),
    newValues: safeParseJson(raw.newValuesJson),
  };
}

function normalizePaged(raw, normalizeItem) {
  const source = Array.isArray(raw?.items) ? raw.items : [];
  const items = source.map(normalizeItem);
  return {
    items,
    totalCount: toNumber(raw?.totalCount, items.length),
    pageNumber: toNumber(raw?.pageNumber, 1),
    pageSize: toNumber(raw?.pageSize, items.length),
    totalPages: toNumber(raw?.totalPages, items.length > 0 ? 1 : 0),
    hasPreviousPage: Boolean(raw?.hasPreviousPage),
    hasNextPage: Boolean(raw?.hasNextPage),
  };
}

export const adminService = {
  /** GET /admin/dashboard/stats → AdminDashboardStatsDto (nested) */
  async getStats() {
    try {
      const res = await api.get('/admin/dashboard/stats');
      return normalizeAdminStats(res);
    } catch (err) {
      if (!USE_MOCK) throw err;
      console.warn('[adminService] /admin/dashboard/stats lỗi, dùng mock (VITE_USE_MOCK=true).', err.message);
      return normalizeAdminStats(MOCK_ADMIN_STATS);
    }
  },

  /**
   * GET /admin/tutor-applications → PagedResult<AdminTutorApplicationListItemDto>
   * @returns {Promise<{items: object[], totalCount: number, pageNumber: number, pageSize: number, totalPages: number, hasPreviousPage: boolean, hasNextPage: boolean}>}
   */
  async getTutorApplications({ status = null, search = '', pageNumber = 1, pageSize = 10 } = {}) {
    try {
      const params = { pageNumber, pageSize };
      if (status) params.status = status;
      if (search) params.search = search;
      const res = await api.get('/admin/tutor-applications', { params });
      return normalizePaged(res, normalizeTutorApplication);
    } catch (err) {
      if (!USE_MOCK) throw err;
      console.warn('[adminService] /admin/tutor-applications lỗi, dùng mock (VITE_USE_MOCK=true).', err.message);
      return normalizePaged(
        { items: MOCK_TUTOR_APPLICATIONS, totalCount: MOCK_TUTOR_APPLICATIONS.length, pageNumber, pageSize },
        normalizeTutorApplication,
      );
    }
  },

  /** GET /admin/disputes/{id}/investigation → DisputeInvestigationDto */
  async getDisputeDetail(id) {
    try {
      const res = await api.get(`/admin/disputes/${id}/investigation`);
      return res;
    } catch (err) {
      if (!USE_MOCK) throw err;
      console.warn('[adminService] /admin/disputes/:id/investigation lỗi, dùng mock (VITE_USE_MOCK=true).', err.message);
      return MOCK_DISPUTE_INVESTIGATION;
    }
  },

  /**
   * GET /admin/users → PagedResult<AdminUserSummaryDto>
   * @returns {Promise<{items: object[], totalCount: number, pageNumber: number, pageSize: number, totalPages: number, hasPreviousPage: boolean, hasNextPage: boolean}>}
   */
  async getUsers({ search = '', role = null, status = null, pageNumber = 1, pageSize = 10 } = {}) {
    try {
      const params = { pageNumber, pageSize };
      if (search) params.search = search;
      if (role) params.role = role;
      if (status) params.status = status;
      const res = await api.get('/admin/users', { params });
      return normalizePaged(res, normalizeAdminUser);
    } catch (err) {
      if (!USE_MOCK) throw err;
      console.warn('[adminService] /admin/users lỗi, dùng mock (VITE_USE_MOCK=true).', err.message);
      return normalizePaged(
        { items: MOCK_USERS, totalCount: MOCK_USERS.length, pageNumber, pageSize },
        normalizeAdminUser,
      );
    }
  },

  /**
   * GET /admin/audit-logs → AdminAuditLogListResponseDto
   * @returns {Promise<{items: object[], totalCount: number, pageNumber: number, pageSize: number, totalPages: number, hasPreviousPage: boolean, hasNextPage: boolean}>}
   */
  async getAuditLogs({
    userId = null,
    entityName = null,
    entityId = null,
    correlationId = null,
    dateFrom = null,
    dateTo = null,
    pageNumber = 1,
    pageSize = 20,
  } = {}) {
    try {
      const params = { pageNumber, pageSize };
      if (userId) params.userId = userId;
      if (entityName) params.entityName = entityName;
      if (entityId) params.entityId = entityId;
      if (correlationId) params.correlationId = correlationId;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      const res = await api.get('/admin/audit-logs', { params });
      return normalizePaged(res, normalizeAuditLog);
    } catch (err) {
      if (!USE_MOCK) throw err;
      console.warn('[adminService] /admin/audit-logs lỗi, dùng mock (VITE_USE_MOCK=true).', err.message);
      return normalizePaged(
        { items: MOCK_AUDIT_LOGS, totalCount: MOCK_AUDIT_LOGS.length, pageNumber, pageSize },
        normalizeAuditLog,
      );
    }
  },

  /** POST /admin/tutor-applications/{id}/approve → AdminTutorApplicationDto */
  approveTutorApplication: (id) => api.post(`/admin/tutor-applications/${id}/approve`),

  /** POST /admin/tutor-applications/{id}/reject { reason } → AdminTutorApplicationDto */
  rejectTutorApplication: (id, reason) =>
    api.post(`/admin/tutor-applications/${id}/reject`, { reason }),

  /**
   * POST /admin/disputes/{id}/resolve → DisputeDto
   * Body thật của AdminResolveDisputeRequest: { decision, customRefundAmount, adminNotes }
   * với `decision` ∈ StudentWinsFullRefund | StudentWinsPartialRefund |
   * TutorWinsReleaseEarning | DismissedNoFinancialChange.
   */
  applyDisputeVerdict: (caseId, { decision, customRefundAmount = null, adminNotes = '' }) =>
    api.post(`/admin/disputes/${caseId}/resolve`, { decision, customRefundAmount, adminNotes }),

  /**
   * KNOWN GAP: backend không có endpoint "set strike" (AbsentStrikes do job điểm danh
   * tự tính, admin chỉ Suspend/Reactivate/Ban qua /admin/users/{id}/suspend|reactivate|ban).
   * Vì vậy hàm này chỉ hoạt động ở mock mode; ngoài mock mode nó ném lỗi rõ ràng
   * thay vì trả về trạng thái bịa.
   */
  async updateUserStrike(userId, delta) {
    if (!USE_MOCK) {
      throw new Error(
        'adminService.updateUserStrike: backend chưa có endpoint cập nhật strike. Dùng /admin/users/{id}/suspend|reactivate|ban.',
      );
    }
    const user = MOCK_USERS.find((item) => item.id === userId);
    if (user) {
      user.absentStrikes = Math.max(0, user.absentStrikes + delta);
      if (user.absentStrikes >= 3) user.status = ACCOUNT_STATUS.BANNED;
      else if (user.absentStrikes > 0) user.status = ACCOUNT_STATUS.SUSPENDED;
      else user.status = ACCOUNT_STATUS.ACTIVE;
    }
    return user;
  },
};

export default adminService;
