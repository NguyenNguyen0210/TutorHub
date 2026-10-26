using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Caching;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Categories.DTOs;
using TutorHub.Application.Features.Subjects.DTOs;

namespace TutorHub.Application.Features.Categories.GetPublicCategories;

public class GetPublicCategoriesQueryHandler : IRequestHandler<GetPublicCategoriesQuery, IReadOnlyList<PublicCategoryDto>>
{
    private readonly IAppDbContext _context;
    private readonly ICategoryCacheService _cache;

    public GetPublicCategoriesQueryHandler(IAppDbContext context, ICategoryCacheService? cache = null)
    {
        _context = context;
        _cache = cache ?? NoOpCategoryCacheService.Instance;
    }

    public Task<IReadOnlyList<PublicCategoryDto>> Handle(GetPublicCategoriesQuery request, CancellationToken cancellationToken) =>
        _cache.GetPublicCategoriesAsync(() => LoadCategoriesFromDbAsync(cancellationToken), cancellationToken);

    private async Task<IReadOnlyList<PublicCategoryDto>> LoadCategoriesFromDbAsync(CancellationToken cancellationToken)
    {
        return await _context.Categories
            .AsNoTracking()
            .Where(c => c.IsActive)
            .OrderBy(c => c.Name)
            .Select(c => new PublicCategoryDto(
                c.Id,
                c.Name,
                c.Description,
                c.Subjects
                    .Where(s => s.IsActive)
                    .OrderBy(s => s.Name)
                    .Select(s => new PublicSubjectDto(s.Id, s.Name, c.Id, c.Name))
                    .ToList()
            ))
            .ToListAsync(cancellationToken);
    }
}
