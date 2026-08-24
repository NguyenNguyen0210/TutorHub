using MediatR;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.Categories.DTOs;

namespace TutorHub.Application.Features.Admin.Categories.GetAdminCategories;

public record GetAdminCategoriesQuery(
    string? Search = null,
    bool? IsActive = null,
    int PageNumber = 1,
    int PageSize = 10
) : IRequest<PagedResult<AdminCategoryDto>>;
