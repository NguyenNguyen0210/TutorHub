// Notification Service - Connected to /api/v1/notifications with graceful fallback
import api from './api';

const MOCK_NOTIFICATIONS = [
  {
    id: 'notif_001',
    category: 'escrow',
    title: 'Giải ngân học phí thành công',
    message: 'TutorHub Escrow đã giải ngân 180.000 ₫ cho ThS. Nguyễn Văn An sau khi buổi học #2 được xác nhận điểm danh hợp lệ.',
    timestamp: '10 phút trước',
    read: false,
    actionType: 'NAVIGATE',
    actionLabel: 'Xem Sổ Cái Ví',
    actionUrl: '/tutor/wallet',
    priority: 'HIGH',
  },
  {
    id: 'notif_002',
    category: 'session',
    title: 'Xác nhận điểm danh buổi học #3',
    message: 'Buổi học Đại Số Tuyến Tính vừa kết thúc lúc 19:30. Gia sư đã tích có mặt. Bạn có 24 giờ để kiểm tra và xác nhận điểm danh.',
    timestamp: '45 phút trước',
    read: false,
    actionType: 'NAVIGATE',
    actionLabel: 'Xác Nhận Điểm Danh Ngay',
    actionUrl: '/student/sessions/s3s3s3s3-0003',
    priority: 'URGENT',
  },
  {
    id: 'notif_003',
    category: 'dispute',
    title: 'Cập nhật phân xử Tranh chấp #DEC-S8-025',
    message: 'Hội đồng trọng tài đã có biên bản phán quyết: Hoàn trả 100% (200.000 ₫) vào tài khoản học viên và áp dụng 1 Strike gia sư do sự cố kỹ thuật.',
    timestamp: '2 giờ trước',
    read: false,
    actionType: 'NAVIGATE',
    actionLabel: 'Xem Quyết Định Trọng Tài',
    actionUrl: '/student/disputes/new',
    priority: 'HIGH',
  }
];

export const notificationService = {
  getNotifications: async () => {
    try {
      const res = await api.get('/notifications');
      if (res && res.data && Array.isArray(res.data.items) && res.data.items.length > 0) {
        return res.data.items;
      }
      return MOCK_NOTIFICATIONS;
    } catch (err) {
      console.warn('[notificationService] Fallback to mock notifications:', err.message);
      return MOCK_NOTIFICATIONS;
    }
  },

  markAsRead: async (id) => {
    try {
      await api.post(`/notifications/${id}/read`);
    } catch (err) {
      console.warn('[notificationService] Fallback markAsRead:', err.message);
    }
    const item = MOCK_NOTIFICATIONS.find(n => n.id === id);
    if (item) item.read = true;
    return true;
  },

  markAllAsRead: async () => {
    try {
      await api.post('/notifications/read-all');
    } catch (err) {
      console.warn('[notificationService] Fallback markAllAsRead:', err.message);
    }
    MOCK_NOTIFICATIONS.forEach(n => n.read = true);
    return true;
  }
};

export default notificationService;
