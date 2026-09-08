namespace TutorHub.Application.Features.PlatformSettings.DTOs;

public class PlatformRevenueAnalyticsDto
{
    public decimal GrossBookingVolume { get; set; }
    public decimal GrossReleasedEarnings { get; set; }
    public decimal RecognizedPlatformFee { get; set; }
    public decimal PlatformFeeReversals { get; set; }
    public decimal NetRecognizedPlatformRevenue { get; set; }
    public decimal UnrecognizedPendingPlatformFee { get; set; }

    public PlatformDisputeMetricsDto DisputeMetrics { get; set; } = new();
}

public class PlatformDisputeMetricsDto
{
    public int TotalDisputes { get; set; }
    public int OpenDisputes { get; set; }
    public int UnderReviewDisputes { get; set; }
    public int ResolvedDisputes { get; set; }
    public int DismissedDisputes { get; set; }
    public decimal TotalRefundedToStudents { get; set; }
    public decimal TotalRecoveredFromTutors { get; set; }
    public decimal TotalFeeReversed { get; set; }
}
