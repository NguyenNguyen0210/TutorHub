namespace TutorHub.Application.Features.Categories.DTOs;

public record CreateCategoryRequest(
    string Name,
    string? Description = null
);
