using MediatR;
using TutorHub.Application.Features.Tutors.Services.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Tutors.Services.UpdateService;

public record UpdateServiceCommand(
    Guid ServiceId,
    Guid UserId,
    string? Title,
    string? Description,
    string? LearningScope,
    string? ExpectedOutcome,
    int? TotalSessions,
    int? SessionDurationMinutes,
    decimal? Price,
    TeachingMode? TeachingMode,
    string? TrialLessonUrl
) : IRequest<ServiceDto>;
