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
import { idempotencyHeaders } from './idempotency';

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeAdminStats(source = {}) {
  return {
    updatedAt: source.updatedAt,
    fromUtc: source.fromUtc,
    period: source.period,
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
      pendingRefundAmount: toNumber(source.financials?.pendingRefundAmount),
    },
    actionQueue: {
      pendingTutorsCount: toNumber(source.actionQueue?.pendingTutorsCount),
      pendingWithdrawalsCount: toNumber(source.actionQueue?.pendingWithdrawalsCount),
      openReportsCount: toNumber(source.actionQueue?.openReportsCount),
      openDisputesCount: toNumber(source.actionQueue?.openDisputesCount),
    },
  };
}

function normalizeTutorApplication(raw = {}) {
  let parsedDocuments = [];
  if (raw.documentsJson) {
    try {
      parsedDocuments = typeof raw.documentsJson === 'string'
        ? JSON.parse(raw.documentsJson)
        : raw.documentsJson;
    } catch (e) {
      console.warn('Failed to parse documentsJson:', e);
    }
  }

  if (!Array.isArray(parsedDocuments)) parsedDocuments = [];

  return {
    id: raw.id,
    userId: raw.userId ?? null,
    userFullName: raw.userFullName || '',
    userEmail: raw.userEmail || '',
    userPhone: raw.userPhone || '',
    userAvatarUrl: raw.userAvatarUrl || null,
    status: raw.status || 'Pending',
    submittedAt: raw.submittedAt ?? null,
    reviewedAt: raw.reviewedAt ?? null,
    reviewedByAdminName: raw.reviewedByAdminName ?? null,
    rejectionReason: raw.rejectionReason ?? null,
    bio: raw.bio || '',
    education: raw.education || '',
    university: raw.university || '',
    major: raw.major || '',
    degreeLevel: raw.degreeLevel || '',
    certifications: raw.certifications || '',
    subject: raw.subject || '',
    subjectSub: raw.subjectSub || '',
    experienceYears: toNumber(raw.experienceYears, 0),
    methodology: raw.methodology || '',
    achievements: raw.achievements || '',
    documentsJson: raw.documentsJson || null,
    documents: parsedDocuments,
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
    accessFailedCount: toNumber(raw.accessFailedCount, 0),
    isLockedOut: Boolean(raw.isLockedOut),
    avatarUrl: raw.avatarUrl ?? null,
    tutorApplicationStatus: raw.tutorApplicationStatus ?? null,
    createdAt: raw.createdAt ?? null,
  };
}

