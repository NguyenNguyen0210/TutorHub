/**
 * Bảng ánh xạ tiêu đề tab trình duyệt theo từng trang / route.
 * Chuẩn hóa gọn gàng: Chỉ hiển thị nội dung chính của trang, không kèm hậu tố "| TutorHub".
 */
const STATIC_TITLES = {
  // Discovery & Public
  '/': 'Tìm gia sư',
  '/services': 'Dịch vụ học tập',
  '/how-it-works': 'Cách hoạt động',
  '/become-tutor': 'Trở thành gia sư',
  '/terms': 'Điều khoản sử dụng',
  '/privacy': 'Chính sách bảo mật',
  '/tutor/application': 'Hồ sơ giảng dạy',

  // Authentication
  '/auth/login': 'Đăng nhập',
  '/auth/register': 'Đăng ký tài khoản',
  '/payment/return': 'Kết quả thanh toán',

  // Shared
  '/app/messages': 'Tin nhắn',
  '/app/notifications': 'Thông báo',

  // Student Space
  '/student/dashboard': 'Bàn học của tôi',
  '/student/schedule': 'Lịch học của tôi',
  '/student/bookings': 'Đơn đặt chỗ của tôi',
  '/student/disputes': 'Khiếu nại của tôi',
  '/student/wallet': 'Ví học viên',
  '/student/wallet/topup': 'Nạp tiền ví',
  '/student/wallet/withdraw': 'Rút tiền ví',
  '/student/wishlist': 'Gia sư & Dịch vụ đã lưu',
  '/student/disputes/new': 'Tạo khiếu nại',
  '/student/settings': 'Cài đặt tài khoản',

  // Tutor Space
  '/tutor/dashboard': 'Không gian giảng dạy',
  '/tutor/schedule': 'Lịch dạy',
  '/tutor/services': 'Gói học của tôi',
  '/tutor/services/new': 'Tạo gói học',
  '/tutor/wallet': 'Ví gia sư',
  '/tutor/wallet/withdraw': 'Yêu cầu rút tiền',
  '/tutor/settings': 'Cài đặt tài khoản',

  // Admin Space
  '/admin/dashboard': 'Tổng quan quản trị',
  '/admin/enrollments': 'Hợp đồng học tập',
  '/admin/services': 'Kiểm duyệt gói học',
  '/admin/student-wallets': 'Quản lý ví học viên',
  '/admin/withdrawals': 'Quản lý rút tiền',
  '/admin/disputes': 'Quản lý tranh chấp',
  '/admin/tutor-applications': 'Duyệt hồ sơ gia sư',
  '/admin/users': 'Quản lý người dùng',
  '/admin/categories': 'Quản lý danh mục',
  '/admin/subjects': 'Quản lý môn học',
  '/admin/transactions': 'Giao dịch toàn sàn',
  '/admin/conversations': 'Điều tra hội thoại',
  '/admin/revenue': 'Doanh thu nền tảng',
  '/admin/trust-reports': 'Báo cáo vi phạm',
  '/admin/audit-logs': 'Nhật ký kiểm toán',
  '/admin/settings': 'Cài đặt tài khoản',
};

/**
 * Trả về tiêu đề tab tương ứng với đường dẫn pathname.
 * Hỗ trợ fallback cho các đường dẫn động có chứa tham số ID.
 */
export function getTitleForPathname(pathname) {
  if (STATIC_TITLES[pathname]) {
    return STATIC_TITLES[pathname];
  }

  // Fallback cho các đường dẫn động
  if (/^\/tutor\/services\/[^/]+\/edit$/.test(pathname)) return 'Chỉnh sửa gói học';
  if (pathname.startsWith('/services/') || pathname.startsWith('/service/')) {
    return 'Chi tiết dịch vụ';
  }
  if (pathname.startsWith('/tutors/')) {
    return 'Hồ sơ gia sư';
  }
  if (pathname.includes('/enrollments/')) {
    return 'Chi tiết gói học';
  }
  if (pathname.includes('/sessions/')) {
    return 'Chi tiết buổi học';
  }
  if (pathname.includes('/bookings/') && pathname.includes('/checkout')) {
    return 'Thanh toán giữ chỗ';
  }
  if (pathname.startsWith('/admin/disputes/') || pathname.startsWith('/app/disputes/')) {
    return 'Chi tiết tranh chấp';
  }

  return 'TutorHub';
}
