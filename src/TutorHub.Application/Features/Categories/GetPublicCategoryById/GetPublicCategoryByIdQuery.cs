using MediatR;
using TutorHub.Application.Features.Categories.DTOs;

namespace TutorHub.Application.Features.Categories.GetPublicCategoryById;

public record GetPublicCategoryByIdQuery(
    Guid Id
) : IRequest<PublicCategoryDto>;
