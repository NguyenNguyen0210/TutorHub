namespace TutorHub.Application.Features.Subjects.DTOs;

public record AdminSubjectDto(
    Guid Id,
    string Name,
    Guid CategoryId,
    string CategoryName,
    bool IsActive,
    int TutorsCount,
    int BookingsCount
);
