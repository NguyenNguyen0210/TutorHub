using MediatR;

namespace TutorHub.Application.Features.Admin.Categories.DeleteCategory;

public record DeleteCategoryCommand(
    Guid Id,
    string? Reason = null
) : IRequest<Unit>;
