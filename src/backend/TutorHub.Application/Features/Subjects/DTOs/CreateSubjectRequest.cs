namespace TutorHub.Application.Features.Subjects.DTOs;

public record CreateSubjectRequest(
    string Name,
    Guid CategoryId
);
