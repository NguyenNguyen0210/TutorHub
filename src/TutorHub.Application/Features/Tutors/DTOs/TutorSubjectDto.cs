namespace TutorHub.Application.Features.Tutors.DTOs;

public record TutorSubjectDto(
    Guid Id,
    Guid SubjectId,
    string SubjectName,
    string Category,
    decimal? OverridePrice,
    bool IsActive
);
