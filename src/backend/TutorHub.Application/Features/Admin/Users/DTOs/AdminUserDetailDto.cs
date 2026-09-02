using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Admin.Users.DTOs;

public record AdminUserDetailDto(
    Guid Id,
    string Email,
    string FullName,
    string? Phone,
    string? AvatarUrl,
    UserRole Role,
    AccountStatus Status,
    DateTime CreatedAt,
    AdminUserTutorProfileDto? TutorProfile,
    AdminUserStudentProfileDto? StudentProfile,
    IReadOnlyList<AdminUserRecentBookingDto> RecentBookings
);

public record AdminUserSubjectDto(
    Guid Id,
    string Name
);

public record AdminUserTutorProfileDto(
    Guid Id,
    string Bio,
    string Education,
    int ExperienceYears,
    TeachingMode TeachingMode,
    string? Address,
    string? LatestApplicationStatus,
    decimal RatingAvg,
    int TotalReviews,
    decimal? WalletBalance,
    IReadOnlyList<AdminUserSubjectDto> Subjects,
    int TotalCompletedSessions
);

public record AdminUserStudentProfileDto(
    int TotalBookingsAsStudent,
    decimal TotalSpent
);

public record AdminUserRecentBookingDto(
    Guid Id,
    string SubjectName,
    string OtherPartyName,
    BookingStatus Status,
    decimal TotalPrice,
    int TotalSessions,
    DateTime CreatedAt
);
