namespace TutorHub.Domain.Enums;

public enum TutorWalletTransactionType
{
    SessionPayoutCredit,
    WithdrawalDebit,
    WithdrawalFailedAdjustmentCredit,
    DisputeHoldReservationDebit,
    DisputeHoldReleaseCredit,
    DisputeRecoveryDebit
}
