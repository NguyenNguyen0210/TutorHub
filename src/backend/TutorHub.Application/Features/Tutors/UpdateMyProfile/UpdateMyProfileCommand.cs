using MediatR;
using TutorHub.Application.Features.Tutors.DTOs;

namespace TutorHub.Application.Features.Tutors.UpdateMyProfile;

public record UpdateMyProfileCommand(
    string? FullName = null,
    string? Phone = null,
    string? AvatarUrl = null,
    string? Bio = null,
    string? Education = null,
    int? ExperienceYears = null
) : IRequest<TutorMyProfileDto>;
