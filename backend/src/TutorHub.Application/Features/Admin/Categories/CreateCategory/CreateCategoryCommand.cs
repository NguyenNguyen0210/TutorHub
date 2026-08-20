using MediatR;
using TutorHub.Application.Features.Categories.DTOs;

namespace TutorHub.Application.Features.Admin.Categories.CreateCategory;

public record CreateCategoryCommand(
    string Name,
    string? Description = null
) : IRequest<AdminCategoryDto>;
