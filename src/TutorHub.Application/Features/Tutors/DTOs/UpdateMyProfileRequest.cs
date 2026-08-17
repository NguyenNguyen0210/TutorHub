namespace TutorHub.Application.Features.Tutors.DTOs;

public record UpdateMyProfileRequest(
    string? FullName = null,
    string? Phone = null,
    string? AvatarUrl = null,
    string? Bio = null,
    string? Education = null,
    int? ExperienceYears = null,
    decimal? HourlyRate = null,
    string? TeachingMode = null,
    string? Address = null,
    double? Latitude = null,
    double? Longitude = null
);
