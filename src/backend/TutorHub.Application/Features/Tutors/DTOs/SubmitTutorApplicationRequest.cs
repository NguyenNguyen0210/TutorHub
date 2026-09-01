namespace TutorHub.Application.Features.Tutors.DTOs;

public record SubmitTutorApplicationRequest(
    string Bio,
    string Education,
    int ExperienceYears,
    string TeachingMode,
    string? Address = null,
    double? Latitude = null,
    double? Longitude = null
);
