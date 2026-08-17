using MediatR;
using TutorHub.Application.Features.Tutors.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Tutors.UpdateMyProfile;

public record UpdateMyProfileCommand(
    Guid UserId,
    string? FullName,
    string? Phone,
    string? AvatarUrl,
    string Bio,
    string Education,
    int ExperienceYears,
    decimal HourlyRate,
    TeachingMode TeachingMode,
    string? Address,
    double? Latitude,
    double? Longitude
) : IRequest<TutorProfileDto>;
