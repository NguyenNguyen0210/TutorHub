/**
 * Chat Service — /api/v1/conversations
 *
 * Verified payloads:
 * - GET  /conversations                     → CursorPagedResult<ConversationDto>
 * - GET  /conversations/{id}/messages       → CursorPagedResult<MessageDto>
 * - POST /conversations/{id}/messages       → MessageDto (body { content, attachmentKey... })
 * - PUT  /conversations/{id}/read           → số message đã đọc
 */
import api from './api';
import { HubConnectionBuilder, LogLevel, HttpTransportType } from '@microsoft/signalr';
import { useAuthStore } from '@/store/authStore';

/**
 * Tạo kết nối SignalR realtime tới /hubs/chat.
 */
export function createChatHubConnection() {
  const hubUrl = import.meta.env.VITE_SIGNALR_HUB_URL || 'http://localhost:5129/hubs/chat';
  return new HubConnectionBuilder()
    .withUrl(hubUrl, {
      accessTokenFactory: () => useAuthStore.getState().accessToken || '',
      transport: HttpTransportType.WebSockets | HttpTransportType.LongPolling,
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000])
    .configureLogging(LogLevel.Warning)
    .build();
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeConversation(raw = {}) {
  return {
    id: raw.id,
    studentProfileId: raw.studentProfileId ?? null,
    studentUserId: raw.studentUserId ?? null,
    studentName: raw.studentName ?? null,
    studentAvatarUrl: raw.studentAvatarUrl ?? null,
    tutorProfileId: raw.tutorProfileId ?? null,
    tutorUserId: raw.tutorUserId ?? null,
    tutorName: raw.tutorName ?? null,
    tutorAvatarUrl: raw.tutorAvatarUrl ?? null,
    createdAt: raw.createdAt ?? null,
    lastMessageId: raw.lastMessageId ?? null,
    lastMessageAt: raw.lastMessageAt ?? null,
    lastMessagePreview: raw.lastMessagePreview ?? null,
    unreadCount: toNumber(raw.unreadCount, 0),
  };
}

function normalizeMessage(raw = {}) {
  return {
    id: raw.id,
    conversationId: raw.conversationId ?? null,
    senderUserId: raw.senderUserId ?? null,
    senderName: raw.senderName || '',
    senderAvatarUrl: raw.senderAvatarUrl ?? null,
    content: raw.content || '',
    attachmentKey: raw.attachmentKey ?? null,
    attachmentName: raw.attachmentName ?? null,
    attachmentContentType: raw.attachmentContentType ?? null,
    attachmentSize: raw.attachmentSize ?? null,
    isRead: Boolean(raw.isRead),
    readAt: raw.readAt ?? null,
    createdAt: raw.createdAt ?? null,
  };
}

/** CursorPagedResult<T> → giữ `nextCursor`/`hasMore` để UI phân trang tiếp. */
function normalizeCursorPaged(raw, normalizeItem) {
  const source = Array.isArray(raw?.items) ? raw.items : [];
  return {
    items: source.map(normalizeItem),
    nextCursor: raw?.nextCursor ?? null,
    hasMore: Boolean(raw?.hasMore),
  };
}

export const chatService = {
  /**
   * GET /conversations → CursorPagedResult<ConversationDto>
   */
  async getConversations({ cursor = null, pageSize = 20 } = {}) {
    const params = { pageSize };
    if (cursor) params.cursor = cursor;
    const res = await api.get('/conversations', { params });
    return normalizeCursorPaged(res, normalizeConversation);
  },

  /**
   * GET /conversations/{id}/messages → CursorPagedResult<MessageDto>
   */
  async getMessages(conversationId, { cursor = null, pageSize = 50 } = {}) {
    const params = { pageSize };
    if (cursor) params.cursor = cursor;
    const res = await api.get(`/conversations/${conversationId}/messages`, { params });
    return normalizeCursorPaged(res, normalizeMessage);
  },

  /** POST /conversations/{id}/messages → MessageDto */
  async sendMessage(conversationId, content, attachment = null) {
    const body = { content };
    if (attachment) {
      body.attachmentKey = attachment.attachmentKey ?? null;
      body.attachmentName = attachment.attachmentName ?? null;
      body.attachmentContentType = attachment.attachmentContentType ?? null;
      body.attachmentSize = attachment.attachmentSize ?? null;
    }
    const res = await api.post(`/conversations/${conversationId}/messages`, body);
    return normalizeMessage(res);
  },

  /** PUT /conversations/{id}/read → số message đã đánh dấu đã đọc */
  markConversationAsRead: (conversationId) => api.put(`/conversations/${conversationId}/read`),
};

export default chatService;
