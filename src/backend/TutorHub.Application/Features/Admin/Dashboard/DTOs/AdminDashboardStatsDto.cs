namespace TutorHub.Application.Features.Admin.Dashboard.DTOs;

public record AdminDashboardStatsDto(
    UserStatsDto Users,
    TutorStatsDto Tutors,
    BookingStatsDto Bookings,
    FinancialStatsDto Financials,
    ActionQueueDto ActionQueue,
    DateTime UpdatedAt = default,
    DateTime? FromUtc = null,
    string Period = "All"
);

public record UserStatsDto(
    int TotalUsers,
    int TotalStudents,
    int TotalTutors,
    int ActiveUsers
);

public record TutorStatsDto(
    int VerifiedTutors,
    int PendingReviewTutors,
    int DraftTutors,
    int RejectedTutors,
    int SuspendedTutors
);

public record BookingStatsDto(
    int TotalBookings,
    int HoldingBookings,
    int PaidBookings,
    int CancelledBookings,
    int ExpiredBookings
);

public record FinancialStatsDto(
    decimal TotalGmv,
    decimal NetGmv,
    decimal TotalPlatformRevenue,
    decimal TotalTutorPayouts,
    decimal TotalRefundedAmount,
    decimal PendingRefundAmount = 0
);

public record ActionQueueDto(
    int PendingTutorsCount,
    int PendingWithdrawalsCount,
    int OpenReportsCount,
    int OpenDisputesCount = 0,
    int PendingStudentWithdrawalsCount = 0,
    int ReviewableTopUpsCount = 0,
    int OutstandingRefundsCount = 0
);
