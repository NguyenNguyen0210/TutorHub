/**
 * Admin Governance Service — /api/v1/admin
 *
 * Contract notes (verified against the running API + backend DTOs):
 * - `api.js` unwrap `ApiResponse<T>` một lần ⇒ `res` ở đây CHÍNH LÀ payload.
 * - GET /admin/dashboard/stats → AdminDashboardStatsDto lồng nhau
 *   (users / tutors / bookings / financials / actionQueue)
 * - GET /admin/audit-logs → PagedResult<AuditLogDto>
 * - GET /admin/users → PagedResult<AdminUserSummaryDto>
 * - GET /admin/tutor-applications → PagedResult<AdminTutorApplicationListItemDto>
 * - GET /admin/disputes → PagedResult<DisputeDto>
 * - GET /admin/disputes/{id}/investigation → DisputeInvestigationDto
 */
import api from './api';

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeAdminStats(source = {}) {
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

function normalizeTutorApplication(raw = {}) {
  return {
    id: raw.id,
    userId: raw.userId ?? null,
    userFullName: raw.userFullName || '',
    userEmail: raw.userEmail || '',
    userAvatarUrl: raw.userAvatarUrl || null,
    status: raw.status || 'Pending',
    submittedAt: raw.submittedAt ?? null,
    reviewedAt: raw.reviewedAt ?? null,
    rejectionReason: raw.rejectionReason ?? null,
    bio: raw.bio || '',
    education: raw.education || '',
    experienceYears: toNumber(raw.experienceYears, 0),
    teachingMode: raw.teachingMode || null,
    address: raw.address || null,
  };
}

function normalizeAdminUser(raw = {}) {
  return {
    id: raw.id,
    email: raw.email || '',
    fullName: raw.fullName || '',
    phone: raw.phone || null,
    role: raw.role || 'Student',
    status: raw.status || 'Active',
    absentStrikes: toNumber(raw.absentStrikes, 0),
    lastAbsentAt: raw.lastAbsentAt ?? null,
    accessFailedCount: toNumber(raw.accessFailedCount, 0),
    isLockedOut: Boolean(raw.isLockedOut),
    tutorApplicationStatus: raw.tutorApplicationStatus ?? null,
    createdAt: raw.createdAt ?? null,
  };
}

function normalizeAuditLog(raw = {}) {
  return {
    id: raw.id,
    userId: raw.userId ?? null,
    userName: raw.userName || 'Hệ thống',
    action: raw.action || '',
    entityName: raw.entityName || '',
    entityId: raw.entityId || '',
    oldValuesJson: raw.oldValuesJson ?? null,
    newValuesJson: raw.newValuesJson ?? null,
    correlationId: raw.correlationId || '',
    ipAddress: raw.ipAddress ?? null,
    userAgent: raw.userAgent ?? null,
    createdAt: raw.createdAt ?? null,
  };
}

function normalizeWithdrawal(raw = {}) {
  return {
    id: raw.id,
    walletId: raw.walletId,
    tutorProfileId: raw.tutorProfileId,
    tutorName: raw.tutorName || '',
    tutorEmail: raw.tutorEmail || '',
    amount: toNumber(raw.amount, 0),
    status: raw.status || 'Pending',
    bankName: raw.bankName || '',
    bankCode: raw.bankCode ?? null,
    accountNumber: raw.accountNumber || '',
    accountHolderName: raw.accountHolderName || '',
    note: raw.note ?? null,
    requestedAt: raw.requestedAt ?? null,
    processingStartedAt: raw.processingStartedAt ?? null,
    processingStartedByAdminId: raw.processingStartedByAdminId ?? null,
    processingStartedByAdminName: raw.processingStartedByAdminName ?? null,
    processedAt: raw.processedAt ?? null,
    processedByAdminId: raw.processedByAdminId ?? null,
    processedByAdminName: raw.processedByAdminName ?? null,
    failureReason: raw.failureReason ?? null,
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
    const res = await api.get('/admin/dashboard/stats');
    return normalizeAdminStats(res);
  },

  /**
   * GET /admin/tutor-applications → PagedResult<AdminTutorApplicationListItemDto>
   */
  async getTutorApplications({ status = null, search = '', pageNumber = 1, pageSize = 10 } = {}) {
    const params = { pageNumber, pageSize };
    if (status) params.status = status;
    if (search) params.search = search;
    const res = await api.get('/admin/tutor-applications', { params });
    return normalizePaged(res, normalizeTutorApplication);
  },

  /** GET /admin/disputes → PagedResult<DisputeDto> */
  async getDisputes({ status = null, pageNumber = 1, pageSize = 10 } = {}) {
    const params = { pageNumber, pageSize };
    if (status) params.status = status;
    const res = await api.get('/admin/disputes', { params });
    return res;
  },

  /** GET /admin/disputes/{id}/investigation → DisputeInvestigationDto */
  async getDisputeDetail(id) {
    const res = await api.get(`/admin/disputes/${id}/investigation`);
    return res;
  },

  /**
   * GET /admin/users → PagedResult<AdminUserSummaryDto>
   */
  async getUsers({ search = '', role = null, status = null, pageNumber = 1, pageSize = 10 } = {}) {
    const params = { pageNumber, pageSize };
    if (search) params.search = search;
    if (role) params.role = role;
    if (status) params.status = status;
    const res = await api.get('/admin/users', { params });
    return normalizePaged(res, normalizeAdminUser);
  },

  /**
   * GET /admin/audit-logs → AdminAuditLogListResponseDto
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
    const params = { pageNumber, pageSize };
    if (userId) params.userId = userId;
    if (entityName) params.entityName = entityName;
    if (entityId) params.entityId = entityId;
    if (correlationId) params.correlationId = correlationId;
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;
    const res = await api.get('/admin/audit-logs', { params });
    return normalizePaged(res, normalizeAuditLog);
  },

  /** POST /admin/tutor-applications/{id}/approve → AdminTutorApplicationDto */
  approveTutorApplication: (id) => api.post(`/admin/tutor-applications/${id}/approve`),

  /** POST /admin/tutor-applications/{id}/reject { reason } → AdminTutorApplicationDto */
  rejectTutorApplication: (id, reason) =>
    api.post(`/admin/tutor-applications/${id}/reject`, { reason }),

  /** POST /admin/users/{id}/suspend { reason } → AdminUserSummaryDto */
  suspendUser: (id, reason = 'Vi phạm quy chế sàn') =>
    api.post(`/admin/users/${id}/suspend`, { reason }),

  /** POST /admin/users/{id}/reactivate → AdminUserSummaryDto */
  reactivateUser: (id) =>
    api.post(`/admin/users/${id}/reactivate`),

  /** POST /admin/users/{id}/ban { reason } → AdminUserSummaryDto */
  banUser: (id, reason = 'Vi phạm nghiêm trọng quy chế sàn') =>
    api.post(`/admin/users/${id}/ban`, { reason }),

  /** POST /admin/disputes/{id}/under-review → DisputeDto */
  moveDisputeUnderReview: (id) =>
    api.post(`/admin/disputes/${id}/under-review`),

  /**
   * POST /admin/disputes/{id}/resolve → DisputeDto
   * Body: { decision, customRefundAmount, adminNotes }
   * decision ∈ StudentWinsFullRefund | StudentWinsPartialRefund | TutorWinsReleaseEarning | DismissedNoFinancialChange
   */
  applyDisputeVerdict: (caseId, { decision, customRefundAmount = null, adminNotes = '' }) =>
    api.post(`/admin/disputes/${caseId}/resolve`, { decision, customRefundAmount, adminNotes }),

  /**
   * GET /admin/withdrawals → PagedResult<WithdrawalDto>
   */
  async getWithdrawals({ status = null, pageNumber = 1, pageSize = 10 } = {}) {
    const params = { pageNumber, pageSize };
    if (status) params.status = status;
    const res = await api.get('/admin/withdrawals', { params });
    return normalizePaged(res, normalizeWithdrawal);
  },

  /** GET /admin/withdrawals/{id} → WithdrawalDto */
  async getWithdrawalById(id) {
    const res = await api.get(`/admin/withdrawals/${id}`);
    return normalizeWithdrawal(res);
  },

  /** POST /admin/withdrawals/{id}/process → WithdrawalDto */
  processWithdrawal: (id) => api.post(`/admin/withdrawals/${id}/process`),

  /** POST /admin/withdrawals/{id}/complete → WithdrawalDto */
  completeWithdrawal: (id) => api.post(`/admin/withdrawals/${id}/complete`),

  /** POST /admin/withdrawals/{id}/fail { reason } → WithdrawalDto */
  failWithdrawal: (id, reason) => api.post(`/admin/withdrawals/${id}/fail`, { reason }),
};

export default adminService;
