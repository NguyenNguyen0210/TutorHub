export function adminActionQueues(queue) {
  if (!queue) return [];
  return [
    { label: 'Báo cáo vi phạm', count: queue.openReportsCount, path: '/admin/trust-reports?status=Open', icon: 'flag', tone: 'danger' },
    { label: 'Rút tiền gia sư chờ tiếp nhận', count: queue.pendingWithdrawalsCount, path: '/admin/withdrawals?audience=tutor&status=Pending', icon: 'payments', tone: 'blue' },
    { label: 'Rút tiền học viên chờ tiếp nhận', count: queue.pendingStudentWithdrawalsCount, path: '/admin/withdrawals?audience=student&status=Pending', icon: 'payments', tone: 'blue' },
    { label: 'Nạp tiền cần kiểm tra', count: queue.reviewableTopUpsCount, path: '/admin/student-wallets?tab=topups&status=Pending&reviewableOnly=true', icon: 'add_card', tone: 'holding' },
    { label: 'Hoàn tiền cần đối soát', count: queue.outstandingRefundsCount, path: '/admin/transactions?type=StudentRefund&settlementRequired=true', icon: 'refresh', tone: 'insight' },
    { label: 'Hồ sơ gia sư chờ duyệt', count: queue.pendingTutorsCount, path: '/admin/users?tab=applications&status=Pending', icon: 'verified_user', tone: 'success' },
    { label: 'Tranh chấp học phí', count: queue.openDisputesCount, path: '/admin/disputes', icon: 'gavel', tone: 'holding' },
  ];
}
