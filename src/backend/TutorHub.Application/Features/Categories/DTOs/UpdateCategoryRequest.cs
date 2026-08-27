namespace TutorHub.Application.Features.Categories.DTOs;

public record UpdateCategoryRequest(
    string Name,
    string? Description = null,
    bool IsActive = true
);
