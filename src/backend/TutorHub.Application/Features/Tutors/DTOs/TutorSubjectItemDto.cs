namespace TutorHub.Application.Features.Tutors.DTOs;

public record TutorSubjectItemDto(
    Guid SubjectId,
    bool IsActive = true
);
