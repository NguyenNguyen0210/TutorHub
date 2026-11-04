export const DISPUTE_STATES = {
  Open: ['Mới mở', 'amber'], UnderReview: ['Đang điều tra', 'blue'],
  RequiresAdminFinancialIntervention: ['Cần xử lý ví', 'amber'],
  RequiresAdminRefundSettlement: ['Chờ đối soát hoàn tiền', 'purple'],
  Resolved: ['Đã phân xử', 'mint'], Dismissed: ['Đã đóng', 'neutral'],
};
export const VERDICTS = {
  StudentWinsFullRefund: 'Hoàn toàn bộ học phí buổi học', StudentWinsPartialRefund: 'Hoàn một phần học phí',
  TutorWinsReleaseEarning: 'Giải ngân học phí cho gia sư', DismissedNoFinancialChange: 'Đóng khiếu nại, không điều chỉnh ngay học phí',
};
