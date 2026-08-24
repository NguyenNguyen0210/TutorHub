namespace TutorHub.Application.Features.Categories.DTOs;

public record AdminCategoryDto(
    Guid Id,
    string Name,
    string? Description,
    bool IsActive,
    int SubjectsCount
);
