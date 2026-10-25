using TutorHub.Domain.Enums;

namespace TutorHub.Domain.Services;

/// <summary>
/// Domain service calculating financial division (student refund vs tutor release) upon dispute resolution.
/// Preserves money conservation: StudentRefund + TutorGrossRelease == GrossAmount for all financial outcomes.
/// </summary>
public static class DisputeFinancialCalculator
{
    public static (decimal StudentRefund, decimal TutorGrossRelease) CalculateFinancialSplit(
        decimal grossAmount,
        DisputeResolutionDecision decision,
        decimal? customRefundAmount = null)
    {
        if (grossAmount < 0m)
        {
            throw new ArgumentOutOfRangeException(nameof(grossAmount), grossAmount, "Gross amount cannot be negative.");
        }

        switch (decision)
        {
            case DisputeResolutionDecision.StudentWinsFullRefund:
                return (StudentRefund: grossAmount, TutorGrossRelease: 0m);

            case DisputeResolutionDecision.StudentWinsPartialRefund:
                if (!customRefundAmount.HasValue)
                {
                    throw new ArgumentException("CustomRefundAmount is required for partial refund.", nameof(customRefundAmount));
                }

                var refund = customRefundAmount.Value;
                if (refund <= 0m || refund >= grossAmount)
                {
                    throw new ArgumentOutOfRangeException(
                        nameof(customRefundAmount),
                        refund,
                        $"Partial refund amount must be between 0 and {grossAmount}.");
                }

                return (StudentRefund: refund, TutorGrossRelease: grossAmount - refund);

            case DisputeResolutionDecision.TutorWinsReleaseEarning:
                return (StudentRefund: 0m, TutorGrossRelease: grossAmount);

            case DisputeResolutionDecision.DismissedNoFinancialChange:
                return (StudentRefund: 0m, TutorGrossRelease: 0m);

            default:
                throw new ArgumentOutOfRangeException(nameof(decision), decision, "Unsupported dispute resolution decision.");
        }
    }
}
