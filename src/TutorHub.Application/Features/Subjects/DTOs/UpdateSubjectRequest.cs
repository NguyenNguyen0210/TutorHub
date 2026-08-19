namespace TutorHub.Application.Features.Subjects.DTOs;

public record UpdateSubjectRequest(
    string Name,
    Guid CategoryId,
    bool IsActive = true
);
