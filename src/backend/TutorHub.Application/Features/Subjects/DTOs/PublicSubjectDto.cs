namespace TutorHub.Application.Features.Subjects.DTOs;

public record PublicSubjectDto(
    Guid Id,
    string Name,
    Guid CategoryId,
    string CategoryName
);
