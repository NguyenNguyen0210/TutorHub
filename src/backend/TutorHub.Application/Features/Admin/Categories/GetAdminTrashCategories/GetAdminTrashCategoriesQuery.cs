using MediatR;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.Categories.DTOs;

namespace TutorHub.Application.Features.Admin.Categories.GetAdminTrashCategories;

public record GetAdminTrashCategoriesQuery(
    string? Search = null,
    int PageNumber = 1,
    int PageSize = 10
) : IRequest<PagedResult<AdminCategoryDto>>;
