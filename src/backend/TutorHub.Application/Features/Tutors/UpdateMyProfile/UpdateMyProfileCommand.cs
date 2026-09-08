using MediatR;
using TutorHub.Application.Features.Tutors.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Tutors.UpdateMyProfile;

public record UpdateMyProfileCommand(
    Guid UserId,
    string? FullName = null,
    string? Phone = null,
    string? AvatarUrl = null,
    string? Bio = null,
    string? Education = null,
    int? ExperienceYears = null,
    TeachingMode? TeachingMode = null,
    string? Address = null,
    double? Latitude = null,
    double? Longitude = null
) : IRequest<TutorMyProfileDto>;
