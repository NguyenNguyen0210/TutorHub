namespace TutorHub.Application.Features.Tutors.DTOs;

public record TutorSubjectDto(
    Guid Id,
    Guid SubjectId,
    string SubjectName,
    Guid CategoryId,
    string CategoryName,
    decimal? OverridePrice,
    bool IsActive
);
