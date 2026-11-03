import { formatCurrency, formatDateTime } from './formatters';
import { notificationDestination } from './workspaceActivity';

// Presentation for the backend's event types and English templates. Unknown content stays intact.
const TITLES = {
  'Enrollment Activated': 'Hợp đồng đã được kích hoạt',
  'New Student Enrollment': 'Có học viên đăng ký gói học',
  'Enrollment Cancelled': 'Hợp đồng đã hủy',
  'Payment Successful': 'Thanh toán thành công',
  'Course Payment Succeeded': 'Thanh toán gói học thành công',
  'Session Scheduled': 'Buổi học đã được xếp lịch',
  'Session Rescheduled': 'Lịch học đã thay đổi',
  'Session Cancelled': 'Buổi học đã hủy',
  'Upcoming Session Reminder': 'Nhắc lịch học sắp tới',
  'Session Grace Period Started': 'Bắt đầu thời hạn báo cáo sự cố',
  'Session Completed — Payout Pending': 'Buổi học kết thúc, đang chờ giải ngân',
  'Session Completed': 'Buổi học đã hoàn thành',
  'Session Earnings Released': 'Học phí đã được giải ngân',
  'Issue Report Submitted': 'Đã tiếp nhận báo cáo sự cố',
  'Issue Reported by Student': 'Học viên đã báo cáo sự cố',
  'Withdrawal Requested': 'Đã tiếp nhận yêu cầu rút tiền',
  'Withdrawal Completed': 'Rút tiền hoàn tất',
  'Withdrawal Failed': 'Rút tiền không thành công',
  'Refund Initiated': 'Đã bắt đầu xử lý hoàn tiền',
  'Refund Completed': 'Hoàn tiền thành công',
  'Refund Processing Notice': 'Hoàn tiền cần được xử lý thêm',
  'Top-Up Confirmed': 'Nạp tiền thành công',
  'Top-Up Request Rejected': 'Yêu cầu nạp tiền bị từ chối',
  'New Top-Up Request': 'Có yêu cầu nạp tiền mới',
  'New Student Withdrawal Request': 'Có yêu cầu rút tiền của học viên',
  'New Student Review': 'Có đánh giá mới từ học viên',
  'Dispute Opened': 'Đã mở tranh chấp',
  'Dispute Resolved': 'Tranh chấp đã được xử lý',
  'New Tutor Application Submitted': 'Có hồ sơ đăng ký gia sư mới',
  'Tutor Application Approved': 'Hồ sơ gia sư đã được phê duyệt',
  'Tutor Application Update': 'Cập nhật hồ sơ đăng ký gia sư',
  'Trust & Safety Notification': 'Thông báo về hoạt động tài khoản',
  'Official Warning Issued': 'Cảnh báo từ TutorHub',
};
const money = value => formatCurrency(Number(value.replace(/[.,\s]/g, '')));
const issueReason = value => ({ TutorNoShow: 'Gia sư không đến', ShortDuration: 'Thời lượng buổi học không đủ', QualityIssue: 'Vấn đề chất lượng dạy hoặc kết nối' })[value] || value;
const utcTime = (_, day, month, year, hour, minute) => formatDateTime(`${year}-${month}-${day}T${hour}:${minute}:00Z`);
const MESSAGE_RULES = [
  [/^Your enrollment is now active\. You can now schedule your sessions with the tutor\.$/, () => 'Hợp đồng học tập của bạn đã có hiệu lực. Hãy liên hệ gia sư để thống nhất lịch học.'],
  [/^A student has completed enrollment\. You can now coordinate session schedules\.$/, () => 'Học viên đã hoàn tất đăng ký. Bạn có thể trao đổi với học viên để thống nhất lịch học.'],
  [/^Your payment of ([\d.,\s]+) VND has been successfully processed\.$/, (_, amount) => `Khoản thanh toán ${money(amount)} của bạn đã được xử lý thành công.`],
  [/^You successfully paid ([\d.,\s]+) VND from your Student Wallet for course booking\.$/, (_, amount) => `Bạn đã thanh toán ${money(amount)} từ Ví học viên để đăng ký gói học.`],
  [/^(?:Your enrollment|Enrollment) #([^\s]+) has been cancelled\. Reason: ([\s\S]*)$/, (_, id, reason) => `Hợp đồng #${id} đã hủy. Lý do: ${reason}`],
  [/^Session has been cancelled\. Reason: ([\s\S]*)$/, (_, reason) => `Buổi học đã hủy. Lý do: ${reason}`],
  [/^A session has been scheduled for (\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}) UTC\.$/, (...args) => `Buổi học đã được xếp lịch vào ${utcTime(...args)}.`],
  [/^A session has been rescheduled to (\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}) UTC\.$/, (...args) => `Lịch học đã chuyển sang ${utcTime(...args)}.`],
  [/^Reminder: You have a scheduled session on (\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}) UTC\.$/, (...args) => `Bạn có buổi học vào ${utcTime(...args)}. Hãy chuẩn bị trước giờ học.`],
  [/^Your session has ended\. You have 12 hours to report any issues before payout is automatically released\.$/, () => 'Buổi học đã kết thúc. Bạn có 12 giờ để báo cáo sự cố trước khi học phí được tự động giải ngân.'],
  [/^Your session has ended\. Payout will be automatically released after the 12-hour grace period if no issues are reported\.$/, () => 'Buổi học đã kết thúc. Học phí sẽ được giải ngân sau thời hạn báo cáo sự cố 12 giờ nếu không phát sinh báo cáo.'],
  [/^You reported an issue for your session: ([\s\S]*)\. Payout has been frozen pending review\.$/, (_, reason) => `Đã tiếp nhận báo cáo sự cố: ${issueReason(reason)}. Học phí được tạm giữ để xem xét.`],
  [/^The student reported an issue for your session: ([\s\S]*)\. Payout has been temporarily held for review\.$/, (_, reason) => `Học viên báo cáo sự cố: ${issueReason(reason)}. Học phí được tạm giữ để xem xét.`],
  [/^Cửa sổ báo cáo sự cố cho buổi học #(\d+) sắp đóng\. Hạn chót: (\d{2}):(\d{2}) (\d{2})\/(\d{2})\/(\d{4}) UTC\.$/, (_, number, hour, minute, day, month, year) => `Thời hạn báo cáo sự cố cho buổi học #${number} sắp kết thúc. Hạn chót: ${utcTime('', day, month, year, hour, minute)}.`],
  [/^Session attendance was confirmed by both parties and the session is now marked completed\.$/, () => 'Hai bên đã xác nhận tham gia. Buổi học được ghi nhận hoàn thành.'],
  [/^Session attendance was confirmed by both parties and earnings have been credited\.$/, () => 'Hai bên đã xác nhận tham gia và thu nhập buổi học đã được ghi nhận.'],
  [/^Earnings of ([\d.,\s]+) VND have been credited to your available balance\.$/, (_, amount) => `Thu nhập ${money(amount)} đã được cộng vào số dư khả dụng.`],
  [/^Your withdrawal request for ([\d.,\s]+) VND is pending administrator processing\.$/, (_, amount) => `Yêu cầu rút ${money(amount)} đang chờ xử lý.`],
  [/^Your withdrawal request for ([\d.,\s]+) VND has been successfully processed(?: to your bank account)?\.$/, (_, amount) => `Yêu cầu rút ${money(amount)} đã được xử lý thành công.`],
  [/^Your withdrawal for ([\d.,\s]+) VND could not be processed\. Funds have been returned to your available balance\. Reason: ([\s\S]*)$/, (_, amount, reason) => `Không thể xử lý yêu cầu rút ${money(amount)}. Tiền đã được hoàn vào số dư khả dụng. Lý do: ${reason}`],
  [/^A refund of ([\d.,\s]+) VND has been initiated for your enrollment\.$/, (_, amount) => `Khoản hoàn tiền ${money(amount)} cho hợp đồng của bạn đã bắt đầu được xử lý.`],
  [/^Your refund of ([\d.,\s]+) VND has been successfully completed\.$/, (_, amount) => `Khoản hoàn tiền ${money(amount)} đã được xử lý thành công.`],
  [/^Automated refund of ([\d.,\s]+) VND encountered an issue and requires manual administrative settlement\. Reason: ([\s\S]*)$/, (_, amount, reason) => `Khoản hoàn tiền ${money(amount)} cần được hỗ trợ xử lý. Lý do: ${reason}`],
  [/^Your wallet has been credited with ([\d.,\s]+) VND\.$/, (_, amount) => `Ví của bạn đã được cộng ${money(amount)}.`],
  [/^Your top-up request was rejected\. Reason: ([\s\S]*)$/, (_, reason) => `Yêu cầu nạp tiền bị từ chối. Lý do: ${reason}`],
  [/^A student submitted a top-up request for ([\d.,\s]+) VND \(Ref: ([\s\S]*)\)\.$/, (_, amount, ref) => `Học viên yêu cầu nạp ${money(amount)}. Mã chuyển khoản: ${ref}.`],
  [/^A student requested withdrawal of ([\d.,\s]+) VND\.$/, (_, amount) => `Học viên yêu cầu rút ${money(amount)}.`],
  [/^A student left a (\d+)-star review on your profile\.$/, (_, rating) => `Học viên đã đánh giá ${rating} sao trên hồ sơ của bạn.`],
  [/^A dispute has been opened for enrollment #([^\s]+)\.$/, (_, id) => `Đã mở tranh chấp cho hợp đồng #${id}.`],
  [/^The dispute has been resolved: ([\s\S]*)\.$/, (_, resolution) => `Tranh chấp đã được xử lý: ${resolution}.`],
  [/^A new tutor application has been submitted and is awaiting your review\.$/, () => 'Có hồ sơ đăng ký gia sư mới đang chờ xét duyệt.'],
  [/^Congratulations! Your application to become a tutor on TutorHub has been approved\.$/, () => 'Hồ sơ đăng ký trở thành gia sư của bạn đã được phê duyệt.'],
  [/^Your tutor application was not approved\. Reason: ([\s\S]*)$/, (_, reason) => `Hồ sơ đăng ký gia sư chưa được phê duyệt. Lý do: ${reason}`],
  [/^A notice regarding your activity has been submitted for administrative review\.$/, () => 'Một báo cáo liên quan đến hoạt động tài khoản của bạn đã được gửi để xem xét.'],
  [/^You have received an official warning from the platform administration: ([\s\S]*)$/, (_, resolution) => `Bạn nhận được cảnh báo từ TutorHub: ${resolution}`],
];
const EVENT_ICONS = {
  EnrollmentActivated: 'menu_book', EnrollmentCancelled: 'menu_book',
  PaymentSucceeded: 'payments', StudentWalletPaymentSucceeded: 'payments',
  SessionScheduled: 'calendar_month', SessionRescheduled: 'calendar_month', SessionCancelled: 'event', SessionReminderDue: 'calendar_clock',
  GracePeriodStarted: 'schedule', GracePeriodClosingSoon: 'schedule', SessionCompleted: 'check_circle',
  SessionIssueReported: 'report_problem', DisputeCreated: 'gavel', DisputeResolved: 'gavel',
  EarningCreated: 'account_balance_wallet', RefundCreated: 'payments', RefundCompleted: 'payments', RefundFailed: 'payments',
  WithdrawalRequested: 'account_balance_wallet', WithdrawalCompleted: 'account_balance_wallet', WithdrawalFailed: 'account_balance_wallet',
  StudentTopUpRequested: 'account_balance_wallet', StudentTopUpConfirmed: 'account_balance_wallet', StudentTopUpRejected: 'account_balance_wallet',
  StudentWithdrawalRequested: 'account_balance_wallet', StudentWithdrawalCompleted: 'account_balance_wallet', StudentWithdrawalFailed: 'account_balance_wallet',
  TutorApplicationSubmitted: 'person', TutorApplicationApproved: 'verified', TutorApplicationRejected: 'person', ReviewCreated: 'star',
};

export function presentNotification(item, role) {
  const original = item.message || '';
  const rule = MESSAGE_RULES.find(([pattern]) => pattern.test(original));
  const message = rule ? original.replace(rule[0], rule[1]) : original;
  const destination = notificationDestination(item.deepLink, role);
  let action = 'Mở thông báo';
  if (destination?.includes('/enrollments/')) action = item.type === 'PaymentSucceeded' ? 'Xem học phí hợp đồng' : 'Xem hợp đồng';
  else if (destination?.includes('/sessions/')) action = ['GracePeriodStarted', 'GracePeriodClosingSoon', 'SessionIssueReported'].includes(item.type) ? 'Kiểm tra buổi học' : 'Xem buổi học';
  else if (destination?.includes('/wallet')) action = 'Xem giao dịch ví';
  else if (destination?.includes('/wishlist')) action = 'Xem danh sách đã lưu';
  else if (destination?.includes('/disputes')) action = 'Xem tranh chấp';
  else if (destination?.includes('/messages')) action = 'Mở cuộc trò chuyện';
  else if (destination?.includes('/tutor-applications') || destination?.includes('/application')) action = 'Xem hồ sơ đăng ký';
  else if (destination === '/tutors' || destination === '/') action = 'Khám phá gia sư';
  else if (destination?.includes('/profile') || destination?.includes('/settings')) action = 'Xem hồ sơ';
  return { title: TITLES[item.title] || item.title || 'Thông báo', message, destination, action, icon: EVENT_ICONS[item.type] || 'notifications' };
}
