/**
 * Notification Service — /api/v1/notifications
 *
 * Verified payloads:
 * - GET   /notifications            → CursorPagedResult<NotificationDto>
 * - PATCH /notifications/{id}/read  → { success: boolean }
 * - PATCH /notifications/read-all   → { markedCount: number }
 * - GET   /notifications/unread-count → { unreadCount: number }
 */
import api from './api';
import { HubConnectionBuilder, LogLevel, HttpTransportType } from '@microsoft/signalr';
import { useAuthStore } from '@/store/authStore';
import { notifyWorkspaceActivityChanged } from '@/utils/workspaceActivity';

/**
 * Tạo kết nối SignalR realtime tới /hubs/notifications.
 */
export function createNotificationHubConnection() {
  const hubUrl = import.meta.env.VITE_NOTIFICATION_HUB_URL || 'http://localhost:5129/hubs/notifications';
  return new HubConnectionBuilder()
    .withUrl(hubUrl, {
      accessTokenFactory: () => useAuthStore.getState().accessToken || '',
      transport: HttpTransportType.WebSockets | HttpTransportType.LongPolling,
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000])
    .configureLogging(LogLevel.Warning)
    .build();
}

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

/** CursorPagedResult<NotificationDto> → giữ `nextCursor`/`hasMore` cho phân trang. */
function normalizeCursorPaged(raw) {
  const source = Array.isArray(raw?.items) ? raw.items : [];
  return {
    items: source.map(normalizeNotification),
    nextCursor: raw?.nextCursor ?? null,
    hasMore: Boolean(raw?.hasMore),
  };
}

export const notificationService = {
  async getById(id) {
    try {
      return normalizeNotification(await api.get(`/notifications/${encodeURIComponent(id)}`));
    } catch (error) {
      if (error?.status !== 404) throw error;
      // Rolling frontend/API updates: older APIs expose the owned feed but not
      // the detail route. Resolve the exact ID from that feed, never from another user.
      const userId = useAuthStore.getState().user?.id || useAuthStore.getState().user?.userId;
      const seenCursors = new Set();
      let cursor;
      do {
        const page = await notificationService.getNotifications({ cursor, pageSize: 100 });
        const currentUser = useAuthStore.getState().user;
        if ((currentUser?.id || currentUser?.userId) !== userId) throw error;
        const item = page.items.find(value => String(value.id).toLowerCase() === String(id).toLowerCase());
        if (item) return item;
        if (!page.hasMore || !page.nextCursor || seenCursors.has(page.nextCursor)) break;
        cursor = page.nextCursor;
        seenCursors.add(cursor);
      } while (cursor);
      throw error;
    }
  },
  /**
   * GET /notifications → CursorPagedResult<NotificationDto>
   */
  async getNotifications({ unreadOnly = null, cursor = null, pageSize = 20 } = {}) {
    const params = { pageSize };
    if (unreadOnly !== null) params.unreadOnly = unreadOnly;
    if (cursor) params.cursor = cursor;
    const res = await api.get('/notifications', { params });
    return normalizeCursorPaged(res);
  },

  /** GET /notifications/unread-count → { unreadCount } */
  async getUnreadCount() {
    const res = await api.get('/notifications/unread-count');
    return Number(res?.unreadCount) || 0;
  },

  /**
   * PATCH /notifications/{id}/read
   */
  async markAsRead(id) {
    const res = await api.patch(`/notifications/${id}/read`);
    notifyWorkspaceActivityChanged();
    return res?.success ?? true;
  },

  /**
   * PATCH /notifications/read-all
   */
  async markAllAsRead() {
    const res = await api.patch('/notifications/read-all');
    notifyWorkspaceActivityChanged();
    return Number(res?.markedCount) || 0;
  },
};

export default notificationService;
