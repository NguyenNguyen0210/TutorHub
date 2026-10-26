using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Caching;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Categories.DTOs;
using TutorHub.Application.Features.Subjects.DTOs;

namespace TutorHub.Application.Features.Categories.GetPublicCategoryById;

public class GetPublicCategoryByIdQueryHandler : IRequestHandler<GetPublicCategoryByIdQuery, PublicCategoryDto>
{
    private readonly IAppDbContext _context;
    private readonly ICategoryCacheService _cache;

    public GetPublicCategoryByIdQueryHandler(IAppDbContext context, ICategoryCacheService? cache = null)
    {
        _context = context;
        _cache = cache ?? NoOpCategoryCacheService.Instance;
    }

    public async Task<PublicCategoryDto> Handle(GetPublicCategoryByIdQuery request, CancellationToken cancellationToken)
    {
        var category = await _cache.GetCategoryAsync(
            request.Id,
            () => LoadCategoryFromDbAsync(request.Id, cancellationToken),
            cancellationToken);

        if (category == null)
        {
            throw new NotFoundException("Category", request.Id);
        }

        return category;
    }

    private async Task<PublicCategoryDto?> LoadCategoryFromDbAsync(Guid id, CancellationToken cancellationToken)
    {
        return await _context.Categories
            .AsNoTracking()
            .Where(c => c.Id == id && c.IsActive)
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
            .FirstOrDefaultAsync(cancellationToken);
    }
}
