using MediatR;
using TutorHub.Application.Features.Categories.DTOs;

namespace TutorHub.Application.Features.Categories.GetPublicCategories;

public record GetPublicCategoriesQuery : IRequest<IReadOnlyList<PublicCategoryDto>>;
