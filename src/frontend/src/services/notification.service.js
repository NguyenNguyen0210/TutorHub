// Notification Service - Multi-channel alerts & actions
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
  },
  {
    id: 'notif_004',
    category: 'escrow',
    title: 'Tiền cọc bảo chứng Escrow đã kích hoạt',
    message: 'Hợp đồng 10 buổi #e1e1e1e1 đã được đặt cọc thành công 2.000.000 ₫ qua VNPay. Toàn bộ tiền nằm trong tài khoản ký quỹ trung gian.',
    timestamp: '1 ngày trước',
    read: true,
    actionType: 'NAVIGATE',
    actionLabel: 'Chi Tiết Hợp Đồng',
    actionUrl: '/student/enrollments/e1e1e1e1-0001',
    priority: 'NORMAL',
  },
  {
    id: 'notif_005',
    category: 'session',
    title: 'Lịch học sắp diễn ra sau 60 phút',
    message: 'Lớp Giải Tích Nâng Cao với Gia sư Trần Thị Bích Ngọc sẽ bắt đầu lúc 20:00 tối nay. Nhấp để kiểm tra phòng học Google Meet.',
    timestamp: '1 ngày trước',
    read: true,
    actionType: 'NAVIGATE',
    actionLabel: 'Mở Phòng Học',
    actionUrl: '/student/sessions/s3s3s3s3-0003',
    priority: 'NORMAL',
  },
  {
    id: 'notif_006',
    category: 'system',
    title: 'Cập nhật chính sách sàn DEC-S8',
    message: 'TutorHub đã triển khai cơ chế kiểm toán bất biến Correlation ID và tự động khấu trừ phí sàn 10% minh bạch khi phán quyết tranh chấp.',
    timestamp: '3 ngày trước',
    read: true,
    priority: 'LOW',
  }
];

export const notificationService = {
  getNotifications: async () => {
    return MOCK_NOTIFICATIONS;
  },

  markAsRead: async (id) => {
    const item = MOCK_NOTIFICATIONS.find(n => n.id === id);
    if (item) item.read = true;
    return true;
  },

  markAllAsRead: async () => {
    MOCK_NOTIFICATIONS.forEach(n => n.read = true);
    return true;
  }
};

export default notificationService;
