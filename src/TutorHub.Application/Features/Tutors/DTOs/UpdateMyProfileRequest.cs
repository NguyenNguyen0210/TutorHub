namespace TutorHub.Application.Features.Tutors.DTOs;

public record UpdateMyProfileRequest(
    string? FullName,
    string? Phone,
    string? AvatarUrl,
    string Bio,
    string Education,
    int ExperienceYears,
    decimal HourlyRate,
    string TeachingMode,
    string? Address,
    double? Latitude,
    double? Longitude
);
