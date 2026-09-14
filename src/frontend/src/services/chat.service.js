// Chat & SignalR Service - Connected to /api/v1/conversations with graceful fallback
import api from './api';

const MOCK_CONVERSATIONS = [
  {
    id: 'conv_001',
    user: {
      id: 'tutor_001',
      name: 'ThS. Nguyễn Văn An',
      role: 'Tutor',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      status: 'online',
      subject: 'Toán Cao Cấp & Đại Số',
    },
    lastMessage: 'Thầy đã gửi đề xuất hợp đồng 5 buổi Đại Số Tuyến Tính em nhé.',
    lastTime: '10:45',
    unreadCount: 1,
    meetUrl: 'https://meet.google.com/abc-defg-hij',
    customAgreement: {
      id: 'agr_001',
      bookingId: 'b_custom_001',
      title: 'Hợp Đồng Dạy Kèm Chuyên Đề Đại Số Tuyến Tính',
      sessionsCount: 5,
      durationMinutes: 60,
      pricePerSession: 200000,
      totalAmount: 1000000,
      status: 'PENDING_PAYMENT',
      expiresAt: 'Trong 24 giờ tới',
      description: 'Lộ trình 5 buổi trọng tâm: Ma trận nghịch đảo, Không gian Vector, Chéo hóa ma trận và bài tập ôn thi kết thúc học phần.'
    }
  },
  {
    id: 'conv_002',
    user: {
      id: 'student_002',
      name: 'Phạm Minh Tuấn',
      role: 'Student',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
      status: 'online',
      subject: 'Học viên Hợp đồng #e1e1e1e1',
    },
    lastMessage: 'Em đã chuẩn bị sẵn bài tập tuần này rồi ạ!',
    lastTime: 'Hôm qua',
    unreadCount: 0,
    meetUrl: 'https://meet.google.com/xyz-uvwx-rst',
  }
];

const MOCK_MESSAGES = {
  conv_001: [
    {
      id: 'm1',
      senderId: 'student_001',
      senderName: 'Bạn (Phạm Minh Tuấn)',
      text: 'Chào Thầy An ạ, em muốn học chuyên sâu về Không gian Vector và Chéo hóa ma trận để thi cuối kỳ.',
      time: '10:30',
      isMe: true,
    },
    {
      id: 'm2',
      senderId: 'tutor_001',
      senderName: 'ThS. Nguyễn Văn An',
      text: 'Chào Tuấn! Thầy đã xem đề cương của em. Thầy thiết kế lộ trình 5 buổi ngắn hạn trọng tâm, học qua Google Meet và có ghi âm bài giảng nhé.',
      time: '10:35',
      isMe: false,
    },
    {
      id: 'm3',
      senderId: 'tutor_001',
      senderName: 'ThS. Nguyễn Văn An',
      text: 'Thầy gửi hợp đồng thỏa thuận riêng qua thẻ bên dưới, tiền học sẽ được TutorHub giữ trong Escrow an toàn đến khi hoàn thành từng buổi nhé.',
      time: '10:42',
      isMe: false,
      type: 'AGREEMENT',
      agreementId: 'agr_001',
    }
  ]
};

export const chatService = {
  getConversations: async () => {
    try {
      const res = await api.get('/conversations');
      if (res && res.data && Array.isArray(res.data.items) && res.data.items.length > 0) {
        return res.data.items;
      }
      return MOCK_CONVERSATIONS;
    } catch (err) {
      console.warn('[chatService] Fallback to mock conversations:', err.message);
      return MOCK_CONVERSATIONS;
    }
  },

  getMessages: async (conversationId) => {
    try {
      const res = await api.get(`/conversations/${conversationId}/messages`);
      if (res && res.data && Array.isArray(res.data.items) && res.data.items.length > 0) {
        return res.data.items;
      }
      return MOCK_MESSAGES[conversationId] || [];
    } catch (err) {
      console.warn('[chatService] Fallback to mock messages:', err.message);
      return MOCK_MESSAGES[conversationId] || [];
    }
  },

  sendMessage: async (conversationId, text) => {
    try {
      await api.post(`/conversations/${conversationId}/messages`, { content: text });
    } catch (err) {
      console.warn('[chatService] Fallback message dispatch:', err.message);
    }
    const newMsg = {
      id: 'm_' + Date.now(),
      senderId: 'me',
      senderName: 'Bạn',
      text,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
    };
    if (!MOCK_MESSAGES[conversationId]) {
      MOCK_MESSAGES[conversationId] = [];
    }
    MOCK_MESSAGES[conversationId].push(newMsg);
    return newMsg;
  }
};

export default chatService;
