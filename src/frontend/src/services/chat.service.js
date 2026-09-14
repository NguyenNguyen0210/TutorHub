// Chat & SignalR Service for Realtime 1-1 Messaging & Custom Agreements
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
      name: 'Lê Hoàng Tuấn',
      role: 'Student',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
      status: 'online',
      subject: 'Học viên Hợp đồng #e1e1e1e1',
    },
    lastMessage: 'Em đã chuẩn bị sẵn bài tập tuần này rồi ạ!',
    lastTime: 'Hôm qua',
    unreadCount: 0,
    meetUrl: 'https://meet.google.com/xyz-uvwx-rst',
  },
  {
    id: 'conv_003',
    user: {
      id: 'admin_support',
      name: 'Hội Đồng Trọng Tài TutorHub',
      role: 'Admin',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      status: 'offline',
      subject: 'Phân Xử Tranh Chấp DEC-S8-025',
    },
    lastMessage: 'Biên bản xử lý khiếu nại DEC-S8-025 đã được lưu vào sổ cái kiểm toán.',
    lastTime: '12/09',
    unreadCount: 0,
  }
];

const MOCK_MESSAGES = {
  conv_001: [
    {
      id: 'm1',
      senderId: 'student_001',
      senderName: 'Bạn (Lê Hoàng Tuấn)',
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
    },
    {
      id: 'm4',
      senderId: 'tutor_001',
      senderName: 'ThS. Nguyễn Văn An',
      text: 'Thầy đã gửi đề xuất hợp đồng 5 buổi Đại Số Tuyến Tính em nhé.',
      time: '10:45',
      isMe: false,
    }
  ]
};

export const chatService = {
  getConversations: async () => {
    return MOCK_CONVERSATIONS;
  },

  getMessages: async (conversationId) => {
    return MOCK_MESSAGES[conversationId] || [];
  },

  sendMessage: async (conversationId, text) => {
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
