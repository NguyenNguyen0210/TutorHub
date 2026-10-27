using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Common.Search;
using TutorHub.Application.Features.Categories.DTOs;

namespace TutorHub.Application.Features.Admin.Categories.GetAdminTrashCategories;

public class GetAdminTrashCategoriesQueryHandler : IRequestHandler<GetAdminTrashCategoriesQuery, PagedResult<AdminCategoryDto>>
{
    private readonly IAppDbContext _context;

    public GetAdminTrashCategoriesQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<AdminCategoryDto>> Handle(GetAdminTrashCategoriesQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Categories
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(c => c.IsDeleted);

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var pattern = "%" + VietnameseSearch.EscapeLikePattern(VietnameseSearch.NormalizeTerm(request.Search)) + "%";
            query = query.Where(c => EF.Functions.Like(
                VietnameseSearch.UnaccentImmutable(c.Name)!.ToLower(),
                pattern, @"\"));
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var pageNumber = request.PageNumber < 1 ? 1 : request.PageNumber;
        var pageSize = request.PageSize < 1 ? 10 : (request.PageSize > 50 ? 50 : request.PageSize);

        var items = await query
            .OrderByDescending(c => c.DeletedAt)
            .ThenBy(c => c.Id)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(c => new AdminCategoryDto(
                c.Id,
                c.Name,
                c.Description,
                c.IsActive,
                c.Subjects.Count,
                c.IsDeleted,
                c.DeletedAt
            ))
            .ToListAsync(cancellationToken);

        return new PagedResult<AdminCategoryDto>(
            items,
            totalCount,
            pageNumber,
            pageSize
        );
    }
}
