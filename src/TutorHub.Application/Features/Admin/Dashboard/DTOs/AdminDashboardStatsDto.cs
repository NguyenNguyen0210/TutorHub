namespace TutorHub.Application.Features.Admin.Dashboard.DTOs;

public record AdminDashboardStatsDto(
    UserStatsDto Users,
    TutorStatsDto Tutors,
    BookingStatsDto Bookings,
    FinancialStatsDto Financials,
    ActionQueueDto ActionQueue
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
    int PendingBookings,
    int ConfirmedBookings,
    int CompletedBookings,
    int CancelledBookings
);

public record FinancialStatsDto(
    decimal TotalGmv,
    decimal NetGmv,
    decimal TotalPlatformRevenue,
    decimal TotalTutorPayouts,
    decimal TotalRefundedAmount
);

public record ActionQueueDto(
    int PendingTutorsCount,
    int PendingWithdrawalsCount,
    int OpenReportsCount
);
