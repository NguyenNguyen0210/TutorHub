namespace TutorHub.Domain.Enums;

public enum WalletTransactionType
{
    // Nạp tiền
    TopUpCredit,

    // Thanh toán khóa học
    CoursePaymentDebit,

    // Hoàn tiền học viên (Hủy khóa, hủy buổi, phán quyết tranh chấp)
    RefundCredit,

    // Thù lao gia sư sau buổi học hoàn thành (12h Grace period)
    SessionPayoutCredit,

    // Rút tiền (giữ chỗ sang WithdrawingBalance)
    WithdrawalDebit,

    // Rút tiền thất bại / từ chối -> hoàn lại AvailableBalance
    WithdrawalReversalCredit,
    WithdrawalFailedAdjustmentCredit,

    // Rút tiền thành công -> tất toán khỏi WithdrawingBalance
    WithdrawalSuccessSettlement,

    // Điều chỉnh thủ công của Admin
    AdjustmentCredit,
    AdjustmentDebit,

    // Dispute holds
    DisputeHoldReservationDebit,
    DisputeHoldReleaseCredit,
    DisputeRecoveryDebit
}

