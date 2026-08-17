namespace TutorHub.Application.Features.Tutors.DTOs;

public record TutorSubjectItemDto(
    Guid SubjectId,
    decimal? OverridePrice = null,
    bool IsActive = true
);
