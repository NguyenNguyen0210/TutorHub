using MediatR;
using TutorHub.Application.Features.Tutors.Services.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Tutors.Services.CreateService;

public record CreateServiceCommand(
    Guid SubjectId,
    string Title,
    string Description,
    string? ShortDescription,
    string[]? Tags,
    string? LearningScope,
    string? ExpectedOutcome,
    int TotalSessions,
    int SessionDurationMinutes,
    decimal Price,
    TeachingMode TeachingMode,
    string? TrialLessonUrl,
    string? CoverImageUrl,
    List<CurriculumItemInput>? Curriculum = null,
    List<string>? TargetAudience = null,
    List<string>? Prerequisites = null,
    List<FaqInput>? Faqs = null
) : IRequest<ServiceDto>;
