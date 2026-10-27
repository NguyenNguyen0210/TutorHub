namespace TutorHub.Application.Features.Subjects.DTOs;

public record AdminSubjectDto(
    Guid Id,
    string Name,
    Guid CategoryId,
    string CategoryName,
    bool IsActive,
    int TutorsCount,
    int BookingsCount,
    bool IsDeleted,
    DateTime? DeletedAt
)
{
    public AdminSubjectDto(Guid id, string name, Guid categoryId, string categoryName, bool isActive, int tutorsCount, int bookingsCount)
        : this(id, name, categoryId, categoryName, isActive, tutorsCount, bookingsCount, false, null)
    {
    }
}
