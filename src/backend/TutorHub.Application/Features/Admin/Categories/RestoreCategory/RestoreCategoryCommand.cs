using MediatR;
using TutorHub.Application.Features.Categories.DTOs;

namespace TutorHub.Application.Features.Admin.Categories.RestoreCategory;

public record RestoreCategoryCommand(
    Guid Id
) : IRequest<AdminCategoryDto>;
