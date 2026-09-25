namespace TutorHub.Application.Features.Tutors.Services.DTOs;

/// <summary>
/// Per-session curriculum item supplied on create/update. Shapes mirror
/// <see cref="Features.Services.DTOs.CurriculumItemDto"/> except DurationMinutes is
/// optional here: when omitted the service's SessionDurationMinutes applies.
/// </summary>
public record CurriculumItemInput(
    int SessionIndex,
    string Title,
    string? Description = null,
    List<string>? KeyTopics = null,
    int? DurationMinutes = null
);

/// <summary>
/// FAQ entry supplied on create/update. Mirrors
/// <see cref="Features.Services.DTOs.FaqItemDto"/>.
/// </summary>
public record FaqInput(
    string Question,
    string Answer
);
