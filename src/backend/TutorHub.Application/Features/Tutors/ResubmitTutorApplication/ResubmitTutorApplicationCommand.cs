using MediatR;
using TutorHub.Application.Features.Tutors.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Tutors.ResubmitTutorApplication;

public record ResubmitTutorApplicationCommand(
    Guid UserId,
    string Bio,
    string Education,
    int ExperienceYears,
    TeachingMode TeachingMode,
    string? Address = null,
    double? Latitude = null,
    double? Longitude = null
) : IRequest<TutorApplicationDto>;
