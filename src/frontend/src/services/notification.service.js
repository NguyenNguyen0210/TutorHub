/**
 * Notification Service — /api/v1/notifications
 *
 * Verified payloads (curl, seeded student.lan@tutorhub.com):
 * - GET   /notifications            → CursorPagedResult<NotificationDto>
 *   { items: [{ id, userId, title, message, type, deepLink, isRead, readAt, isCritical,
 *     eventId, deduplicationKey, createdAt }], nextCursor, hasMore }
 * - PATCH /notifications/{id}/read  → { success: boolean }   (PATCH, KHÔNG phải POST)
 * - PATCH /notifications/read-all   → { markedCount: number } (PATCH, KHÔNG phải POST)
 * - GET   /notifications/unread-count → { unreadCount: number }
 *
 * Mock: chỉ khi VITE_USE_MOCK === 'true'; lỗi khác được ném lại (ApiError).
 */
import api from './api';
import { USE_MOCK } from '@/config/constants';

const MOCK_NOTIFICATIONS = [
  {
    id: 'ba0aba0a-0001-0000-0000-000000000001',
    userId: '66666666-1111-1111-1111-111111111111',
    title: 'Giải ngân học phí thành công',
    message: 'TutorHub Escrow đã giải ngân 180.000 ₫ cho buổi học đã được xác nhận điểm danh.',
    type: 'SessionPayoutReleased',
    deepLink: '/tutor/wallet',
    isRead: false,
    readAt: null,
    isCritical: false,
    eventId: null,
    deduplicationKey: 'mock:payout-001',
    createdAt: '2026-09-14T13:38:01.747215Z',
  },
  {
    id: 'ba0aba0a-0001-0000-0000-000000000002',
    userId: '66666666-1111-1111-1111-111111111111',
    title: 'Xác nhận điểm danh buổi học #3',
    message: 'Bạn có 24 giờ để kiểm tra và xác nhận điểm danh buổi học vừa kết thúc.',
    type: 'AttendanceReminder',
    deepLink: '/student/sessions/s3s3s3s3-0001-0000-0000-000000000003',
    isRead: false,
    readAt: null,
    isCritical: true,
    eventId: null,
    deduplicationKey: 'mock:attendance-003',
    createdAt: '2026-09-14T12:38:01.747215Z',
  },
];

function normalizeNotification(raw = {}) {
  return {
    id: raw.id,
    userId: raw.userId ?? null,
    title: raw.title || '',
    message: raw.message || '',
    type: raw.type || '',
    deepLink: raw.deepLink ?? null,
    isRead: Boolean(raw.isRead),
    readAt: raw.readAt ?? null,
    isCritical: Boolean(raw.isCritical),
    eventId: raw.eventId ?? null,
    deduplicationKey: raw.deduplicationKey ?? null,
    createdAt: raw.createdAt ?? null,
  };
}

/** CursorPagedResult<NotificationDto> — giữ `nextCursor`/`hasMore` cho phân trang. */
function normalizeCursorPaged(raw) {
  const source = Array.isArray(raw?.items) ? raw.items : [];
  return {
    items: source.map(normalizeNotification),
    nextCursor: raw?.nextCursor ?? null,
    hasMore: Boolean(raw?.hasMore),
  };
}

export const notificationService = {
  /**
   * GET /notifications → CursorPagedResult<NotificationDto>
   * @returns {Promise<{items: object[], nextCursor: string|null, hasMore: boolean}>}
   */
  async getNotifications({ unreadOnly = null, cursor = null, pageSize = 20 } = {}) {
    try {
      const params = { pageSize };
      if (unreadOnly !== null) params.unreadOnly = unreadOnly;
      if (cursor) params.cursor = cursor;
      const res = await api.get('/notifications', { params });
      return normalizeCursorPaged(res);
    } catch (err) {
      if (!USE_MOCK) throw err;
      console.warn('[notificationService] /notifications lỗi, dùng mock (VITE_USE_MOCK=true).', err.message);
      return normalizeCursorPaged({ items: MOCK_NOTIFICATIONS, nextCursor: null, hasMore: false });
    }
  },

  /** GET /notifications/unread-count → { unreadCount } */
  async getUnreadCount() {
    try {
      const res = await api.get('/notifications/unread-count');
      return Number(res?.unreadCount) || 0;
    } catch (err) {
      if (!USE_MOCK) throw err;
      console.warn('[notificationService] /notifications/unread-count lỗi, dùng mock (VITE_USE_MOCK=true).', err.message);
      return MOCK_NOTIFICATIONS.filter((item) => !item.isRead).length;
    }
  },

  /**
   * PATCH /notifications/{id}/read
   * Backend chỉ expose PATCH cho thao tác này (POST trả 405) — xem NotificationsController.cs.
   */
  async markAsRead(id) {
    if (USE_MOCK) {
      const item = MOCK_NOTIFICATIONS.find((notification) => notification.id === id);
      if (item) item.isRead = true;
      return true;
    }
    const res = await api.patch(`/notifications/${id}/read`);
    return res?.success ?? true;
  },

  /**
   * PATCH /notifications/read-all
   * Trả về số thông báo đã đánh dấu (`markedCount`).
   */
  async markAllAsRead() {
    if (USE_MOCK) {
      MOCK_NOTIFICATIONS.forEach((notification) => {
        notification.isRead = true;
      });
      return MOCK_NOTIFICATIONS.length;
    }
    const res = await api.patch('/notifications/read-all');
    return Number(res?.markedCount) || 0;
  },
};

export default notificationService;
