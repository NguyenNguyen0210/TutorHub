using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.Categories.DTOs;

namespace TutorHub.Application.Features.Admin.Categories.GetAdminCategories;

public class GetAdminCategoriesQueryHandler : IRequestHandler<GetAdminCategoriesQuery, PagedResult<AdminCategoryDto>>
{
    private readonly IAppDbContext _context;

    public GetAdminCategoriesQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<AdminCategoryDto>> Handle(GetAdminCategoriesQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Categories
            .AsNoTracking()
            .AsQueryable();

        if (request.IsActive.HasValue)
        {
            query = query.Where(c => c.IsActive == request.IsActive.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim().ToLower();
            query = query.Where(c => c.Name.ToLower().Contains(search));
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var pageNumber = request.PageNumber < 1 ? 1 : request.PageNumber;
        var pageSize = request.PageSize < 1 ? 10 : (request.PageSize > 50 ? 50 : request.PageSize);

        var items = await query
            .OrderBy(c => c.Name)
            .ThenBy(c => c.Id)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(c => new AdminCategoryDto(
                c.Id,
                c.Name,
                c.Description,
                c.IsActive,
                c.Subjects.Count
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
