/**
 * Chat Service — /api/v1/conversations
 *
 * Verified payloads (curl, seeded student.lan@tutorhub.com):
 * - GET  /conversations                     → CursorPagedResult<ConversationDto>
 *   { items: [{ id, studentProfileId, studentUserId, studentName, studentAvatarUrl,
 *     tutorProfileId, tutorUserId, tutorName, tutorAvatarUrl, createdAt, lastMessageId,
 *     lastMessageAt, lastMessagePreview, unreadCount }], nextCursor, hasMore }
 * - GET  /conversations/{id}/messages       → CursorPagedResult<MessageDto>
 *   { items: [{ id, conversationId, senderUserId, senderName, senderAvatarUrl, content,
 *     attachmentKey, attachmentName, attachmentContentType, attachmentSize, isRead,
 *     readAt, createdAt }], nextCursor, hasMore }
 * - POST /conversations/{id}/messages       → MessageDto (body { content })
 * - PUT  /conversations/{id}/read           → số message đã đọc
 *
 * Mock: chỉ khi VITE_USE_MOCK === 'true'; lỗi khác được ném lại (ApiError).
 */
import api from './api';
import { USE_MOCK } from '@/config/constants';

const MOCK_CONVERSATIONS = [
  {
    id: 'c0c0c0c0-0001-0000-0000-000000000001',
    studentProfileId: null,
    studentUserId: null,
    studentName: null,
    studentAvatarUrl: null,
    tutorProfileId: '22222222-2222-2222-2222-111111111111',
    tutorUserId: '22222222-1111-1111-1111-111111111111',
    tutorName: 'ThS. Nguyễn Văn An',
    tutorAvatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=an',
    createdAt: '2026-09-10T10:30:00Z',
    lastMessageId: 'ba03ba03-0001-0000-0000-000000000001',
    lastMessageAt: '2026-09-10T10:45:00Z',
    lastMessagePreview: 'Thầy đã gửi đề xuất gói học 5 buổi em nhé.',
    unreadCount: 1,
  },
];

const MOCK_MESSAGES = {
  'c0c0c0c0-0001-0000-0000-000000000001': [
    {
      id: 'ba03ba03-0001-0000-0000-000000000001',
      conversationId: 'c0c0c0c0-0001-0000-0000-000000000001',
      senderUserId: '66666666-1111-1111-1111-111111111111',
      senderName: 'Hoàng Lan Anh',
      senderAvatarUrl: null,
      content: 'Dạ em muốn học chuyên sâu phần Oxyz ạ.',
      attachmentKey: null,
      attachmentName: null,
      attachmentContentType: null,
      attachmentSize: null,
      isRead: true,
      readAt: '2026-09-10T10:46:00Z',
      createdAt: '2026-09-10T10:30:00Z',
    },
  ],
};

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
   * @returns {Promise<{items: object[], nextCursor: string|null, hasMore: boolean}>}
   */
  async getConversations({ cursor = null, pageSize = 20 } = {}) {
    try {
      const params = { pageSize };
      if (cursor) params.cursor = cursor;
      const res = await api.get('/conversations', { params });
      return normalizeCursorPaged(res, normalizeConversation);
    } catch (err) {
      if (!USE_MOCK) throw err;
      console.warn('[chatService] /conversations lỗi, dùng mock (VITE_USE_MOCK=true).', err.message);
      return normalizeCursorPaged(
        { items: MOCK_CONVERSATIONS, nextCursor: null, hasMore: false },
        normalizeConversation,
      );
    }
  },

  /**
   * GET /conversations/{id}/messages → CursorPagedResult<MessageDto>
   * @returns {Promise<{items: object[], nextCursor: string|null, hasMore: boolean}>}
   */
  async getMessages(conversationId, { cursor = null, pageSize = 50 } = {}) {
    try {
      const params = { pageSize };
      if (cursor) params.cursor = cursor;
      const res = await api.get(`/conversations/${conversationId}/messages`, { params });
      return normalizeCursorPaged(res, normalizeMessage);
    } catch (err) {
      if (!USE_MOCK) throw err;
      console.warn('[chatService] /conversations/:id/messages lỗi, dùng mock (VITE_USE_MOCK=true).', err.message);
      return normalizeCursorPaged(
        { items: MOCK_MESSAGES[conversationId] ?? [], nextCursor: null, hasMore: false },
        normalizeMessage,
      );
    }
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
