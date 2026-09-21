namespace TutorHub.Domain.Services;

/// <summary>
/// Pure fee-conservation math for post-release dispute settlement
/// (DEC-S8-025 "Mandatory Patch B", INV-DISP-007).
///
/// Extracted from the AdminResolveDispute handler so the identity
/// <c>StudentRefund ≡ TutorNetRecovery + PlatformFeeReversal</c> can be verified
/// without a database, and so the adjustment rows are always derived the same way.
/// </summary>
public static class DisputeSettlementCalculator
{
    /// <summary>Result of a post-release (already paid out) dispute settlement.</summary>
    public readonly record struct Settlement(
        decimal StudentRefund,
        decimal TutorFinalGross,
        decimal PlatformFinalFee,
        decimal TutorFinalNet,
        decimal TutorNetRecovery,
        decimal PlatformFeeReversal);

    /// <summary>
    /// Recomputes the session's fee and tutor net after reducing the gross by
    /// <paramref name="studentRefund"/>, then derives how much must be recovered from
    /// the tutor and how much platform fee must be reversed.
    /// </summary>
    /// <param name="studentRefund">Refund granted to the student. Must be within [0, originalGross].</param>
    /// <param name="originalGross">The gross recorded on the original payout transaction.</param>
    /// <param name="originalPlatformFee">The fee recorded on the original payout transaction.</param>
    /// <param name="originalTutorNet">The tutor net recorded on the original payout transaction.</param>
    /// <param name="appliedRate">The commission rate frozen on the original payout transaction.</param>
    public static Settlement CalculatePostRelease(
        decimal studentRefund,
        decimal originalGross,
        decimal originalPlatformFee,
        decimal originalTutorNet,
        decimal appliedRate)
    {
        if (studentRefund < 0m || studentRefund > originalGross)
        {
            throw new ArgumentOutOfRangeException(
                nameof(studentRefund), studentRefund, "Refund must be within [0, originalGross].");
        }

        var tutorFinalGross = originalGross - studentRefund;
        var (platformFinalFee, tutorFinalNet) = PlatformFeeCalculator.SplitGross(tutorFinalGross, appliedRate);

        var tutorNetRecovery = originalTutorNet - tutorFinalNet;
        var platformFeeReversal = originalPlatformFee - platformFinalFee;

        return new Settlement(
            StudentRefund: studentRefund,
            TutorFinalGross: tutorFinalGross,
            PlatformFinalFee: platformFinalFee,
            TutorFinalNet: tutorFinalNet,
            TutorNetRecovery: tutorNetRecovery,
            PlatformFeeReversal: platformFeeReversal);
    }
}
