using MediatR;
using TutorHub.Application.Features.Categories.DTOs;

namespace TutorHub.Application.Features.Admin.Categories.UpdateCategory;

public record UpdateCategoryCommand(
    Guid Id,
    string Name,
    string? Description = null,
    bool IsActive = true
) : IRequest<AdminCategoryDto>;
