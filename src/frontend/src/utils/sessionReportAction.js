export function sessionReportAction(session, now = Date.now()) {
  if (session.hasIssueReport) return { href: '#session-protection', label: 'Xem khiếu nại', reason: '' };
  let reason = '';
  if (session.status === 'Cancelled') reason = 'Buổi học đã hủy. Liên hệ hỗ trợ nếu cần kiểm tra học phí.';
  else if (session.isPayoutReleased) reason = 'Học phí đã giải ngân. Liên hệ hỗ trợ để được hướng dẫn.';
  else if (session.status !== 'AwaitingPayout' || new Date(session.endAt).getTime() > now) reason = 'Bạn có thể báo cáo khi buổi học bắt đầu thời hạn phản hồi.';
  else if (!session.gracePeriodEndsAt || !(new Date(session.gracePeriodEndsAt).getTime() > now)) reason = 'Buổi học không còn thời hạn nhận khiếu nại mới. Liên hệ hỗ trợ để được hướng dẫn.';
  return { href: reason ? null : `/student/disputes/new?sessionId=${encodeURIComponent(session.id)}`, label: 'Báo cáo / khiếu nại', reason };
}