function normalizeAuditLog(raw = {}) {
  return {
    id: raw.id,
    userId: raw.userId ?? null,
    userName: raw.userName || (raw.userId ? 'Tài khoản chưa có tên hiển thị' : 'Hệ thống'),
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
    tutorAvatarUrl: raw.tutorAvatarUrl ?? null,
    availableBalanceAtRequest: raw.availableBalanceAtRequest ?? null,
    availableBalanceAfterReservation: raw.availableBalanceAfterReservation ?? null,
    bankTransferReference: raw.bankTransferReference ?? null,
    reconciliationNote: raw.reconciliationNote ?? null,
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
  getRevenueChart: months => api.get('/admin/dashboard/revenue-chart', { params: { months } }),
  getPlatformRevenue: () => api.get('/admin/analytics/platform-revenue'),
  getConversations: params => api.get('/admin/investigations/conversations', { params }),
  getConversationMessages: (id, params) => api.get(`/admin/investigations/conversations/${id}/messages`, { params }),
  forceUnpublishService: id => api.post(`/admin/services/${id}/force-unpublish`),
  removeReview: (id, reason) => api.delete(`/admin/reviews/${id}`, { data: { reason } }),
  cancelEnrollment: (id, reason) => api.post(`/admin/enrollments/${id}/cancel`, { reason }),
  getTransactions: params => api.get('/admin/transactions', { params }),
  getTransaction: id => api.get(`/admin/transactions/${id}`),
  getCatalog: (kind, params = {}, trash = false) => api.get(`/admin/${kind}${trash ? '/trash' : ''}`, { params }),
  saveCatalog: (kind, id, payload) => id ? api.put(`/admin/${kind}/${id}`, payload) : api.post(`/admin/${kind}`, payload),
  deleteCatalog: (kind, id) => api.delete(`/admin/${kind}/${id}`),
  restoreCatalog: (kind, id) => api.post(`/admin/${kind}/${id}/restore`),
  async getAllCategories() {
    const items = []; let pageNumber = 1; let page;
    do { page = await adminService.getCatalog('categories', { pageNumber, pageSize: 50 }); items.push(...page.items); pageNumber++; } while (page.hasNextPage);
    return items;
  },
  getTrustReports: ({ status, search, reportType, pageNumber = 1 } = {}) => api.get('/admin/trust-reports', { params: { status: status || undefined, search: search || undefined, reportType: reportType || undefined, pageNumber, pageSize: 10 } }),
  getTrustReport: id => api.get(`/admin/trust-reports/${id}`),
  resolveTrustReport: (id, payload) => api.post(`/admin/trust-reports/${id}/resolve`, payload),
  /** GET /admin/dashboard/stats → AdminDashboardStatsDto (nested) */
  async getStats(period = 'All', signal) {
    const res = await api.get('/admin/dashboard/stats', { params: { period }, signal });
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
  async getApplicationDocumentUrl(mediaId) {
    return api.get(`/media/${mediaId}/download-url`);
  },

  /** GET /admin/disputes → PagedResult<DisputeDto> */
  async getDisputes({ status = null, search = '', pageNumber = 1, pageSize = 10 } = {}) {
    const params = { pageNumber, pageSize };
    if (status) params.status = status;
    if (search) params.search = search;
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
  getUserSummary: () => api.get('/admin/users/summary'),
  getUserById: id => api.get(`/admin/users/${id}`),
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
  getAuditOptions: () => api.get('/admin/audit-logs/options'),
  getAuditLog: async id => normalizeAuditLog(await api.get(`/admin/audit-logs/${id}`)),
  async getAuditLogs({
    userId = null,
    entityName = null,
    entityId = null,
    correlationId = null,
    search = '',
    action = '',
    oldestFirst = false,
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
    if (search) params.search = search;
    if (action) params.action = action;
    if (oldestFirst) params.oldestFirst = true;
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

  unbanUser: (id, reason) => api.post(`/admin/users/${id}/unban`, { reason }),

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
  getDisputeSummary: () => api.get('/admin/disputes/summary'),
  previewDisputeAllocation: (id, payload) => api.post(`/admin/disputes/${id}/allocation-preview`, { ...payload, adminNotes: '' }),
  applyDisputeVerdict: (caseId, payload, key) =>
    api.post(`/admin/disputes/${caseId}/resolve`, payload, { headers: idempotencyHeaders(key) }),

  /**
   * GET /admin/withdrawals → PagedResult<WithdrawalDto>
   */
  async getWithdrawals({ status = null, pageNumber = 1, pageSize = 10, search } = {}) {
    const params = { pageNumber, pageSize, search };
    if (status) params.status = status;
    const res = await api.get('/admin/withdrawals', { params });
    return normalizePaged(res, normalizeWithdrawal);
  },

  getWithdrawalSummary: () => api.get('/admin/withdrawals/summary'),

  /** GET /admin/withdrawals/{id} → WithdrawalDto */
  async getWithdrawalById(id) {
    const res = await api.get(`/admin/withdrawals/${id}`);
    return normalizeWithdrawal(res);
  },

  /** POST /admin/withdrawals/{id}/process → WithdrawalDto */
  processWithdrawal: (id) => api.post(`/admin/withdrawals/${id}/process`),

  /** POST /admin/withdrawals/{id}/complete → WithdrawalDto */
  completeWithdrawal: (id, payload, key) => api.post(`/admin/withdrawals/${id}/complete`, payload, { headers: idempotencyHeaders(key) }),

  /** POST /admin/withdrawals/{id}/fail { reason } → WithdrawalDto */
  failWithdrawal: (id, reason) => api.post(`/admin/withdrawals/${id}/fail`, { reason }),
};

export default adminService;
