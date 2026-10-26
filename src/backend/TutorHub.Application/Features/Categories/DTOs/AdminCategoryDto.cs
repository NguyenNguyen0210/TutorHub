namespace TutorHub.Application.Features.Categories.DTOs;

public record AdminCategoryDto(
    Guid Id,
    string Name,
    string? Description,
    bool IsActive,
    int SubjectsCount,
    bool IsDeleted,
    DateTime? DeletedAt,
    string? DeleteReason
)
{
    public AdminCategoryDto(Guid id, string name, string? description, bool isActive, int subjectsCount)
        : this(id, name, description, isActive, subjectsCount, false, null, null)
    {
    }
}
