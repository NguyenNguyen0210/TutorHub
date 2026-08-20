namespace TutorHub.Application.Features.Admin.Dashboard.DTOs;

public record RevenueChartDto(
    int Months,
    string FromMonth,
    string ToMonth,
    IReadOnlyList<RevenueChartDataPointDto> Data
);

public record RevenueChartDataPointDto(
    string Month,
    int TotalBookings,
    int CompletedBookings,
    decimal TotalGmv,
    decimal NetGmv,
    decimal PlatformRevenue,
    decimal TutorPayouts
);
