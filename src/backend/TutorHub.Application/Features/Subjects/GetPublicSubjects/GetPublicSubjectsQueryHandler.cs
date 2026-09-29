using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Caching;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Common.Search;
using TutorHub.Application.Features.Subjects.DTOs;

namespace TutorHub.Application.Features.Subjects.GetPublicSubjects;

public class GetPublicSubjectsQueryHandler : IRequestHandler<GetPublicSubjectsQuery, PagedResult<PublicSubjectDto>>
{
    private readonly IAppDbContext _context;
    private readonly ISubjectCacheService _cache;

    public GetPublicSubjectsQueryHandler(IAppDbContext context, ISubjectCacheService? cache = null)
    {
        _context = context;
        _cache = cache ?? NoOpSubjectCacheService.Instance;
    }

    public Task<PagedResult<PublicSubjectDto>> Handle(GetPublicSubjectsQuery request, CancellationToken cancellationToken) =>
        _cache.GetPublicSubjectsAsync(request, () => QueryAsync(request, cancellationToken), cancellationToken);

    private async Task<PagedResult<PublicSubjectDto>> QueryAsync(GetPublicSubjectsQuery request, CancellationToken cancellationToken)
    {
        // Public Invariant: Subject must be active AND Category must be active
        var query = _context.Subjects
            .AsNoTracking()
            .Where(s => s.IsActive && s.Category.IsActive);

        if (request.CategoryId.HasValue)
        {
            query = query.Where(s => s.CategoryId == request.CategoryId.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var term = VietnameseSearch.NormalizeTerm(request.Search);
            query = query.Where(s => EF.Functions.Like(
                VietnameseSearch.UnaccentImmutable(s.Name)!.ToLower(),
                "%" + VietnameseSearch.UnaccentImmutable(term)! + "%"));
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var pageNumber = request.PageNumber < 1 ? 1 : request.PageNumber;
        var pageSize = request.PageSize < 1 ? 20 : (request.PageSize > 50 ? 50 : request.PageSize);

        var items = await query
            .OrderBy(s => s.Name)
            .ThenBy(s => s.Id)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(s => new PublicSubjectDto(
                s.Id,
                s.Name,
                s.CategoryId,
                s.Category.Name
            ))
            .ToListAsync(cancellationToken);

        return new PagedResult<PublicSubjectDto>(
            items,
            totalCount,
            pageNumber,
            pageSize
        );
    }
}
