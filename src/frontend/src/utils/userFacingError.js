// Presentation only: never mutate the original error, its status or API details.
const MESSAGES = {
  'Invalid email or password.': 'Email hoặc mật khẩu chưa đúng. Vui lòng kiểm tra và nhập lại.',
  'Current password is incorrect.': 'Mật khẩu hiện tại chưa đúng. Vui lòng nhập lại.',
  'Your account has been suspended. Please contact support.': 'Tài khoản đang bị tạm khóa. Vui lòng liên hệ hỗ trợ.',
  'Your account has been banned.': 'Tài khoản đã bị cấm truy cập. Vui lòng liên hệ hỗ trợ nếu cần kiểm tra lại.',
  'This account is temporarily locked. Please try again later.': 'Tài khoản đang tạm khóa đăng nhập. Vui lòng thử lại sau.',
  'Email is required.': 'Vui lòng nhập email.',
  'A valid email is required.': 'Vui lòng nhập email hợp lệ.',
  'Password is required.': 'Vui lòng nhập mật khẩu.',
  'Current password is required.': 'Vui lòng nhập mật khẩu hiện tại.',
  'New password is required.': 'Vui lòng nhập mật khẩu mới.',
  'Password must be at least 6 characters long.': 'Mật khẩu cần ít nhất 6 ký tự.',
  'New password must be at least 6 characters long.': 'Mật khẩu mới cần ít nhất 6 ký tự.',
  'New password must be different from current password.': 'Mật khẩu mới cần khác mật khẩu hiện tại.',
  'Full name is required.': 'Vui lòng nhập họ và tên.',
  'Bank name is required.': 'Vui lòng chọn ngân hàng nhận tiền.',
  'Account number is required.': 'Vui lòng nhập số tài khoản nhận tiền.',
  'Account holder name is required.': 'Vui lòng nhập tên chủ tài khoản.',
  'Top-up amount must be at least 10,000 VND.': 'Số tiền nạp tối thiểu là 10.000 ₫.',
  'Withdrawal amount must be at least 50,000 VND.': 'Số tiền rút tối thiểu là 50.000 ₫.',
  'Insufficient wallet balance.': 'Số dư ví không đủ. Vui lòng kiểm tra số dư hoặc nạp thêm tiền.',
  'Cancellation reason is required.': 'Vui lòng nhập lý do hủy.',
  'Cannot cancel a completed session.': 'Buổi học đã hoàn thành nên không thể hủy.',
  'Cannot cancel a session that has already started.': 'Buổi học đã bắt đầu nên không thể hủy.',
  'Session is already cancelled.': 'Buổi học này đã được hủy. Vui lòng tải lại lịch học.',
  'Cannot reschedule a completed session.': 'Buổi học đã hoàn thành nên không thể đổi lịch.',
  'Cannot reschedule a cancelled session.': 'Buổi học đã hủy nên không thể đổi lịch.',
  'Session EndAt must be after StartAt.': 'Giờ kết thúc phải sau giờ bắt đầu.',
  'Cannot reply to a removed review.': 'Đánh giá đã bị gỡ nên không thể phản hồi.',
  'Review is already removed.': 'Đánh giá này đã được gỡ. Vui lòng tải lại danh sách.',
  'Only registered students have a student wallet.': 'Ví học viên chỉ dành cho tài khoản học viên.',
  'Invalid refresh token.': 'Phiên đăng nhập không còn hợp lệ. Vui lòng đăng nhập lại.',
  'Refresh token has expired.': 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
  'Máy chủ chưa cấu hình đăng nhập Google.': 'Đăng nhập bằng Google tạm thời chưa khả dụng. Vui lòng đăng nhập bằng email.',
  'Liên kết đăng nhập thiếu code hoặc state.': 'Không thể hoàn tất đăng nhập bằng Google. Vui lòng quay lại trang đăng nhập và thử lại.',
  'Không tìm thấy thông tin giao dịch trong URL chuyển hướng.': 'Chưa có thông tin thanh toán. Vui lòng kiểm tra lịch sử thanh toán hoặc liên hệ hỗ trợ.',
  'You have not submitted a tutor application yet. Submit your application first.': 'Bạn chưa gửi hồ sơ gia sư. Hãy gửi hồ sơ trước khi dùng tính năng này.',
  'Your tutor application is still under review. This feature unlocks once an admin approves it.': 'Hồ sơ gia sư đang chờ duyệt. Tính năng này mở sau khi hồ sơ được duyệt.',
  'Your tutor application was rejected. Resubmit it to unlock tutor features.': 'Hồ sơ gia sư đã bị từ chối. Hãy gửi lại hồ sơ để mở khoá tính năng.',
  'Cannot publish service: required fields are missing or invalid.': 'Chưa thể đăng gói học: còn thiếu thông tin bắt buộc (tiêu đề, mô tả, số buổi, thời lượng hoặc học phí).',
};
const TECHNICAL = /request failed|status code|network error|internal server error|exception|stack trace|\bat (?:System|Microsoft)\.|sqlstate|correlation|traceid|\b(?:entity|DTO|payload|endpoint|undefined|null|enum|boolean|fetch|execute|trigger|process|JWT|token|callback|backend|frontend)\b|https?:\/\/|ECONN|ENOTFOUND|\b[A-Za-z_]+(?:Id|At)\b/iu;
const VIETNAMESE = /[\u00c0-\u1ef9\u0110\u0111]/u;
const GENERIC = new Set(['Lỗi xử lý nghiệp vụ', 'Đã có lỗi xảy ra', 'Validation failed']);

export function userFacingError(error, fallback = 'Không thể hoàn tất thao tác. Vui lòng thử lại.') {
  const source = typeof error === 'string' ? { message: error } : error || {};
  const status = source.status ?? source.response?.status;
  const details = source.errors ?? source.response?.data?.errors;
  const candidates = [source.message, source.response?.data?.message, ...(Array.isArray(details) ? details : [])];
  for (const entry of candidates) {
    if (typeof entry !== 'string') continue;
    const message = entry.trim();
    if (GENERIC.has(message)) continue;
    if (Object.hasOwn(MESSAGES, message)) return MESSAGES[message];
    if (message && VIETNAMESE.test(message) && !TECHNICAL.test(message))
      return message.replace(/Mã OTP|mã OTP/g, value => value[0] === 'M' ? 'Mã xác nhận' : 'mã xác nhận')
        .replace(/\bID\b/g, (value, offset) => offset === 0 ? 'Mã' : 'mã');
  }
  if (status === 429) return 'Chưa thể tiếp tục lúc này. Vui lòng chờ một chút rồi thử lại.';
  return fallback;
}
