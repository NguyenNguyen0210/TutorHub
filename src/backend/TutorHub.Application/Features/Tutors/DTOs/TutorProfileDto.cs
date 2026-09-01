using TutorHub.Application.Features.Tutors.Services.DTOs;

namespace TutorHub.Application.Features.Tutors.DTOs;

public record TutorProfileDto(
    Guid Id,
    Guid UserId,
    string FullName,
    string? AvatarUrl,
    string Bio,
    string Education,
    int ExperienceYears,
    string TeachingMode,
    string? Address,
    double? Latitude,
    double? Longitude,
    decimal RatingAvg,
    int TotalReviews,
    List<TutorSubjectDto> Subjects,
    List<ServiceSummaryDto> Services
);
