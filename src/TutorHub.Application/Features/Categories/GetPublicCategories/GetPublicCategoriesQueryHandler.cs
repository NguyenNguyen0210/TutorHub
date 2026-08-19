using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Categories.DTOs;
using TutorHub.Application.Features.Subjects.DTOs;

namespace TutorHub.Application.Features.Categories.GetPublicCategories;

public class GetPublicCategoriesQueryHandler : IRequestHandler<GetPublicCategoriesQuery, IReadOnlyList<PublicCategoryDto>>
{
    private readonly IAppDbContext _context;

    public GetPublicCategoriesQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<PublicCategoryDto>> Handle(GetPublicCategoriesQuery request, CancellationToken cancellationToken)
    {
        var categories = await _context.Categories
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

        return categories;
    }
}
